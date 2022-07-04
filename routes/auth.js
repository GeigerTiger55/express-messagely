"use strict";

const Router = require("express").Router;
const router = new Router();

/** POST /login: {username, password} => {token} 
 * 
 * Get PW using username
 * verify password with bcrypt
 * store in res.locals._token
*/



/** POST /register: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 */

module.exports = router;