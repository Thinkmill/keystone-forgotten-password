module.exports = userRequest => (req, res) => {
  return req[userRequest]._id;
};
