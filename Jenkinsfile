pipeline {
    agent any
    stages {
        stage('Clone Repository') {
            steps {
                withEnv(['GIT_SSH_COMMAND=ssh -i /root/.ssh/id_rsa -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no']) {
                    sh 'git clone git@github.com:your-org/back-end.git'
                }
            }
        }
    }
}
