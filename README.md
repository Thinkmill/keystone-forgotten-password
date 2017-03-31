# Keystone Forgotten Password
## What is This?
This is for keystone applications only. Keystone projects having a user model may require a reset password setup.

** Note **

This plugin assumes you have a user model with a password property with a keystone Password field type.


## Prerequisites
 - Node V6+
 - Keystone 4.0.0.beta-5
 - User model with Password field type
 - The need to add a password reset to your application

## Usage

```JavaScript

// routes/index.js
const forgottenPasswordPlugin = require('keystone-forgotten-password');

const forgottenPassword = forgottenPasswordPlugin({
	// define what happens on the given hooks.
	onForgotEmail: (locals) => sendForgotEmail(locals),
	onChangePasswordEmail: (locals) => sendChangePasswordEmail(locals),
});

exports = module.exports = function (app) {
  app.get('/', routes.views.index);
  app.use('/auth/', forgottenPassword); // routes are mounted on /auth/ auth/forgot, auth/change-password will be added
};

// model/User.js
const keystone = require('keystone');
const { enhanceUser } = require('keystone-forgotten-password');

const User = new keystone.List('User');

User.add({
	email: { type: keystone.Field.Types.Email },
	password: { type: keystone.Field.Types.Password },
});

enhanceUser(User);

User.schema.virtual('canAccessKeystone').get(function () {
	return true;
});

User.defaultColumns = 'displayName, email';
User.register();

```

## Routes


|	Route	|		Payload		 | Response |
|-----|--------|----------|
| POST /forgot | { "email": "test@test.com" } | 400 for email validation, 200 for email exists or does not|
|	POST | /change-password |	{ "password": "usersNewPassword123", forgotPasswordKey: "(UNIQUE GUID Value)" }|


## API

### Plugin
```JavaScript
const forgottenPasswordPlugin = require('keystone-forgotten-password');
```
accepts the following config object.

|	Key	|		Value		 | Required |
|-----|------------|----------|
| onForgotEmail | requires a function which returns a promise. The promise is given the entire user object and ```forgotPasswordKey`` which must be provided in the reset password link to change-password in your front end application. | Yes |
| onChangePasswordEmail | requires a function which returns a promise. The promise is given the entire user object | Yes |
| keyExpiry | Integer in hours, defaults to 24 hours. The key sent in the email will live until the given expiry | No |

```JavaScript
const { enhanceUser } = require('keystone-forgotten-password');
```

To add the additional property ```passwordLastUpdated: { type: Date },``` to your User model you can use this helper. Adding this field manually is possibly but not recommended.
