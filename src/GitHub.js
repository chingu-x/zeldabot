const gql = require("graphql-tag")
const ApolloClient = require("apollo-client").ApolloClient
const fetch = require("node-fetch")
const createHttpLink = require("apollo-link-http").createHttpLink
const setContext = require("apollo-link-context").setContext
const InMemoryCache = require("apollo-cache-inmemory").InMemoryCache
const { Octokit } = require("@octokit/rest")

const { getTemplateRepo } = require('./graphql/queries')
const { createRepo } = require('./graphql/mutations')

class GitHub {
  constructor(environment) {
    this.environment = environment
    this.isDebug = this.environment.isDebug()
    this.client
    this.GITHUB_TOKEN = this.environment.getOperationalVars().GITHUB_TOKEN
    this.octokit = new Octokit({
      auth: this.GITHUB_TOKEN,
      baseUrl: 'https://api.github.com'
    });
  }

  async createGqlClient() {
    const githubLink = createHttpLink({
      uri: 'https://api.github.com/graphql',
      fetch: fetch,
      headers: {
        authorization: `Bearer ${this.GITHUB_TOKEN}`,
      } 
    })

    const client = new ApolloClient({
      link: githubLink,
      cache: new InMemoryCache()
    });

    this.client = client
  }

  async createTeam(orgName, repoName, repoDescription) {
    try {
      await this.octokit.teams.create({
        org: orgName,
        name: repoName,
        description: repoDescription,
        privacy: 'closed',
        permission: 'admin',
        repo_names: [`${ orgName }/${ repoName }`],
      })
    } catch(err) {
      console.log(`Error creating team ${ repoName }: `, err)
    }
  }

  async createRepo(repoOwner, repoName, repoDescription) {
    const mutationData = await this.client.mutate({ 
      mutation: createRepo, 
      variables: { reponame: repoName, owner: repoOwner, description: repoDescription }
    })
    this.isDebug && console.log('...createRepo - mutationData: ', mutationData)
  }

  cloneTemplate(reposToCreate) {
    return new Promise(async (resolve, reject) => {
      this.isDebug && console.log(`GITHUB_ORG: ${this.environment.operationalVars.GITHUB_ORG} GITHUB_TEMPLATE_REPO: ${this.environment.operationalVars.GITHUB_TEMPLATE_REPO}`)
      try {
        await this.createGqlClient()
        
        this.isDebug && console.log('GOT HERE. getTemplateRepo: ', getTemplateRepo)
        const templateData = await this.client.query({ 
          query: getTemplateRepo, 
          variables: { owner: this.environment.operationalVars.GITHUB_ORG, reponame: this.environment.operationalVars.GITHUB_TEMPLATE_REPO }
        })

        this.isDebug && console.log('\nrepository: ', templateData.data.repository)
        templateData.data.repository.issues.edges.forEach(issue => {
          this.isDebug && console.log(issue.node)
        })
        templateData.data.repository.labels.edges.forEach(label => {
          this.isDebug && console.log(label.node)
        })
        templateData.data.repository.milestones.edges.forEach(milestone => {
          this.isDebug && console.log(milestone.node)
        })

        console.log('No. teams to create: ', reposToCreate.length)
        for (let currentTeamNo = 0; currentTeamNo < reposToCreate.length; currentTeamNo++) {
          const repoName = `${ reposToCreate[currentTeamNo].voyageName }-`
            + `${ reposToCreate[currentTeamNo].tierName }-team-`
            + `${ reposToCreate[currentTeamNo].teamNo }`
          const repoDescription = `Chingu Voyage `
            + `${ reposToCreate[currentTeamNo].voyageName.slice(-2) } - `
            + `${ reposToCreate[currentTeamNo].tierName.charAt(0).toUpperCase() + reposToCreate[currentTeamNo].tierName.slice(1) } `
            +`Team ${ reposToCreate[currentTeamNo].teamNo }`
          console.log(repoName,'\n',repoDescription)
          await this.createRepo(templateData.data.repository.owner.id, repoName, repoDescription) 
          await this.createTeam(this.environment.getOperationalVars().GITHUB_ORG, repoName, repoDescription)
        }
        
        return resolve('done')
      }
      catch(err) {
        this.environment.isDebug && console.error(err)
        return reject(err)
      }
    })
  }

}

module.exports = GitHub