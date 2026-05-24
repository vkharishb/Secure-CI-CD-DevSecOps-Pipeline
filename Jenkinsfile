// Jenkinsfile
// Secure CI Pipeline — Jenkins (Node.js)
// Stages:
//   1. Code Checkout
//   2. Code Build
//   3. SonarQube Scan
//   4. Black Duck Scan
//   5. Push Snapshot to Nexus
//   6. Build Docker Image
//   7. Trivy Docker Scan
//   8. Push Image to Docker Hub
//   9. UAT Deploy (manual approval gate)

pipeline {
    agent {
        kubernetes {
            yaml """
apiVersion: v1
kind: Pod
metadata:
  labels:
    pipeline: ci
spec:
  containers:
    - name: node
      image: node:20-alpine
      command: [cat]
      tty: true
      resources:
        requests: { memory: "512Mi", cpu: "500m" }
        limits:   { memory: "1Gi",   cpu: "1"    }
    - name: docker
      image: docker:24-dind
      securityContext:
        privileged: true
      env:
        - name: DOCKER_TLS_CERTDIR
          value: ""
    - name: trivy
      image: aquasec/trivy:latest
      command: [cat]
      tty: true
    - name: helm
      image: alpine/helm:3.14.0
      command: [cat]
      tty: true
"""
        }
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '20'))
        timeout(time: 45, unit: 'MINUTES')
        timestamps()
        disableConcurrentBuilds()
        ansiColor('xterm')
    }

    environment {
        NODE_ENV            = 'test'
        APP_NAME            = "${env.JOB_NAME.split('/')[0].toLowerCase()}"
        SHORT_SHA           = "${env.GIT_COMMIT[0..6]}"
        SNAPSHOT_VERSION    = ""
        SONAR_HOST_URL      = credentials('sonar-host-url')
        NEXUS_NPM_REGISTRY  = credentials('nexus-npm-registry')     // e.g. https://nexus.example.com/repository/npm-snapshots/
        DOCKERHUB_USERNAME  = credentials('dockerhub-username')
        BLACKDUCK_URL       = credentials('blackduck-url')
    }

    stages {

        // ─────────────────────────────────────────
        // STAGE 1 — Code Checkout
        // ─────────────────────────────────────────
        stage('① Code Checkout') {
            steps {
                checkout scm
                script {
                    echo "Branch : ${env.GIT_BRANCH}"
                    echo "Commit : ${env.GIT_COMMIT}"
                    echo "Author : ${env.GIT_AUTHOR_NAME}"
                    env.SHORT_SHA = env.GIT_COMMIT[0..6]
                }
            }
        }

        // ─────────────────────────────────────────
        // STAGE 2 — Code Build
        // ─────────────────────────────────────────
        stage('② Code Build') {
            steps {
                container('node') {
                    sh 'npm ci --prefer-offline'
                    sh 'npm run build'

                    sh '''
                        npm test -- \
                            --coverage \
                            --coverageReporters=lcov \
                            --coverageReporters=text \
                            --forceExit
                    '''

                    // Coverage gate — fail if below 80%
                    sh '''
                        COVERAGE=$(node -e "
                          const fs = require('fs');
                          const lcov = fs.readFileSync('coverage/lcov.info','utf8');
                          const lf = lcov.match(/LF:(\\d+)/g)||[];
                          const lh = lcov.match(/LH:(\\d+)/g)||[];
                          const total = lf.reduce((s,l)=>s+parseInt(l.slice(3)),0);
                          const hit   = lh.reduce((s,h)=>s+parseInt(h.slice(3)),0);
                          console.log(total?((hit/total)*100).toFixed(1):0);
                        ")
                        echo "Coverage: ${COVERAGE}%"
                        if [ $(echo "${COVERAGE} < 80" | bc) -eq 1 ]; then
                          echo "❌ Coverage ${COVERAGE}% is below the 80% gate."
                          exit 1
                        fi
                        echo "✅ Coverage gate passed: ${COVERAGE}%"
                    '''
                }
            }
            post {
                always {
                    junit 'test-results/**/*.xml'
                    publishHTML([
                        reportDir:   'coverage/lcov-report',
                        reportFiles: 'index.html',
                        reportName:  'Coverage Report'
                    ])
                }
            }
        }

        // ─────────────────────────────────────────
        // STAGE 3 — SonarQube Code Scan (SAST)
        // ─────────────────────────────────────────
        stage('③ SonarQube Scan') {
            environment {
                SONAR_TOKEN = credentials('sonar-token')
            }
            steps {
                container('node') {
                    withSonarQubeEnv('SonarQube') {
                        sh '''
                            npx sonar-scanner \
                                -Dsonar.projectKey=${APP_NAME} \
                                -Dsonar.sources=src \
                                -Dsonar.tests=test \
                                -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info \
                                -Dsonar.host.url=${SONAR_HOST_URL} \
                                -Dsonar.login=${SONAR_TOKEN}
                        '''
                    }
                }
            }
            post {
                always {
                    script {
                        timeout(time: 5, unit: 'MINUTES') {
                            def qg = waitForQualityGate()
                            if (qg.status != 'OK') {
                                error "❌ SonarQube Quality Gate failed: ${qg.status}"
                            }
                            echo "✅ SonarQube Quality Gate passed: ${qg.status}"
                        }
                    }
                }
            }
        }

        // ─────────────────────────────────────────
        // STAGE 4 — Black Duck SCA Scan
        // ─────────────────────────────────────────
        stage('④ Black Duck Scan') {
            environment {
                BLACKDUCK_API_TOKEN = credentials('blackduck-api-token')
            }
            steps {
                container('node') {
                    synopsys_detect(
                        detectProperties: """
                            --blackduck.url=${BLACKDUCK_URL}
                            --blackduck.api.token=${BLACKDUCK_API_TOKEN}
                            --detect.project.name=${APP_NAME}
                            --detect.project.version.name=${SHORT_SHA}
                            --detect.blackduck.scan.mode=RAPID
                            --detect.blackduck.scan.failure.severities=CRITICAL,HIGH
                            --detect.npm.include.dev.dependencies=false
                        """,
                        returnStatus: false
                    )
                }
            }
            post {
                always {
                    archiveArtifacts artifacts: 'blackduck-output/**/*', allowEmptyArchive: true
                }
            }
        }

        // ─────────────────────────────────────────
        // STAGE 5 — Push Snapshot Artifact to Nexus
        // ─────────────────────────────────────────
        stage('⑤ Push Snapshot → Nexus') {
            environment {
                NEXUS_NPM_TOKEN = credentials('nexus-npm-token')
            }
            steps {
                container('node') {
                    script {
                        def baseVersion = sh(
                            script: "node -p \"require('./package.json').version\"",
                            returnStdout: true
                        ).trim()
                        env.SNAPSHOT_VERSION = "${baseVersion}-SNAPSHOT.${env.SHORT_SHA}"
                    }

                    sh 'npm version ${SNAPSHOT_VERSION} --no-git-tag-version'
                    sh 'npm pack'

                    // Write .npmrc for Nexus authentication
                    sh '''
                        REGISTRY_HOST=$(echo ${NEXUS_NPM_REGISTRY} | sed 's|https:||')
                        echo "${REGISTRY_HOST}:_authToken=${NEXUS_NPM_TOKEN}" >> .npmrc
                        npm publish --registry ${NEXUS_NPM_REGISTRY}
                        echo "✅ Snapshot ${SNAPSHOT_VERSION} published to Nexus"
                    '''
                }
            }
        }

        // ─────────────────────────────────────────
        // STAGE 6 — Build Docker Image
        // ─────────────────────────────────────────
        stage('⑥ Build Docker Image') {
            steps {
                container('docker') {
                    sh '''
                        docker build \
                            --label git.commit=${GIT_COMMIT} \
                            --label build.number=${BUILD_NUMBER} \
                            --label app.version=${SNAPSHOT_VERSION} \
                            -t ${DOCKERHUB_USERNAME}/${APP_NAME}:sha-${SHORT_SHA} \
                            -t ${DOCKERHUB_USERNAME}/${APP_NAME}:snapshot-${SHORT_SHA} \
                            .
                        echo "✅ Docker image built: ${DOCKERHUB_USERNAME}/${APP_NAME}:sha-${SHORT_SHA}"

                        // Save image to tar for Trivy scan
                        docker save ${DOCKERHUB_USERNAME}/${APP_NAME}:sha-${SHORT_SHA} \
                            -o /tmp/image.tar
                    '''
                }
            }
        }

        // ─────────────────────────────────────────
        // STAGE 7 — Trivy Docker Image Scan
        // ─────────────────────────────────────────
        stage('⑦ Trivy Docker Scan') {
            steps {
                container('trivy') {
                    sh '''
                        trivy image \
                            --input /tmp/image.tar \
                            --severity CRITICAL,HIGH \
                            --ignore-unfixed \
                            --exit-code 1 \
                            --format table \
                            --output trivy-report.txt

                        echo "✅ Trivy scan passed — no CRITICAL/HIGH vulnerabilities"
                    '''

                    // Also generate SARIF for archive
                    sh '''
                        trivy image \
                            --input /tmp/image.tar \
                            --severity CRITICAL,HIGH \
                            --ignore-unfixed \
                            --exit-code 0 \
                            --format sarif \
                            --output trivy.sarif || true
                    '''
                }
            }
            post {
                always {
                    archiveArtifacts artifacts: 'trivy-report.txt, trivy.sarif', allowEmptyArchive: true
                    publishHTML([
                        reportDir:   '.',
                        reportFiles: 'trivy-report.txt',
                        reportName:  'Trivy Scan Report'
                    ])
                }
            }
        }

        // ─────────────────────────────────────────
        // STAGE 8 — Push Image to Docker Hub
        // ─────────────────────────────────────────
        stage('⑧ Push Image → Docker Hub') {
            environment {
                DOCKERHUB_TOKEN = credentials('dockerhub-token')
            }
            steps {
                container('docker') {
                    sh 'echo ${DOCKERHUB_TOKEN} | docker login -u ${DOCKERHUB_USERNAME} --password-stdin'

                    sh '''
                        docker push ${DOCKERHUB_USERNAME}/${APP_NAME}:sha-${SHORT_SHA}
                        docker push ${DOCKERHUB_USERNAME}/${APP_NAME}:snapshot-${SHORT_SHA}
                        echo "✅ Image pushed: ${DOCKERHUB_USERNAME}/${APP_NAME}:sha-${SHORT_SHA}"
                    '''

                    sh 'docker logout'
                }
            }
        }

        // ─────────────────────────────────────────
        // STAGE 9 — UAT Deploy (Manual Approval Gate)
        // ─────────────────────────────────────────
        stage('⑨ Deploy → UAT') {
            when {
                branch 'main'
            }
            environment {
                KUBECONFIG = credentials('kubeconfig-uat')
            }
            steps {
                // ── Manual approval gate ──────────────────
                timeout(time: 30, unit: 'MINUTES') {
                    input(
                        message: "Deploy ${APP_NAME}:sha-${SHORT_SHA} to UAT?",
                        ok: 'Approve & Deploy',
                        submitter: 'team-leads,devops-approvers'   // Jenkins user/group IDs
                    )
                }

                container('helm') {
                    sh '''
                        helm upgrade --install ${APP_NAME} ./helm/app \
                            --namespace uat \
                            --create-namespace \
                            --set image.repository=${DOCKERHUB_USERNAME}/${APP_NAME} \
                            --set image.tag=sha-${SHORT_SHA} \
                            --set replicaCount=1 \
                            --wait --timeout 5m
                        echo "✅ Deployed to UAT: sha-${SHORT_SHA}"
                    '''

                    sh '''
                        sleep 15
                        STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://uat.example.com/health)
                        if [ "$STATUS" != "200" ]; then
                          echo "❌ UAT smoke test failed — HTTP $STATUS"
                          exit 1
                        fi
                        echo "✅ UAT smoke test passed — HTTP 200"
                    '''
                }
            }
        }
    }

    post {
        success {
            slackSend(
                color: 'good',
                message: "✅ *${env.APP_NAME}* `sha-${env.SHORT_SHA}` — pipeline passed & deployed to UAT. (<${env.BUILD_URL}|View Build>)"
            )
        }
        failure {
            slackSend(
                color: 'danger',
                message: "❌ *${env.APP_NAME}* `sha-${env.SHORT_SHA}` — pipeline failed. (<${env.BUILD_URL}|View Build>)"
            )
        }
        always {
            cleanWs()
        }
    }
}
