# gather-robo-roles

A Gather NPC you can control via chat.

Also a great example of a mod built with the [Gather API](https://gathertown.notion.site/Gather-Websocket-API-bf2d5d4526db412590c3579c36141063)

## setup

Install [NodeJS](https://nodejs.org/en/download/) (and NPM).

Download this repo and `cd` into it.

Run `npm install`

[Create](https://app.gather.town/signin) another Gather.Town account for the robot (use a new email) and in the same session, get an [API Key](https://app.gather.town/apikeys) for it.

Put your Config in a file named `config.ts` like so:

```js
// Get the API Key from https://app.gather.town/apikeys
export const API_KEY = "your-api-key-here";
// SpaceId is what follows app/ with forward slashes as backslashes. E.g.
// for https://app.gather.town/app/ASDF/my_room
// this ID is  "ASDF\\my_room"
export const SPACE_ID = "space_id\\name";
// If you know your ID, you can put it here and not have to use the password.
export const ADMIN_ID = "myplayerid";
// Password to use for admin control. Just DM it to the bot to get admin access.
// _NOT SECURE_ Do not reuse another password. Leave blank to only allow ADMIN_ID
// admin access.
export const PASSWORD = "mypassword";
```

## running

From the repo, run

`npm run start`

## NOTE(!)

Putting in your API key will make the bot join as you!
You probably want to be able to join as yourself and have the bot going at the same time.
Just login with a different email and get an API key for that account, so you can use yours normally.
