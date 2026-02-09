import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { User } from './models/user.model.js';
import { Category } from './models/category.model.js';
import { Product } from './models/product.model.js';

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    await User.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});
    console.log('Cleared existing data');

    const adminPassword = await bcrypt.hash('admin123', 12);
    const admin = await User.create({
      email: 'admin@test.com',
      password: adminPassword,
      role: 'admin'
    });
    console.log('Created admin user:', admin.email);

    const adminPhone = await User.create({
      phone: '+77777777777',
      role: 'admin'
    });
    console.log('Created admin by phone:', adminPhone.phone);

    const userPassword = await bcrypt.hash('user123', 12);
    const user = await User.create({
      email: 'user@test.com',
      password: userPassword,
      role: 'user'
    });
    console.log('Created regular user:', user.email);

    // Сначала создаём категорию Смартфон (родительская)
    const smartphone = await Category.create({
      name: 'Смартфон',
      description: 'Смартфоны и мобильные устройства'
    });

    // Производители внутри категории Смартфон
    const apple = await Category.create({
      name: 'Apple',
      parent: smartphone._id,
      description: 'Смартфоны Apple iPhone'
    });
    const samsung = await Category.create({
      name: 'Samsung',
      parent: smartphone._id,
      description: 'Смартфоны Samsung Galaxy'
    });
    const xiaomi = await Category.create({
      name: 'Xiaomi',
      parent: smartphone._id,
      description: 'Смартфоны Xiaomi'
    });
    const honor = await Category.create({
      name: 'Honor',
      parent: smartphone._id,
      description: 'Смартфоны Honor'
    });

    // Прочие категории
    const electronics = await Category.create({
      name: 'Электроника',
      description: 'Ноутбуки, планшеты и аксессуары'
    });
    const clothing = await Category.create({
      name: 'Одежда',
      description: 'Мужская и женская одежда'
    });
    const food = await Category.create({
      name: 'Продукты',
      description: 'Еда и напитки'
    });
    const books = await Category.create({
      name: 'Книги',
      description: 'Художественная и научная литература'
    });

    const categories = [smartphone, apple, samsung, xiaomi, honor, electronics, clothing, food, books];
    console.log('Created categories:', categories.length);

    const products = await Product.insertMany([
      {
        name: 'Смартфон Apple iPhone 16 Pro Max',
        price: 749990,
        category: apple._id,
        description: 'Смартфон Apple iPhone 16 Pro Max с дисплеем Super Retina XDR, процессором A18 Pro и камерой 48 Мп',
        colors: [
          { name: 'Natural Titanium', colorName: 'титан', image: 'images/Iphone 16 Pro Max 256GB (Natural Titanium).webp' },
          { name: 'White Titanium', colorName: 'белый', image: 'images/iPhone 16 Pro Max 256GB (White Titanium).webp' },
          { name: 'Desert Titanium', colorName: 'бежевый', image: 'images/iPhone 16 Pro Max 256GB (Desert Titanium).webp' }
        ],
        memoryOptions: [
          { size: 256, price: 749990 },
          { size: 512, price: 849990 }
        ],
        specs: {
          article: '13865',
          brand: 'Apple',
          model: 'iPhone 16 Pro Max',
          ram: '8 ГБ',
          screen: 'Super Retina XDR'
        }
      },
      {
        name: 'iPhone 15 128GB',
        price: 89990,
        category: apple._id,
        description: 'Смартфон Apple iPhone 15 128GB',
        colors: [
          { name: 'Blue', colorName: 'синий', image: 'images/iPhone 15 128GB (Blue).webp' },
          { name: 'Black', colorName: 'чёрный', image: 'images/Phone 15 128GB (Black).webp' }
        ]
      },
      {
        name: 'Смартфон Apple iPhone 16 Pro 256GB',
        price: 129990,
        category: apple._id,
        description: 'Смартфон Apple iPhone 16 Pro 256GB с дисплеем Super Retina XDR и процессором A18 Pro',
        colors: [
          { name: 'Black Titanium', colorName: 'чёрный титан', image: 'images/Apple iPhone 16 Pro 256GB (Black Titanium).webp' },
          { name: 'White Titanium', colorName: 'белый титан', image: 'images/Apple iPhone 16 Pro 256GB (White Titanium).webp' }
        ]
      },
      {
        name: 'Samsung Galaxy S24 256GB',
        price: 79990,
        category: samsung._id,
        description: 'Смартфон Samsung Galaxy S24 256GB с камерой 200 Мп',
        colors: [
          { name: 'Galaxy S24', colorName: '', image: 'images/Samsung Galaxy S24 256GB.webp' }
        ]
      },
      {
        name: 'Samsung Galaxy A54 5G 128GB',
        price: 45990,
        category: samsung._id,
        description: 'Смартфон Samsung Galaxy A54 5G 128GB',
        colors: [
          { name: 'Black', colorName: 'чёрный', image: 'images/Samsung Galaxy A54 5G 128GB Black.webp' }
        ]
      },
      {
        name: 'Xiaomi 14 256GB',
        price: 59990,
        category: xiaomi._id,
        description: 'Смартфон Xiaomi 14 256GB'
      },
      {
        name: 'Xiaomi Redmi Note 13',
        price: 24990,
        category: xiaomi._id,
        description: 'Смартфон Xiaomi Redmi Note 13 128GB'
      },
      {
        name: 'Honor 90 256GB',
        price: 44990,
        category: honor._id,
        description: 'Смартфон Honor 90 256GB'
      },
      {
        name: 'Honor Magic6',
        price: 89990,
        category: honor._id,
        description: 'Смартфон Honor Magic6 512GB'
      },
      {
        name: 'MacBook Air M2',
        price: 129990,
        category: electronics._id,
        description: 'Ноутбук Apple MacBook Air 13 M2 256GB'
      },
      {
        name: 'Футболка Nike',
        price: 2990,
        category: clothing._id,
        description: 'Спортивная футболка Nike Dri-FIT черная'
      },
      {
        name: 'Молоко Простоквашино',
        price: 89,
        category: food._id,
        description: 'Молоко пастеризованное 3.2% 1л'
      },
      {
        name: '1984 - Джордж Оруэлл',
        price: 590,
        category: books._id,
        description: 'Антиутопический роман Джорджа Оруэлла'
      }
    ]);
    console.log('Created products:', products.length);

    console.log('\n========== SEED COMPLETED ==========');
    console.log('Admin login: admin@test.com / admin123');
    console.log('User login: user@test.com / user123');
    console.log('=====================================\n');

  } catch (error) {
    console.error('Seed error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

seed();
