const keystone = require('keystone');
const moment = require('moment');
// this method would be passed in when its a plugin
const sendPasswordUpdatedEmail = onChangePasswordEmail => forgotPassword => {
	const locals = Object.assign({}, forgotPassword.user.toJSON(), {
		recipientEmail: forgotPassword.user.email,
	});
	return onChangePasswordEmail(locals);
};

const regexChunk = {
	digitChar: /\d/,
	spChar: /[!@#\$%\^&\*()\+]/,
	asciiChar: /^[\u0020-\u007E]+$/,
	lowChar: /[a-z]/,
	upperChar: /[A-Z]/,
};
const detailMsg = {
	digitChar: 'enter at least one digit',
	spChar: 'enter at least one special character',
	asciiChar: 'only ASCII characters are allowed',
	lowChar: 'use at least one lower case character',
	upperChar: 'use at least one upper case character',
};

const changePassword = (user, password) => {
	user.password = password;
	return user.save();
};

const validate = password => {
	let detail = '';
	const UserModel = keystone.get('user model');
	const User = keystone.list(UserModel);
	const min = User.fields.password.options.min;
	const max = User.fields.password.options.max || 72;
	const complexity = User.fields.password.options.complexity;
	if (min && typeof passwordValue === 'string' && password.length < min) {
		detail += 'password must be longer than ' + min + ' characters\n';
	}

	if (max && typeof password === 'string' && password.length > max) {
		detail += 'password must not be longer than ' + max + ' characters\n';
	}

	for (var prop in complexity) {
		if (complexity[prop] && typeof password === 'string') {
			var complexityCheck = (regexChunk[prop]).test(password);
			if (!complexityCheck) {
				detail += detailMsg[prop] + '\n';
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

module.exports = ({ onChangePasswordEmail, RESET_PASSWORD_KEY_EXPIRY }) => (req, res, next) => {
	const ForgotPassword = keystone.list('ForgotPassword');
	var errors = {};
	const { password, forgotPasswordKey } = req.body;
	if (!password) {
		errors.password = 'Password is required';
	}

	const result = validate(password);

	if (result) {
		errors.password = result;
	}

	if (!forgotPasswordKey) {
		errors.forgotPasswordKey = 'forgotPasswordKey is required';
	}

	if (Object.keys(errors).length) {
		return res.status(400).json({
			success: false,
			errors,
		});
	}

	ForgotPassword.model
	.findOne({ key: forgotPasswordKey })
	.where('expired').equals(false)
	.populate('user')
	.exec()
	.then(forgotPassword => {
		if (forgotPassword && moment().diff(moment(forgotPassword.dateRequested), 'h') <= RESET_PASSWORD_KEY_EXPIRY) {
			changePassword(forgotPassword.user, password)
			.then(() => {
				forgotPassword.dateAccessed = Date.now();
				forgotPassword.accessedByIp = req.ips.length ? req.ips : req.ip;
				forgotPassword.expired = true;
				forgotPassword.user.passwordLastUpdated = Date.now();
				return Promise.all([
					forgotPassword.save(),
					forgotPassword.user.save(),
				])
				.then(([forgot]) => forgot);
			})
			.then(sendPasswordUpdatedEmail(onChangePasswordEmail)) // in a plugin this would be passed in.
			.catch(error => {
				console.error(`Error sending change password email to: ${forgotPassword.user.email}. Error:`, error);
			});
			return res.status(200).json({ success: true });
		} else {
			return res.status(400).json({ success: false, errors: { general: 'Request to reset password has expired' } });
		}
	}).catch(next);
};
