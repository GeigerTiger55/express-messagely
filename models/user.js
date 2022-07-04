"use strict";

const { BCRYPT_WORK_FACTOR } = require("../config");
const { BadRequestError, NotFoundError } = require("../expressError");
const bcrypt = require("bcrypt");

/** User of the site. */

class User {

  /** Register new user. Returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({ username, password, first_name, last_name, phone }) {
    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
    
    const result = await db.query(
        `INSERT INTO users (username,
                            password,
                            first_name,
                            last_name,
                            phone)
            VALUES
              ($1, $2, $3, $4, $5)
            RETURNING username, password, first_name, last_name, phone`,
      [ username, hashedPassword, first_name, last_name, phone ]);
    if(result.rows.length === 0){
      throw new BadRequestError('Could not create user');
    }
    return result.rows[0];
  }

  /** Authenticate: is username/password valid? Returns boolean. */

  static async authenticate(username, password) {
    const result = await dbquery(
      `SELECT password
        FROM users
        WHERE username = $1`,
      [username]);
    const user = results.rows[0];

    if(user) {
       return await bcrypt.compare(password, user.password) === true;
    }

    return false;
  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {
    const result = await db.query(
      `UPDATE users
        SET last_login_at = CURRENT_TIMESTAMP
        WHERE username = $1
        RETURNING username, last_login_at`,
      [username]);

    if(result.rows.length === 0){
      throw new NotFoundError('Could not find user');
    }
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name}, ...] */

  static async all() {
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) {
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {
  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {id, first_name, last_name, phone}
   */

  static async messagesTo(username) {
  }
}


module.exports = User;
