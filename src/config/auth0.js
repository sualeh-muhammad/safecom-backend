// const { ManagementClient } = require('auth0');

// const auth0Management = new ManagementClient({
//   domain: process.env.AUTH0_DOMAIN,
//   clientId: process.env.AUTH0_CLIENT_ID,
//   clientSecret: process.env.AUTH0_CLIENT_SECRET,
//   scope: 'read:users create:users update:users delete:users'
// });

// module.exports = auth0Management;
const { ManagementClient } = require('auth0');

const auth0Management = new ManagementClient({
  domain: process.env.AUTH0_DOMAIN,
  clientId: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  scope: 'read:users create:users update:users delete:users read:user_metadata update:user_metadata'
});

// Test connection on startup using correct method
// auth0Management.users.getAll({ per_page: 1 })
//   .then((users) => console.log(`✅ Auth0 Management API connected - Found ${users} users` , users.data))
//   .catch(err => console.error('❌ Auth0 connection failed:', err.message , err.statusCode));

module.exports = auth0Management;