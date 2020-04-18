const bcrypt = require('bcrypt');

const getUserByEmail = (email, database) => {
  let usersValues = Object.values(database);
  let retUser;
  for (let user of usersValues) {
    if (user.email === email) {
      retUser = user;
      break;
    }
  }
  return retUser;
}

// filtering the URLs list so that it will be visible to the user who created them
function urlsForUser(id, urlsObj) {
  let userUniqueDb = {};
  for (let item in urlsObj) {
    if (urlsObj[item].userID === id) {
      userUniqueDb[item] = urlsObj[item];
    } 
  }
  return userUniqueDb;
}

// updating the users' object and hashing the password
const updateUsers = (email, password, database) => {
  const hashedPassword = bcrypt.hashSync(password, 10);
  const userID = generateRandomString();
  database[userID] = {id: userID, email: email, password: hashedPassword};
  return userID;
}

// random string generator (6 alphanumeric characters)
const generateRandomString = function () {
  return Math.random().toString(36).substr(2,6);
}

// adding a new URL
const updateUrls = (shortURL, longURL, database) => {
  database[shortURL].longURL = longURL;
}

module.exports = { getUserByEmail, urlsForUser, updateUsers, generateRandomString, updateUrls };