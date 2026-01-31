pipeline {
    agent any

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

        stage('Run Unit Tests') {
            parallel {
                stage('Frontend Tests') {
                    steps {
                        dir('frontend') {
                            sh 'npm install'
                            sh 'npm test -- --watchAll=false || true'
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
                                    sh 'npm install'
                                    sh 'npm test || true'
                                }
                            }
                        }
                    }
                }
            }
        }

        stage('SonarQube Scan') {
            environment {
                SONAR_TOKEN = credentials('sonar-cred')
            }
            steps {
                sh """
                sonar-scanner \
                -Dsonar.projectKey=${SONAR_PROJECT_KEY} \
                -Dsonar.sources=. \
                -Dsonar.host.url=${SONAR_HOST_URL} \
                -Dsonar.login=${SONAR_TOKEN}
                """
            }
        }

        stage('Build Docker Images') {
            steps {
                sh 'docker compose build'
            }
        }

       // stage('Trivy Image Scan') {
         //   steps {
           //     script {
             //       def images = [
               //         "frontend",
                 //       "api-gateway",
                   //     "user-service",
                    //    "skill-service",
                      //  "exchange-service",
                        //"notification-service"
                   // ]

                   // for (img in images) {
                    //    sh "trivy image --exit-code 0 --severity HIGH,CRITICAL ${DOCKER_USER}/${img}:latest || true"
                   // }
                //}
            //  }
        //}

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

        stage('Deploy') {
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
