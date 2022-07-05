"use strict";

const request = require("supertest");
const jwt = require("jsonwebtoken");

const app = require("../app");
const db = require("../db");
const User = require("../models/user");
const Message = require("../models/message");
const { SECRET_KEY } = require("../config");


describe("Users Routes Test", function () {
  let testUserToken; //Should this be outside of describe???

  beforeEach(async function () {
    await db.query("DELETE FROM messages");
    await db.query("DELETE FROM users");

    let u1 = await User.register({
      username: "atest1",
      password: "password",
      first_name: "Test1",
      last_name: "Testy1",
      phone: "+14155550000",
    });

    let u2 = await User.register({
      username: "btest2",
      password: "password",
      first_name: "Test2",
      last_name: "Testy2",
      phone: "+14155552222",
    });

    let m1 = await Message.create({
      from_username: u1.username,
      to_username: u2.username,
      body: "message1",
    });

    let m2 = await Message.create({
      from_username: u2.username,
      to_username: u1.username,
      body: "message2",
    });

    const testUser = { username: u1.username };
    testUserToken = jwt.sign(testUser, SECRET_KEY);

  });

  /** GET /users/ => {users: [{username, first_name, last_name}, ...]}  */
  describe("GET /users/", function () {
    test("get all users", async function () {
      let response = await request(app)
        .get("/users/")
        .query({ _token: testUserToken });
      expect(response.statusCode).toEqual(200);
      expect(response.body.users.length).toEqual(2);
      expect(response.body.users[0]).toEqual({
        username: "atest1",
        first_name: "Test1",
        last_name: "Testy1",
      });
    });

    test("throws UnauthorizedError", async function () {
      let response = await request(app)
        .get("/users/");
      expect(response.statusCode).toEqual(401);
      expect(response.body.users).toEqual(undefined);
    });
  });

  /** GET /:username - get detail of user.
  *
  * => {user: {username, first_name, last_name, phone, join_at, last_login_at}}
  *
  **/
  describe("GET /users/:username", function () {
    test("gets user", async function () {
      let response = await request(app)
        .get("/users/atest1")
        .query({ _token: testUserToken });
      expect(response.statusCode).toEqual(200);
      expect(response.body.user).toEqual({
        username: "atest1",
        first_name: "Test1",
        last_name: "Testy1",
        phone: "+14155550000",
        join_at: expect.any(String),
        last_login_at: expect.any(String),
      });
    });

    test("throws UnauthorizedError without token", async function () {
      let response = await request(app)
        .get("/users/atest1");
      expect(response.statusCode).toEqual(401);
      expect(response.body.user).toEqual(undefined);
    });

    test("throws UnauthorizedError for wrong user", async function () {
      let response = await request(app)
        .get("/users/btest2")
        .query({ _token: testUserToken });
      expect(response.statusCode).toEqual(401);
      expect(response.body.user).toEqual(undefined);
    });
  });

  /** GET /:username/to - get messages to user
  *
  * => {messages: [{id,
  *                 body,
  *                 sent_at,
  *                 read_at,
  *                 from_user: {username, first_name, last_name, phone}}, ...]}
  *
  **/
  describe("GET /users/:username/to", function () {
    test("gets messages to this user", async function () {
      let response = await request(app)
        .get("/users/atest1/to")
        .query({ _token: testUserToken });
      expect(response.statusCode).toEqual(200);
      expect(response.body.messages).toEqual([{
        id: expect.any(Number),
        body: "message2",
        sent_at: expect.any(String),
        read_at: null,
        from_user: {
          username: "btest2",
          first_name: "Test2",
          last_name: "Testy2",
          phone: "+14155552222",
        },
      }]);
    });

    test("throws UnauthorizedError without token", async function () {
      let response = await request(app)
        .get("/users/atest1/to");
      expect(response.statusCode).toEqual(401);
      expect(response.body.messages).toEqual(undefined);
    });

    test("throws UnauthorizedError for wrong user", async function () {
      let response = await request(app)
        .get("/users/btest2/to")
        .query({ _token: testUserToken });
      expect(response.statusCode).toEqual(401);
      expect(response.body.messages).toEqual(undefined);
    });
  });

  /** GET /:username/from - get messages from user
  *
  * => {messages: [{id,
  *                 body,
  *                 sent_at,
  *                 read_at,
  *                 to_user: {username, first_name, last_name, phone}}, ...]}
  *
  **/
  describe("GET /users/:username/from", function () {
    test("gets messages from this user", async function () {
      let response = await request(app)
        .get("/users/atest1/from")
        .query({ _token: testUserToken });
      expect(response.statusCode).toEqual(200);
      expect(response.body.messages).toEqual([{
        id: expect.any(Number),
        body: "message1",
        sent_at: expect.any(String),
        read_at: null,
        to_user: {
          username: "btest2",
          first_name: "Test2",
          last_name: "Testy2",
          phone: "+14155552222",
        },
      }]);
    });

    test("throws UnauthorizedError without token", async function () {
      let response = await request(app)
        .get("/users/atest1/from");
      expect(response.statusCode).toEqual(401);
      expect(response.body.messages).toEqual(undefined);
    });

    test("throws UnauthorizedError for wrong user", async function () {
      let response = await request(app)
        .get("/users/btest2/from")
        .query({ _token: testUserToken });
      expect(response.statusCode).toEqual(401);
      expect(response.body.messages).toEqual(undefined);
    });
  });
});

afterAll(async function () {
  await db.end();
});
