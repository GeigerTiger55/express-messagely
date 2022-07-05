"use strict";

const Router = require("express").Router;
const router = new Router();

const Message = require("../models/message");
const { ensureLoggedIn, ensureCorrectUser } = require("../middleware/auth");
const { UnauthorizedError } = require("../expressError");

/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Makes sure that the currently-logged-in user is either the to or from user.
 *
 **/
router.get('/:id', ensureLoggedIn, async function (req, res) {
  const message = await Message.get(req.params.id);

  //Verify currently-logged-in user is either the to or from user.
  const from_user = message.from_user.username;
  const to_user = message.to_user.username;
  if (res.locals.user.username !== from_user
    && res.locals.user.username !== to_user) {
    throw new UnauthorizedError();
  }

  return res.json({ message });

});


/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/
router.post('/', ensureLoggedIn, async function (req, res) {
  const to_username = req.body.to_username;
  const body = req.body.body;
  const from_username = res.locals.user.username;

  const message = await Message.create({ from_username, to_username, body });
  return res.json({ message });
});


/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Makes sure that the only the intended recipient can mark as read.
 *
 **/
router.post('/:id/read', ensureLoggedIn, async function (req, res) {
  const messageId = req.params.id;
  const message = await Message.get(messageId);

  //Verify currently-logged-in user is the to user.
  const to_user = message.to_user.username;
  if (res.locals.user.username !== to_user) {
    throw new UnauthorizedError();
  }

  const updatedMessage = await Message.markRead(messageId);

  return res.json({ message: updatedMessage });

});

module.exports = router;