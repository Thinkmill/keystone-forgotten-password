const express = require("express");
const request = require("supertest");
const bodyParser = require("body-parser");
const tk = require("timekeeper");
const { TIME_STAMP } = require("../constants");

jest.setMock("keystone", require("../keystone-mock"));

const time = new Date(TIME_STAMP);
tk.freeze(time);
tk.travel(time);

const { updatePassword } = require("../");
function auth(user, userRequest = "user") {
  return function(req, res, next) {
    if (user) {
      req[userRequest] = user;
      return next();
    }
    return res.sendStatus(401);
  };
}

function customAuth(user) {
  return function(req, res, next) {
    if (user) {
      res.tokenUser = user;
      return next();
    }
    return res.sendStatus(401);
  };
}

let app;

beforeEach(() => {
  app = express();
  app.use(bodyParser.json());
});

test("change password password 400 on no existing password", () => {
  app.use(auth(true), updatePassword());
  return request(app)
    .post("/update-password")
    .send({ password: "Testing123", existingPassword: "" })
    .set("Accept", "application/json")
    .expect("Content-Type", /json/)
    .expect(400)
    .then(response => {
      expect(response.body).toEqual({
        success: false,
        errors: { existingPassword: "Please enter an existing password" }
      });
    });
});

test("Password required", () => {
  app.use(auth(true), updatePassword());
  return request(app)
    .post("/update-password")
    .send({ password: "", existingPassword: "test1223" })
    .set("Accept", "application/json")
    .expect("Content-Type", /json/)
    .expect(400)
    .then(response => {
      expect(response.body).toEqual({
        success: false,
        errors: { password: "Please enter a new password" }
      });
    });
});

test("New password validation error ", () => {
  app.use(auth(true), updatePassword());
  return request(app)
    .post("/update-password")
    .send({ password: "test12", existingPassword: "test1223" })
    .set("Accept", "application/json")
    .expect("Content-Type", /json/)
    .expect(400)
    .then(response => {
      expect(response.body).toEqual({
        success: false,
        errors: { password: "use at least one upper case character" }
      });
    });
});

test("change password password failing to confirm existing password", () => {
  app.use(
    auth({
      _id: "1",
      password: "$2a$10$ju.NVefBklL87naLbHAsTO/DCx3mKfTV1c03EdkxaSCWt00EV/yki" // test1224
    }),
    updatePassword()
  );
  return request(app)
    .post("/update-password")
    .send({ password: "Testing123", existingPassword: "test1223" })
    .set("Accept", "application/json")
    .expect("Content-Type", /json/)
    .expect(400)
    .then(response => {
      expect(response.body).toEqual({
        success: false,
        errors: { existingPassword: "Please enter an existing password" }
      });
    });
});

test("Updates password", () => {
  app.use(
    auth({
      _id: "1",
      password: "$2a$10$ju.NVefBklL87naLbHAsTO/DCx3mKfTV1c03EdkxaSCWt00EV/yki"
    }),
    updatePassword()
  );
  return request(app)
    .post("/update-password")
    .send({ password: "Testing123", existingPassword: "test1224" })
    .set("Accept", "application/json")
    .expect("Content-Type", /json/)
    .expect(200)
    .then(response => {
      expect(response.body).toEqual({ success: true });
    });
});

test("handles custom userRequest property", () => {
  app.use(
    auth(
      {
        _id: "1",
        password: "$2a$10$ju.NVefBklL87naLbHAsTO/DCx3mKfTV1c03EdkxaSCWt00EV/yki"
      },
      "appuser"
    ),
    updatePassword({
      userRequest: "appuser"
    })
  );
  return request(app)
    .post("/update-password")
    .send({ password: "Testing123", existingPassword: "test1224" })
    .set("Accept", "application/json")
    .expect("Content-Type", /json/)
    .expect(200)
    .then(response => {
      expect(response.body).toEqual({ success: true });
    });
});

test("handles onChangePasswordEmail handler", () => {
  const onChangePasswordEmail = jest.fn();

  app.use(
    auth(
      {
        _id: "1",
        password: "$2a$10$ju.NVefBklL87naLbHAsTO/DCx3mKfTV1c03EdkxaSCWt00EV/yki"
      },
      "appuser"
    ),
    updatePassword({
      userRequest: "appuser",
      onChangePasswordEmail
    })
  );
  return request(app)
    .post("/update-password")
    .send({ password: "Testing123", existingPassword: "test1224" })
    .set("Accept", "application/json")
    .expect("Content-Type", /json/)
    .expect(200)
    .then(response => {
      expect(response.body).toEqual({ success: true });
      expect(onChangePasswordEmail.mock.calls.length).toBe(1);
      expect(onChangePasswordEmail).toBeCalledWith({
        email: "test@test.com",
        _id: "1",
        id: "1",
        passwordLastUpdated: TIME_STAMP,
        recipientEmail: "test@test.com"
      });
    });
});

test("handles onChangePasswordEmail handler with custom resolveUserId function", () => {
  const onChangePasswordEmail = jest.fn();

  app.use(
    customAuth({
      id: "1",
      password: "$2a$10$ju.NVefBklL87naLbHAsTO/DCx3mKfTV1c03EdkxaSCWt00EV/yki"
    }),
    updatePassword({
      resolveUserId: (req, res) => res.tokenUser.id,
      onChangePasswordEmail
    })
  );
  return request(app)
    .post("/update-password")
    .send({ password: "Testing123", existingPassword: "test1224" })
    .set("Accept", "application/json")
    .expect("Content-Type", /json/)
    .expect(200)
    .then(response => {
      expect(response.body).toEqual({ success: true });
      expect(onChangePasswordEmail.mock.calls.length).toBe(1);
      expect(onChangePasswordEmail).toBeCalledWith({
        email: "test@test.com",
        _id: "1",
        id: "1",
        passwordLastUpdated: TIME_STAMP,
        recipientEmail: "test@test.com"
      });
    });
});
