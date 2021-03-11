# zeldabot
Zelda creates Chingu Voyage repos in GitHub from a template repository. It's purpose is
to automate the process to reduce the amount of manual time spent preparing for Voyages,
while improving quality and reducing the chance of errors.

## Process Overview

Zeldabot uses a template repository as a model to create one repo for each Voyage team.
The steps it follows are to:

1. Validate operating parameters from the command line & the `.env` file

2. Generate a unique team name using parameters supplied by the user which define the number of teams in each Tier.

3. Create a new team in the target organization

4. Create a new repo for the team in the target organization. Setting the following attributes
   - [X] Set the repo name to be the same as the team name
   - [X] Set the repo description to be `Add-project-description-here | Voyage-27 | https://chingu.io/ | Twitter: https://twitter.com/ChinguCollabs` 
   - [X] Add the team with Admin rights on the repository
   - [X] Copy labels from the template repo
   - [X] Copy milestones from the template repo
   - [X] Copy issues from the template repo
   - [ ] Copy the `readme.md` in the template repo
   - [ ] Copy issue templates from the template repo
   
## Test Commandw (temporary)
node zelda clone -o chingu-voyagetest -t voyage-template -t1 1 -t2 0 -t3 0 -n1 Toucans -n2 Geckos -n3 Bears
node zelda clone -t1 1 -t2 0 -t3 0 

