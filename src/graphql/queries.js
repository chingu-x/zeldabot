const gql = require('graphql-tag');

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
            }
            labels (first: 10) {
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
            description
          }
        }
      }
    }
  }
`

module.exports = { getTemplateRepo }