const { Command } = require('commander');
const program = new Command();
const { isDebugOn } = require('./src/Environment')
const Environment = require('./src/Environment')
const GitHub = require('./src/GitHub')
const teamslist = require('./config/v47_teams_users.json')

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
    console.log('- t1-count: ', options.t1Count)
    console.log('- t2-count: ', options.t2Count)
    console.log('- t3-count: ', options.t3Count)
    console.log('- t1-name: ', options.t1Name)
    console.log('- t2-name: ', options.t2Name)
    console.log('- t3-name: ', options.t3Name)
  }
}

let reposToCreate = []
const generateRepoList = (voyageName, teams) => {
  let teamNo = 0
  for (let teamCount = 0; teamCount < teams.length; teamCount++) {
    if (teams[teamCount].count > 0) {
      for (let currentTeamNo = 1; currentTeamNo <= teams[teamCount].count; currentTeamNo++) {
        teamNo += 1
        reposToCreate.push({ 
          voyageName: `${ voyageName }`,
          tierName: `${ teams[teamCount].name.toLowerCase() }`,
          teamNo: `${ teamNo.toString().padStart(2, "0") }` 
        })
      }
    }
  }
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
  .option('-t1, --t1-count <t1count>', 'Number of Tier 1 team repos to create')
  .option('-t2, --t2-count <t2count>', 'Number of Tier 2 team repos to create')
  .option('-t3, --t3-count <t3count>', 'Number of Tier 3 team repos to create')
  .option('-n1, --t1-name <t1count>', 'Name of Tier 1 team used to create repo/team name')
  .option('-n2, --t2-name <t2count>', 'Name of Tier 2 team used to create repo/team name')
  .option('-n3, --t3-name <t3count>', 'Name of Tier 3 team used to create repo/team name')
  .action( async (options) => {
    environment.setOperationalVars({
      debug: options.debug,
      restart: options.restart,
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

    isDebug = environment.isDebug()

    isDebug && consoleLogOptions(options)
    isDebug && console.log('\noperationalVars: ', environment.getOperationalVars())
    environment.isDebug() && environment.logEnvVars()

    const { VOYAGE, NO_TIER1_TEAMS, NO_TIER2_TEAMS, NO_TIER3_TEAMS,
      TIER1_NAME, TIER2_NAME, TIER3_NAME } = environment.getOperationalVars()
    generateRepoList(VOYAGE, [
      { name: TIER1_NAME, count: NO_TIER1_TEAMS },
      { name: TIER2_NAME, count: NO_TIER2_TEAMS },
      { name: TIER3_NAME, count: NO_TIER3_TEAMS }
    ])
    
    const github = new GitHub(environment) 
    await github.cloneTemplate(reposToCreate, teamslist)
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
.option('-t1, --t1-count <t1count>', 'Number of Tier 1 team repos to create')
.option('-t2, --t2-count <t2count>', 'Number of Tier 2 team repos to create')
.option('-t3, --t3-count <t3count>', 'Number of Tier 3 team repos to create')
.option('-n1, --t1-name <t1count>', 'Name of Tier 1 team used to create repo/team name')
.option('-n2, --t2-name <t2count>', 'Name of Tier 2 team used to create repo/team name')
.option('-n3, --t3-name <t3count>', 'Name of Tier 3 team used to create repo/team name')
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

  const { VOYAGE, NO_TIER1_TEAMS, NO_TIER2_TEAMS, NO_TIER3_TEAMS,
    TIER1_NAME, TIER2_NAME, TIER3_NAME } = environment.getOperationalVars()
  generateRepoList(VOYAGE, [
    { name: TIER1_NAME, count: NO_TIER1_TEAMS },
    { name: TIER2_NAME, count: NO_TIER2_TEAMS },
    { name: TIER3_NAME, count: NO_TIER3_TEAMS }
  ])
  
  const github = new GitHub(environment) 
  await github.addIssuesToTeamRepos(reposToCreate,teamslist)
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
.option('-t1, --t1-count <t1count>', 'Number of Tier 1 team repos to create')
.option('-t2, --t2-count <t2count>', 'Number of Tier 2 team repos to create')
.option('-t3, --t3-count <t3count>', 'Number of Tier 3 team repos to create')
.option('-n1, --t1-name <t1count>', 'Name of Tier 1 team used to create repo/team name')
.option('-n2, --t2-name <t2count>', 'Name of Tier 2 team used to create repo/team name')
.option('-n3, --t3-name <t3count>', 'Name of Tier 3 team used to create repo/team name')
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

  const { VOYAGE, NO_TIER1_TEAMS, NO_TIER2_TEAMS, NO_TIER3_TEAMS,
    TIER1_NAME, TIER2_NAME, TIER3_NAME } = environment.getOperationalVars()
  generateRepoList(VOYAGE, [
    { name: TIER1_NAME, count: NO_TIER1_TEAMS },
    { name: TIER2_NAME, count: NO_TIER2_TEAMS },
    { name: TIER3_NAME, count: NO_TIER3_TEAMS }
  ])
  
  const github = new GitHub(environment) 
  await github.createAuthorizeTeams(reposToCreate,teamslist)
})

program.parse(process.argv)
