pipeline {
    agent any

    tools {
    }

    environment {
        REGISTRY = "docker.io"
        DOCKER_USER = "sahilll22"
        SONAR_PROJECT_KEY = "skillswap"
        SONAR_HOST_URL = "http://172.31.3.113:9000"
    }

    stages {
        stage('Checkout Code') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm run install-all'
            }
        }

        stage('Run Unit Tests') {
            parallel {
                stage('Frontend Tests') {
                    steps {
                        dir('frontend') {
                            sh 'npm test -- --watchAll=false --passWithNoTests || true'
                        }
                    }
                }
                stage('Backend Tests') {
                    steps {
                        script {
                            def services = [
                                "api-gateway",
                                "user-service",
                                "skill-service",
                                "exchange-service",
                                "notification-service"
                            ]
                            for (s in services) {
                                dir("services/${s}") {
                                    sh 'npm test || true'
                                }
                            }
                        }
                    }
                }
            }
        }

        stage('SonarQube Analysis') {
            environment {
                SONAR_TOKEN = credentials('sonar-cred')
            }
            steps {
                script {
                    def scannerHome = tool 'sonar-scanner'
                    withSonarQubeEnv('sonar-server') {
                        sh """
                        ${scannerHome}/bin/sonar-scanner \
                        -Dsonar.projectKey=${SONAR_PROJECT_KEY} \
                        -Dsonar.sources=. \
                        -Dsonar.host.url=${SONAR_HOST_URL} \
                        -Dsonar.login=${SONAR_TOKEN} \
                        -Dsonar.exclusions=**/node_modules/**
                        """
                    }
                }
            }
        }

        stage('Build Docker Images') {
            steps {
                sh 'docker compose build'
            }
        }

        stage('Push Images to DockerHub') {
            environment {
                DOCKER_CREDS = credentials('docker-hub-creds')
            }
            steps {
                sh """
                echo ${DOCKER_CREDS_PSW} | docker login -u ${DOCKER_CREDS_USR} --password-stdin
                docker compose push
                """
            }
        }

        stage('Deploy (Docker Compose)') {
            steps {
                sh 'docker compose up -d'
            }
        }
    }

    post {
        success {
            echo "✅ SkillSwap CI/CD Pipeline Successful"
        }
        failure {
            echo "❌ Pipeline Failed"
        }
        always {
            cleanWs()
        }
    }
}