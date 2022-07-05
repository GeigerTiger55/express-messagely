"use strict";

const request = require("supertest");
const jwt = require("jsonwebtoken");

const app = require("../app");
const db = require("../db");
const User = require("../models/user");
const Message = require("../models/message");
const { SECRET_KEY } = require("../config");


describe("Messages Routes Test", function () {
    let testUserToken; //Should this be outside of describe???
    let m1Id;
    let m2Id;

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

        m1Id = m1.id;
        m2Id = m2.id;
        const testUser = { username: u1.username };
        testUserToken = jwt.sign(testUser, SECRET_KEY);

    });

    /** GET /messages/:id - get detail of message.
    *
    * => {message: {id,
    *               body,
    *               sent_at,
    *               read_at,
    *               from_user: {username, first_name, last_name, phone},
    *               to_user: {username, first_name, last_name, phone}}
    **/
    describe("GET /messages/:id", function () {
        test("gets a message", async function () {
            let response = await request(app)
                .get(`/messages/${m1Id}`)
                .query({ _token: testUserToken });
            expect(response.statusCode).toEqual(200);
            expect(response.body.message).toEqual({
                id: m1Id,
                body: "message1",
                sent_at: expect.any(String),
                read_at: null,
                from_user: expect.any(Object),
                to_user: expect.any(Object),
            });
            expect(response.body.message.from_user).toEqual({
                username: "atest1",
                first_name: "Test1",
                last_name: "Testy1",
                phone: "+14155550000",
            });
            expect(response.body.message.to_user).toEqual({
                username: "btest2",
                first_name: "Test2",
                last_name: "Testy2",
                phone: "+14155552222",
            });
        });

        test("throws UnauthorizedError without token", async function () {
            let response = await request(app)
                .get(`/messages/${m1Id}`);
            expect(response.statusCode).toEqual(401);
            expect(response.body.message).toEqual(undefined);
        });

        test("throws UnauthorizedError with bad token", async function () {
            let response = await request(app)
                .get(`/messages/${m1Id}`)
                .query({_token:'badtoken'});
            expect(response.statusCode).toEqual(401);
            expect(response.body.message).toEqual(undefined);
        });
    });

    /** POST / - post message.
    *
    * {to_username, body} =>
    *   {message: {id, from_username, to_username, body, sent_at}}
    **/
    describe("POST /messages/", function () {
        test("posts a message", async function () {
            let response = await request(app)
                .post(`/messages/`)
                .send({ 
                    _token: testUserToken,
                    to_username: "btest2",
                    body: "testmessage3" 
                 });
            expect(response.statusCode).toEqual(200);
            expect(response.body.message).toEqual({
                id: expect.any(Number),
                from_username: "atest1",
                to_username: "btest2",
                body: "testmessage3",
                sent_at: expect.any(String),
            });
        });

        test("throws UnauthorizedError without token", async function () {
            let response = await request(app)
                .post(`/messages/`)
                .send({
                    to_username: "btest2",
                    body: "testmessage3"
                });
            expect(response.statusCode).toEqual(401);
            expect(response.body.message).toEqual(undefined);
        });

        test("throws UnauthorizedError with bad token", async function () {
            let response = await request(app)
                .post(`/messages/`)
                .send({
                    _token: 'badtoken',
                    to_username: "btest2",
                    body: "testmessage3"
                });
            expect(response.statusCode).toEqual(401);
            expect(response.body.message).toEqual(undefined);
        });
    });

    /** POST/:id/read - mark message as read:
    *
    *  => {message: {id, read_at}}
    **/
    describe("POST /messages/:id/read", function () {
        test("marks a message as read", async function () {
            let response = await request(app)
                .post(`/messages/${m2Id}/read`)
                .send({
                    _token: testUserToken
                });
            expect(response.statusCode).toEqual(200);
            expect(response.body.message).toEqual({
                id: m2Id,
                read_at: expect.any(String)
            });
        });

        test("throws UnauthorizedError without token", async function () {
            let response = await request(app)
                .post(`/messages/${m2Id}/read`);
            expect(response.statusCode).toEqual(401);
            expect(response.body.message).toEqual(undefined);
        });

        test("throws UnauthorizedError with bad token", async function () {
            let response = await request(app)
                .post(`/messages/${m2Id}/read`)
                .send({
                    _token: 'badtoken'
                });
            expect(response.statusCode).toEqual(401);
            expect(response.body.message).toEqual(undefined);
        });
    });
});

afterAll(async function () {
    await db.end();
});