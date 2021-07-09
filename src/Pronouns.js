const { mysql, twitchApi } = require('./vars');

const userIds = new Map();
const pronouns = new Map();

function setPronouns(userid, displayName, userPronouns) {
  userIds.set(displayName, userid);
  pronouns.set(userid, userPronouns);
  mysql
    .query(
      'INSERT INTO pronouns (user_id, pronouns) VALUES (?,?) ON DUPLICATE KEY UPDATE pronouns=?;',
      [userid, userPronouns, userPronouns]
    )
    // .then((res) => {
    //   console.log(res);
    // })
    .catch((err) => {
      console.log(err);
    });
}

function getUserPronouns(username) {
  return new Promise(async (resolve, reject) => {
    if (userIds.has(username)) return resolve(await getIdPronouns(userIds.get(username)));
    var userDetails = await twitchApi.usernameId(username);
    userDetails = userDetails?.data?.[0];
    if (!userDetails) return resolve(null);
    userIds.set(username, userDetails.id);
    var pro = await getIdPronouns(userDetails.id);
    return resolve(pro);
  });
}

function getIdPronouns(id) {
  return new Promise(async (resolve, reject) => {
    if (pronouns.has(id)) return resolve(pronouns.get(id));
    mysql
      .query('SELECT * FROM pronouns WHERE user_id=?', [id])
      .then((res) => {
        if (res.length === 0) return resolve(null);
        pronouns.set(id, res[0].pronouns);
        return resolve(res[0].pronouns);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

module.exports = {
  setPronouns,
  pronouns: {
    getUserPronouns,
    getIdPronouns,
  },
};
