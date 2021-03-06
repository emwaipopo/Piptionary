const express = require("express");
const router = express.Router();
const validateRegisterInput = require('../../validation/register');
const validateLoginInput = require('../../validation/login');
const jwt = require('jsonwebtoken');
const keys = require('../../config/keys');
const passport = require('passport');
const bcrypt = require('bcryptjs');
const User = require('../../models/User');

router.get('/current', passport.authenticate('jwt', { session: false }), (req, res) => {
  res.json({
    id: req.user.id,
    username: req.user.username,
    email: req.user.email
  });
})

router.post("/register", (req, res) => {
  const { errors, isValid } = validateRegisterInput(req.body);

  if (!isValid) {
    return res.status(400).json(errors);
  }

  User.findOne({ email: req.body.email }).then(user => {
    if (user) {
      errors.username = "There is already an account associated with that email";
      return res.status(400).json(errors);
    } else {
      const newUser = new User({
        username: req.body.username,
        email: req.body.email,
        password: req.body.password
      });

      bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(newUser.password, salt, (err, hash) => {
          if (err) throw err;
          newUser.password = hash;
          newUser
            .save()
            .then(user => {
              const payload = { id: user.id, username: user.username };

              jwt.sign(payload, keys.secretOrKey, { expiresIn: 3600 }, (err, token) => {
                res.json({
                  success: true,
                  token: "Bearer " + token
                });
              });
            })
            .catch(err => console.log(err));
        });
      });
    }
  });
});

router.post("/login", (req, res) => {
  const { errors, isValid } = validateLoginInput(req.body);

  if (!isValid) {
    return res.status(400).json(errors);
  }

  const email = req.body.email
  const password = req.body.password;

  User.findOne({ email }).then(user => {
    if (!user) {
      errors.email = "This user does not exist";
      return res.status(400).json(errors);
    }

    bcrypt.compare(password, user.password).then(isMatch => {
      if (isMatch) {
        const payload = { id: user.id, username: user.username, theme: user.theme };

        jwt.sign(payload, keys.secretOrKey, { expiresIn: 14400 }, (err, token) => {
          res.json({
            success: true,
            token: "Bearer " + token
          });
        });
      } else {
        errors.password = "Incorrect password";
        return res.status(400).json(errors);
      }
    });
  });
});

router.patch("/:id/theme", (req, res) => {
  const filter = { _id: req.body.user.id };
  User.findOneAndUpdate(filter, { "$set": { theme: `${req.body.theme}` } }, { new: true })
    .then(user => {
      res.json(user)
    })
    .catch(err => res.status(400).json({ unabletoupdate: `Unable to update ${err}` }))
});

router.get("/:id/ui", (req, res) => {
  User.findById(req.params.id)
    .then(user => {
      res.json(user.theme)
    })
    .catch(err => res.status(400).json({ unabletoupdate: `Unable to get ${err}` }))
});

module.exports = router;