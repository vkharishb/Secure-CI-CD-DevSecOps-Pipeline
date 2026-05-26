// =============================================================
// Jenkinsfile — Secure CI Pipeline
// Converted from GitHub Actions CI.yml
//
// Stages:
//   1. Build & Test
//   2. SonarQube Analysis
//   3. OWASP Dependency Check   (parallel with Stage 2)
//   4. Nexus Publish
//   5. Docker Build & Push
//   6. Docker Security Scan (Trivy)
// =============================================================

pipeline {

    agent any

    // ── Triggers ─────────────────────────────────────────────
    triggers {
        githubPush()
    }

    // ── Options ──────────────────────────────────────────────
    options {
        buildDiscarder(logRotator(numToKeepStr: '20'))
        timeout(time: 60, unit: 'MINUTES')
        timestamps()
        disableConcurrentBuilds()
    }

    // ── Global environment ────────────────────────────────────
    environment {
        NODE_VERSION        = '20'
        SONAR_HOST_URL      = 'https://sonarcloud.io'
        SONAR_ORG           = 'vkharishb'
        SONAR_PROJECT_KEY   = 'Secure-CI-CD-Pipeline'
        IMAGE_NAME          = 'secure-cicd-pipeline'
        SHORT_SHA           = "${env.GIT_COMMIT ? env.GIT_COMMIT[0..6] : 'unknown'}"

        // Credentials (set these in Manage Jenkins → Credentials)
        SONAR_TOKEN         = credentials('sonar-token')
        NEXUS_NPM_REGISTRY  = credentials('nexus-npm-registry')
        NEXUS_NPM_TOKEN     = credentials('nexus-npm-token')
        DOCKERHUB_USERNAME  = credentials('dockerhub-username')
        DOCKERHUB_TOKEN     = credentials('dockerhub-token')
    }

    stages {

        // ─────────────────────────────────────────────────────
        // STAGE 1 — Build & Test
        // Mirrors: jobs.build in CI.yml
        // ─────────────────────────────────────────────────────
        stage('① Build & Test') {
            steps {
                echo "Branch: ${env.GIT_BRANCH}"
                echo "Commit: ${env.GIT_COMMIT}"

                // Install dependencies (mirrors: npm ci with cache)
                sh 'npm ci'

                // Run tests with coverage (mirrors: npm test -- --coverage ...)
                sh '''
                    npm test -- \
                        --coverage \
                        --coverageReporters=lcov \
                        --coverageReporters=text \
                        --forceExit
                '''

                // Build application (mirrors: npm run build)
                sh 'npm run build'
            }

            post {
                always {
                    // Archive coverage + build artifacts
                    // (mirrors: upload-artifact coverage-report + build-files)
                    archiveArtifacts artifacts: 'dist/**/*',       allowEmptyArchive: true
                    archiveArtifacts artifacts: 'coverage/**/*',   allowEmptyArchive: true

                    // Publish HTML coverage report in Jenkins UI
                    publishHTML([
                        reportDir:   'coverage/lcov-report',
                        reportFiles: 'index.html',
                        reportName:  'Coverage Report',
                        keepAll:     true
                    ])
                }
                failure {
                    echo '❌ Build & Test failed.'
                }
                success {
                    echo '✅ Build & Test passed.'
                }
            }
        }

        // ─────────────────────────────────────────────────────
        // STAGES 2 & 3 — Run in PARALLEL
        // Mirrors: sonarqube + owasp-scan (both need: build)
        // ─────────────────────────────────────────────────────
        stage('Security Scans (parallel)') {
            parallel {

                // ── STAGE 2 — SonarQube Analysis ─────────────
                // Mirrors: jobs.sonarqube in CI.yml
                stage('② SonarQube Analysis') {
                    steps {
                        withSonarQubeEnv('SonarQube') {
                            sh '''
                                npx sonar-scanner \
                                    -Dsonar.organization=${SONAR_ORG} \
                                    -Dsonar.projectKey=${SONAR_PROJECT_KEY} \
                                    -Dsonar.sources=src \
                                    -Dsonar.tests=tests \
                                    -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info \
                                    -Dsonar.host.url=${SONAR_HOST_URL} \
                                    -Dsonar.login=${SONAR_TOKEN} \
                                    -Dsonar.qualitygate.wait=false \
                                    -Dsonar.qualitygate.timeout=300
                            '''
                        }
                    }
                    post {
                        success { echo '✅ SonarQube scan passed.' }
                        failure { echo '❌ SonarQube scan failed.' }
                    }
                }

                // ── STAGE 3 — OWASP Dependency Check ─────────
                // Mirrors: jobs.owasp-scan in CI.yml
                stage('③ OWASP Dependency Check') {
                    steps {
                        // Run OWASP Dependency Check via Jenkins plugin
                        // (requires OWASP Dependency-Check plugin installed)
                        dependencyCheck(
                            additionalArguments: '''
                                --project "${JOB_NAME}"
                                --scan .
                                --enableRetired
                                --format HTML
                                --out owasp-report
                            ''',
                            odcInstallation: 'dependency-check'
                        )

                        // npm audit — mirrors: npm audit --audit-level=high || true
                        sh 'npm audit --audit-level=high || true'
                    }
                    post {
                        always {
                            // Publish OWASP HTML report
                            // (mirrors: upload-artifact owasp-report)
                            publishHTML([
                                reportDir:   'owasp-report',
                                reportFiles: 'dependency-check-report.html',
                                reportName:  'OWASP Dependency Check Report',
                                keepAll:     true
                            ])
                            archiveArtifacts artifacts: 'owasp-report/**/*', allowEmptyArchive: true
                        }
                        success { echo '✅ OWASP scan passed.' }
                        failure { echo '❌ OWASP scan failed.' }
                    }
                }

            } // end parallel
        }

        // ─────────────────────────────────────────────────────
        // STAGE 4 — Nexus Publish
        // Mirrors: jobs.nexus-publish (needs: sonarqube, owasp-scan)
        // ─────────────────────────────────────────────────────
        stage('④ Nexus Publish') {
            steps {
                // Configure .npmrc for Nexus auth
                // (mirrors: Configure Nexus npm auth step)
                sh '''
                    REGISTRY_HOST=$(echo "${NEXUS_NPM_REGISTRY}" | sed 's|http://||' | sed 's|https://||')
                    echo "registry=${NEXUS_NPM_REGISTRY}"                         > ~/.npmrc
                    echo "//${REGISTRY_HOST}:_authToken=${NEXUS_NPM_TOKEN}"      >> ~/.npmrc
                '''

                // Publish package to Nexus
                // (mirrors: npm publish --registry=... || true)
                sh '''
                    npm publish \
                        --registry=${NEXUS_NPM_REGISTRY} || true
                '''
            }
            post {
                success { echo '✅ Nexus publish passed.' }
                failure { echo '❌ Nexus publish failed.' }
            }
        }

        // ─────────────────────────────────────────────────────
        // STAGE 5 — Docker Build & Push
        // Mirrors: jobs.docker-build-push (needs: nexus-publish)
        // ─────────────────────────────────────────────────────
        stage('⑤ Docker Build & Push') {
            steps {
                script {
                    env.FULL_SHA = env.GIT_COMMIT ?: 'unknown'
                }

                // Login to Docker Hub
                // (mirrors: docker/login-action@v3)
                sh 'echo "${DOCKERHUB_TOKEN}" | docker login -u "${DOCKERHUB_USERNAME}" --password-stdin'

                // Build image with SHA tag + latest
                // (mirrors: docker build -t ...sha -t ...latest)
                sh '''
                    docker build \
                        -t ${DOCKERHUB_USERNAME}/${IMAGE_NAME}:${FULL_SHA} \
                        -t ${DOCKERHUB_USERNAME}/${IMAGE_NAME}:latest \
                        .
                    echo "✅ Docker image built: ${DOCKERHUB_USERNAME}/${IMAGE_NAME}:${FULL_SHA}"
                '''

                // Push both tags
                // (mirrors: docker push sha + docker push latest)
                sh '''
                    docker push ${DOCKERHUB_USERNAME}/${IMAGE_NAME}:${FULL_SHA}
                    docker push ${DOCKERHUB_USERNAME}/${IMAGE_NAME}:latest
                    echo "✅ Images pushed to Docker Hub"
                '''
            }
            post {
                always {
                    sh 'docker logout || true'
                }
                success { echo '✅ Docker build & push passed.' }
                failure { echo '❌ Docker build & push failed.' }
            }
        }

        // ─────────────────────────────────────────────────────
        // STAGE 6 — Docker Security Scan (Trivy)
        // Mirrors: jobs.docker-security-scan (needs: docker-build-push)
        // ─────────────────────────────────────────────────────
        stage('⑥ Docker Security Scan (Trivy)') {
            steps {
                script {
                    env.FULL_SHA = env.GIT_COMMIT ?: 'unknown'
                }

                // Install Trivy if not available on agent
                sh '''
                    if ! command -v trivy &> /dev/null; then
                        curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh \
                            | sh -s -- -b /usr/local/bin
                    fi
                '''

                // Run Trivy scan — table format, fail on CRITICAL/HIGH
                // (mirrors: trivy-action exit-code:1, severity:CRITICAL,HIGH, ignore-unfixed)
                sh '''
                    trivy image \
                        --severity CRITICAL,HIGH \
                        --ignore-unfixed \
                        --exit-code 1 \
                        --vuln-type os,library \
                        --format table \
                        --output trivy-report.txt \
                        ${DOCKERHUB_USERNAME}/${IMAGE_NAME}:${FULL_SHA}
                    echo "✅ Trivy scan passed — no CRITICAL/HIGH vulnerabilities"
                '''

                // Generate SARIF report for archiving
                // (mirrors: Generate Trivy Report step — format:sarif)
                sh '''
                    trivy image \
                        --severity CRITICAL,HIGH \
                        --ignore-unfixed \
                        --exit-code 0 \
                        --vuln-type os,library \
                        --format sarif \
                        --output trivy-results.sarif \
                        ${DOCKERHUB_USERNAME}/${IMAGE_NAME}:${FULL_SHA} || true
                '''
            }
            post {
                always {
                    // Archive Trivy outputs
                    // (mirrors: Upload Trivy Results step)
                    archiveArtifacts artifacts: 'trivy-report.txt, trivy-results.sarif', allowEmptyArchive: true

                    publishHTML([
                        reportDir:   '.',
                        reportFiles: 'trivy-report.txt',
                        reportName:  'Trivy Security Scan Report',
                        keepAll:     true
                    ])
                }
                success { echo '✅ Trivy scan passed.' }
                failure { echo '❌ Trivy scan failed — vulnerabilities found.' }
            }
        }

    } // end stages

    // ── Post pipeline ─────────────────────────────────────────
    post {
        success {
            echo "✅ Pipeline passed for commit ${env.GIT_COMMIT} on ${env.GIT_BRANCH}"
        }
        failure {
            echo "❌ Pipeline failed for commit ${env.GIT_COMMIT} on ${env.GIT_BRANCH}"
        }
        always {
            cleanWs()
        }
    }

}
