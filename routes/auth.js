"use strict";

const User = require("../models/user");
const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");
const { UnauthorizedError } = require("../expressError");

const Router = require("express").Router;
const router = new Router();

/** POST /login: {username, password} => {token} 
 *  If invalid username or password is provided, throws error
 *  with 401 status code. 
 */
router.post('/login', async function (req, res, next) {
  const {username, password} = req.body;

  if (await User.authenticate(username, password) === true) {
    const user = { username };
    const token = jwt.sign(user, SECRET_KEY);
    return res.send({ token });
  }

  throw new UnauthorizedError('Invalid username or password.');
});



/** POST /register: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 */
router.post('/register', async function (req, res, next) {
  const {username, password, first_name, last_name, phone} = req.body;

  const user = await User.register({
    username,
    password,
    first_name,
    last_name,
    phone,
  });
  const token = jwt.sign({ username: user.username }, SECRET_KEY);

  return res.send({ token });
});

module.exports = router;