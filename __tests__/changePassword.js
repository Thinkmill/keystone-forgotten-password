const express = require("express");
const request = require("supertest");
const bodyParser = require("body-parser");
const tk = require("timekeeper");
const { GUID, TIME_STAMP } = require("../constants");

jest.setMock("keystone", require("../keystone-mock"));
jest.setMock("uuid/v4", () => GUID);

const time = new Date(TIME_STAMP);
tk.freeze(time);
tk.travel(time);

const forgotPassword = require("../");

let app;

beforeEach(() => {
  app = express();
  app.use(bodyParser.json());
});

test("should handle change-password, 200 response", () => {
  app.use("/auth", forgotPassword());
  return request(app)
    .post("/auth/change-password")
    .send({ password: "Testing123", forgotPasswordKey: GUID })
    .set("Accept", "application/json")
    .expect("Content-Type", /json/)
    .expect(200)
    .then(response => {
      expect(response.body).toEqual({ success: true });
    });
});

test("should handle expired change-password request", () => {
  app.use("/auth", forgotPassword({ keyExpiry: -1 })); // ensure it fails
  return request(app)
    .post("/auth/change-password")
    .send({ password: "Testing123", forgotPasswordKey: GUID })
    .set("Accept", "application/json")
    .expect("Content-Type", /json/)
    .expect(400)
    .then(response => {
      expect(response.body).toEqual({
        success: false,
        errors: { general: "Request to reset password has expired" }
      });
    });
});

test("should handle invalid password", () => {
  app.use("/auth", forgotPassword()); // esnure it fails
  return request(app)
    .post("/auth/change-password")
    .send({ password: "", forgotPasswordKey: GUID })
    .set("Accept", "application/json")
    .expect("Content-Type", /json/)
    .expect(400)
    .then(response => {
      expect(response.body).toEqual({
        success: false,
        errors: { password: "Password is required" }
      });
    });
});

test("should handle short password", () => {
  app.use("/auth", forgotPassword()); // esnure it fails
  return request(app)
    .post("/auth/change-password")
    .send({ password: "a", forgotPasswordKey: GUID })
    .set("Accept", "application/json")
    .expect("Content-Type", /json/)
    .expect(400)
    .then(response => {
      expect(response.body).toMatchSnapshot();
    });
});

test("should call onChangePasswordEmail handler", () => {
  const onChangePasswordEmail = jest.fn();
  app.use("/auth", forgotPassword({ onChangePasswordEmail }));
  return request(app)
    .post("/auth/change-password")
    .send({ password: "Testing123", forgotPasswordKey: GUID })
    .set("Accept", "application/json")
    .expect("Content-Type", /json/)
    .expect(200)
    .then(response => {
      expect(response.body).toEqual({ success: true });
      expect(onChangePasswordEmail.mock.calls.length).toBe(1);
      expect(onChangePasswordEmail).toBeCalledWith({
        email: "test@test.com",
        id: "1234",
        passwordLastUpdated: TIME_STAMP,
        recipientEmail: "test@test.com"
      });
    });
});
