import { Test, TestingModule } from '@nestjs/testing';
import { StaffManagementController } from '../../../src/modules/users/controllers/staff-management.controller';
import { StaffManagementService } from '../../../src/modules/users/services/staff-management.service';

describe('StaffManagementController', () => {
  let controller: StaffManagementController;
  let mockStaffService: any;

  beforeEach(async () => {
    mockStaffService = {
      findAll: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue({ id: '1', fullName: 'Cô Nguyễn Thị Mai' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [StaffManagementController],
      providers: [
        { provide: StaffManagementService, useValue: mockStaffService },
      ],
    }).compile();

    controller = module.get<StaffManagementController>(StaffManagementController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should list staff members', async () => {
    const list = await controller.findAll({});
    expect(list).toEqual([]);
  });

  it('should get one staff member', async () => {
    const staff = await controller.findOne(1);
    expect(staff).toHaveProperty('fullName', 'Cô Nguyễn Thị Mai');
  });
});
