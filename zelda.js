const program = require('commander');
const Environment = require('./src/Environment')

// Interpret command line directives and options
program 
  .command('clone')
  .description('Clone a template GitHub repo to create Chingu Voyage Repos')
  .option('-e, --envpath <env-path>', 'Path to the .env file containing environment variables')
  .option('-t, --token <gitHub-token>', 'GitHub token used for authentication')

  .action(async (args) => {
    console.log('clone command options:')
    console.log('--------------------')
    console.log('- envpath: ', args.envpath)
    console.log('- token: ', args.token)

    Environment.initDotEnv('./')
    Environment.logEnvVars()
    
  });
 
program.parse(process.argv)
