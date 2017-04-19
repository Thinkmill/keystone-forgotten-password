const { GUID } = require('./constants');

const users = [
	{
		id: '1',
		email: 'test@test.com',
		password: '$2a$10$ju.NVefBklL87naLbHAsTO/DCx3mKfTV1c03EdkxaSCWt00EV/yki'
	}
];
class UserModel {

	static findOne (query) {
		return new UserModel({}, query);
	}

	constructor (props, query) {
		Object.keys(props)
		.forEach(k => {
			this[k] = props[k];
		});
		this.props = props;
		this.query = query;
		this.id = props.id || '1234';
	}

	toJSON () {
		const json = Object.assign({}, this);
		delete json.password;
		delete json.props;
		delete json.query;
		return json;
	}

	exec () {
		let search;
		if (typeof (this.query) === 'string') {
			search = () => users.find(u => u.id === this.query);
		} else {
			const key = Object.keys(this.query)[0];
			search = () => users.find(u => u[key] === this.query.email);
		}

		const found = search();
		if (!found) {
			return Promise.resolve();
		}
		return Promise.resolve(new UserModel(found));
	}

	save () {
		return Promise.resolve(Object.assign({}, this, { id: this.id }));
	}
}

class ForgotPasswordModel {
	constructor (props, query) {
		this.props = props;

		Object.keys(props)
		.forEach(k => {
			this[k] = props[k];
		});

		this.id = '1234';
		this.query = query;
		this.whereEquals = null;
		this.filter = null;
	}

	static findOne (query) {
		return new ForgotPasswordModel({}, query);
	}

	where () {
		return this;
	}

	equals () {
		return this;
	}

	populate () {
		return this;
	}

	exec () {
		const found = forgottenRequests().find(r => r.key === this.query.key);
		if (!found) {
			return Promise.resolve();
		}
		return Promise.resolve(new ForgotPasswordModel(found));
	}

	save () {
		return Promise.resolve(Object.assign({}, this.props, { id: this.id }));
	}
}

const ForgotPassword = { model: ForgotPasswordModel };
const User = {
	model: UserModel,
	fields: {
		password: {
			options: {
				complexity: {
					digitChar: true, upperChar: true,
				},
			},
		},
	},
};


const forgottenRequests = () => [{ key: GUID, user: new UserModel({ password: 'old-password', email: 'test@test.com' }), dateRequested: Date.now() }];

const lists = {
	User,
	ForgotPassword,
};

const gets = {
	'user model': 'User',
};

const list = l => lists[l];
const get = l => gets[l];

module.exports = {
	list,
	get,
};
