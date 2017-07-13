const keystone = require("keystone");
const uuid = require("uuid/v4");
const debug = require("debug")("keystone");

const sendForgottenPasswordEmail = (user, onForgotEmail) => forgotPassword => {
  const locals = Object.assign({}, user.toJSON(), {
    recipientEmail: user.email,
    forgotPasswordKey: forgotPassword.key
  });

  return onForgotEmail(locals);
};

const emailValidation = email => {
  // http://emailregex.com/
  const match = email.match(
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  );
  return !!match;
};

const forgotPassword = ({ onForgotEmail }) => (req, res, next) => {
  const UserModel = keystone.get("user model");
  const User = keystone.list(UserModel);
  const ForgotPassword = keystone.list("ForgotPassword");
  var errors = {};

  const { email } = req.body;
  if (!email) {
    errors.email = "Email is required";
  }

  if (email && !emailValidation(email)) {
    errors.email = "Valid email required";
  }

  if (Object.keys(errors).length) {
    return res.status(400).json({
      success: false,
      errors
    });
  }

  User.model
    .findOne({ email: email.toLowerCase() })
    .exec()
    .then(user => {
      if (user) {
        const forgotPassword = new ForgotPassword.model({
          user: user._id,
          key: uuid(),
          dateRequested: Date.now(),
          requestedByIp: req.ips.length ? req.ips : req.ip
        });
        forgotPassword
          .save()
          .then(sendForgottenPasswordEmail(user, onForgotEmail))
          .then(() => {
            res.status(200).json({ success: true });
          })
          .catch(error => {
            debug(`Error sending email to: ${email}. Error:`, error);
            res.status(400).json({
              success: false,
              errors: { emailSend: "Email failed to send" }
            });
          });
      } else {
        res.status(200).json({ success: true });
      }
    })
    .catch(next);
};

module.exports = forgotPassword;
