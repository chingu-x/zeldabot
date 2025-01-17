const { Command } = require('commander');
const program = new Command();
const Environment = require('./src/Environment')
const FileOps = require('./src/FileOps.js')
const GitHub = require('./src/GitHub')
const { FgRed, FgWhite  } = require('./src/util/constants.js')

const environment = new Environment()
environment.initDotEnv('./')
let isDebug = false

const consoleLogOptions = (options) => {
  if (isDebug) {
    console.log('\nZelda clone command options:')
    console.log('--------------------')
    console.log('- debug: ',options.debug)
    console.log('- restart: ', options.restart)
    console.log('- voyage: ', options.voyage)
    console.log('- github-token: ', options.githubToken)
    console.log('- github-org: ', options.githubOrg)
    console.log('- github-template: ', options.githubTemplate)
  }
}

// Use the Voyage team configuration file to build the list of repos to be
// processed
let reposToCreate = []
const generateRepoList = (configPath) => {
  const config = JSON.parse(FileOps.readFile(configPath))
  const voyageName = 'V'.concat(config.voyage_number)
  for (let team of config.teams) {
    reposToCreate.push({ 
      voyageName: `${ voyageName }`,
      tierName: `${ team.team.tier.toLowerCase() }`,
      teamNo: `${ team.team.name.slice(-2).toString().padStart(2, "0") }` 
    })
  }
  return config
}

// Process a request to clone the Voyage Template repo for each Voyage team
program 
  .command('clone')
  .description('Clone a template GitHub repo to create Chingu Voyage Repos')
  .option('-d, --debug <debug>', 'Debug switch to add runtime info to console (YES/NO)')
  .option('-r, --restart <team-number>', 'Restart processing at the specified team number')
  .option('-v, --voyage <voyagename>', 'Voyage name (e.g. v99)')
  .option('-s, --github-token <ghtoken>', 'GitHub token used for authentication')
  .option('-o, --github-org <ghorg>', 'GitHub organization name')
  .option('-t, --github-template <ghtemplate>', 'GitHub template repo name')
  .option('-c, --config-path <configpath>', 'Path to the Teams config file')
  .action( async (options) => {
    environment.setOperationalVars({
      debug: options.debug,
      restart: options.restart,
      voyage: options.voyage,
      githubToken: options.githubToken,
      githubOrg: options.githubOrg,
      githubTemplate: options.githubTemplate,
      configFile: options.configPath,
    })

    isDebug = environment.isDebug()

    isDebug && consoleLogOptions(options)
    isDebug && console.log('\noperationalVars: ', environment.getOperationalVars())
    environment.isDebug() && environment.logEnvVars()

    const { CONFIG_PATH } = environment.getOperationalVars()
    const teamsConfig = generateRepoList(CONFIG_PATH)
    
    const github = new GitHub(environment) 
    await github.cloneTemplate(reposToCreate, teamsConfig)
  })

// Process a request to clone the Voyage Template repo for each Voyage team
program 
  .command('add_issues')
  .description('Clone issues from the template GitHub repo to the Chingu Voyage team Repos')
  .option('-d, --debug <debug>', 'Debug switch to add runtime info to console (YES/NO)')
  .option('-r, --restart <team-number>', 'Restart processing at the specified team number')
  .option('-v, --voyage <voyagename>', 'Voyage name (e.g. v99)')
  .option('-s, --github-token <ghtoken>', 'GitHub token used for authentication')
  .option('-o, --github-org <ghorg>', 'GitHub organization name')
  .option('-t, --github-template <ghtemplate>', 'GitHub template repo name')
  .action( async (options) => {
    environment.setOperationalVars({
      debug: options.debug,
      restart: options.restart,
      voyage: options.voyage,
      githubToken: options.githubToken,
      githubOrg: options.githubOrg,
      githubTemplate: options.githubTemplate,
    })

    isDebug = environment.isDebug()

    isDebug && consoleLogOptions(options)
    isDebug && console.log('\noperationalVars: ', environment.getOperationalVars())
    environment.isDebug() && environment.logEnvVars()

    const { CONFIG_PATH } = environment.getOperationalVars()
    const teamsConfig = generateRepoList(CONFIG_PATH)
    
    const github = new GitHub(environment) 
    await github.addIssuesToTeamRepos(reposToCreate, teamsConfig)
  })

// Process a request to create teams and authorize them to access the associated repo
program 
  .command('authorize')
  .description('Create teams and authorize them to access the associated team repo')
  .option('-d, --debug <debug>', 'Debug switch to add runtime info to console (YES/NO)')
  .option('-r, --restart <team-number>', 'Restart processing at the specified team number')
  .option('-v, --voyage <voyagename>', 'Voyage name (e.g. v99)')
  .option('-s, --github-token <ghtoken>', 'GitHub token used for authentication')
  .option('-o, --github-org <ghorg>', 'GitHub organization name')
  .option('-t, --github-template <ghtemplate>', 'GitHub template repo name')
  .action( async (options) => {
    environment.setOperationalVars({
      debug: options.debug,
      restart: options.restart,
      voyage: options.voyage,
      githubToken: options.githubToken,
      githubOrg: options.githubOrg,
      githubTemplate: options.githubTemplate,
    })

    isDebug = environment.isDebug()

    isDebug && consoleLogOptions(options)
    isDebug && console.log('\noperationalVars: ', environment.getOperationalVars())
    environment.isDebug() && environment.logEnvVars()

    const { CONFIG_PATH } = environment.getOperationalVars()
    const teamsConfig = generateRepoList(CONFIG_PATH)
    
    const github = new GitHub(environment) 
    await github.createAuthorizeTeams(reposToCreate,teamsConfig)
  })

// Process a request to validate GitHub user names
program 
  .command('validate')
  .description('Validate that GitHub user names for this Voyage are correct')
  .option('-d, --debug <debug>', 'Debug switch to add runtime info to console (YES/NO)')
  .option('-r, --restart <team-number>', 'Restart processing at the specified team number')
  .option('-v, --voyage <voyagename>', 'Voyage name (e.g. v99)')
  .option('-s, --github-token <ghtoken>', 'GitHub token used for authentication')
  .option('-o, --github-org <ghorg>', 'GitHub organization name')
  .action( async (options) => {
    environment.setOperationalVars({
      debug: options.debug,
      restart: options.restart,
      voyage: options.voyage,
      githubToken: options.githubToken,
      githubOrg: options.githubOrg,
    })

    isDebug = environment.isDebug()

    isDebug && consoleLogOptions(options)
    isDebug && console.log('\noperationalVars: ', environment.getOperationalVars())
    environment.isDebug() && environment.logEnvVars()

    const { CONFIG_PATH } = environment.getOperationalVars()
    const teamsConfig = generateRepoList(CONFIG_PATH)
    const github = new GitHub(environment) 

    // Validate the GitHub user names in each Voyage team in the config file
    for (team of teamsConfig.teams) {
      for (let index = 0; index < team.team.github_names.length; index++) {
        const githubUser = await github.getUser(team.team.github_names[index])
        const isValidGithubName = githubUser !== undefined ? true : false
        isDebug && console.log(`${ isValidGithubName ? FgWhite : FgRed }validate - team:${ team.team.name } githubName:${ team.team.github_names[index].padEnd(20, ' ') } valid:${ isValidGithubName }`)
      }
    }
  })

program.parse(process.argv)
