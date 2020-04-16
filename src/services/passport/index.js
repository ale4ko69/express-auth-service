const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const mongoose = require('mongoose');
const User = mongoose.model('User');
const Auth = require('../../utils/auth');

passport.use(new LocalStrategy(
  {usernameField: 'email'},
  (username, password, done) => {
    // let condition = {email: username};
    let condition = {$or: [{email: username}, {username: username}]};
    User.findOne(condition, function (err, user) {
      if (err) return done(err);
      // Return if user not found in database
      if (!user || user.deletedAt) {
        return done(null, false, {
          message: 'User not found'
        });
      }
      // Return if password is wrong
      if (!Auth.validPassword(user, password)) {
        return done(null, false, {
          message: 'Password is wrong'
        });
      }
      // If credentials are correct, return the user object
      // console.log(user);
      return done(null, user);
    });
  }
));
