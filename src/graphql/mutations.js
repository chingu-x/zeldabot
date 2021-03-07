const gql = require('graphql-tag');

const createRepo = gql`
  mutation createRepository($reponame: String, $owner: String) {
    createRepository(input: {
      name: $reponame,
      ownerId: $owner,
      visibility: PUBLIC
    }) {
      repository {
        name
        createdAt
      }
    }
  }
`

module.exports = { createRepo }