const gql = require("graphql-tag");
const ApolloClient = require("apollo-client").ApolloClient;
const fetch = require("node-fetch");
const createHttpLink = require("apollo-link-http").createHttpLink;
const setContext = require("apollo-link-context").setContext;
const InMemoryCache = require("apollo-cache-inmemory").InMemoryCache;

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
      console.log(`GITHUB_ORG: ${process.env.GITHUB_ORG} GITHUB_TEMPLATE_REPO: ${process.env.GITHUB_TEMPLATE_REPO}`)
      try {
        await this.createGqlClient()
        console.log('GOT HERE. getTemplateRepo: ', getTemplateRepo)
        const templateData = await this.client.query({ 
          query: getTemplateRepo, 
          variables: { owner: process.env.GITHUB_ORG, reponame: process.env.GITHUB_TEMPLATE_REPO }
        })
        console.log('templateData.data: ', templateData )
        return resolve('done')
      }
      catch(err) {
        console.error(err)
        return reject(err)
      }
    })
  }

}

module.exports = GitHub