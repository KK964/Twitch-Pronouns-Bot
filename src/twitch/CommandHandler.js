const { Client } = require('tmi.js');
const { pronouns, setPronouns } = require('../Pronouns');
const { mysql, twitchApi } = require('../vars');

const pronounRegex = /(([a-z]+)((\/([a-z]+))+)?)/gi;
const doubleSpaceRegex = /( )( +)/g;

/**
 * @param {Client} client
 * @param {String} channel
 * @param {import("tmi.js").Userstate} userstate
 * @param {String} message
 */
module.exports = (client, channel, userstate, message, self) => {
  if (self) return;
  if (!message.toLowerCase().startsWith('!')) return;
  message = message.replace(doubleSpaceRegex, ' ');
  var args = message.substring(1).split(' ');
  if (args[0] === '') args.shift();
  if (!args[0].toLowerCase().startsWith('pronoun')) return;
  var command = args[1].toLowerCase();
  switch (command) {
    case 'help': {
      client.say(channel, 'Pronouns Commands: ').catch(errorHandler);
      client
        .say(channel, ' - !pronoun set <pronouns> - Set your pronouns, ex: she/her')
        .catch(errorHandler);
      client.say(channel, ' - !pronoun get <@user> - See a users pronouns').catch(errorHandler);
      break;
    }
    case 'set': {
      if (args.length < 3 || !pronounRegex.test(args[2]))
        return client.say(channel, 'You need to supply pronouns! Ex: she/her, she/her/they, any');
      var userPronouns = args[2].match(pronounRegex)[0];
      userPronouns = userPronouns.toLowerCase();
      userPronouns = userPronouns.split('/');
      if (userPronouns.length > 4)
        return client.say(channel, 'You only use up to 4 pronouns, sorry!');
      var lengthOfPronouns = userPronouns.map((p) => p.length);
      userPronouns = capitalizeAll(userPronouns);
      for (var i = 0; i < lengthOfPronouns.length; i++)
        if (lengthOfPronouns[i] > 5) {
          return client.say(
            channel,
            `The pronoun "${userPronouns[i]}" exceeds the 5 letter limit, sorry!`
          );
        }
      userPronouns = userPronouns.join('/');
      setPronouns(userstate['user-id'], userstate.username, userPronouns);
      client.say(channel, `${userstate.username}'s pronouns have been set to "${userPronouns}"!`);
      break;
    }
    case 'get': {
      if (args.length < 3) {
        pronouns
          .getIdPronouns(userstate['user-id'])
          .then((pronoun) => {
            if (!pronoun) return client.say(channel, `You have not set any pronouns!`);
            client.say(channel, `Your pronouns are set to "${pronoun}"`);
          })
          .catch(errorHandler);
      } else {
        var user = args[2].replace(/(@)/g, '');
        pronouns
          .getUserPronouns(user)
          .then((pronoun) => {
            if (!pronoun) return client.say(channel, `I couldn't find pronouns for "${user}"`);
            client.say(channel, `${user}'s pronouns are set to "${pronoun}"`);
          })
          .catch(errorHandler);
      }
      break;
    }
  }
};

function capitalizeAll(arr) {
  return arr.map(capitalizeFirstLetter);
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function errorHandler(err) {
  console.log(err);
}
