// Domain to pull pronouns from
// If you are self hosting, you can change this to your domain
const DOMAIN = 'https://pronouns.kmods.dev';

// Don't change anything below this line, unless you know what you're doing
// -------------------------

var pronouns = new Map(); // Pronouns of users
var noPronouns = new Map(); // 5 tries before we retry getting pronouns for user

// Load live updating of pronouns
jQuery.ajax({
  url: 'https://cdnjs.cloudflare.com/ajax/libs/socket.io/4.1.3/socket.io.js',
  dataType: 'script',
  async: true,
  cache: true,
  success: () => {
    var socket = io(DOMAIN + '/socket.io/chat');
    socket.on('connect', () => {
      console.log('Connected to pronouns socket');
    });
    socket.on('pronounsUpdate', (obj) => {
      noPronouns.delete(obj.userId);
      pronouns.set(obj.userId, obj.pronouns);
    });
    socket.connect();
  },
  fail: () => {
    console.error('Failed to load socket.io! Updating users pronouns in chat will be slower.');
  },
});

document.addEventListener('onLoad', function (obj) {
  console.log('Custom JS Loaded');
});

// Run on message received
document.addEventListener('onEventReceived', function (obj) {
  if (obj.detail.command !== 'PRIVMSG') return;
  var userId = obj.detail.payload.tags['user-id'];
  var latest = $('#log>div').last()[0];
  var name = latest.firstElementChild.children[1];
  updateUsername(name, userId);
});

// Get the pronouns of a user from the server
function getPronouns(userid) {
  if (pronouns.has(userid)) return pronouns.get(userid);
  if (noPronouns.has(userid) && noPronouns.get(userid) > 0) {
    noPronouns.set(userid, noPronouns.get(userid) - 1);
    return;
  }
  return new Promise((res, rej) => {
    $.get(DOMAIN + '/api/pronouns/' + userid, (data) => {
      pronouns.set(userid, data);
      res(pronouns.get(userid));
    }).catch((err) => {
      res();
      noPronouns.set(userid, 5);
    });
  });
}

// Change username to (${pronouns}) {Username}
async function updateUsername(element, userId) {
  var pronouns = await getPronouns(userId);
  if (!pronouns) return;
  var currentName = element.innerText;
  if (currentName.startsWith(`(${pronouns})`)) return;
  element.innerText = `(${pronouns}) ${currentName}`;
}
