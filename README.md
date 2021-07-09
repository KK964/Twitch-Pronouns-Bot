# Twitch Pronouns Bot

Allow Users to set their pronouns in your stream!

## Use Official Pronouns Bot

Work In Progress, please self host until finished!

## Setup Self Hosting

- Duplicate `.env.example` and call it `.env`
- Fill in your `.env` file
  - Refer to [Twitch Docs](https://dev.twitch.tv/docs/authentication/#registration)
  - Database uses MySql
- Duplicate `channels.example.json` and call it `channels.json`
  - Put list of channels to watch chat of in file
- Configure [Streamlabs Chatbox](https://streamlabs.com/dashboard#/chatbox)

#### Streamlabs ChatBox:

- Enable Custom HTML/CSS
- Go to the JS tab and paste the following into it

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
    $.get(YOUR DOMAIN + '/api/pronouns/' + userid, (data) => {
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

- `YOUR DOMAIN`
  - Self Hosting
    - Change to your domain
  - Not Self Hosting
    - Set to `'https://pronouns.kmods.dev'`
- Click Save Settings

## Todo

- [ ] Dashboard for streamers to view users Pronouns watching the stream
- [ ] Bot channels database
- [ ] Invite Bot page
