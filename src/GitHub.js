const gql = require("graphql-tag");
const ApolloClient = require("apollo-client").ApolloClient;
const fetch = require("node-fetch");
const createHttpLink = require("apollo-link-http").createHttpLink;
const setContext = require("apollo-link-context").setContext;
const InMemoryCache = require("apollo-cache-inmemory").InMemoryCache;

const { getTemplateRepo } = require('./graphql/queries')

class GitHub {

  constructor(environment) {
    this.environment = environment
    this.isDebug = this.environment.isDebug()
    this.client
  }

  async createGqlClient() {
    const githubLink = createHttpLink({
      uri: 'https://api.github.com/graphql',
      fetch: fetch,
      headers: {
        authorization: `Bearer ${this.environment.operationalVars.GITHUB_TOKEN}`,
      } 
    })

    const client = new ApolloClient({
      link: githubLink,
      cache: new InMemoryCache()
    });

    this.client = client
  }

  createRepos() {
    console.log('Retrieve the template repo')
    return new Promise(async (resolve, reject) => {
      this.isDebug && console.log(`GITHUB_ORG: ${this.environment.operationalVars.GITHUB_ORG} GITHUB_TEMPLATE_REPO: ${this.environment.operationalVars.GITHUB_TEMPLATE_REPO}`)
      try {
        await this.createGqlClient()
        this.isDebug && console.log('GOT HERE. getTemplateRepo: ', getTemplateRepo)
        const templateData = await this.client.query({ 
          query: getTemplateRepo, 
          variables: { owner: this.environment.operationalVars.GITHUB_ORG, reponame: this.environment.operationalVars.GITHUB_TEMPLATE_REPO }
        })

        this.environment.isDebug && console.log('repository: ', templateData.data.repository)
        templateData.data.repository.issues.edges.forEach(issue => {
          this.isDebug && console.log(issue.node)
        })
        templateData.data.repository.labels.edges.forEach(label => {
          this.isDebug && console.log(label.node)
        })
        templateData.data.repository.milestones.edges.forEach(milestone => {
          this.isDebug && console.log(milestone.node)
        })
        
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