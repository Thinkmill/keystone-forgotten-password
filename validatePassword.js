const keystone = require("keystone");

const regexChunk = {
  digitChar: /\d/,
  spChar: /[!@#\$%\^&\*()\+]/,
  asciiChar: /^[\u0020-\u007E]+$/,
  lowChar: /[a-z]/,
  upperChar: /[A-Z]/
};
const detailMsg = {
  digitChar: "enter at least one digit",
  spChar: "enter at least one special character",
  asciiChar: "only ASCII characters are allowed",
  lowChar: "use at least one lower case character",
  upperChar: "use at least one upper case character"
};
const validate = password => {
  let detail = "";
  const UserModel = keystone.get("user model");
  const User = keystone.list(UserModel);
  const min = User.fields.password.options.min;
  const max = User.fields.password.options.max || 72;
  const complexity = User.fields.password.options.complexity;

  if (min && typeof password === "string" && password.length < min) {
    detail += "password must be longer than " + min + " characters\n";
  }

  if (max && typeof password === "string" && password.length > max) {
    detail += "password must not be longer than " + max + " characters\n";
  }

  for (var prop in complexity) {
    if (complexity[prop] && typeof password === "string") {
      var complexityCheck = regexChunk[prop].test(password);
      if (!complexityCheck) {
        detail += detailMsg[prop] + "\n";
      }
    }
  }
  return detail.trim();
  // if pr is complete: https://github.com/keystonejs/keystone/pull/4157
  // const Types = keystone.Field.Types;
  // const { result, detail } = Types.Password.validate(password, confirmPassword, { min, max, complexity });
  // return detail;

  // calling manually at the moment is very complex.
  // following won't work too much stubbing to get the method working...
  // const User = keystone.list('User');
  // return new Promise((resolve, reject) => {
  // 	try {
  // 		User.fields.password.validateInput({ password, _confirm: password }, resolve);
  // 	} catch (e) {
  // 		reject(e);
  // 	}
  // });
};

module.exports = validate;
