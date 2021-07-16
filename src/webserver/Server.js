const Express = require('express');
const app = Express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

const cors = require('cors');
const passport = require('passport');
const OAuth2Strategy = require('passport-oauth').OAuth2Strategy;
const expressSession = require('express-session');

const request = require('request');
const ejs = require('ejs');

const vars = require('../vars');

const { pronouns, channels } = require('../Pronouns');
const { twitchApi, mysql } = require('../vars');

app.use(
  cors({
    origin: (a, b) => {
      b(null, true);
    },
  })
);

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

var session = expressSession({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
});

io.use((socket, next) => {
  session(socket.request, socket.request.res || {}, next);
});

app.use(session);

app.use(Express.static(__dirname + '/public'));

app.use(passport.initialize());
app.use(passport.session());

OAuth2Strategy.prototype.userProfile = (accessToken, done) => {
  var options = {
    url: 'https://api.twitch.tv/helix/users',
    method: 'GET',
    headers: {
      'Client-ID': process.env.TWITCH_CLIENT_ID,
      Accept: 'application/vnd.twitchtv.v5+json',
      Authorization: 'Bearer ' + accessToken,
    },
  };

  request(options, (err, res, body) => {
    if (res && res.statusCode === 200) {
      done(null, JSON.parse(body));
    } else {
      done(JSON.parse(body));
    }
  });
};

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

passport.use(
  'twitch',
  new OAuth2Strategy(
    {
      authorizationURL: 'https://id.twitch.tv/oauth2/authorize',
      tokenURL: 'https://id.twitch.tv/oauth2/token',
      clientID: process.env.TWITCH_CLIENT_ID,
      clientSecret: process.env.TWITCH_CLIENT_SECRET,
      callbackURL: process.env.TWITCH_CALLBACK_URL,
      state: true,
    },
    (accessToken, refreshToken, profile, done) => {
      profile.accessToken = accessToken;
      profile.refreshToken = refreshToken;

      // vars.mysql.query('', [], '', (err, rows) => {
      //   if (err) {
      //     console.log(err);
      //   } else {
      //   }
      // });

      done(null, profile);
    }
  )
);

app.get('/', (req, res) => {
  if (req.session && req.session.passport && req.session.passport.user) {
    res.render('index.ejs', { template: 'dashboard', vars: req.session.passport.user });
  } else {
    res.render('index.ejs', { template: 'login', vars: null });
  }
});

app.get('/auth/twitch', passport.authenticate('twitch', { scope: ['user_read', 'openid'] }));

app.get(
  '/auth/twitch/callback',
  passport.authenticate('twitch', { failureRedirect: '/', successRedirect: '/' })
);

app.get('/api/pronouns/:user', async (req, res) => {
  var user = req.params.user;
  if (!user) return res.sendStatus(404);
  pronouns
    .getIdPronouns(user)
    .then((pronouns) => {
      res.send(pronouns);
    })
    .catch((err) => {
      res.sendStatus(404);
    });
});

io.on('connection', (socket) => {
  console.log(socket.request);
  if (!socket.request.session || !socket.request.session?.passport) {
    socket.emit('error', 'No session');
    socket.disconnect();
    console.log('Resetting user session');
  } else console.log('New user connected', socket.id, socket.request.session);

  socket.on('disconnect', () => {
    console.log('User disconnected', socket.id);
  });

  socket.on('usersInChat', () => {
    console.log(
      socket.request.session.passport.user.data[0].login + ' requesting users in their chat'
    );
    twitchApi
      .getUsersChat(socket.request.session.passport.user.data[0].login)
      .then((users) => {
        socket.emit('usersInChat', users.chatters);
      })
      .catch(() => {
        socket.emit('usersInChat', []);
      });
  });

  socket.on('getPronouns', (user, callback) => {
    console.log('User requesting pronouns for', user);
    pronouns.getUserPronouns(user).then((pronouns) => {
      console.log(pronouns);
      callback({ pronouns });
    });
  });

  socket.on('invited', async (callback) => {
    if (await channels.channelAdded(socket.request.session.passport.user.data[0].id))
      callback({ invited: true });
    else callback({ invited: false });
  });

  socket.on('invite', async (callback) => {
    console.log('User requesting to be invited');
    if (await channels.channelAdded(socket.request.session.passport.user.data[0].id))
      return callback({ success: false, message: 'Your channel is already added!' });
    if (await channels.addChannel(socket.request.session.passport.user.data[0].id))
      return callback({ success: true, message: 'Your channel has been added!' });
    return callback({ success: false, message: 'An error occurred!' });
  });

  socket.on('remove', async (callback) => {
    console.log('User requesting to be removed');
    if (await channels.removeChannel(socket.request.session.passport.user.data[0].id))
      return callback({ success: true, message: 'Your channel has been removed!' });
    return callback({ success: false, message: 'An error occurred!' });
  });
});

const chatIO = io.of('/socket.io/chat');
chatIO.on('connection', (socket) => {
  console.log('New chat connection');
  chatIO.emit('pronounsUpdate', { userId: '1', pronouns: 'sdaw' });
});

server.listen(process.env.PORT, () => {
  console.log('Server listening on port ' + process.env.PORT);
});

module.exports.updatePronouns = (userId, pronouns) => {
  chatIO.emit('pronounsUpdate', { userId, pronouns });
};
