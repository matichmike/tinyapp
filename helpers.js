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

module.exports = { getUserByEmail };