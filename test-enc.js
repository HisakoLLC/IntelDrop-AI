import crypto from 'crypto';

function testEncryption(keyString, text) {
  try {
    console.log(`Testing key: "${keyString}" (length: ${keyString.length})`);
    
    // Attempt 1: utf8 (what I have in code)
    const keyUtf8 = Buffer.from(keyString, 'utf8');
    console.log(`- Buffer length (utf8): ${keyUtf8.length}`);
    
    try {
      const iv = crypto.randomBytes(12);
      const cipher = crypto.createCipheriv('aes-256-gcm', keyUtf8, iv);
      console.log('[+] Success with utf8 as 32-byte buffer');
    } catch (e) {
      console.log(`[!] Failed with utf8: ${e.message}`);
    }

    // Attempt 2: base64
    try {
      const keyB64 = Buffer.from(keyString, 'base64');
      console.log(`- Buffer length (base64): ${keyB64.length}`);
      if (keyB64.length === 32) {
        const iv = crypto.randomBytes(12);
        const cipher = crypto.createCipheriv('aes-256-gcm', keyB64, iv);
        console.log('[+] Success with base64 decoding to 32-byte buffer');
      }
    } catch (e) {
      console.log(`[!] Failed with base64: ${e.message}`);
    }

  } catch (err) {
    console.log(`[!] Global error: ${err.message}`);
  }
}

console.log('--- TEST CASE 1: 32 char string ---');
testEncryption('12345678901234567890123456789012', 'hello');

console.log('\n--- TEST CASE 2: 44 char B64 (32-byte) ---');
testEncryption('YTM0NTY3ODkwMTIzNDU2Nzg5MDEyMzQ1Njc4OTAxMjM=', 'hello');
