const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const flash = require('connect-flash');

module.exports = (passport)=>{
    passport.use(new LocalStrategy({
        passReqToCallback: true
    },(req,email, password, done)=>{
        User.findOne({email: email}, (err, user)=>{
            if (err) {
                throw err;
            }

            if(!user){
                return done(null, false, req.flash('error', 'User does not exist'));
            }

            console.log(user) 

            bcrypt.compare(password, user.password, (err, isMatch)=>{
                if (err) {
                    throw err;
                }
                    
                if (isMatch) {
                    return done(null, user);
                } else {
                    console.log("error")
                    return done(null, false, req.flash('error', 'Wrong Password'));
                }
            });
        });
    }));

    passport.serializeUser((user, done)=>{
        done(null, user._id);
    });

    passport.deserializeUser((id, done)=>{
        User.findById(id, (err, user)=>{
            done(err, user);
        });
    });
}