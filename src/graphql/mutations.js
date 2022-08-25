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
  mutation createIssue($body: String, $labelIds: [ID!], $milestoneId: ID, 
    $repositoryId: ID!, $title: String!) {
    createIssue(input: {
      body: $body,
      labelIds: $labelIds,
      milestoneId: $milestoneId,
      repositoryId: $repositoryId,
      title: $title
    }) {
      clientMutationId
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
      clientMutationId
      repository {
        id
        name
        createdAt
      }
    }
  }
`

module.exports = { addLabelToRepo, cloneTemplateRepository, createIssue, createRepo }