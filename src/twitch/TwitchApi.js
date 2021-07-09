const fetch = require('node-fetch');
const jwt = require('jsonwebtoken');

const idMap = new Map();

let verifier;

module.exports = class TwitchApi {
  constructor() {
    this.getCredentials();
  }

  getUsersChat(user) {
    return new Promise((resolve, reject) => {
      var url = `https://tmi.twitch.tv/group/user/${user}/chatters`;
      fetch(url)
        .then((response) => response.json())
        .then((response) => {
          console.log(response);
          resolve(response);
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  getCredentials() {
    return new Promise((res, rej) => {
      var url = `https://id.twitch.tv/oauth2/token?client_id=${process.env.TWITCH_CLIENT_ID}&client_secret=${process.env.TWITCH_CLIENT_SECRET}&grant_type=client_credentials`;
      var options = {
        method: 'POST',
      };
      fetch(url, options)
        .then((res) => res.json())
        .then((data) => {
          this.clientCredentials = data.access_token;
          res();
        })
        .catch((err) => rej(err));
    });
  }
};
