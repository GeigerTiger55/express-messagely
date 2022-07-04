"use strict";

const { BCRYPT_WORK_FACTOR } = require("../config");
const { BadRequestError, NotFoundError } = require("../expressError");
const bcrypt = require("bcrypt");
const db = require('../db');

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
                            phone,
                            join_at,
                            last_login_at
                            )
            VALUES
              ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING username, 
                      password, 
                      first_name, 
                      last_name, 
                      phone`,
      [username, hashedPassword, first_name, last_name, phone]);
    if (result.rows.length === 0) {
      throw new BadRequestError('Could not create user');
    }
    return result.rows[0];
  }

  /** Authenticate: is username/password valid? Returns boolean. */

  static async authenticate(username, password) {
    const result = await db.query(
      `SELECT password
        FROM users
        WHERE username = $1`,
      [username]);
    const user = result.rows[0];

    if (user) {
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

    if (result.rows.length === 0) {
      throw new NotFoundError('Could not find user');
    }
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name}, ...] */

  static async all() {
    const result = await db.query(
      `SELECT username, first_name, last_name
        FROM users`
    );

    return result.rows;
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
    const result = await db.query(
      `SELECT 
          username, 
          first_name, 
          last_name, 
          phone, 
          join_at, 
          last_login_at
        FROM users
        WHERE username = $1`,
      [username]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Could not find user');
    }

    return result.rows[0];
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {
    const result = await db.query(
      `SELECT 
          m.id, 
          m.body, 
          m.sent_at, 
          m.read_at,
          m.to_username,
          t.first_name AS to_first_name,
          t.last_name AS to_last_name,
          t.phone AS to_phone
        FROM messages AS m
            JOIN users AS t ON m.to_username = t.username
        WHERE m.from_user = $1
        `,
      [username]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Could not find messages for user');
    }

    const messages = result.rows.map(m => {
      return {
        id: m.id,
        to_user: {
          username: m.to_username,
          first_name: m.to_first_name,
          last_name: m.to_last_name,
          phone: m.to_phone
        },
        body: m.body,
        sent_at: m.sent_at,
        read_at: m.read_at

      }
    });

    return messages;
  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {id, first_name, last_name, phone}
   */

  static async messagesTo(username) {
    const result = await db.query(
      `SELECT 
          m.id, 
          m.body, 
          m.sent_at, 
          m.read_at,
          m.from_username,
          f.first_name AS from_first_name,
          f.last_name AS from_last_name,
          f.phone AS from_phone
        FROM messages AS m
            JOIN users AS f ON m.from_username = f.username
        WHERE m.to_user = $1
        `,
      [username]
    );

    const messages = result.rows.map(m => {
      return {
        id: m.id,
        from_user: {
          username: m.from_username,
          first_name: m.from_first_name,
          last_name: m.from_last_name,
          phone: m.from_phone
        },
        body: m.body,
        sent_at: m.sent_at,
        read_at: m.read_at
      }
    });

    return messages;
  }
}


module.exports = User;
