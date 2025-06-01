// test-enums.js
const { PrismaClient } = require('@prisma/client');

async function testEnums() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🧪 Testing enum values...');
    
    // Test creating a company with each status
    const testStatuses = ['TRIAL', 'ACTIVE', 'PENDING_PAYMENT', 'PAST_DUE', 'CANCELLED', 'SUSPENDED'];
    
    for (const status of testStatuses) {
      console.log(`Testing status: ${status}`);
      
      // Just test the enum value, don't actually create
      const query = prisma.company.findMany({
        where: { subscriptionStatus: status },
        take: 1
      });
      
      // This will throw an error if the enum value is invalid
      await query;
      console.log(`✅ ${status} is valid`);
    }
    
    console.log('🎉 All enum values are valid!');
    
  } catch (error) {
    console.error('❌ Enum test failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testEnums();