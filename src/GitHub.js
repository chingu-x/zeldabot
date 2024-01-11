const ApolloClient = require("apollo-client").ApolloClient
const Bar = require('progress-barjs')
const fetch = require("node-fetch")
const createHttpLink = require("apollo-link-http").createHttpLink
const InMemoryCache = require("apollo-cache-inmemory").InMemoryCache
const { Octokit } = require("@octokit/rest")

const { getRepo, getTemplateRepo } = require('./graphql/queries')
const { addLabelToRepo, cloneTemplateRepository, createIssue, createRepo } = require('./graphql/mutations')
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
    for (let issue of templateIssues) {
      // Translate the label id's in the issue from the template repo to the
      // labels in this repo that match them.
      let labelIds = []
      for (let templateIndex = 0; templateIndex < issue.node.labels.edges.length; ++templateIndex) {
        for (let labelInRepoIndex = 0; labelInRepoIndex < labelsInRepo.length; ++labelInRepoIndex) {
          if (labelsInRepo[labelInRepoIndex].name === issue.node.labels.edges[templateIndex].node.name) {
            labelIds.push(labelsInRepo[labelInRepoIndex].id)
          }
        }
      }

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
        console.log(`\naddIssuesToRepo - Error creating issue: `, issue.node.title)
        console.log(`addIssuesToRepo - Error creating issue: `, err)
        process.exitCode = 1
        return
      }
      await this.sleep(3) // Sleep to avoid creating issues too fast for GraphQL
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

  // Create the team, grant the admin privilege on the team repo, and
  // add individual team members to it
  async createTeam(orgName, repoName, teamDescription, teamslist) {
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

    try{
      // Add the 'admin' permission for the team on its repository. 
      // Remember the repo name and team name are the same for a Voyage
      await this.octokit.teams.addOrUpdateRepoPermissionsInOrg({
        org: orgName,
        team_slug: repoName,
        owner: orgName,
        repo: `${ repoName }`,
        permission: "admin"
      })
    } catch(err) {
      console.log(`createTeam - Error granting team permission to repo org:${ orgName } team: ${ repoName }`)
      console.log(`...err:`, err)
      process.exitCode = 1
      return
    }

    // Add individual teammates to the team using the GitHub names provided
    // in the configuration file. If an error occurs when adding a teammate
    // log it and continue adding remaining teammates
    const team = teamslist.teams.find((team) => {
      const voyageNameLength = repoName.split('-')[0].length
      const teamName = voyageNameLength === 3 ? repoName.slice(4) : repoName.slice(5)
      return team.team.name === teamName
    })

    if (team === undefined) {
      console.log(`...team: ${ repoName } not found`)
    } else {
      for (let i=0; i < team.team.github_names.length; i++) {
        try {
          const addResult = await this.octokit.teams.addOrUpdateMembershipForUserInOrg({
            org: orgName,
            team_slug: repoName,
            username: team.team.github_names[i]
          })
        } catch(err) {
          console.log(`...Error adding user: ${ team.team.github_names[i] } to team: ${ repoName } - ${ err.status } / ${ err.response.data.message }`)
          continue
        }
      }
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
      console.log('createRepo - Error in createRepo - repo: ', repoName, ' err: ', err)
      process.exitCode = 1
      return
    }
  }

  async getRepo(orgName, repoName) {
    try {
      const teamRepo = await this.client.query({ 
        query: getRepo, 
        variables: { owner: orgName, reponame: repoName }
      })
      return teamRepo
    } catch(err) {
      console.log('getRepo - Error in getRepo - err: ', err)
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

  sleep(secondsToSleep) {
    return new Promise(resolve => setTimeout(resolve, secondsToSleep*1000));
  }

  async cloneTemplate(reposToCreate, teamslist) {
    try {
      const clonebarOptions = {
        label: 'Cloning team repos'.padEnd(20),
        total: teamslist.teams.length,
        show: {
          overwrite: true,
          'only_at_completed_rows': false,
          bar: {
              completed: '\x1b[47m \x1b[0;37m',
              incompleted: ' ',
          }
        }
      }
      const cloneBar = Bar(clonebarOptions)

      await this.createGqlClient()
      const templateData = await this.getTemplateRepo(this.GITHUB_ORG, this.GITHUB_TEMPLATE_REPO)

      for (let teamNo = 0; teamNo < reposToCreate.length; teamNo++) {
        // Reset variables for new team 
        this.milestones = []

        // Clone the template repo for a new team
        if (teamNo+1 >= this.RESTART) {
          try {
            //await this.sleep(10) // Sleep to avoid creating repos too fast for GraphQL
            this.generateNames(reposToCreate[teamNo])
            const newRepoData = await this.createRepo(templateData.data.repository.owner.id, 
              templateData.data.repository.id,
              this.repoName, this.repoDescription)
          } catch (err) {
            console.error('\nError detected creating team repo: ', err)
            continue
          }
        }
        cloneBar.tick(1)
      }
    }
    catch(err) {
      console.error('Error detected setting up teams: ', err)
    }
  }

  async addIssuesToTeamRepos(reposToCreate, teamslist) {
    try {
      const addIssuesBarOptions = {
        label: 'Adding issues to repos'.padEnd(20),
        total: teamslist.teams.length,
        show: {
          overwrite: true,
          'only_at_completed_rows': false,
          bar: {
              completed: '\x1b[47m \x1b[0;37m',
              incompleted: ' ',
          }
        }
      }
      const addIssuesBar = Bar(addIssuesBarOptions)
      await this.createGqlClient()
      const templateData = await this.getTemplateRepo(this.GITHUB_ORG, this.GITHUB_TEMPLATE_REPO)
      let areLabelsAndMilestonesCreated = false
      let labelsInRepo = []

      for (let teamNo = 0; teamNo < reposToCreate.length; teamNo++) {
        // Reset variables for new team 
        areLabelsAndMilestonesCreated = false
        labelsInRepo = []
        this.milestones = []

        // Clone the issues in the template repo to the new voyage team repo
        if (teamNo+1 >= this.RESTART) {
          try {
            //await this.sleep(10) // Sleep to avoid creating repos too fast for GraphQL
            this.generateNames(reposToCreate[teamNo])
            const teamRepo = await this.getRepo(this.GITHUB_ORG, this.repoName)
            if (areLabelsAndMilestonesCreated === false) {
                labelsInRepo = await this.addLabelsToRepo(teamRepo.data.repository.id, 
                templateData.data.repository.labels.edges)
              await this.addMilestonesToRepo(this.GITHUB_ORG, this.repoName, 
                templateData.data.repository.milestones.edges)
              areLabelsAndMilestonesCreated = true
            }
            await this.addIssuesToRepo(teamRepo.data.repository.id,
              templateData.data.repository.issues.edges, labelsInRepo)
            addIssuesBar.tick(1)
          } catch (err) {
            console.error('\nError detected adding issues to a team repo: ', err)
            continue
          }
        }
      }
    }
    catch(err) {
      console.error('Error detected setting up teams: ', err)
    }
  }

  async createAuthorizeTeams(reposToCreate, teamslist) {
    try {
      const authorizeBarOptions = {
        label: 'Creating & authorizing teams'.padEnd(20),
        total: teamslist.teams.length,
        show: {
          overwrite: true,
          'only_at_completed_rows': false,
          bar: {
              completed: '\x1b[47m \x1b[0;37m',
              incompleted: ' ',
          }
        }
      }
      const authorizeBar = Bar(authorizeBarOptions)

      await this.createGqlClient()
      const templateData = await this.getTemplateRepo(this.GITHUB_ORG, this.GITHUB_TEMPLATE_REPO)

      for (let teamNo = 0; teamNo < reposToCreate.length; teamNo++) {
        // Reset variables for new team 
        this.milestones = []

        // Clone the template repo for a new team
        if (teamNo+1 >= this.RESTART) {
          try {
            //await this.sleep(10) // Sleep to avoid creating repos too fast for GraphQL
            this.generateNames(reposToCreate[teamNo])
            await this.createTeam(this.GITHUB_ORG, this.repoName, this.teamDescription, teamslist)
          } catch (err) {
            console.error('\nError detected creating team repo: ', err)
            continue
          }
        }
        authorizeBar.tick(1)
      }
    }
    catch(err) {
      console.error('Error detected setting up teams: ', err)
    }
  }
}

module.exports = GitHub