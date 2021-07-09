const Express = require('express');
const vars = require('../vars');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const OAuth2Strategy = require('passport-oauth').OAuth2Strategy;
const request = require('request');
const handlebars = require('handlebars');
const { pronouns } = require('../Pronouns');

const app = Express();

app.use(
  cors({
    origin: (a, b) => {
      b(null, true);
    },
  })
);

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);
app.use(Express.static('public'));
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

var template = handlebars.compile(`
<html><table>
    <tr><th>Access Token</th><td>{{accessToken}}</td></tr>
    <tr><th>Refresh Token</th><td>{{refreshToken}}</td></tr>
    <tr><th>Display Name</th><td>{{data.[0].display_name}}</td></tr>
    <tr><th>Bio</th><td>{{data.[0].description}}</td></tr>
    <tr><th>Image</th><td>{{data.[0].profile_image_url}}</td></tr>
</table></html>`);

app.get('/', (req, res) => {
  if (req.session && req.session.passport && req.session.passport.user) {
    console.log(req.session.passport.user);
    res.send(template(req.session.passport.user));
  } else {
    res.send('<html><a href="/auth/twitch">Log in with Twitch</a></html>');
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

app.listen(process.env.PORT, () => {
  console.log('Server listening on port ' + process.env.PORT);
});
