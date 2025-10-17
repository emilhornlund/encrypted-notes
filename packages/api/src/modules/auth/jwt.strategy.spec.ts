import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let _authService: AuthService;

  const mockAuthService = {
    validateUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    _authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validate', () => {
    it('should return user data if user is valid', async () => {
      const payload = {
        sub: 'user-id',
        email: 'test@example.com',
        iat: 1234567890,
        exp: 1234567890 + 3600,
      };
      const mockUser = { id: 'user-id', email: 'test@example.com' };

      mockAuthService.validateUser.mockResolvedValue(mockUser);

      const result = await strategy.validate(payload);

      expect(mockAuthService.validateUser).toHaveBeenCalledWith('user-id');
      expect(result).toEqual({ userId: 'user-id', email: 'test@example.com' });
    });

    it('should throw UnauthorizedException if user is not found', async () => {
      const payload = {
        sub: 'user-id',
        email: 'test@example.com',
        iat: 1234567890,
        exp: 1234567890 + 3600,
      };

      mockAuthService.validateUser.mockResolvedValue(null);

      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException
      );
      expect(mockAuthService.validateUser).toHaveBeenCalledWith('user-id');
    });
  });
});
