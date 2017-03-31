const keystone = require('keystone');
const uuid = require('uuid/v4');

const sendForgottenPasswordEmail = (user, onForgotEmail) => forgotPassword => {
	const locals = Object.assign({}, user.toJSON(), {
		recipientEmail: user.email,
		forgotPasswordKey: forgotPassword.key,
	});

	return onForgotEmail(locals);
};

module.exports = ({ onForgotEmail }) => (req, res, next) => {
	const User = keystone.list('User');
	const ForgotPassword = keystone.list('ForgotPassword');
	var errors = {};
	const { email } = req.body;
	if (!email) {
		errors.email = 'Email is required';
	};

	if (Object.keys(errors).length) {
		return res.status(400).json({
			success: false,
			errors,
		});
	}
	User.model
	.findOne({ email })
	.exec()
	.then(user => {
		if (user) {
			const forgotPassword = new ForgotPassword.model({
				user: user._id,
				key: uuid(),
				dateRequested: Date.now(),
				requestedByIp: req.ips.length ? req.ips : req.ip,
			});
			forgotPassword.save()
			.then(sendForgottenPasswordEmail(user, onForgotEmail))
			.catch(error => {
				console.error(`Error sending email to: ${email}. Error:`, error);
			});
		}
		return res.status(200).json({ success: true });
	}).catch(next);
};
