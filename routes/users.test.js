"use strict";

const request = require("supertest");
const jwt = require("jsonwebtoken");

const app = require("../app");
const db = require("../db");
const User = require("../models/user");
const Message = require("../models/message");
const { SECRET_KEY } = require("../config");


describe("Auth Routes Test", function () {
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
      to_username:u2.username, 
      body: "this message has a body",
    });

    const testUser = { username: u1.username };
    testUserToken = jwt.sign(testUser, SECRET_KEY);

  });

  /** GET /users/ => {users: [{username, first_name, last_name}, ...]}  */

  describe("GET /users/", function () {
    test("get all users", async function () {
      let response = await request(app)
        .get("/users/")
        .query({_token: testUserToken});
      //console.log('*********response.text', response);
      expect(response.statusCode).toEqual(200);
      expect(response.body.users.length).toEqual(2);
      expect(response.body.users[0]).toEqual({
        username: "atest1",
        first_name: "Test1",
        last_name: "Testy1",
      });
    });
  });

  // /** POST /auth/login => token  */

  // describe("POST /auth/login", function () {
  //   test("can login", async function () {
  //     let response = await request(app)
  //       .post("/auth/login")
  //       .send({ username: "test1", password: "password" });

  //     let token = response.body.token;
  //     expect(jwt.decode(token)).toEqual({
  //       username: "test1",
  //       iat: expect.any(Number)
  //     });
  //   });

  //   test("won't login w/wrong password", async function () {
  //     let response = await request(app)
  //       .post("/auth/login")
  //       .send({ username: "test1", password: "WRONG" });
  //     expect(response.statusCode).toEqual(401);
  //   });

  //   test("won't login w/wrong password", async function () {
  //     let response = await request(app)
  //       .post("/auth/login")
  //       .send({ username: "not-user", password: "password" });
  //     expect(response.statusCode).toEqual(401);
  //   });
  // });
});

afterAll(async function () {
  await db.end();
});
