import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { DepartmentsService } from './departments.service';
import { Department } from './schemas/department.schema';

describe('DepartmentsService', () => {
  it('should be defined and injectable', async () => {
    const modelMock = {
      create: jest.fn(),
      find: jest.fn(() => ({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn(),
      })),
      findById: jest.fn(() => ({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn(),
      })),
      findByIdAndUpdate: jest.fn(() => ({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn(),
      })),
      findByIdAndDelete: jest.fn(() => ({
        exec: jest.fn(),
      })),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        DepartmentsService,
        {
          provide: getModelToken(Department.name),
          useValue: modelMock,
        },
      ],
    }).compile();

    expect(moduleRef.get(DepartmentsService)).toBeDefined();
  });
});
