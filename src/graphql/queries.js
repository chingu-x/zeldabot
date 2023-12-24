const gql = require('graphql-tag')

const getRepo = gql`
  query getRepo($owner: String!, $reponame: String!) {
    repository(owner: $owner, name: $reponame) {
      id
      name
      description
      owner {
        id
      }
    }
  }
`

const getTemplateRepo = gql`
  query getTemplateRepo($owner: String!, $reponame: String!) {
    repository(owner: $owner, name: $reponame) {
      id
      name
      description
      owner {
        id
      }
      issueTemplates {
        name
        title
        about
        body  
      }
      issues (first: 15) {
        totalCount
        edges {
          node {
            title
            body
            milestone {
              id
              title
              description
            }
            labels (first: 11) {
              edges {
                node {
                  id
                  name
                  color
                }
              }
            }
          }
        }
      }
      labels(first:11) {
        edges {
          node {
            name
            description
            color
          }
        }
      }
      milestones(first:8) {
        edges {
          node {
            title
            description
          }
        }
      }
    }
  }
`

module.exports = { getRepo, getTemplateRepo }