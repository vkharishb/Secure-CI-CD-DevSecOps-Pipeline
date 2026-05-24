# Secure CI/CD Pipeline

A production-ready **Secure CI/CD Pipeline** built using **GitHub Actions**, **SonarQube Cloud**, **OWASP Dependency Check**, **Nexus Repository**, **Docker**, and **Trivy Security Scanning** for automated build, testing, artifact publishing, and container security validation.

## Project Overview

This project demonstrates a **secure DevSecOps CI/CD implementation** for a Node.js application.

The pipeline automates:
- Application build and testing
- Static code analysis
- Security vulnerability scanning
- Dependency risk assessment
- Artifact publishing to Nexus
- Docker image build and push
- Container image vulnerability scanning

The pipeline is configured to run automatically on:
- `dev`
- `main`

## Key Features

- Automated CI/CD using GitHub Actions
- Code Quality Analysis with SonarQube Cloud
- OWASP Dependency Vulnerability Scanning
- Nexus Artifact Publishing
- Docker Image Build & Push
- Container Security Scanning with Trivy
- GitHub Security Tab Integration (SARIF)
- Branch-based validation (`dev` and `main`)
- Automated Quality Gate Enforcement

## Architecture

```text
Developer Push (dev/main)
        ↓
GitHub Repository
        ↓
GitHub Actions Pipeline
        ├── Stage 1 → Build & Test
        ├── Stage 2 → SonarQube Analysis
        ├── Stage 3 → OWASP Dependency Check
        ├── Stage 4 → Nexus Publish
        ├── Stage 5 → Docker Build & Push
        └── Stage 6 → Docker Security Scan (Trivy)
```

## Technology Stack

| Category | Technology |
|----------|-------------|
| CI/CD | GitHub Actions |
| Runtime | Node.js 20 |
| Code Quality | SonarQube Cloud |
| Security Scanning | OWASP Dependency Check |
| Containerization | Docker |
| Container Security | Trivy |
| Artifact Repository | Nexus |
| Testing | Jest |

## Repository Structure

```text
Secure-CI-CD-Pipeline/
├── .github/workflows/
├── public/
├── src/
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   ├── utils/
│   ├── app.js
│   └── index.js
├── tests/
├── Dockerfile
├── package.json
├── package-lock.json
└── README.md
```

## CI/CD Workflow

### Stage 1 — Build & Test
- Checkout source code
- Install dependencies
- Execute unit tests
- Generate code coverage
- Build application

```bash
npm ci
npm test -- --coverage
npm run build
```

### Stage 2 — SonarQube Analysis
- Code smells detection
- Vulnerability analysis
- Security hotspots
- Coverage integration
- Quality Gate validation

Runs on both `dev` and `main`.

### Stage 3 — OWASP Dependency Check
Scans:
- Vulnerable dependencies
- CVEs
- Retired packages

```bash
npm audit --audit-level=high
```

### Stage 4 — Nexus Publish
Publishes npm artifacts to Nexus Repository Manager.

### Stage 5 — Docker Build & Push
Builds and pushes Docker images tagged with:
- `latest`
- Commit SHA

```bash
docker build -t secure-cicd-pipeline .
docker push secure-cicd-pipeline
```

### Stage 6 — Docker Security Scan
Scans Docker images using Trivy:
- Critical vulnerabilities
- High severity vulnerabilities
- OS & package vulnerabilities

## Branch Strategy

| Branch | Purpose |
|--------|---------|
| `dev` | Development & Testing |
| `main` | Production-ready Validation |

## Required GitHub Secrets

### SonarCloud
- `SONAR_TOKEN`

### Nexus
- `NEXUS_NPM_REGISTRY`
- `NEXUS_NPM_TOKEN`

### DockerHub
- `DOCKER_USERNAME`
- `DOCKER_PASSWORD`

## Local Development Setup

```bash
git clone https://github.com/<your-username>/Secure-CI-CD-Pipeline.git
cd Secure-CI-CD-Pipeline
npm install
npm start
```

Run tests:

```bash
npm test
npm test -- --coverage
```

## Docker Usage

```bash
docker build -t secure-cicd-pipeline .
docker run -p 3000:3000 secure-cicd-pipeline
```

## Troubleshooting

### SonarQube Failing
Verify:
- `SONAR_TOKEN`
- `sonar.organization`
- `sonar.projectKey`

### Docker Push Failed
Verify:
- `DOCKER_USERNAME`
- `DOCKER_PASSWORD`

### Nexus Publish Failed
Verify:
- `NEXUS_NPM_REGISTRY`
- `NEXUS_NPM_TOKEN`

## Future Enhancements
- Kubernetes Deployment
- ArgoCD GitOps
- Terraform Automation
- Slack Notifications
- Approval Gates

## Author

**VK Harish Bodapati**  
DevSecOps | Cloud | Platform Engineering
