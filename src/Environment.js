const dotenv = require('dotenv')
const FileOps = require('./FileOps')

class Environment {
  constructor() {
    this.operationalVars = {}
  }

  logEnvVars() {
    console.log('\nEnvironment Variables:')
    console.log('---------------------')
    console.log('- DEBUG:', process.env.DEBUG)
    console.log('- VOYAGE:', process.env.VOYAGE)
    console.log('- NO_TIER1_TEAMS:', process.env.NO_TIER1_TEAMS)
    console.log('- NO_TIER2_TEAMS:', process.env.NO_TIER2_TEAMS)
    console.log('- NO_TIER3_TEAMS:', process.env.NO_TIER3_TEAMS)
    console.log('- TIER1_NAME:', process.env.TIER1_NAME)
    console.log('- TIER2_NAME:', process.env.TIER2_NAME)
    console.log('- TIER3_NAME:', process.env.TIER3_NAME)
    console.log('- GITHUB_TOKEN:', process.env.GITHUB_TOKEN)
    console.log('- GITHUB_ORG:', process.env.GITHUB_ORG)
    console.log('- GITHUB_TEMPLATE_REPO:', process.env.GITHUB_TEMPLATE_REPO)
    return true
  }

  initDotEnv(path) {
    try {
      const pathToEnv = path ? path : `${__dirname}`
      if (FileOps.validateDirPath(pathToEnv) !== 0) {
        throw new Error(`.env file not found in path - ${pathToEnv}`)
      }
      const result = dotenv.config( { path: `${pathToEnv}/.env`, silent: true } )
      if (result.error) {
        throw result.error
      }
    }
    catch (err) {
      throw err
    }
  }

  isDebug() {
    return this.operationalVars.DEBUG
  }

  getOperationalVars() {
    return this.operationalVars
  }

  setOperationalVars(options) {
    // Retrieve the current variable values from `.env` file
    let { DEBUG,
      GITHUB_TOKEN, GITHUB_ORG, GITHUB_TEMPLATE_REPO,
      VOYAGE, NO_TIER1_TEAMS, NO_TIER2_TEAMS, NO_TIER3_TEAMS,
      TIER1_NAME, TIER2_NAME, TIER3_NAME} = process.env;

    // Initialize `operationalVars` allowing command line parameter values
    // to override `.env` parameters
    const debugValue = options.debug ? options.debug : DEBUG;
    this.operationalVars.DEBUG = debugValue.toUpperCase() === 'YES' ? true : false
    this.operationalVars.VOYAGE = options.voyage ? options.voyage : VOYAGE;
    this.operationalVars.NO_TIER1_TEAMS = options.t1Count ? options.t1Count : NO_TIER1_TEAMS;
    this.operationalVars.NO_TIER2_TEAMS = options.t2Count ? options.t2Count : NO_TIER2_TEAMS;
    this.operationalVars.NO_TIER3_TEAMS = options.t3Count ? options.t3Count : NO_TIER3_TEAMS;
    this.operationalVars.TIER1_NAME = options.t1Name ? options.t1Name : TIER1_NAME;
    this.operationalVars.TIER2_NAME = options.t2Name ? options.t2Name : TIER2_NAME;
    this.operationalVars.TIER3_NAME = options.t3Name ? options.t3Name : TIER3_NAME;
    this.operationalVars.GITHUB_TOKEN = options.githubToken ? options.githubToken : GITHUB_TOKEN;
    this.operationalVars.GITHUB_ORG = options.githubOrg ? options.githubOrg : GITHUB_ORG;
    this.operationalVars.GITHUB_TEMPLATE_REPO = options.githubTemplate ? options.githubTemplate : GITHUB_TEMPLATE_REPO;
  }
}

module.exports = Environment