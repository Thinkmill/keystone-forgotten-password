const express = require('express');
const request = require('supertest');
const bodyParser = require('body-parser');
const GUID = '27156760-56d9-4d5b-904d-1eaf0d96e17a';
jest.setMock('keystone', require('../keystone-mock'));
jest.setMock('uuid/v4', () => GUID);

const forgotPassword = require('../');

let app;

beforeEach(() => {
	app = express();
	app.use(bodyParser.json());
});

test('should handle request password reset, 200 response', () => {

	app.use('/auth', forgotPassword());
	return request(app)
	.post('/auth/forgot')
	.send({ email: 'test@test.com' })
	.set('Accept', 'application/json')
	.expect('Content-Type', /json/)
	.expect(200)
	.then((response) => {
		expect(response.body).toEqual({ success: true });
	});

});

test('should handle bad email request', () => {

	app.use('/auth', forgotPassword());
	return request(app)
	.post('/auth/forgot')
	.send({ email: 'testtest.com' })
	.set('Accept', 'application/json')
	.expect('Content-Type', /json/)
	.expect(400)
	.then(response => {
		expect(response.body).toEqual({ success: false, errors: { email: 'Valid email required' } });
	});

});

test('should handle no email', () => {

	app.use('/auth', forgotPassword());
	return request(app)
	.post('/auth/forgot')
	.send({ email: '' })
	.set('Accept', 'application/json')
	.expect('Content-Type', /json/)
	.expect(400)
	.then(response => {
		expect(response.body).toEqual({ success: false, errors: { email: 'Email is required' } });
	});

});

test('should return 200 when email does not exist in system', () => {

	app.use('/auth', forgotPassword());
	return request(app)
	.post('/auth/forgot')
	.send({ email: 'test@testing.com' })
	.set('Accept', 'application/json')
	.expect('Content-Type', /json/)
	.expect(200)
	.then(response => {
		expect(response.body).toEqual({ success: true });
	});

});

test('onForgotEmail is called', () => {
	const onForgotEmail = jest.fn();
	app.use('/auth', forgotPassword({ onForgotEmail }));
	return request(app)
	.post('/auth/forgot')
	.send({ email: 'test@test.com' })
	.set('Accept', 'application/json')
	.expect('Content-Type', /json/)
	.expect(200)
	.then(response => {
		expect(response.body).toEqual({ success: true });
		expect(onForgotEmail.mock.calls.length).toBe(1);
		expect(onForgotEmail).toBeCalledWith({ email: 'test@test.com', forgotPasswordKey: GUID, recipientEmail: 'test@test.com' });
	});
});
