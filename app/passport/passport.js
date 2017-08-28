var FacebookStrategy = require('passport-facebook').Strategy;
var TwitterStrategy = require('passport-twitter').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var User = require('../models/user');
var session = require('express-session');
var jwt = require('jsonwebtoken');
var secret = 'sevillafc';

module.exports = function(app, passport){

  app.use(passport.initialize());
  app.use(passport.session());
  app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true
  }));

  passport.serializeUser(function(user, done) {

    if(user.active){
      token = jwt.sign({ username: user.username, email: user.email }, secret, {expiresIn:'24h'});
      done(null, user.id);
    }else{
      token = "inactive/error"
    }
  });

  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });

  passport.use(new FacebookStrategy({
      clientID: '344360105987740',
      clientSecret: '68277dc19eecbf94b8d652d65af8a844',
      callbackURL: "http://localhost:8080/auth/facebook/callback",
      profileFields : ['id', 'displayName', 'photos', 'email']
    },
    function(accessToken, refreshToken, profile, done) {
      User.findOne({ email: profile._json.email}).select('username active password email').exec(function(err, user){
        if(err) done(err);

        if(user && user !=null){
          done(null, user);
        }else{
          done(err);
        }
      });
    }
  ));

  passport.use(new TwitterStrategy({
    consumerKey: 'KIDp0GNxjzaLXbnkb8ExzDSO4',
    consumerSecret: 'DYCRrcZfzw7akIchKjKtcXfGgV2O3u83o6C08Fq6k6MESORi46',
    callbackURL: "http://localhost:8080/auth/twitter/callback",
    userProfileURL: "https://api.twitter.com/1.1/account/verify_credentials.json?include_email=true"
  },
  function(token, tokenSecret, profile, done) {
    User.findOne({ email: profile.emails[0].value}).select('username active password email').exec(function(err, user){
      if(err) done(err);

      if(user && user !=null){
        done(null, user);
      }else{
        done(err);
      }
    });
  }
))

  passport.use(new GoogleStrategy({
    clientID: '939707278918-ueoi8i7el65uiihmnn0mt595irqpjseq.apps.googleusercontent.com',
    clientSecret: 'hz-eiqtgymvqxPhGVIJwgIBG',
    callbackURL: "http://localhost:8080/auth/google/callback"
  },
  function(token, tokenSecret, profile, done) {
    User.findOne({ email: profile.emails[0].value}).select('username password email').exec(function(err, user){
      if(err) done(err);

      if(user && user !=null){
        done(null, user);
      }else{
        done(err);
      }
    });
  }
));
app.get('/auth/google', passport.authenticate('google', { scope: ['https://www.googleapis.com/auth/plus.login', 'profile', 'email'] }));

  app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/googleerror' }), function(req, res) {
    res.redirect('/google/' + token);
  });

  app.get('/auth/twitter', passport.authenticate('twitter'));

  app.get('/auth/twitter/callback', passport.authenticate('twitter', { failureRedirect: '/twittererror' }), function(req, res){
    res.redirect('/twitter' + token);
  });

  app.get('/auth/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/facebookerror' }), function(req, res){
    res.redirect('/facebook/' + token);
  });

  app.get('/auth/facebook', passport.authenticate('facebook', { scope: 'email' }));


  return passport;
}
