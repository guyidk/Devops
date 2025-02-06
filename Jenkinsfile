pipeline {
    agent any
    stages {
        stage('Clone Repository') {
            steps {
                checkout([
                    $class: 'GitSCM',
                    branches: [[name: '*/main']],
                    userRemoteConfigs: [[
                        url: 'https://github.com/guyidk/DEVOPS-Book_Track.git',
                        credentialsId: '960adf43-9a7f-4930-8774-0383b5caed20' 
                    ]]
                ])
            }
        }
        stage('Run Backend Mocha Tests') {
            steps {
                bat 'npm run backend-test-mocha'
            }
        }
        stage('Run Frontend Instrumentation') {
            steps {
                bat 'npm run frontend-instrument'
            }
        }
        stage('Run Frontend Tests') {
            steps {
                bat 'npm run frontend-test-electron'
            }
        }
        stage('Docker Login, Compose, Build and Push') {
            steps {
                script {
                    withCredentials([usernamePassword(credentialsId: '8567fd83-2c62-43c4-bdca-26bab6fd6c27', usernameVariable: 'Docker_Username', passwordVariable: 'Docker_Password')]) {
                        bat '''
                            docker login -u %Docker_Username% -p %Docker_Password%
                            docker-compose build
                            docker-compose push
                        '''
                    }
                }
            }
        }
        stage('Azure Login') {
            steps {
                script {
                    withCredentials([
                        usernamePassword(credentialsId: '8fd6b74a-7216-430d-a7a8-6a08ac5f9186', usernameVariable: 'appId_value', passwordVariable: 'password_value'),
                        string(credentialsId: '054b515b-504b-425d-b085-75c14b48f833', variable: 'tenant_value')
                    ]) {
                        try {
                            bat 'az login --service-principal -u %appId_value% -p %password_value% --tenant %tenant_value%'
                        } catch (Exception e) {
                            error "Azure login failed: ${e.message}"
                        }
                    }
                }
            }
        }
        stage('Azure AKS Cluster Setup') {
            steps {
                bat '''
                    az aks show --resource-group btResourceGroup --name btAKSCluster -o json >nul 2>nul || az aks create --resource-group btResourceGroup --name btAKSCluster --node-count 1 --generate-ssh-keys 2>&1
                '''
            }
        }
        stage('Get AKS Cluster Credentials') {
            steps {
                script {
                    withCredentials([string(credentialsId: '3bfe8e54-a3e1-4e99-98e4-67cbf5eb1ab7', variable: 'subscription_id')]) {
                        try {
                            bat '''
                                az aks get-credentials --resource-group "btResourceGroup" --name "btAKSCluster" --overwrite-existing --subscription %subscription_id%
                            '''
                        } catch (Exception e) {
                            error "Get AKS Cluster Credentials failed: ${e.message}"
                        }
                    }
                }
            }
        }
        stage('Apply Kubernetes Deployment and Service') {
            steps {
                bat '''
                    kubectl apply -f bt-deployment.yaml
                    kubectl apply -f bt-service.yaml
                '''
            }
        }
        stage('Verify Kubernetes Deployment') {
            steps {
                bat '''
                    kubectl rollout history deployment/bt-deployment
                    kubectl get pods
                    kubectl get services
                '''
            }
        }
    }

    post {
        success {
            script {
                emailext(
                    subject: "Pipeline Success: ${env.JOB_NAME}",
                    body: """
                    The pipeline '${env.JOB_NAME}' completed successfully.
                    Build: ${env.BUILD_NUMBER}
                    
                    Check Jenkins for more details.
                    """,
                    to: 'jonathandoeington103@gmail.com'
                )
            }
        }
 
        failure {
            script {
                emailext(
                    subject: "Pipeline Failed: ${env.JOB_NAME}",
                    body: """
                    The pipeline '${env.JOB_NAME}' failed.
                    Build: ${env.BUILD_NUMBER}
                    
                    Check Jenkins for more details.
                    """,
                    to: 'jonathandoeington103@gmail.com'
                )
            }
            script {
                echo "Pipeline failed. Triggering GitHub Actions workflow..." // Log a message indicating that the pipeline has failed and a GitHub Actions workflow is being triggered.

                withCredentials([string(credentialsId: '17ca1df9-d281-4064-9f87-5f5bac260b10', variable: 'GITHUB_TOKEN')]) {
                    // Define the API endpoint URL for triggering the GitHub Actions workflow for the specified repository and workflow file.
                    def githubWorkflowDispatchUrl = "https://api.github.com/repos/guyidk/DEVOPS-Book_Track/actions/workflows/node.js.yml/dispatches"
                    // Execute a batch script to send a POST request to the GitHub API using the 'curl' command.
                    // Add an authorization header with the GitHub token.
                    // Specify the API version and response format as JSON.
                    // Send the JSON payload specifying the branch to trigger ('main').
                    // Redirect the output (stdout and stderr) to a file named 'curl_output.txt'.
                    bat """
                    curl -X POST -H "Authorization: Bearer %GITHUB_TOKEN%" ^ 
                        -H "Accept: application/vnd.github.v3+json" ^
                        -d "{\\"ref\\": \\"main\\"}" ^
                        ${githubWorkflowDispatchUrl} > curl_output.txt 2>&1
                    """
                    // Read the content of the output file ('curl_output.txt') containing the response from the GitHub API.
                    def curlOutput = readFile('curl_output.txt')
                    // Log the response from the GitHub API to the Jenkins console to verify the result of the trigger request.
                    echo "GitHub Actions Trigger Response: ${curlOutput}"
                }
            }
        }

        always {
            echo 'Pipeline execution completed.'
        }
    }
}