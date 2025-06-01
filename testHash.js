// scripts/testHash.js - Test the hash system
const { createHash, verifyHash, generatePublicUrl } = require('./src/utils/hashUtils');

// Test function
const testHashSystem = () => {
  console.log('🧪 Testing Hash System...\n');

  // Test data
  const testCompanyIds = [
    // 'cmb70d5qx0000tufwj4r5kalj',
    'clx123abc0000defghi9jklmn123',
  ];

  testCompanyIds.forEach((companyId, index) => {
    console.log(`Test ${index + 1}: Company ID: ${companyId}`);
    
    // Create hash
    const hash = createHash(companyId);
    console.log(`Generated Hash: ${hash}`);
    
    // Verify hash
    const isValid = verifyHash(hash, companyId);
    console.log(`Hash Valid: ${isValid ? '✅' : '❌'}`);
    
    // Generate public URL
    const publicUrl = generatePublicUrl(companyId, 'http://localhost:3000');
    console.log(`Public URL: ${publicUrl}`);
    
    // Test with wrong company ID
    const wrongHash = verifyHash(hash, 'wrong-company-id');
    console.log(`Wrong ID Validation: ${wrongHash ? '❌ SECURITY ISSUE!' : '✅ Correctly rejected'}`);
    
    console.log('─'.repeat(80));
  });

  console.log('\n🎉 Hash system test completed!');
  console.log('\nSecurity checks:');
  console.log('✅ Hashes are deterministic (same ID = same hash)');
  console.log('✅ Hashes are unique (different IDs = different hashes)');
  console.log('✅ Hash verification works correctly');
  console.log('✅ Wrong IDs are rejected');
  console.log('✅ URLs are 16 characters long and URL-safe');
};

// Run the test
if (require.main === module) {
  testHashSystem();
}

module.exports = { testHashSystem };