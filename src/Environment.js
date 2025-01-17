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
    console.log('- RESTART:', process.env.RESTART)
    console.log('- VOYAGE:', process.env.VOYAGE)
    console.log('- GITHUB_TOKEN:', process.env.GITHUB_TOKEN)
    console.log('- GITHUB_ORG:', process.env.GITHUB_ORG)
    console.log('- GITHUB_TEMPLATE_REPO:', process.env.GITHUB_TEMPLATE_REPO)
    console.log('- CONFIG_PATH:', process.env.CONFIG_PATH)
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
    let { DEBUG, RESTART, 
      GITHUB_TOKEN, GITHUB_ORG, GITHUB_TEMPLATE_REPO,
      VOYAGE, TIER1_NAME, TIER2_NAME, TIER3_NAME, CONFIG_PATH} = process.env;

    // Initialize `operationalVars` allowing command line parameter values
    // to override `.env` parameters
    const debugValue = options.debug ? options.debug : DEBUG;
    this.operationalVars.DEBUG = debugValue.toUpperCase() === 'YES' ? true : false
    this.operationalVars.RESTART = options.restart > 0 ? options.restart : RESTART
    this.operationalVars.VOYAGE = options.voyage ? options.voyage : VOYAGE
    this.operationalVars.GITHUB_TOKEN = options.githubToken ? options.githubToken : GITHUB_TOKEN
    this.operationalVars.GITHUB_ORG = options.githubOrg ? options.githubOrg : GITHUB_ORG
    this.operationalVars.GITHUB_TEMPLATE_REPO = options.githubTemplate ? options.githubTemplate : GITHUB_TEMPLATE_REPO
    this.operationalVars.CONFIG_PATH = options.configPath ? options.configPath : CONFIG_PATH
  }
}

module.exports = Environment