const gql = require('graphql-tag');

const getTemplateRepo = gql`
  query getTemplateRepo($owner: String!, $reponame: String!) {
    repository(owner: $owner, name: $reponame) {
        name
        description
        forks {
          totalCount
        }
        issues {
          totalCount
        }
        labels(first:10) {
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