const { ApolloClient } = require('apollo-client');
const { createHttpLink } = require('apollo-link-http');
const { InMemoryCache } = require('apollo-cache-inmemory');
const { ApolloLink } = require('apollo-link');
const { SchemaLink }  = require('apollo-link-schema');
const { 
    introspectSchema,
    makeRemoteExecutableSchema,
    mergeSchemas
  } = require('graphql-tools');
const fetch = require('node-fetch');

const { getTemplateRepo } = require('./graphql/queries')


class GitHub {

  constructor() {
  }

  async createGqlClient() {
    return new Promise(async (resolve, reject) => {
      console.log('token: ', process.env.GITHUB_TOKEN)

      const httpLink = () =>
        createHttpLink({
          uri: 'https://api.github.com/graphql',
          fetch: fetch,
          headers: {
            authorization: process.env.GITHUB_TOKEN ? `Bearer ${process.env.GITHUB_TOKEN}` : "",
          } 
        })

      // Use introspection to create the GitHub schema
      const githubSchema = await introspectSchema(httpLink)
      console.log(githubSchema)
      const remoteSchema = makeRemoteExecutableSchema({
        schema: githubSchema,
        link: httpLink
      });

      const schema = mergeSchemas({
        schemas: [
          remoteSchema,
        ],
      });
      const schemaLink = new SchemaLink({ schema });

      // Create a GraphQL Client connection
      const clientLinks = ApolloLink.from([
        schemaLink,
      ]);
      this.client = new ApolloClient({
        link: clientLinks,
        cache: new InMemoryCache(),
      });
      return resolve(this.client)
    });
  }

  createRepos() {
    console.log('Retrieve the template repo')
    return new Promise(async (resolve, reject) => {
      try {
        await this.createGqlClient()
        const templateData = await this.client.query({ 
          query: getTemplateRepo, 
          variables: { login: process.env.GITHUB_ORG, reponame: process.env.GITHUB_TEMPLATE_REPO }
        })
        console.log('templateData: ', templateData)
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