//tinyApp
const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const bcrypt = require('bcrypt');
const cookieSession = require('cookie-session');
const { getUserByEmail, urlsForUser, updateUsers, generateRandomString, updateUrls } = require('./helpers');

app.use(cookieSession({
  name: 'session',
  keys: ['key1']
}));

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");

const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
}

const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "aJ48lW" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "aJ48lW" }
};

app.get("/", (req, res) => {
  if (!req.session.user_id) {
    res.redirect('/login');
  } else {
    res.redirect('/urls');
  }
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// logout/ clearing the cookie
app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/urls');
});

app.get('/register', (req, res) => {
  let templateVars = { user: req.session.user_id };
  res.render('register', templateVars);
});

// registration path/ not allowing to proceed if email/password fields are blank or the given email is already registered
app.post('/register', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  if (!email || !password) {
    res.redirect(400, '/register');
  } else if (getUserByEmail(email, users)){
    res.redirect(400, '/register');
  } else {
      const id = updateUsers(email, password, users);
      req.session.user_id = id;
      res.redirect('/urls');
  }
});

app.get('/login', (req, res) => {
  const idPassedFromCookie = req.session.user_id;
  let user = users[idPassedFromCookie];
  let templateVars = { user: req.session.user_id, 'user': user };
  res.render('login', templateVars);
});

// log in path/not allowing to proceed if the account doesnt exist or password is wrong/password comparison using bcrypt hashing method
app.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user = getUserByEmail(email, users);
  if (!user){
    res.status(403).send('There is no account under the given email!')
  } else if (!bcrypt.compareSync(password, user.password)){
    res.status(403).send('Incorrect password!')
  } else {
    req.session.user_id = user.id;
    res.redirect('/urls');
  }
});

// visible list of URLs created by the logged in user
app.get("/urls", (req, res) => {
  const idPassedFromCookie = req.session.user_id;
  let user = users[idPassedFromCookie];
  if (!user) {
    res.redirect("/login");
    return;
  }
  let filteredDb = urlsForUser(user.id, urlDatabase);
  let templateVars = {
    user_id: idPassedFromCookie,
    urls: filteredDb,
    user: user
  };
  res.render("urls_index", templateVars);
});

// removal of an URL by the user that created it
app.post('/urls/:shortURL/delete', (req, res) => {
  let id = req.session.user_id
  let user = users[id]
  if (!user) {
    res.redirect("/login")
    return;
  }
  if (urlDatabase[req.params.shortURL].userID !== id) {
    res.redirect("/login")
    return;
  }
  const itemToDelete = req.params.shortURL;
  delete urlDatabase[itemToDelete];
  res.redirect('/urls');
});

// adding the new URL to the list by the logged in user/ redirecting to /login path if not logged in
app.get("/urls/new", (req, res) => {
  let id = req.session.user_id
  let user = users[id]
  if (!user) {
    res.redirect("/login")
    return;
  }
  let templateVars = {
    'user_id': id,
    'user': user
  }
  res.render("urls_new", templateVars);
  
});

// view of the one URL by the user that created it, the user should be logged in
app.get("/urls/:shortURL", (req, res) => {
  let user = users[req.session.user_id];
  let filteredDb = urlsForUser(req.session.user_id, urlDatabase);
  if (filteredDb[req.params.shortURL]) {
    let templateVars = {'user_id': req.session.user_id, shortURL: req.params.shortURL, longURL: filteredDb[req.params.shortURL], 'user' : user };
    res.render("urls_show", templateVars);
  } else {
    res.status(403).send('Unauthorised access');
  }
});

// directly accessing the shortURL link by anyone results in a redirect to corresponding longURL
app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL.longURL);
});

// editing the URL by the user that created it, the user should be logged in
app.post('/urls/:shortURL/edit', (req, res) => {
  let id = req.session.user_id
  let user = users[id]
  if (!user) {
    res.redirect("/login")
    return;
  }
  if (urlDatabase[req.params.shortURL].userID !== id) {
    res.redirect("/login")
    return;
  }
  const itemToUpdate = req.params.shortURL; 
  const itemURL = req.body.longURL;  
  updateUrls(itemToUpdate, itemURL, urlDatabase);
  res.redirect('/urls');
});

// adding the new URL to the DB by a user
app.post("/urls", (req, res) => {
  const idPassedFromCookie = req.session.user_id;
  let user = users[idPassedFromCookie];
  if (!user) {
    res.redirect("/login")
    return;
  }
  let shortURL = generateRandomString();
  let longURL = req.body;
  urlDatabase[shortURL] = { longURL: longURL["longURL"], userID: user.id };
  res.redirect(`/urls/${shortURL}`);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});