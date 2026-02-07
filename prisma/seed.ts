import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // 1. Users
  const users = [
    { id: 'cml93vukn00003dzfljl7cg0z', name: 'Admin User', email: 'admin@hostmyservice.com', password: '$2b$10$CiIQpvF8UGI8DzLO8jm6DOZLinxKyDTdtl/GoIUpf7BaKLpJAO5hC', image: null, phoneNumber: null, address: null, city: null, state: null, postalCode: null, country: null, role: 'ADMIN', resetToken: null, resetTokenExpiry: null, createdAt: new Date('2026-02-05T06:59:19.559Z'), updatedAt: new Date('2026-02-07T04:53:51.479Z'), deletedAt: null },
    { id: 'cml927jfq0000l7ghzkfj9vcm', name: 'priyansh', email: 'kakkadpriyansh@gmail.com', password: '$2b$10$nQvXdwJ1ZxNBpud18C6yv./XJhYyiy6G9sqI5IdIM9X11K/bPLqYm', image: null, phoneNumber: null, address: null, city: null, state: null, postalCode: null, country: null, role: 'USER', resetToken: '0cdfa7cf-16ea-4dde-99cd-c0226bd8fabe', resetTokenExpiry: new Date('2026-02-07T06:05:44.136Z'), createdAt: new Date('2026-02-05T06:12:25.767Z'), updatedAt: new Date('2026-02-07T05:05:44.137Z'), deletedAt: null },
    { id: 'cmlbuvl1h000048kreuc55y6a', name: 'Admin User', email: 'admin@hostmyservice.in', password: '$2b$10$cFCa/hE2FtE0t4Ymehb1..0bIZP2c8M7X1PEqnUcbN6t91Yr50fYm', image: null, phoneNumber: null, address: null, city: null, state: null, postalCode: null, country: null, role: 'ADMIN', resetToken: null, resetTokenExpiry: null, createdAt: new Date('2026-02-07T05:10:29.189Z'), updatedAt: new Date('2026-02-07T05:10:29.189Z'), deletedAt: null }
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: {},
      create: user,
    });
  }
  console.log(`Seeded ${users.length} users`);

  // 2. Plans
  const plans = [
    { id: 'cml93vul300013dzfm35a718g', name: 'Starter', price: 199, price2Years: null, price3Years: null, duration: 30, description: 'Perfect for personal websites and blogs', features: [], isActive: true, requiresEnv: false, providesDb: false, createdAt: new Date('2026-02-05T06:59:19.575Z'), updatedAt: new Date('2026-02-05T07:04:10.664Z'), deletedAt: new Date('2026-02-05T07:04:10.662Z') },
    { id: 'cml93vul800023dzf04r9qxiw', name: 'Professional', price: 499, price2Years: null, price3Years: null, duration: 30, description: 'For businesses and growing projects', features: [], isActive: true, requiresEnv: false, providesDb: false, createdAt: new Date('2026-02-05T06:59:19.580Z'), updatedAt: new Date('2026-02-05T07:04:14.026Z'), deletedAt: new Date('2026-02-05T07:04:14.025Z') },
    { id: 'cml93vulc00033dzfcca7bbea', name: 'Enterprise', price: 999, price2Years: null, price3Years: null, duration: 30, description: 'High performance for demanding applications', features: [], isActive: true, requiresEnv: false, providesDb: false, createdAt: new Date('2026-02-05T06:59:19.584Z'), updatedAt: new Date('2026-02-05T07:04:21.875Z'), deletedAt: new Date('2026-02-05T07:04:21.874Z') },
    { id: 'cml91t86l00003bllf27kwy9z', name: 'Smart Host + ', price: 2029, price2Years: null, price3Years: null, duration: 30, description: 'Fast loading || SMTP Working || Access ENV || ', features: ['Static Website Hosting', 'Free SSL Certificate', 'DDoS Protection', 'SMTP Working', '1 DB with 3 Collection', 'Upto 15000 views / month'], isActive: true, requiresEnv: true, providesDb: false, createdAt: new Date('2026-02-05T06:01:17.998Z'), updatedAt: new Date('2026-02-06T12:16:00.075Z'), deletedAt: null },
    { id: 'cml91kzrw0002zf5hgbo6tejt', name: 'Smart Host', price: 1799, price2Years: null, price3Years: null, duration: 30, description: 'Fast loading || SMTP Working || Access ENV || ', features: ['Static Website Hosting', 'Free SSL Certificate', 'DDoS Protection', 'SMTP Working', '1 DB with 3 Collection', 'Upto 5000 views / month'], isActive: true, requiresEnv: false, providesDb: false, createdAt: new Date('2026-02-05T05:54:53.852Z'), updatedAt: new Date('2026-02-06T12:16:14.006Z'), deletedAt: null },
    { id: 'cml91e0di0001zf5hfyh458zk', name: 'Basic host +', price: 1549, price2Years: null, price3Years: null, duration: 30, description: 'Fast loading || SMTP Working || Access ENV', features: ['Static Website Hosting', 'Free SSL Certificate', 'DDoS Protection', 'SMTP Working'], isActive: true, requiresEnv: false, providesDb: false, createdAt: new Date('2026-02-05T05:49:28.032Z'), updatedAt: new Date('2026-02-06T12:16:31.175Z'), deletedAt: null },
    { id: 'cml91b2at0000zf5hu27z9pyy', name: 'Basic Host', price: 1420, price2Years: null, price3Years: null, duration: 30, description: 'Best for StartUps\nNo SMTP', features: ['Static Website Hosting', 'Free SSL Certificate', 'DDoS Protection'], isActive: true, requiresEnv: false, providesDb: false, createdAt: new Date('2026-02-05T05:47:10.559Z'), updatedAt: new Date('2026-02-06T12:16:57.653Z'), deletedAt: null },
    { id: 'cmlbuvl2d000148kr8u5dxn8g', name: 'Starter', price: 199, price2Years: null, price3Years: null, duration: 30, description: 'Perfect for personal websites and blogs', features: [], isActive: true, requiresEnv: false, providesDb: false, createdAt: new Date('2026-02-07T05:10:29.222Z'), updatedAt: new Date('2026-02-07T05:10:29.222Z'), deletedAt: null },
    { id: 'cmlbuvl2m000248kr5o1siu9j', name: 'Professional', price: 499, price2Years: null, price3Years: null, duration: 30, description: 'For businesses and growing projects', features: [], isActive: true, requiresEnv: false, providesDb: false, createdAt: new Date('2026-02-07T05:10:29.231Z'), updatedAt: new Date('2026-02-07T05:10:29.231Z'), deletedAt: null },
    { id: 'cmlbuvl2o000348krq4pors5g', name: 'Enterprise', price: 999, price2Years: null, price3Years: null, duration: 30, description: 'High performance for demanding applications', features: [], isActive: true, requiresEnv: false, providesDb: false, createdAt: new Date('2026-02-07T05:10:29.232Z'), updatedAt: new Date('2026-02-07T05:10:29.232Z'), deletedAt: null }
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { id: plan.id },
      update: {},
      create: plan,
    });
  }
  console.log(`Seeded ${plans.length} plans`);

  // 3. Subscriptions
  const subscriptions = [
    { id: 'cml928vi00004l7gh8qfym403', userId: 'cml927jfq0000l7ghzkfj9vcm', planId: 'cml91b2at0000zf5hu27z9pyy', startDate: new Date('2026-02-05T06:13:28.055Z'), endDate: new Date('2026-03-07T06:13:28.055Z'), status: 'ACTIVE', createdAt: new Date('2026-02-05T06:13:28.056Z'), updatedAt: new Date('2026-02-05T06:13:28.056Z'), deletedAt: null },
    { id: 'cmlap6pmu0005bgooinlp7u1d', userId: 'cml927jfq0000l7ghzkfj9vcm', planId: 'cml91t86l00003bllf27kwy9z', startDate: new Date('2026-02-06T00:00:00.000Z'), endDate: new Date('2026-03-08T00:00:00.000Z'), status: 'ACTIVE', createdAt: new Date('2026-02-06T09:43:24.486Z'), updatedAt: new Date('2026-02-06T09:43:24.486Z'), deletedAt: null }
  ];

  for (const sub of subscriptions) {
    await prisma.subscription.upsert({
      where: { id: sub.id },
      update: {},
      create: sub,
    });
  }
  console.log(`Seeded ${subscriptions.length} subscriptions`);

  // 4. Sites
  const sites = [
    { id: 'cml92tyim0006l7ghmbu7ue9f', domain: 'hms.in', serverPath: null, userId: 'cml927jfq0000l7ghzkfj9vcm', status: 'ACTIVE', sslStatus: 'PENDING', subscriptionId: 'cml928vi00004l7gh8qfym403', createdAt: new Date('2026-02-05T06:29:51.742Z'), updatedAt: new Date('2026-02-05T07:12:00.270Z'), deletedAt: null, serverIp: '12.3.12.3.12.3', envVars: null, dbConnection: null },
    { id: 'cmlap6pmv0007bgooiatew8cf', domain: 'hhhms.in', serverPath: null, userId: 'cml927jfq0000l7ghzkfj9vcm', status: 'ACTIVE', sslStatus: 'NONE', subscriptionId: 'cmlap6pmu0005bgooinlp7u1d', createdAt: new Date('2026-02-06T09:43:24.486Z'), updatedAt: new Date('2026-02-06T10:25:29.282Z'), deletedAt: null, serverIp: null, envVars: `ds [ di ioxcjoij\nasfdgogi odpskf`, dbConnection: null }
  ];

  for (const site of sites) {
    await prisma.site.upsert({
      where: { id: site.id },
      update: {},
      create: site,
    });
  }
  console.log(`Seeded ${sites.length} sites`);

  // 5. Payments
  const payments = [
    { id: 'cml927tf90002l7ght3kvh3qs', userId: 'cml927jfq0000l7ghzkfj9vcm', planId: 'cml91b2at0000zf5hu27z9pyy', subscriptionId: null, amount: 119, currency: 'INR', status: 'SUCCESS', razorpayOrderId: 'order_SCMRn9LKzWxbSI', razorpayPaymentId: 'pay_SCMSNEX24DZFLw', razorpaySignature: '1c5b22a4c4c0666aa753457b62209a8e629cf5984ec1af1f1f4f01c000c8af85', invoiceNumber: null, gstNumber: null, gstAmount: null, durationYears: 1, createdAt: new Date('2026-02-05T06:12:38.709Z'), deletedAt: null },
    { id: 'cmlaqsdy100017t01a2hhm0d9', userId: 'cml927jfq0000l7ghzkfj9vcm', planId: 'cml91b2at0000zf5hu27z9pyy', subscriptionId: null, amount: 119, currency: 'INR', status: 'PENDING', razorpayOrderId: 'order_SCpKvGN8AE9Hwe', razorpayPaymentId: null, razorpaySignature: null, invoiceNumber: null, gstNumber: null, gstAmount: null, durationYears: 1, createdAt: new Date('2026-02-06T10:28:15.384Z'), deletedAt: null }
  ];

  for (const payment of payments) {
    await prisma.payment.upsert({
      where: { id: payment.id },
      update: {},
      create: payment,
    });
  }
  console.log(`Seeded ${payments.length} payments`);

  // 6. Deployments
  const deployments = [
  ];

  for (const deployment of deployments) {
    await prisma.deployment.upsert({
      where: { id: deployment.id },
      update: {},
      create: deployment,
    });
  }
  console.log(`Seeded ${deployments.length} deployments`);

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
