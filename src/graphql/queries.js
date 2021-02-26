const gql = require('graphql-tag');

const getTemplateRepo = gql`
  query getTemplateRepo($login: String, $reponame: String) {
    repositoryOwner (login: $login) {
      repositories {
        totalCount
      }
      repository(name: $reponame) {
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
  } 
`

module.exports = { getTemplateRepo }