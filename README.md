# Twitch-Pronouns-Bot

Allow Users to set their pronouns in your stream

Streamlabs ChatBox JS:

```js
var pronouns = new Map();
var noPronouns = new Map();

document.addEventListener('onLoad', function (obj) {});

function getPronouns(userid) {
  if (pronouns.has(userid)) return pronouns.get(userid);
  if (noPronouns.has(userid) && noPronouns.get(userid) > 0) {
    noPronouns.set(userid, noPronouns.get(userid) - 1);
    return 'unk';
  }
  return new Promise((res, rej) => {
    $.get('https://pronouns.kmods.dev/api/pronouns/' + userid, (data) => {
      pronouns.set(userid, data);
      res(pronouns.get(userid));
    }).catch((err) => {
      res('unk');
      noPronouns.set(userid, 5);
    });
  });
}

document.addEventListener('onEventReceived', function (obj) {
  if (obj.detail.command !== 'PRIVMSG') return;
  var userId = obj.detail.payload.tags['user-id'];
  var latest = $('#log>div').last()[0];
  var name = latest.firstElementChild.children[1];
  updateUsername(name, userId);
});

async function updateUsername(element, userId) {
  var pronouns = await getPronouns(userId);
  var currentName = element.innerText;
  if (currentName.startsWith(`(${pronouns})`)) return;
  element.innerText = `(${pronouns}) ${currentName}`;
}
```
