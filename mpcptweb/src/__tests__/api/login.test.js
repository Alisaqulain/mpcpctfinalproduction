import { POST } from '@/app/api/login/route';
import { connectTestDb, disconnectTestDb, clearTestDb, createTestUser } from '../helpers/testDb';
import { NextRequest } from 'next/server';

// Mock NextRequest
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, init) => ({
      json: async () => data,
      status: init?.status || 200,
      cookies: {
        set: jest.fn(),
      },
    })),
    next: jest.fn(),
  },
}));

describe('Login API', () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
  });

  describe('POST /api/login', () => {
    it('should login successfully with valid credentials', async () => {
      // Create a test user
      const testUser = await createTestUser({
        phoneNumber: '9876543210',
        email: 'login@test.com',
        password: 'password123',
      });

      // Create request
      const req = {
        json: async () => ({
          phoneNumber: '9876543210',
          password: 'password123',
        }),
      };

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Login successful');
      expect(data.user).toBeDefined();
      expect(data.user.phoneNumber).toBe('9876543210');
      expect(data.user.email).toBe('login@test.com');
    });

    it('should return 400 if phone number is missing', async () => {
      const req = {
        json: async () => ({
          password: 'password123',
        }),
      };

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Phone number and password required');
    });

    it('should return 400 if password is missing', async () => {
      const req = {
        json: async () => ({
          phoneNumber: '9876543210',
        }),
      };

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Phone number and password required');
    });

    it('should return 401 if user does not exist', async () => {
      const req = {
        json: async () => ({
          phoneNumber: '9999999999',
          password: 'password123',
        }),
      };

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Invalid credentials');
    });

    it('should return 401 if password is incorrect', async () => {
      await createTestUser({
        phoneNumber: '9876543210',
        email: 'login@test.com',
        password: 'correctpassword',
      });

      const req = {
        json: async () => ({
          phoneNumber: '9876543210',
          password: 'wrongpassword',
        }),
      };

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Invalid credentials');
    });

    it('should set JWT token cookie on successful login', async () => {
      await createTestUser({
        phoneNumber: '9876543210',
        email: 'login@test.com',
        password: 'password123',
      });

      const req = {
        json: async () => ({
          phoneNumber: '9876543210',
          password: 'password123',
        }),
      };

      const response = await POST(req);

      expect(response.cookies.set).toHaveBeenCalled();
      expect(response.cookies.set).toHaveBeenCalledWith(
        'token',
        expect.any(String),
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
        })
      );
    });

    it('should return 500 on database error', async () => {
      // Disconnect database to simulate error
      await disconnectTestDb();

      const req = {
        json: async () => ({
          phoneNumber: '9876543210',
          password: 'password123',
        }),
      };

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal Server Error');

      // Reconnect for other tests
      await connectTestDb();
    });
  });
});

