const validatePassword = require("./validatePassword");
const keystone = require("keystone");
const bcrypt = require("bcrypt");
const updatePassword = require("./updateUserPassword");

module.exports = ({ resolveUserId, onChangePasswordEmail }) => (
  req,
  res,
  next
) => {
  const UserModel = keystone.get("user model");
  const User = keystone.list(UserModel);

  const { password, existingPassword } = req.body;
  const errors = {};
  if (!password) {
    errors.password = "Please enter a new password";
  } else {
    const result = validatePassword(password);

    if (result) {
      errors.password = result;
    }
  }

  if (!existingPassword) {
    errors.existingPassword = "Please enter an existing password";
  }

  if (Object.keys(errors).length) {
    return res.status(400).json({
      success: false,
      errors
    });
  }

  User.model
    .findOne({ _id: resolveUserId(req, res) })
    .exec()
    .then(user => {
      return compare(user.password, existingPassword).then(result => {
        if (!result) {
          return res.status(400).json({
            success: false,
            errors: {
              existingPassword: "Please enter an existing password"
            }
          });
        }
        return updatePassword(user, password)
          .then(() => {
            return res.status(200).json({
              success: true
            });
          })
          .then(sendChangePasswordEmail(user, onChangePasswordEmail));
      });
    })
    .catch(err => {
      console.log("error updating password", err);
      next(err);
    });
};

const compare = (hashed, raw) =>
  new Promise((resolve, reject) => {
    bcrypt.compare(raw, hashed, (err, res) => {
      if (err) return reject(err);
      resolve(res);
    });
  });

const sendChangePasswordEmail = (user, onChangePasswordEmail) => {
  const locals = Object.assign({}, user.toJSON(), {
    recipientEmail: user.email
  });
  return onChangePasswordEmail(locals);
};
