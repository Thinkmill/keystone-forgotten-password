const Router = require("express").Router;
const forgotPassword = require("./forgotPassword");
const changePassword = require("./changePassword");
const updatePassword = require("./updatePassword");
const defaultResolveUserId = require("./resolveUserId");
const internals = {};

module.exports = internals.plugin = function keystoneForgottenPassword(
  config = {}
) {
  const routes = new Router();
  const RESET_PASSWORD_KEY_EXPIRY = config.keyExpiry || 24;
  const {
    onForgotEmail = () => Promise.resolve(),
    onChangePasswordEmail = () => Promise.resolve()
  } = config;

  routes.post(
    "/forgot",
    forgotPassword({
      onForgotEmail,
      RESET_PASSWORD_KEY_EXPIRY
    })
  );

  routes.post(
    "/change-password",
    changePassword({
      onChangePasswordEmail,
      RESET_PASSWORD_KEY_EXPIRY
    })
  );

  return routes;
};

internals.plugin.enhanceUserModel = function enhanceUserModel(Model) {
  require("./model/ForgotPassword");
  Model.add({
    passwordLastUpdated: { type: Date }
  });
};

internals.plugin.updatePassword = function keystoneUpdatePassword(config = {}) {
  const routes = new Router();
  let {
    onChangePasswordEmail = () => Promise.resolve(),
    userRequest = "user",
    resolveUserId
  } = config;

  if (!resolveUserId) {
    resolveUserId = defaultResolveUserId(userRequest);
  }

  routes.post(
    "/update-password",
    updatePassword({
      resolveUserId,
      onChangePasswordEmail
    })
  );

  return routes;
};
