var express = require('express');
var tokenModel = require('../../models/token.model')
var userModel = require('../../models/user.model');
var router = express.Router();
var nodemailer = require('nodemailer')
var crypto = require('crypto')
var bcrypt = require('bcrypt')

router.get('/', (req, res, next) => {
    res.render('info/resetpw', {
        layout: false
    })
});

router.post('/', (req, res, next) => {
    var email = req.body.email;
    var correct = false;
    var entity = {}
    var token = crypto.createHmac('sha256', email)
                            .update('I love cupcakes')
                            .digest('hex');

    userModel.getEmails().then(rows => {
        rows.forEach(row => {
            if(row.email == email) {
                correct = true
            };
        });

        if (correct) {
            var transporter = nodemailer.createTransport({
                service: 'Gmail',
                auth: {
                       user: 'nhomwebgame@gmail.com',
                       pass: 'Legolas1508'
                   }
            });

            var mailOptions = {
                from: 'eMagazine-TH06',
                to: email,
                subject: 'Password Reset',
                text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
                  'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
                  'http://localhost:3002/resetpw/' + token + '\n\n' +
                  'And your new password will be changed to: ' + token.substr(0,10) + '\n\n' +
                  'If you did not request this, please ignore this email and your password will remain unchanged.\n',
                //html:'<p>You have got a new message</p>',
            };

            transporter.sendMail(mailOptions, function(err, info){
                if (err) {
                    console.log(err);
                    entity = {
                        err_message: "Something wrong when we try to send new password!\nPlease try again.",
                        invalid: email,
                        layout: false,
                    }
                    res.render('info/resetpw', entity);

                } else {
                    console.log('Message sent: ' +  info.response);
                    //req.flash('info', 'An e-mail has been sent to ' + email + ' with further instructions.');
                    var token_entity = {
                        email: email,
                        token: token,
                        newpass: token.substr(0,10),
                    }

                    tokenModel.add(token_entity).then (rows => {
                        res.redirect('/');
                    }).catch(next);
                }
            });
        } else {
            entity = {
                err_message: "This email hasn't been registerd by any user!\nPlease check again.",
                invalid: email,
                layout: false,
            }
            res.render('info/resetpw', entity)
        }
    })
});


router.get('/:token', (req, res, next) => {
    var token = req.params.token;

    Promise.all([
        tokenModel.getEmail(token),
        tokenModel.getPass(token),
    ]).then(([email, newpass]) => {
        if (email.rows > 0 && newpass.rows > 0) {
            var saltRounds = 10;
            console.log(newpass[0].newpass);
            var hash = bcrypt.hashSync(newpass[0].newpass, saltRounds);
            var user = {
                email: email[0].email,
                password: hash,
            }

            userModel.update(user);
            tokenModel.delete(token);
            res.render('info/login', {layout: false});
        } else {
            res.render('info/login', {layout: false});
        }
    }).catch(next);
});

module.exports = router;