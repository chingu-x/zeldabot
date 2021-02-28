const { Command } = require('commander');
const program = new Command();
const { isDebugOn } = require('./src/Environment')
const Environment = require('./src/Environment')
const GitHub = require('./src/GitHub')

Environment.initDotEnv('./')
Environment.logEnvVars()

// Interpret command line directives and options
program 
  .command('clone <template>')
  .description('Clone a template GitHub repo to create Chingu Voyage Repos')
  .option('-e, --envpath <envpath>', 'Path to the .env file containing environment variables')
  .option('-s, --secret <ghtoken>', 'GitHub token used for authentication')
  .option('-t, --toucans <t1count>', 'Number of Tier 1 team repos to create')
  .option('-g, --geckos <t2count>', 'Number of Tier 2 team repos to create')
  .option('-b, --bears <t3count>', 'Number of Tier 3 team repos to create')
  .action( async (template, options) => {
    if (isDebugOn()) {
      console.log('clone ', template)
      console.log('clone command options:')
      console.log('--------------------')
      console.log('- envpath: ', options.envpath)
      console.log('- token: ', options.secret)
      console.log('- tier1: ', options.toucans)
      console.log('- tier2: ', options.geckos)
      console.log('- tier3: ', options.bears)
    }

    const github = new GitHub() 
    github.createRepos()
  })

  program.parse(process.argv)
