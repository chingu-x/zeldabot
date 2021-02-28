const gql = require("graphql-tag");
const ApolloClient = require("apollo-client").ApolloClient;
const fetch = require("node-fetch");
const createHttpLink = require("apollo-link-http").createHttpLink;
const setContext = require("apollo-link-context").setContext;
const InMemoryCache = require("apollo-cache-inmemory").InMemoryCache;

const { isDebugOn } = require('./Environment')
const { getTemplateRepo } = require('./graphql/queries')

class GitHub {

  constructor() {
    this.client
  }

  async createGqlClient() {
    const githubLink = createHttpLink({
      uri: 'https://api.github.com/graphql',
      fetch: fetch,
      headers: {
        authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
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
      isDebugOn() && console.log(`GITHUB_ORG: ${process.env.GITHUB_ORG} GITHUB_TEMPLATE_REPO: ${process.env.GITHUB_TEMPLATE_REPO}`)
      try {
        await this.createGqlClient()
        isDebugOn() && console.log('GOT HERE. getTemplateRepo: ', getTemplateRepo)
        const templateData = await this.client.query({ 
          query: getTemplateRepo, 
          variables: { owner: process.env.GITHUB_ORG, reponame: process.env.GITHUB_TEMPLATE_REPO }
        })

        isDebugOn() && console.log('repository: ', templateData.data.repository)
        templateData.data.repository.issues.edges.forEach(issue => {
          isDebugOn() && console.log(issue.node)
        })
        templateData.data.repository.labels.edges.forEach(label => {
          isDebugOn() && console.log(label.node)
        })
        templateData.data.repository.milestones.edges.forEach(milestone => {
          isDebugOn() && console.log(milestone.node)
        })
        
        return resolve('done')
      }
      catch(err) {
        isDebugOn() && console.error(err)
        return reject(err)
      }
    })
  }

}

module.exports = GitHub