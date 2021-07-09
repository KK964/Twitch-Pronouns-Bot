const MySql = require('./MySql');
const TwitchApi = require('./twitch/TwitchApi');

var obj = {
  mysql: new MySql(),
  twitchApi: new TwitchApi(),
};

module.exports = obj;
