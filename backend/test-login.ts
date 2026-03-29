
import { adminAdminsService } from './src/modules/admin/admins/admin-admins.service';
import { prisma } from './src/config/database';

async function test() {
  try {
    console.log('Testing admin login...');
    const result = await adminAdminsService.login('admin@footballchallenge.app', 'admin_password_123');
    console.log('Login successful:', result);
  } catch (error) {
    console.error('Login failed with error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

test();
