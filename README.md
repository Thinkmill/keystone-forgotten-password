# Keystone Forgotten Password

[![Build Status](https://travis-ci.org/Thinkmill/keystone-forgotten-password.svg?branch=master)](https://travis-ci.org/Thinkmill/keystone-forgotten-password)


## What is This?
This is for keystone applications only. Keystone projects having a user model may require a reset password setup. this plugin adds the required models and routes, you will have to interact with the routes yourself in your own application, including writing your own email handlers.

### Note

This plugin assumes you have a `user model` with a password property with a keystone Password field type.


## Exports

```js
	// Exposes routes for a password reset
	const forgotPassword = require('keystone-forgotten-password'); 
	
	// Exposes a single route to change a password for a logged in User.
	const { updatePassword } = require('keystone-forgotten-password');
```


## Prerequisites
 - Node V6+
 - Keystone 4.0.0.beta-5
 - User model with Password field type
 - The need to add a password reset to your application

## Usage

For IP logging of requests ensure you set:
``` js
	app.enable('trust proxy')
```

### Forgotten Password

```js

// routes/index.js
const forgottenPasswordPlugin = require('keystone-forgotten-password');

const forgottenPassword = forgottenPasswordPlugin({
	// define what happens on the given email handlers.
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

### Update Password for Logged in Users
In the case where you have a 'Profile' page in your application and you want to allow user to change their password setup the following.

```js

// routes/index.js
const { updatePassword } = require('keystone-forgotten-password');


exports = module.exports = function (app) {
  app.get('/', routes.views.index);
  app.use(middelwares.authenticated, updatePassword()); // route is added to /update-password
  // alternatively
  app.use('/profile', middlewares.authenticated, updatePassword());
  
  // forgottenPassword checks by default req.user from your custom middleware, want to check a different property i.e. req.appUser?
  // want to send an email?
  app.use('/profile', middlewares.authenticated, updatePassword({
  	userRequest: 'appUser',
  	onChangePasswordEmail: (locals) => sendChangePasswordEmail(locals),
  }));

};


```




## Routes


|	Route	|		Payload		 | Response |
|-----|--------|----------|
| POST /forgot | ```{ "email": "test@test.com" } ```| 400 for email validation, 200 for email exists or does not|
|	POST | /change-password |	```{ "password": "usersNewPassword123", forgotPasswordKey: "(UNIQUE GUID Value)" }```|
| POST | /update-password (ensure this is behind auth middleware) | ``` {"password": "usersNewPassword123", "existingPassword": "existingPassword" } ``` |


## API

### Forgotten Password Plugin
```js
const forgottenPasswordPlugin = require('keystone-forgotten-password');
```
accepts the following config object.

|	Key	|		Value		 | Required |
|-----|------------|----------|
| onForgotEmail: Function | requires a function which returns a promise. The promise is given the entire user object and ```forgotPasswordKey``` which must be provided in the reset password link to change-password in your front end application. | Yes |
| onChangePasswordEmail: Function | requires a function which returns a promise. The promise is given the entire user object | Yes |
| keyExpiry: number | Integer in hours, defaults to 24 hours. The key sent in the email will live until the given expiry | No |

```js
const { enhanceUser } = require('keystone-forgotten-password');
```

To add the additional property ```passwordLastUpdated: { type: Date },``` to your User model you can use this helper. Adding this field manually is possibly but not recommended.

### Update Password Plugin
```js
// Exposes a single route to change a password for a logged in User.
const { updatePassword } = require('keystone-forgotten-password');

```
|	Key	|		Value		 | Required |
|-----|------------|----------|
| onChangePasswordEmail: Function | requires a function which returns a promise. The promise is given the entire user object | No |
| userRequest: string | name of property on express req object containing the current user defaults to req.user | No |
