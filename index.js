require('dotenv').config();
const tmi = require('tmi.js');
const vars = require('./src/vars');
const Queue = require('tmi.js/lib/timer');
const cmdHandler = require('./src/twitch/CommandHandler');
const client = new tmi.client({
  identity: {
    username: process.env.TWITCH_USERNAME,
    password: process.env.TWITCH_PASSWORD,
  },
});

client.connect();

const server = require('./src/webserver/Server');

client.on('connected', () => {
  console.log('connected');
  console.log('Joining Channels');
  joinChannels();
});

function joinChannels() {
  vars.mysql.query('SELECT * FROM channels', []).then((rows) => {
    const joinQueue = new Queue(300);
    rows.forEach((row) => {
      joinQueue.add(async () => {
        const channel = await vars.twitchApi.userData(row.channel);
        if (channel?.error) {
          console.log(channel.error, channel.message);
          return;
        }
        client.join(channel.data[0].login);
      });
    });
    joinQueue.next();
  });
}

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
