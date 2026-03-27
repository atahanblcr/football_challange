// prisma/seed.ts
import { PrismaClient, AdminRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial admin user...');

  const email = 'admin@footballchallenge.app';
  const password = 'admin_password_123'; // In production, use a strong password and secret management
  const hashedPassword = await bcrypt.hash(password, 10);

  const admin = await prisma.adminUser.upsert({
    where: { email },
    update: {},
    create: {
      email,
      passwordHash: hashedPassword,
      role: AdminRole.super_admin,
      isActive: true,
    },
  });

  console.log('Admin user created:', admin.email);
  
  // Seed AppConfig
  const config = await prisma.appConfig.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      minimum_version: '1.0.0',
      latest_version: '1.0.0',
      force_update: false,
    },
  });
  
  console.log('App config initialized');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
