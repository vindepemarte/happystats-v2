import { config } from 'dotenv';
config({ path: '.env.local' });

console.log('JWT_SECRET:', !!process.env.JWT_SECRET);
console.log('NEXTAUTH_SECRET:', !!process.env.NEXTAUTH_SECRET);
console.log('DATABASE_URL:', !!process.env.DATABASE_URL);