const { Command } = require('commander');
const program = new Command();
const { isDebugOn } = require('./src/Environment')
const Environment = require('./src/Environment')
const GitHub = require('./src/GitHub')

const environment = new Environment()
environment.initDotEnv('./')

const consoleLogOptions = (options) => {
  if (environment.isDebug()) {
    console.log('\nZelda clone command options:')
    console.log('--------------------')
    console.log('- debug: ',options.debug)
    console.log('- voyage: ', options.voyage)
    console.log('- github-token: ', options.githubToken)
    console.log('- github-org: ', options.githubOrg)
    console.log('- github-template: ', options.githubTemplate)
    console.log('- t1-count: ', options.t1Count)
    console.log('- t2-count: ', options.t2Count)
    console.log('- t3-count: ', options.t3Count)
    console.log('- t1-name: ', options.t1Name)
    console.log('- t2-name: ', options.t2Name)
    console.log('- t3-name: ', options.t3Name)
  }
}

const generateRepoList = (reposToCreate, voyageName, teamName, teamCount) => {
  environment.isDebug() && console.log('\n...generateRepoList - ',
    ' reposToCreate: ', reposToCreate,
    ` teamName: ${teamName} teamCount: ${teamCount}`)
  for (let currentTeamNo = 1; currentTeamNo <= teamCount; currentTeamNo++) {
    reposToCreate.push({ 
      team: `${ voyageName }-${ teamName.toLowerCase() }-team-${ currentTeamNo.toString().padStart(2, "0") }` 
    })
  }
}

// Interpret command line directives and options
program 
  .command('clone')
  .description('Clone a template GitHub repo to create Chingu Voyage Repos')
  .option('-d, --debug <debug>', 'Debug switch to add runtime info to console (YES/NO)')
  .option('-v, --voyage <voyagename>', 'Voyage name (e.g. v99)')
  .option('-s, --github-token <ghtoken>', 'GitHub token used for authentication')
  .option('-o, --github-org <ghorg>', 'GitHub organization name')
  .option('-t, --github-template <ghtemplate>', 'GitHub template repo name')
  .option('-t1, --t1-count <t1count>', 'Number of Tier 1 team repos to create')
  .option('-t2, --t2-count <t2count>', 'Number of Tier 2 team repos to create')
  .option('-t3, --t3-count <t3count>', 'Number of Tier 3 team repos to create')
  .option('-n1, --t1-name <t1count>', 'Number of Tier 1 team repos to create')
  .option('-n2, --t2-name <t2count>', 'Number of Tier 2 team repos to create')
  .option('-n3, --t3-name <t3count>', 'Number of Tier 3 team repos to create')
  .action( async (options) => {
    environment.setOperationalVars({
      debug: options.debug,
      voyage: options.voyage,
      githubToken: options.githubToken,
      githubOrg: options.githubOrg,
      githubTemplate: options.githubTemplate,
      t1Count: options.t1Count,
      t2Count: options.t2Count,
      t3Count: options.t3Count,
      t1Name: options.t1Name,
      t2Name: options.t2Name,
      t3Name: options.t3Name,
    })

    consoleLogOptions(options)
    console.log('\noperationalVars: ', environment.getOperationalVars())
    environment.isDebug() && environment.logEnvVars()

    let reposToCreate = []
    const { VOYAGE, NO_TIER1_TEAMS, NO_TIER2_TEAMS, NO_TIER3_TEAMS,
      TIER1_NAME, TIER2_NAME, TIER3_NAME } = environment.getOperationalVars()
    generateRepoList(reposToCreate, VOYAGE, TIER1_NAME, NO_TIER1_TEAMS)
    generateRepoList(reposToCreate, VOYAGE, TIER2_NAME, NO_TIER2_TEAMS)
    generateRepoList(reposToCreate, VOYAGE, TIER3_NAME, NO_TIER3_TEAMS)
    environment.isDebug() && console.log('reposToCreate: ', reposToCreate)
    
    const github = new GitHub(environment) 
    github.createRepos()
  })

  program.parse(process.argv)
