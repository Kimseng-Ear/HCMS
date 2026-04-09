import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../server/app';

describe('HRMS Integration Tests', () => {
  let app: any;
  let userId: string;
  let departmentId: string;
  let positionId: string;

  beforeAll(async () => {
    app = await createApp();
  });

  describe('User Account Module', () => {
    it('should create a new user account', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
          role: 'employee',
          phone: '1234567890'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      userId = response.body.id;
    });

    it('should login user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          phone: '1234567890',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
    });
  });

  describe('Department & Position Module', () => {
    it('should create a department', async () => {
      const response = await request(app)
        .post('/api/departments')
        .send({
          name: 'IT Department',
          description: 'Information Technology'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      departmentId = response.body.id;
    });

    it('should create a position', async () => {
      const response = await request(app)
        .post('/api/positions')
        .send({
          title: 'Software Developer',
          departmentId: departmentId,
          salary: 50000
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      positionId = response.body.id;
    });
  });

  describe('Employee Integration', () => {
    it('should create an employee profile', async () => {
      const response = await request(app)
        .post('/api/employees')
        .send({
          userId: userId,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          positionId: positionId,
          departmentId: departmentId,
          hireDate: '2023-01-01'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
    });
  });

  describe('Attendance Module', () => {
    it('should record clock-in', async () => {
      const response = await request(app)
        .post('/api/attendance/clock-in')
        .send({
          employeeId: userId,
          timestamp: new Date().toISOString()
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
    });

    it('should record clock-out', async () => {
      const response = await request(app)
        .post('/api/attendance/clock-out')
        .send({
          employeeId: userId,
          timestamp: new Date().toISOString()
        });

      expect(response.status).toBe(200);
    });
  });

  describe('Leave Module', () => {
    it('should submit leave request', async () => {
      const response = await request(app)
        .post('/api/leave')
        .send({
          employeeId: userId,
          type: 'annual',
          startDate: '2024-01-01',
          endDate: '2024-01-05',
          reason: 'Vacation'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
    });
  });

  describe('Payroll Module', () => {
    it('should calculate payroll', async () => {
      const response = await request(app)
        .post('/api/payroll/calculate')
        .send({
          employeeId: userId,
          period: '2024-01'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('grossSalary');
      expect(response.body).toHaveProperty('netSalary');
    });
  });

  describe('Report Module', () => {
    it('should generate attendance report', async () => {
      const response = await request(app)
        .get('/api/reports/attendance?startDate=2024-01-01&endDate=2024-01-31');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should generate payroll report', async () => {
      const response = await request(app)
        .get('/api/reports/payroll?period=2024-01');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});