require('dotenv').config();
const tmi = require('tmi.js');
const vars = require('./src/vars');
const cmdHandler = require('./src/twitch/CommandHandler');
const channels = require('./channels.json');
const client = new tmi.client({
  identity: {
    username: process.env.TWITCH_USERNAME,
    password: process.env.TWITCH_PASSWORD,
  },
  channels: channels,
});

client.connect();

client.on('connected', () => {
  console.log('connected');
  require('./src/webserver/Server');
});

client.on('disconnected', () => {
  console.log('disconnected');
});

client.on('reconnecting', () => {
  console.log('reconnecting');
});

client.on('error', (error) => {
  console.log(error);
});

client.on('message', async (channel, userstate, message, self) => {
  cmdHandler(client, channel, userstate, message, self);
});
