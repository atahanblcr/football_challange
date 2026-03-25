// tests/unit/middleware/rbac.middleware.test.ts
import { Request, Response } from 'express';
import { rbacMiddleware } from '../../../src/middleware/rbac.middleware';
import { ApiError } from '../../../src/errors/api-error';
import { AdminRole } from '@prisma/client';

describe('RbacMiddleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: jest.Mock = jest.fn();

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {};
    nextFunction = jest.fn();
  });

  it('should allow access if role is included', () => {
    (mockRequest as any).adminUser = { role: AdminRole.super_admin };
    const middleware = rbacMiddleware([AdminRole.super_admin, AdminRole.editor]);
    
    middleware(mockRequest as Request, mockResponse as Response, nextFunction);
    
    expect(nextFunction).toHaveBeenCalledWith();
  });

  it('should deny access if role is not included', () => {
    (mockRequest as any).adminUser = { role: AdminRole.moderator };
    const middleware = rbacMiddleware([AdminRole.super_admin]);
    
    middleware(mockRequest as Request, mockResponse as Response, nextFunction);
    
    const error = nextFunction.mock.calls[0][0];
    expect(error).toBeInstanceOf(ApiError);
    expect(error.statusCode).toBe(403);
  });

  it('should deny access if adminUser is missing', () => {
    const middleware = rbacMiddleware([AdminRole.super_admin]);
    
    middleware(mockRequest as Request, mockResponse as Response, nextFunction);
    
    const error = nextFunction.mock.calls[0][0];
    expect(error).toBeInstanceOf(ApiError);
    expect(error.statusCode).toBe(401);
  });
});
