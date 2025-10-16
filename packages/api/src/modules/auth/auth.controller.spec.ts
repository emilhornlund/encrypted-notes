import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RegisterRequest, LoginRequest } from '@encrypted-notes/common';

describe('AuthController', () => {
  let controller: AuthController;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let authService: AuthService;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should call authService.register and return result', async () => {
      const registerData: RegisterRequest = {
        email: 'test@example.com',
        password: 'password123',
      };
      const expectedResult = { accessToken: 'jwt-token' };

      mockAuthService.register.mockResolvedValue(expectedResult);

      const result = await controller.register(registerData);

      expect(mockAuthService.register).toHaveBeenCalledWith(registerData);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('login', () => {
    it('should call authService.login and return result', async () => {
      const loginData: LoginRequest = {
        email: 'test@example.com',
        password: 'password123',
      };
      const expectedResult = { accessToken: 'jwt-token' };

      mockAuthService.login.mockResolvedValue(expectedResult);

      const result = await controller.login(loginData);

      expect(mockAuthService.login).toHaveBeenCalledWith(loginData);
      expect(result).toEqual(expectedResult);
    });
  });
});
