//tinyApp
const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
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
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

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

const updateUrls = (shortURL, longURL) => {
  urlDatabase[shortURL] = longURL;
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
  //console.log(req.cookies);
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
  let templateVars = { user: req.cookies["user_id"] };
  //console.log(req.cookies);
  res.render('login', templateVars);
});

app.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user = emailLookup(email);
  if (!user){
    res.status(403).send('Something broke!')
  } else if (user.password !== password){
    res.status(403).send('Something broke!')
  } else {
    res.cookie("user_id", user.id);
    res.redirect('/urls');
  }
});

app.get("/urls", (req, res) => {
  // console.log('1st: ', users.userRandomID);
  // console.log('2nd: ', users['userRandomID']);
  // console.log('3rd: ', users[userRandomID]);
  const idPassedFromCookie = req.cookies["user_id"];
  let templateVars = {
    urls: urlDatabase,
    user: users[idPassedFromCookie]
  };

  res.render("urls_index", templateVars);
});

app.post('/urls/:shortURL/delete', (req, res) => {
  console.log("HELLO WORLD")
  const itemToDelete = req.params.shortURL;
  delete urlDatabase[itemToDelete];
  res.redirect('/urls');
});

app.get("/urls/new", (req, res) => {
  let templateVars = {
    user: req.cookies["user_id"],
  };
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase, user: req.cookies["user_id"]};
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase, user: req.cookies["user_id"] }
  const shortURL = templateVars['shortURL'];
  let longURL = urlDatabase[shortURL];
  res.redirect(longURL);
});

app.post('/urls/:shortURL/edit', (req, res) => {
  const itemToUpdate = req.params.shortURL; 
  const itemURL = req.body.longURL;  
  updateUrls(itemToUpdate, itemURL);
  res.redirect('/urls');
});

app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls/${shortURL}`);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});