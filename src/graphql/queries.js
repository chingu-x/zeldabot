const gql = require('graphql-tag');

const getRepoLabels = gql`
  query getRepoLabels($owner: String!, $reponame: String!) {
    repository(owner: $owner, name: $reponame) {
      id
      name
      labels(first:15) {
        edges {
          node {
            id
            name
            description
            color
          }
        }
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
              title
            }
            labels (first: 10) {
              edges {
                node {
                  name
                  color
                }
              }
            }
          }
        }
      }
      labels(first:15) {
        edges {
          node {
            name
            description
            color
          }
        }
      }
      milestones(first:10) {
        edges {
          node {
            title
          }
        }
      }
    }
  }
`

module.exports = { getRepoLabels, getTemplateRepo }