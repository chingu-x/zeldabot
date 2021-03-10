const gql = require("graphql-tag")
const ApolloClient = require("apollo-client").ApolloClient
const fetch = require("node-fetch")
const createHttpLink = require("apollo-link-http").createHttpLink
const setContext = require("apollo-link-context").setContext
const InMemoryCache = require("apollo-cache-inmemory").InMemoryCache
const { Octokit } = require("@octokit/rest")

const { getRepoLabels, getTemplateRepo } = require('./graphql/queries')
const { addLabelToRepo, createRepo } = require('./graphql/mutations')

class GitHub {
  constructor(environment) {
    this.environment = environment
    this.isDebug = this.environment.isDebug()
    this.client
    this.GITHUB_TOKEN = this.environment.getOperationalVars().GITHUB_TOKEN
    this.GITHUB_ORG = this.environment.getOperationalVars().GITHUB_ORG
    this.GITHUB_TEMPLATE_REPO = this.environment.getOperationalVars().GITHUB_TEMPLATE_REPO
    this.octokit = new Octokit({
      auth: this.GITHUB_TOKEN,
      baseUrl: 'https://api.github.com'
    });
    this.repoName
    this.repoDescription
    this.teamDescription
  }

  async createGqlClient() {
    const githubLink = createHttpLink({
      uri: 'https://api.github.com/graphql',
      fetch: fetch,
      headers: {
        authorization: `Bearer ${this.GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.bane-preview+json'
      } 
    })

    const client = new ApolloClient({
      link: githubLink,
      cache: new InMemoryCache()
    });

    this.client = client
  }

  async getRepoLabels(orgName, repoName) {
    let labels
    try {
      labels = await this.client.query({ 
        query: getRepoLabels, 
        variables: { owner: orgName, reponame: repoName }
      })
      return labels
    } catch(err) {
      console.log('getRepoLabels  - Error fetching labels. err: ', err)
    }
  }

  async addLabelsToRepo(repoId, labels) {
    labels.map(async (label)  => {
      const mutationData = await this.client.mutate({ 
        mutation: addLabelToRepo, 
        variables: { 
          repoId: repoId,  
          name: label.node.name, 
          description: label.node.description,
          color: label.node.color,
        }
      })
      this.isDebug && console.log('...addLabelsToRepo - mutationData: ', mutationData)
    })
  }

  async createTeam(orgName, repoName, teamDescription) {
    try {
      await this.octokit.teams.create({
        org: orgName,
        name: repoName,
        description: teamDescription,
        privacy: 'closed',
        permission: 'admin',
        repo_names: [`${ orgName }/${ repoName }`],
      })
    } catch(err) {
      console.log(`createTeam - Error creating team ${ repoName }: `, err)
    }
  }

  async createRepo(repoOwner, repoName, repoDescription) {
    try {
      const mutationData = await this.client.mutate({ 
        mutation: createRepo, 
        variables: { reponame: repoName, owner: repoOwner, description: repoDescription }
      })
      this.isDebug && console.log('...createRepo - mutationData: ', mutationData)
      return mutationData
    } catch(err) {
      console.log('createRepo - Error in createRepo - err: ', err)
    }
  }

  generateNames(repoToCreate) {
    this.repoName = `${ repoToCreate.voyageName }-`
      + `${ repoToCreate.tierName }-team-`
      + `${ repoToCreate.teamNo }`
    this.repoDescription = `Add-project-description-here | Voyage-${ repoToCreate.voyageName.slice(-2) } | https://chingu.io/ | Twitter: https://twitter.com/ChinguCollabs`
    this.teamDescription = `Chingu Voyage `
      + `${ repoToCreate.voyageName.slice(-2) } - `
      + `${ repoToCreate.tierName.charAt(0).toUpperCase() + repoToCreate.tierName.slice(1) } `
      +`Team ${ repoToCreate.teamNo }`
  }

  cloneTemplate(reposToCreate) {
    return new Promise(async (resolve, reject) => {
      this.isDebug && console.log(`GITHUB_ORG: ${ this.GITHUB_ORG } GITHUB_TEMPLATE_REPO: ${this.GITHUB_TEMPLATE_REPO}`)
      try {
        await this.createGqlClient()
        
        const templateData = await this.client.query({ 
          query: getTemplateRepo, 
          variables: { owner: this.GITHUB_ORG, reponame: this.GITHUB_TEMPLATE_REPO }
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
          this.generateNames(reposToCreate[currentTeamNo])
          this.isDebug && console.log(this.repoName, '\n', this.repoDescription)
          const newRepoData = await this.createRepo(templateData.data.repository.owner.id, 
            this.repoName, this.repoDescription) 
          await this.createTeam(this.GITHUB_ORG, this.repoName, this.teamDescription)
          await this.addLabelsToRepo(newRepoData.data.createRepository.repository.id, 
            templateData.data.repository.labels.edges)
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