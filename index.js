// // const app = require('./app');
// // const { PrismaClient } = require('@prisma/client');

// // const prisma = new PrismaClient();
// // const PORT = process.env.PORT || 8000;

// // // Test database connection
// // async function connectDB() {
// //   try {
// //     await prisma.$connect();
// //     console.log('✅ Database connected successfully');

// //      const result = await prisma.$queryRaw`SELECT version()`;
// //     console.log('📊 PostgreSQL version:', result[0].version);
// //   } catch (error) {
// //     console.error('❌ Database connection failed:', error);
// //     process.exit(1);
// //   }
// // }

// // // Start server
// // async function startServer() {
// //   await connectDB();
  
// //   app.listen(PORT, () => {
// //     console.log(`🚀 Server running on port ${PORT}`);
// //     console.log(`📱 Environment: ${process.env.NODE_ENV}`);
// //     console.log(`🔗 API URL: http://localhost:${PORT}`);
// //   });
// // }

// // // Handle graceful shutdown
// // process.on('SIGINT', async () => {
// //   console.log('\n🛑 Shutting down server...');
// //   await prisma.$disconnect();
// //   process.exit(0);
// // });

// // startServer();

// const app = require('./app');
// const { PrismaClient } = require('@prisma/client');

// const prisma = new PrismaClient();
// const PORT = process.env.PORT || 8000;

// // Test database connection with retry logic
// async function connectDB() {
//   const maxRetries = 25;
//   const retryDelay = 8000; // 5 seconds between retries

//   for (let attempt = 1; attempt <= maxRetries; attempt++) {
//     try {
//       console.log(`🔄 Database connection attempt ${attempt}/${maxRetries}`);
      
//       await prisma.$connect();
//       console.log('✅ Database connected successfully');

//       const result = await prisma.$queryRaw`SELECT version()`;
//       console.log('📊 PostgreSQL version:', result[0].version);
      
//       // Test if we can actually query the database
//       await prisma.$queryRaw`SELECT 1 as test`;
//       console.log('🎯 Database is ready for queries');
      
//       return; // Success - exit the retry loop
      
//     } catch (error) {
//       console.error(`❌ Database connection failed (attempt ${attempt}/${maxRetries}):`, error.message);
      
//       if (attempt === maxRetries) {
//         console.error('💀 Max database connection retries reached. Exiting...');
//         console.error('🔍 Check your DATABASE_URL and ensure PostgreSQL service is running');
//         process.exit(1);
//       }
      
//       console.log(`⏳ Waiting ${retryDelay/1000} seconds before retry...`);
//       await new Promise(resolve => setTimeout(resolve, retryDelay));
//     }
//   }
// }

// // Start server
// async function startServer() {
//   console.log('🚀 Starting SafeCom Backend...');
//   console.log(`📱 Environment: ${process.env.NODE_ENV}`);
//   console.log(`🔗 Database URL: ${process.env.DATABASE_URL ? 'Set' : 'NOT SET'}`);
  
//   await connectDB();
  
//   app.listen(PORT, '0.0.0.0', () => {
//     console.log(`🚀 Server running on port ${PORT}`);
//     console.log(`📱 Environment: ${process.env.NODE_ENV}`);
//     console.log(`🔗 API URL: http://localhost:${PORT}`);
//     console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`);
//   });
// }

// // Handle graceful shutdown
// process.on('SIGINT', async () => {
//   console.log('\n🛑 Shutting down server...');
//   await prisma.$disconnect();
//   process.exit(0);
// });

// process.on('SIGTERM', async () => {
//   console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
//   await prisma.$disconnect();
//   process.exit(0);
// });

// // Handle uncaught exceptions
// process.on('uncaughtException', (error) => {
//   console.error('💥 Uncaught Exception:', error);
//   process.exit(1);
// });

// process.on('unhandledRejection', (reason, promise) => {
//   console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
//   process.exit(1);
// });

// startServer();



const app = require('./app');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const PORT = process.env.PORT || 8000;

// Start server WITHOUT database connection
async function startServer() {
  console.log('🚀 Starting SafeCom Backend...');
  console.log(`📱 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Database URL: ${process.env.DATABASE_URL ? 'Set' : 'NOT SET'}`);
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📱 Environment: ${process.env.NODE_ENV}`);
    console.log(`🔗 API URL: http://localhost:${PORT}`);
    console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`);
  });
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

startServer();