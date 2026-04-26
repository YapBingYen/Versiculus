const webpush = require('web-push');
const fs = require('fs');
const path = require('path');

const vapidKeys = webpush.generateVAPIDKeys();

console.log('PUBLIC_VAPID_KEY=' + vapidKeys.publicKey);
console.log('PRIVATE_VAPID_KEY=' + vapidKeys.privateKey);

const envPath = path.join(__dirname, '.env');
const envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';

let newEnvContent = envContent;
if (!envContent.includes('PUBLIC_VAPID_KEY')) {
  newEnvContent += `\nPUBLIC_VAPID_KEY=${vapidKeys.publicKey}\nPRIVATE_VAPID_KEY=${vapidKeys.privateKey}\n`;
  fs.writeFileSync(envPath, newEnvContent);
  console.log('.env updated with VAPID keys.');
} else {
  console.log('.env already has VAPID keys.');
}
