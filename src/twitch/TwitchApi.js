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
          resolve(response);
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  usernameId(username) {
    return new Promise(async (resolve, reject) => {
      if (!this.clientCredentials) await this.getCredentials();
      var url = `https://api.twitch.tv/helix/users?login=${username}`;
      var options = {
        method: 'GET',
        headers: {
          'Client-ID': process.env.TWITCH_CLIENT_ID,
          Authorization: `Bearer ${this.clientCredentials}`,
        },
      };
      fetch(url, options)
        .then((result) => result.json())
        .then(resolve)
        .catch(reject);
    });
  }

  userData(id) {
    return new Promise((resolve, reject) => {
      var url = `https://api.twitch.tv/helix/users?id=${id}`;
      var options = {
        method: 'GET',
        headers: {
          'Client-ID': process.env.TWITCH_CLIENT_ID,
          Authorization: `Bearer ${this.clientCredentials}`,
        },
      };
      fetch(url, options)
        .then((result) => result.json())
        .then((response) => {
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
          //console.log(data);
          this.clientCredentials = data.access_token;
          res();
        })
        .catch((err) => rej(err));
    });
  }
};
