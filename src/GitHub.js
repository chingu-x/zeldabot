const ApolloClient = require("apollo-client").ApolloClient
const fetch = require("node-fetch")
const createHttpLink = require("apollo-link-http").createHttpLink
const InMemoryCache = require("apollo-cache-inmemory").InMemoryCache
const { Octokit } = require("@octokit/rest")
const cliProgress = require('cli-progress')
const _colors = require('colors')

const { getTemplateRepo } = require('./graphql/queries')
const { addLabelToRepo, createIssue, createRepo } = require('./graphql/mutations')

class GitHub {
  constructor(environment) {
    this.environment = environment
    this.isDebug = this.environment.isDebug()

    this.GITHUB_TOKEN = this.environment.getOperationalVars().GITHUB_TOKEN
    this.GITHUB_ORG = this.environment.getOperationalVars().GITHUB_ORG
    this.GITHUB_TEMPLATE_REPO = this.environment.getOperationalVars().GITHUB_TEMPLATE_REPO

    this.client
    this.repoName
    this.repoDescription
    this.teamDescription
    this.milestones = []

    this.octokit = new Octokit({
      auth: this.GITHUB_TOKEN,
      baseUrl: 'https://api.github.com',
      headers: {
        Accept: 'application/vnd.github.v3+json',
      }
    })

    this.overallProgress = new cliProgress.SingleBar({
      format: 'Overall Progress |' + _colors.brightGreen('{bar}') + '| {percentage}% || {value}/{total} All Repos ',
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      clearOnComplete: false,
      hideCursor: true
    }, cliProgress.Presets.shades_classic)
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

  async addMilestonesToRepo(orgName, repoName, milestones) {
    for (let milestone of milestones) {
      try {
        const mutationResult = await this.octokit.issues.createMilestone({
          owner: orgName,
          repo: repoName,
          title: milestone.node.title,
          description: milestone.node.description,
        })
        this.milestones.push({
          id: mutationResult.data.node_id,
          title: mutationResult.data.title,
        })
      } catch(err) {
        console.log('Error adding milestone to repo: ', err)
      }
    }
  }

  async addIssuesToRepo(repoId, templateIssues) {
    for (let issue of templateIssues) {
      const labelIds = issue.node.labels.edges === [] 
        ? [] : issue.node.labels.edges.map(label => label.node.id) 
      const milestoneForIssue = this.milestones.find(milestone => milestone.title === issue.node.milestone.title) 
      try {
          const mutationResult = await this.client.mutate({ 
            mutation: createIssue, 
            variables: { 
              repoId: repoId,  
              title: issue.node.title, 
              body: issue.node.body,
              labelIds: labelIds,
              milestoneId: milestoneForIssue.id
            }
          })
      } catch(err) {
        console.log(`addIssuesToRepo - Error creating issue: `, err)
      }
    }
  }

  async addLabelsToRepo(repoId, labels) {
    for (let label of labels) {
      try {
        const mutationResult = await this.client.mutate({ 
          mutation: addLabelToRepo, 
          variables: { 
            repoId: repoId,  
            name: label.node.name, 
            description: label.node.description,
            color: label.node.color,
          }
        })
      } catch(err) {
        console.log('Error adding label to repo: ', err)
      }
    }
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
      const mutationResult = await this.client.mutate({ 
        mutation: createRepo, 
        variables: { reponame: repoName, owner: repoOwner, description: repoDescription }
      })
      return mutationResult
    } catch(err) {
      console.log('createRepo - Error in createRepo - err: ', err)
    }
  }

  async getTemplateRepo(orgName, repoName) {
    return await this.client.query({ 
      query: getTemplateRepo, 
      variables: { owner: orgName, reponame: repoName }
    })
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

  async cloneTemplate(reposToCreate) {
    try {
      this.overallProgress.start(reposToCreate.length, 0)

      await this.createGqlClient()
      
      const templateData = await this.getTemplateRepo(this.GITHUB_ORG, this.GITHUB_TEMPLATE_REPO)
      for (let currentTeamNo = 0; currentTeamNo < reposToCreate.length; currentTeamNo++) {
        this.generateNames(reposToCreate[currentTeamNo])
        const newRepoData = await this.createRepo(templateData.data.repository.owner.id, 
          this.repoName, this.repoDescription) 
        await this.createTeam(this.GITHUB_ORG, this.repoName, this.teamDescription)
        await this.addLabelsToRepo(newRepoData.data.createRepository.repository.id, 
          templateData.data.repository.labels.edges)
        await this.addMilestonesToRepo(this.GITHUB_ORG, this.repoName, 
          templateData.data.repository.milestones.edges)
        await this.addIssuesToRepo(newRepoData.data.createRepository.repository.id,
          templateData.data.repository.issues.edges)
        this.milestones = []
        this.overallProgress.increment(1)
      }
      this.overallProgress.stop()
    }
    catch(err) {
      this.environment.isDebug && console.error(err)
    }
  }

}

module.exports = GitHub