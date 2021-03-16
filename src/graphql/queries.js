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
      issues (first: 10) {
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
            labels (first: 9) {
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
      labels(first:9) {
        edges {
          node {
            name
            description
            color
          }
        }
      }
      milestones(first:7) {
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