const keystone = require("keystone");
const uuid = require("uuid/v4");
const Types = keystone.Field.Types;

var ForgotPassword = new keystone.List("ForgotPassword");

ForgotPassword.add({
  dateRequested: { type: Date, required: true, default: () => Date.now() },
  key: { type: String, required: true, default: () => uuid() },
  user: { type: Types.Relationship, ref: "User" },
  requestedByIp: { type: Types.TextArray },
  dateAccessed: { type: Date },
  accessedByIp: { type: Types.TextArray },
  expired: { type: Boolean, required: true, default: false }
});

ForgotPassword.register();
