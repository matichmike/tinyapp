//tinyApp
const express = require("express");
const app = express();
const PORT = 8080;
const cookieParser = require('cookie-parser')
const bodyParser = require("body-parser");

app.use(cookieParser())
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

const updateUrls = (shortURL, longURL) => {
  urlDatabase[shortURL].longURL = longURL;
}

const generateRandomString = function () {
  return Math.random().toString(36).substr(2,6);
}

const updateUsers = (email, password) => {
  const userID = generateRandomString();
  users[userID] = {id: userID, email: email, password: password};
  return userID;
}

const emailLookup = (email) => {
  let usersValues = Object.values(users);
  for (let user of usersValues) {
    if (user.email === email) {
      return user;
    }
  }
  return false;
}

function urlsForUser(id, urlsObj) {
  let userUniqueDb = {};
  for (let item in urlsObj) {
    if (urlsObj[item].userID === id) {
      userUniqueDb[item] = urlsObj[item];
    } 
  }
  return userUniqueDb;
}

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.post('/logout', (req, res) => {
  res.clearCookie('user_id')
  res.redirect('/urls');
});

app.get('/register', (req, res) => {
  let templateVars = { user: req.cookies["user_id"] };
  res.render('register', templateVars);
});

app.post('/register', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  if (!email || !password) {
    res.redirect(400, '/register');
  } else if (emailLookup(email)){
    res.redirect(400, '/register');
  } else {
      const id = updateUsers(email, password);
      res.cookie("user_id", id);
      res.redirect('/urls');
  }
});

app.get('/login', (req, res) => {
  const idPassedFromCookie = req.cookies["user_id"];
  let user = users[idPassedFromCookie];
  let templateVars = { user: req.cookies["user_id"], 'user': user };
  res.render('login', templateVars);
});

app.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user = emailLookup(email);
  if (!user){
    res.status(403).send('There is no account under the given email!')
  } else if (user.password !== password){
    res.status(403).send('Incorrect password!')
  } else {
    res.cookie("user_id", user.id);
    res.redirect('/urls');
  }
});

app.get("/urls", (req, res) => {
  const idPassedFromCookie = req.cookies["user_id"];
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

app.post('/urls/:shortURL/delete', (req, res) => {
  let id = req.cookies["user_id"]
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

app.get("/urls/new", (req, res) => {
  let id = req.cookies["user_id"]
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

app.get("/urls/:shortURL", (req, res) => {
  let user = users[req.cookies["user_id"]];

  let filteredDb = urlsForUser(user.id, urlDatabase);
  if (filteredDb[req.params.shortURL]) {
    let templateVars = {'user_id': req.cookies["user_id"], shortURL: req.params.shortURL, longURL: filteredDb[req.params.shortURL], 'user' : user };
    res.render("urls_show", templateVars);
  } else {
    res.status(403).send('Incorrect password!');
  }
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL.longURL);
});

app.post('/urls/:shortURL/edit', (req, res) => {
  let id = req.cookies["user_id"]
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
  updateUrls(itemToUpdate, itemURL);
  res.redirect('/urls');
});

app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  let longURL = req.body;
  const idPassedFromCookie = req.cookies["user_id"];
  let user = users[idPassedFromCookie];
  urlDatabase[shortURL] = { longURL: longURL["longURL"], userID: user.id };
  res.redirect(`/urls/${shortURL}`);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});