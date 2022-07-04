"use strict";

/** Common config for message.ly */

// read .env files and make environmental variables

require("dotenv").config();

const DB_URI = (process.env.NODE_ENV === "test")
    ? "postgresql://jasano:foofoo@localhost/messagely_test"
  : "postgresql://jasano:foofoo@localhost/messagely";

// const DB_URI = (process.env.NODE_ENV === "test")
//   ? "postgresql://egeiger:foofoo@localhost/messagely_test"
//   : "postgresql://egeiger:foofoo@localhost/messagely";

const SECRET_KEY = process.env.SECRET_KEY || "secret";

const BCRYPT_WORK_FACTOR = 12;


module.exports = {
  DB_URI,
  SECRET_KEY,
  BCRYPT_WORK_FACTOR,
};