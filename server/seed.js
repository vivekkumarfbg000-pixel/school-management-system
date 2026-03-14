const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // Create default school
  const school = await prisma.school.create({
    data: {
      name: 'Vidya Bhawan Public School',
      address: '123 Main St, Patna, Bihar',
      phone: '+91 9876543210',
      affiliationNo: 'CBSE/12345/2026',
    },
  });
  console.log(`Created school with id: ${school.id}`);

  // Create default Academic Session
  const session = await prisma.academicSession.create({
    data: {
      name: '2025-26',
      startDate: new Date('2025-04-01'),
      endDate: new Date('2026-03-31'),
      isActive: true,
      schoolId: school.id,
    },
  });
  console.log(`Created session: ${session.name}`);

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      name: 'System Admin',
      role: 'ADMIN',
      schoolId: school.id,
    },
  });
  console.log(`Created admin user: ${admin.username}`);

  // Create sample student
  const student = await prisma.student.create({
    data: {
      admissionNo: 'ADM001',
      name: 'Rahul Kumar',
      fatherName: 'Sanjay Kumar',
      motherName: 'Sunita Devi',
      className: '10',
      section: 'A',
      dob: new Date('2010-05-15'),
      gender: 'Male',
      category: 'General',
      phone: '9876543211',
      address: 'Plot 4, Kankarbagh, Patna',
      schoolId: school.id,
    }
  });
  console.log(`Created sample student: ${student.name}`);

  console.log('Seeding finished.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
