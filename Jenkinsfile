pipeline {
    agent any  // Run on any available Jenkins agent

    environment {
        NODE_VERSION = '16'  // Specify Node.js version
    }

    stages {
        stage('Checkout Code') {
            steps {
                git branch: 'main', credentialsId: 'git', url: 'git@github.com:your-org/back-end.git'
            }
        }

        stage('Setup Node.js') {
            steps {
                sh 'node -v || nvm install $NODE_VERSION'  // Ensure Node.js is installed
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm install'  // Install dependencies
            }
        }

        stage('Build React App') {
            steps {
                sh 'npm run build'  // Build the project
            }
        }

        stage('Run Tests') {
            steps {
                sh 'npm test'  // Run tests
            }
        }

        stage('Deploy (Optional)') {
            steps {
                sh 'scp -r build/* root@localhost:/var/www/node-app'  // Deploy to server
            }
        }
    }

    post {
        success {
            echo '🎉 Build and Deployment Successful!'
        }
        failure {
            echo '❌ Build Failed!'
        }
    }
}
