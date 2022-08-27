const ApolloClient = require("apollo-client").ApolloClient
const fetch = require("node-fetch")
const createHttpLink = require("apollo-link-http").createHttpLink
const InMemoryCache = require("apollo-cache-inmemory").InMemoryCache
const { Octokit } = require("@octokit/rest")
const cliProgress = require('cli-progress')
const _colors = require('colors')

const { getTemplateRepo } = require('./graphql/queries')
const { addLabelToRepo, cloneTemplateRepository, createIssue, createRepo } = require('./graphql/mutations')

const ALL_TEAMS = 0
const DESC_MAX_LTH = 22
class GitHub {
  constructor(environment) {
    this.environment = environment
    this.isDebug = this.environment.isDebug()

    this.GITHUB_TOKEN = this.environment.getOperationalVars().GITHUB_TOKEN
    this.GITHUB_ORG = this.environment.getOperationalVars().GITHUB_ORG
    this.GITHUB_TEMPLATE_REPO = this.environment.getOperationalVars().GITHUB_TEMPLATE_REPO
    this.RESTART = this.environment.getOperationalVars().RESTART

    this.client
    this.milestones = []
    this.overallProgress
    this.progressBars = []
    this.repoName
    this.repoDescription
    this.teamDescription

    this.octokit = new Octokit({
      auth: this.GITHUB_TOKEN,
      baseUrl: 'https://api.github.com',
      headers: {
        Accept: 'application/vnd.github.v3+json',
      }
    })
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
        // Octokit REST is used because creating milestones is not yet part 
        // of GitHub's GraphQL API
        //
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
        process.exitCode = 1
        return
      }
    }
  }

  async addIssuesToRepo(repoId, templateIssues, labelsInRepo) {
    console.log('GitHub.js addIssuesToRepo - labelsInRepo: ', labelsInRepo)
    for (let issue of templateIssues) {
      // Translate the label id's in the issue from the template repo to the
      // labels in this repo that match them.
      let labelIds = []
      if (issue.node !== undefined) {
        for (let labelFromTemplate in issue.node.labels.edges) {
          for (let labelInRepo in labelsInRepo) {
            if (labelInRepo.name === labelFromTemplate.name) {
              labelIds.push(labelInRepo.id)
            }
          }
        }
      }
      console.log('GitHub.js addIssuesToRepo - labelIds: ', labelIds)

      // Translate the milestone in the issue from the template repo to a 
      // matching milestone in this repo.
      const milestoneForIssue = this.milestones.find(milestone => {
        return issue.node.milestone === null ? false : milestone.title === issue.node.milestone.title
      })

      try {
          const mutationResult = await this.client.mutate({ 
            mutation: createIssue, 
            variables: { 
              body: issue.node.body,
              milestoneId: milestoneForIssue === undefined ? null : milestoneForIssue.id,
              labelIds: labelIds,
              repositoryId: repoId,  
              title: issue.node.title
            }
          })
      } catch(err) {
        console.log(`\naddIssuesToRepo - Error creating issue: `, err)
        process.exitCode = 1
        return
      }
    }
  }

  async addLabelsToRepo(repoId, labelsToAdd) {
    let labelsInRepo = [] 
    for (let label of labelsToAdd) {
      let mutationResult
      try {
        const isLabelInRepo = labelsInRepo.find(labelToFind => labelToFind.name === label.node.name)
        if (isLabelInRepo === undefined) {
          mutationResult = await this.client.mutate({ 
            mutation: addLabelToRepo, 
            variables: { 
              repoId: repoId,  
              name: label.node.name, 
              description: label.node.description,
              color: label.node.color,
            }
          })
          labelsInRepo.push({
            id: mutationResult.data.createLabel.label.id, 
            name: mutationResult.data.createLabel.label.name
          })
        }
      } catch(err) {
        console.log('addLabelsToRepo - Error adding mutationResult: ', mutationResult)
        console.log('addLabelsToRepo - Error adding label: ', label)
        console.log('addLabelsToRepo - Error adding err: ', err)
        process.exitCode = 1
        return
      }
    }
    return labelsInRepo
  }

  async createTeam(orgName, repoName, teamDescription) {
    try {
        // Octokit REST is used because creating 
        // teams is not yet part of GitHub's GraphQL API
        await this.octokit.teams.create({
        org: orgName,
        name: repoName,
        description: teamDescription,
        privacy: 'closed',
        repo_names: [`${ orgName }/${ repoName }`],
      })
    } catch(err) {
      console.log(`createTeam - Error creating org:${ orgName } team: ${ repoName }`)
      console.log(`...err:`, err)
      process.exitCode = 1
      return
    }
  }

  async createRepo(repoOwner, templateRepoId, repoName, repoDescription) {
    try {
      const mutationResult = await this.client.mutate({ 
        mutation: cloneTemplateRepository, 
        variables: { templateRepoId: templateRepoId, reponame: repoName, 
          owner: repoOwner, description: repoDescription }
      })
     return mutationResult
    } catch(err) {
      console.log('createRepo - Error in createRepo - err: ', err)
      process.exitCode = 1
      return
    }
  }

  async getTemplateRepo(orgName, repoName) {
    try {
      const templateRepo = await this.client.query({ 
        query: getTemplateRepo, 
        variables: { owner: orgName, reponame: repoName }
      })
      return templateRepo
    } catch(err) {
      console.log('getTemplateRepo - Error in getTemplateRepo - err: ', err)
      process.exitCode = 1
      return
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

  initializeProgressBars(reposToCreate) {
    this.overallProgress = new cliProgress.MultiBar({
      format: '{description} |' + _colors.brightGreen('{bar}') + '| repo {value}/{total} | {percentage}% | {duration} secs.',
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      clearOnComplete: false,
      hideCursor: true
    }, cliProgress.Presets.shades_classic)

    this.progressBars[ALL_TEAMS] = this.overallProgress.create(reposToCreate.length, 0)
    this.progressBars[ALL_TEAMS].update(0, { description: 'Overall progress'.padEnd(DESC_MAX_LTH, ' ') })
    
    for (let teamNo = 0; teamNo < reposToCreate.length; ++teamNo) {
      const repoToCreate = reposToCreate[teamNo]
      this.progressBars[teamNo+1] = this.overallProgress.create(1, 0)
      this.repoName = `${ repoToCreate.voyageName }-`
        + `${ repoToCreate.tierName }-team-`
        + `${ repoToCreate.teamNo }`
      this.progressBars[teamNo+1].update(0, {description: this.repoName.padEnd(DESC_MAX_LTH, ' ')})
    }
  }

  sleep(secondsToSleep) {
    return new Promise(resolve => setTimeout(resolve, secondsToSleep*1000));
  }

  async cloneTemplate(reposToCreate) {
    try {
      this.initializeProgressBars(reposToCreate)
      await this.createGqlClient()
      const templateData = await this.getTemplateRepo(this.GITHUB_ORG, this.GITHUB_TEMPLATE_REPO)
      let areLabelsAndMilestonesCreated = false
      let labelsInRepo = []

      for (let teamNo = 0; teamNo < reposToCreate.length; teamNo++) {
        if (teamNo+1 >= this.RESTART) {
          try {
            await this.sleep(15) // Sleep to avoid creating issues too fast for GraphQL
            this.generateNames(reposToCreate[teamNo])
            const newRepoData = await this.createRepo(templateData.data.repository.owner.id, 
              templateData.data.repository.id,
              this.repoName, this.repoDescription)
            await this.createTeam(this.GITHUB_ORG, this.repoName, this.teamDescription)
            if (areLabelsAndMilestonesCreated === false) {
              labelsInRepo = await this.addLabelsToRepo(newRepoData.data.cloneTemplateRepository.repository.id, 
                templateData.data.repository.labels.edges)
              await this.addMilestonesToRepo(this.GITHUB_ORG, this.repoName, 
                templateData.data.repository.milestones.edges)
              areLabelsAndMilestonesCreated = true
            }
            await this.addIssuesToRepo(newRepoData.data.cloneTemplateRepository.repository.id,
              templateData.data.repository.issues.edges, labelsInRepo)
            this.milestones = []
          } catch (err) {
            console.error('\nError detected creating team repo: ', err)
            process.exit(1)
          }
        }
        this.progressBars[teamNo+1].increment(1)
        this.progressBars[ALL_TEAMS].increment(1)
      }
      this.overallProgress.stop()
    }
    catch(err) {
      console.error('Error detected setting up teams: ', err)
    }
  }

}

module.exports = GitHub