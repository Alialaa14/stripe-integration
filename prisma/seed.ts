import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is required');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const products = [
  {
    stripeProductId: 'prod_test_starter_kit',
    name: 'Starter Coffee Kit',
    slug: 'starter-coffee-kit',
    sku: 'COFFEE-STARTER-001',
    description: 'A compact coffee kit with a ceramic mug, beans, and a scoop.',
    category: 'coffee',
    brand: 'Northstar Roasters',
    images: [
      'https://images.example.com/products/starter-coffee-kit-front.jpg',
      'https://images.example.com/products/starter-coffee-kit-open.jpg',
    ],
    unitLabel: 'kit',
    shippable: true,
    taxCode: 'txcd_99999999',
    url: 'https://example.com/products/starter-coffee-kit',
    metadata: {
      fulfillment: 'warehouse',
      inventory: '42',
      weightGrams: '1200',
    },
    price: {
      stripePriceId: 'price_test_starter_kit_usd',
      nickname: 'Starter kit - one time',
      currency: 'usd',
      unitAmount: 3499,
    },
  },
  {
    stripeProductId: 'prod_test_weekly_beans',
    name: 'Weekly Roaster Box',
    slug: 'weekly-roaster-box',
    sku: 'COFFEE-SUB-WEEKLY-001',
    description: 'Freshly roasted single-origin coffee delivered every week.',
    category: 'subscription',
    brand: 'Northstar Roasters',
    images: ['https://images.example.com/products/weekly-roaster-box.jpg'],
    unitLabel: 'box',
    shippable: true,
    taxCode: 'txcd_99999999',
    url: 'https://example.com/products/weekly-roaster-box',
    metadata: {
      fulfillment: 'subscription',
      inventory: 'unlimited',
      roast: 'single-origin',
    },
    price: {
      stripePriceId: 'price_test_weekly_beans_usd',
      nickname: 'Weekly subscription',
      currency: 'usd',
      unitAmount: 1899,
      recurring: true,
      interval: 'week' as const,
      intervalCount: 1,
    },
  },
  {
    stripeProductId: 'prod_test_gift_card',
    name: 'Digital Gift Card',
    slug: 'digital-gift-card',
    sku: 'GIFT-DIGITAL-025',
    description: 'A digital gift card delivered by email after payment.',
    category: 'gift-card',
    brand: 'Northstar Roasters',
    images: ['https://images.example.com/products/digital-gift-card.jpg'],
    unitLabel: 'card',
    shippable: false,
    taxCode: 'txcd_40060000',
    url: 'https://example.com/products/digital-gift-card',
    metadata: {
      fulfillment: 'email',
      inventory: 'unlimited',
      denomination: '25',
    },
    price: {
      stripePriceId: 'price_test_gift_card_25_usd',
      nickname: '$25 digital gift card',
      currency: 'usd',
      unitAmount: 2500,
    },
  },
];

async function main() {
  for (const productData of products) {
    const { price, ...product } = productData;
    const savedProduct = await prisma.product.upsert({
      where: { stripeProductId: product.stripeProductId },
      update: product,
      create: product,
    });

    await prisma.price.upsert({
      where: { stripePriceId: price.stripePriceId },
      update: { ...price, productId: savedProduct.id },
      create: { ...price, productId: savedProduct.id },
    });
  }
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exitCode = 1;
  });
