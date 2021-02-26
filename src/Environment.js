const dotenv = require('dotenv')
const FileOps = require('./FileOps')

class Environment {

  static logEnvVars() {
    console.log('\nEnvironment Variables:')
    console.log('---------------------')
    console.log('- VOYAGE:', process.env.VOYAGE)
    console.log('- GITHUB_TOKEN:', process.env.GITHUB_TOKEN)
    console.log('- GITHUB_ORG:', process.env.GITHUB_ORG)
    console.log('- GITHUB_TEMPLATE_REPO:', process.env.GITHUB_TEMPLATE_REPO)
    return true
  }

  static initDotEnv(path) {
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

  static refreshEnvVars(envFile) {
    const envConfig = dotenv.parse(FileOps.readFile(envFile), { silent: true } )
    for (let k in envConfig) {
      process.env[k] = envConfig[k]
    }
  }

  static validateEnvPath(envPath) {
    const pathToEnv = envPath ? envPath : `${__dirname}`
    if (FileOps.validateDirPath(pathToEnv) !== 0) {
      return null
    }
    return pathToEnv
  }

  static validateRegEx(regexPattern) {
    var isValid = true
      try {
        new RegExp(regexPattern)
      } catch(err) {
        isValid = false
      }
    return isValid
  }

}

module.exports = Environment