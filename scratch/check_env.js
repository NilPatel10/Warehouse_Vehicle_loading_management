import fs from 'fs';
const envFile = fs.readFileSync('.env.local', 'utf-8');
console.log('Lines in .env.local:');
envFile.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts[0]) {
    console.log(parts[0].trim());
  }
});
