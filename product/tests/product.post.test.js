const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');

const app = require('../src/app');
const connectDB = require('../src/db/db');

jest.mock('../src/services/imagekit.service', () => ({
  uploadImage: jest.fn().mockResolvedValue({ url: 'http://img', thumbnail: 'http://img', id: 'fileid' }),
}));

describe('POST /api/products/', () => {
  let mongo;
  let token;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    const uri = mongo.getUri();
    process.env.MONGODB_URI = uri;
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret';

    await connectDB();

    const sellerId = new mongoose.Types.ObjectId().toHexString();
    token = jwt.sign({ id: sellerId, role: 'seller' }, process.env.JWT_SECRET);
  });

  afterEach(async () => {
    const collections = await mongoose.connection.db.collections();
    for (let collection of collections) {
      await collection.deleteMany({});
    }
  });

  afterAll(async () => {
    await mongoose.connection.close();
    if (mongo) await mongo.stop();
  });

  it('creates a product successfully when data is valid', async () => {
    const res = await request(app)
      .post('/api/products/')
      .set('Authorization', `Bearer ${token}`)
      .field('title', 'Test Product')
      .field('description', 'A product created by tests')
      .field('priceAmount', '19.99')
      .attach('images', Buffer.from('abc'), 'img1.jpg');

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data.title).toBe('Test Product');
    expect(res.body.data.price.amount).toBe(19.99);
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await request(app)
      .post('/api/products/')
      .set('Authorization', `Bearer ${token}`)
      .field('description', 'Missing title and price');

    expect(res.status).toBe(400);
  });
});
