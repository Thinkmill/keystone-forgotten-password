const updateUserPassword = (user, password) => {
  user.password = password;
  user.passwordLastUpdated = Date.now();
  return user.save();
};

module.exports = updateUserPassword;
