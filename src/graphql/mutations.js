const gql = require('graphql-tag');

const addLabelToRepo = gql`
  mutation createLabel($repoId: ID!, $name: String!, $description: String!, 
      $color: String!) {
    createLabel(input: {
      repositoryId: $repoId,
      name: $name,
      description: $description
      color: $color
    }) {
      label {
        id
        name
        description
        color
        createdAt
      }
    }
  }
`

const createRepo = gql`
  mutation createRepository($reponame: String, $owner: String, $description: String) {
    createRepository(input: {
      name: $reponame,
      ownerId: $owner,
      description: $description
      visibility: PUBLIC
    }) {
      repository {
        id
        name
        createdAt
      }
    }
  }
`

module.exports = { addLabelToRepo, createRepo }