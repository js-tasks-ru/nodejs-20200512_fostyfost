const User = require('../models/User');
const connection = require('../libs/connection');
const users = require('../../../__data/users');

(async () => {
  await User.deleteMany();

  for (const user of users.users) {
    const u = new User(user);
    await u.setPassword(user.password);
    await u.save();
  }
  
  connection.close();
  console.log(`All done, ${users.users.length} users have been saved in DB`);
})();
