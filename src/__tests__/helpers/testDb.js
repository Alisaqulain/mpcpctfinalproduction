import mongoose from 'mongoose';
import User from '@/lib/models/User';
import Subscription from '@/lib/models/Subscription';
import SharedMembership from '@/lib/models/SharedMembership';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mpcpct-test';

let connection = null;

export async function connectTestDb() {
  if (connection) {
    return connection;
  }
  
  try {
    connection = await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    return connection;
  } catch (error) {
    console.error('Test DB connection error:', error);
    throw error;
  }
}

export async function disconnectTestDb() {
  if (connection) {
    await mongoose.connection.close();
    connection = null;
  }
}

export async function clearTestDb() {
  if (connection) {
    await User.deleteMany({});
    await Subscription.deleteMany({});
    await SharedMembership.deleteMany({});
  }
}

export async function createTestUser(userData = {}) {
  const defaultUser = {
    name: 'Test User',
    phoneNumber: '1234567890',
    email: 'test@example.com',
    password: '$2a$10$rOzJqJqJqJqJqJqJqJqJqOeJqJqJqJqJqJqJqJqJqJqJqJqJqJqJq', // bcrypt hash for 'password123'
    states: 'Test State',
    city: 'Test City',
    role: 'user',
    ...userData,
  };

  // If password is provided as plain text, hash it
  if (userData.password && !userData.password.startsWith('$2a$')) {
    const bcrypt = require('bcryptjs');
    defaultUser.password = await bcrypt.hash(userData.password, 10);
  }

  return await User.create(defaultUser);
}

export async function createTestSubscription(subscriptionData = {}) {
  const defaultSubscription = {
    userId: subscriptionData.userId,
    type: 'all',
    status: 'active',
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    plan: 'oneMonth',
    price: 299,
    paymentId: `PAY_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    sharedLimit: 3,
    ownerRewardGranted: false,
    ...subscriptionData,
  };

  return await Subscription.create(defaultSubscription);
}

export async function createTestSharedMembership(sharedMembershipData = {}) {
  const defaultSharedMembership = {
    subscriptionId: sharedMembershipData.subscriptionId,
    sharedUserId: sharedMembershipData.sharedUserId,
    activatedAt: new Date(),
    ...sharedMembershipData,
  };

  return await SharedMembership.create(defaultSharedMembership);
}

export function createMockRequest(body = {}, cookies = {}) {
  return {
    json: async () => body,
    cookies: {
      get: (name) => cookies[name] ? { value: cookies[name] } : undefined,
    },
    headers: {
      get: (name) => undefined,
    },
  };
}

export function createMockGetRequest(searchParams = {}, cookies = {}) {
  const url = new URL('http://localhost:3000/api/test');
  Object.keys(searchParams).forEach(key => {
    url.searchParams.set(key, searchParams[key]);
  });

  return {
    url: url.toString(),
    cookies: {
      get: (name) => cookies[name] ? { value: cookies[name] } : undefined,
    },
  };
}

