class ForgotPasswordModel {
	constructor (props) {
		this.props = props;
		this.id = '1234';
	}

	save () {
		return Promise.resolve(Object.assign({}, this.props, { id: this.id }));
	}
}

const users = [{ email: 'test@test.com', toJSON: () => ({ email: 'test@test.com' }) }];
class UserModel {

	static findOne (query) {
		return new UserModel(query);
	}

	constructor (query) {
		this.query = query;
	}

	exec () {
		const found = users.find(u => u.email === this.query.email);
		return Promise.resolve(found);
	}
}

const ForgotPassword = { model: ForgotPasswordModel };
const User = { model: UserModel };

const lists = {
	User,
	ForgotPassword,
};

const list = l => lists[l];

module.exports = {
	list,
};
