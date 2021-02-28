const gql = require('graphql-tag');

const getTemplateRepo = gql`
  query getTemplateRepo($owner: String!, $reponame: String!) {
    repository(owner: $owner, name: $reponame) {
      name
      description
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

module.exports = { getTemplateRepo }