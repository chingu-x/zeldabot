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

const createIssue = gql`
  mutation createIssue($repoId: ID!, $title: String!, $body: String!, 
      $milestoneId: ID, $labelIds: [ID!]) {
    createIssue(input: {
      repositoryId: $repoId,
      title: $title,
      body: $body,
      milestoneId: $milestoneId,
      labelIds: $labelIds
    }) {
      issue {
        id
        title
        createdAt
      }
    }
  }
`

const cloneTemplateRepository = gql`
  mutation cloneTemplateRepository($reponame: String!, $owner: ID!, 
    $templateRepoId: ID!, $description: String) {
    cloneTemplateRepository(input: {
      name: $reponame,
      ownerId: $owner,
      repositoryId: $templateRepoId,
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

module.exports = { addLabelToRepo, cloneTemplateRepository, createIssue, createRepo }