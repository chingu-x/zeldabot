import Airtable from 'airtable'
import chalk from 'chalk'

// Retrieve a voyager for a specific Voyage, team number, and GitHub Login 
const getVoyagerByGithubLogin = async (voyage, teamNo, githubLogin) => {
  return new Promise(async (resolve, reject) => {
    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE)

    const filter = 'AND(' +
      '{Voyage} = "' + voyage + '", ' +
      '{Team No.} = "' + Number(teamNo) + '", ' +
      '{GitHub ID} = "' + githubLogin + '" ' +
    ')'

    //console.log(chalk.white(`getVoyagerByGithubLogin - filter: ${ chalk.green(filter) }`))
    
    base('Voyage Signups').select({ 
      fields:[
        'Email', 'Voyage', 'Team Name', 'Tier', 'Team No.', 'Discord Name', 
        'Discord ID', 'GitHub ID', 'Role', 'Status', 'Status Comment'
      ],
      filterByFormula: filter,
      view: 'Teamsort - '.concat(voyage.toUpperCase()) 
    })
    //TODO: Convert .firstPage instead of eachPage. This is needed to help
    // make retrieving this information more performant. But, a couple of
    // attempts have failed so more research is needed.
    .eachPage(async function page(records, fetchNextPage) {
      for (let record of records) {
        try {
          const atDiscordId = record.get('Discord ID')[0]
          const tierName = record.get('Tier')
            .slice(0,6)
            .toLowerCase()
            .split(' ')
            .join('')
          resolve({ 
            signup_id: `${ record.id }`,
            email: `${ record.get('Email') }`,
            voyage: `${ record.get('Voyage') }`,
            team_name: `${ record.get('Team Name') }`,
            tier: `${ tierName }`,
            team_no: `${ record.get('Team No.') }`,
            discord_name: `${ record.get('Discord Name') }`,
            discord_id: `${ atDiscordId }`,
            github_login: `${ record.get('GitHub ID')}`,
            role: `${ record.get('Role') }`,
            status: `${ record.get('Status')}`,
            status_comment: `${ record.get('Status Comment')}`
          })
        }
        catch(error) {
          console.error(chalk.white(`getVoyagerByGithubLogin - error: `), error)
          console.error(chalk.white(`getVoyagerByGithubLogin - Error retrieving discordUserId ${ chalk.green(discordUserId) }`))
          reject(error)
        }
      }
      resolve(-1)
    }, function done(err) {
      if (err) { 
        console.error(chalk.white(`getVoyageTeam - filter: ${ chalk.green(filter) }` ))
        console.error(err)
        reject(err) 
      }

      console.log(chalk.white(`getVoyagerByGithubLogin - Voyager not found - Voyage:${ chalk.green(voyage) } team:${ chalk.green(teamNo) } user:${ chalk.green(discordUserId) }`))
      resolve(-1)
    })
  })
}

export { 
  getVoyagerByGithubLogin
}