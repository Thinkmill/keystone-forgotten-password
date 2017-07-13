const keystone = require("keystone");
const moment = require("moment");
const validatePassword = require("./validatePassword");
const updateUserPassword = require("./updateUserPassword");
// this method would be passed in when its a plugin
const sendPasswordUpdatedEmail = onChangePasswordEmail => forgotPassword => {
  const locals = Object.assign({}, forgotPassword.user.toJSON(), {
    recipientEmail: forgotPassword.user.email
  });
  return onChangePasswordEmail(locals);
};

module.exports = ({ onChangePasswordEmail, RESET_PASSWORD_KEY_EXPIRY }) => (
  req,
  res,
  next
) => {
  const ForgotPassword = keystone.list("ForgotPassword");
  var errors = {};
  const { password, forgotPasswordKey } = req.body;

  if (!password) {
    errors.password = "Password is required";
  } else {
    const result = validatePassword(password);

    if (result) {
      errors.password = result;
    }

    if (!forgotPasswordKey) {
      errors.forgotPasswordKey = "forgotPasswordKey is required";
    }
  }

  if (Object.keys(errors).length) {
    return res.status(400).json({
      success: false,
      errors
    });
  }

  ForgotPassword.model
    .findOne({ key: forgotPasswordKey })
    .where("expired")
    .equals(false)
    .populate("user")
    .exec()
    .then(forgotPassword => {
      if (
        forgotPassword &&
        moment().diff(moment(forgotPassword.dateRequested), "h") <=
          RESET_PASSWORD_KEY_EXPIRY
      ) {
        updateUserPassword(forgotPassword.user, password)
          .then(() => {
            forgotPassword.dateAccessed = Date.now();
            forgotPassword.accessedByIp = req.ips.length ? req.ips : req.ip;
            forgotPassword.expired = true;
            forgotPassword.user.passwordLastUpdated = Date.now();
            return Promise.all([
              forgotPassword.save(),
              forgotPassword.user.save()
            ]).then(([forgot]) => forgot);
          })
          .then(sendPasswordUpdatedEmail(onChangePasswordEmail)) // in a plugin this would be passed in.
          .catch(error => {
            console.log(
              `Error sending change password email to: ${forgotPassword.user
                .email}. Error:`,
              error
            );
          });
        return res.status(200).json({ success: true });
      } else {
        return res.status(400).json({
          success: false,
          errors: { general: "Request to reset password has expired" }
        });
      }
    })
    .catch(next);
};
