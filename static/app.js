const BASE_API_URL = "http://localhost:3000"

/** */
async function loadHomePage() {
  console.log('********************homepage route');
  const username = res.locals.user.username;
  console.log('******username', username);
  const receivedMessages = 
    await axios.get(`${BASE_API_URL}/users/${username}/to`,
      { params: {_token: req.query._token}}
    );
  console.log('************receivedMEssages', receivedMessages);
}

loadHomePage();