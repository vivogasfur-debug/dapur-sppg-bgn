const bcrypt = require('bcryptjs');

const hash = '$2b$10$.2fYdyUmWmbpBzxKfSCaYOo.ZzioqT6XARWzrX4BfPZqmSdMTnhYK';
const password = 'password123';

bcrypt.compare(password, hash).then(result => {
  console.log('Password match:', result);
});
