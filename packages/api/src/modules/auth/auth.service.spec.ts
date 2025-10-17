import { LoginRequest, RegisterRequest } from '@encrypted-notes/common';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from '../../entities/user.entity';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let _userRepository: Repository<User>;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let _jwtService: JwtService;

  const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    _userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    _jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerData: RegisterRequest = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should successfully register a new user', async () => {
      const mockUser = {
        id: 'user-id',
        email: registerData.email,
        passwordHash: 'hashed-password',
        salt: Buffer.from('salt'),
        argon2Params: { m: 131072, t: 3, p: 1 },
        wrappedUMK: Buffer.from('wrapped-umk'),
      };

      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue(mockUser);
      mockUserRepository.save.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('jwt-token');

      const result = await service.register(registerData);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: registerData.email },
      });
      expect(mockUserRepository.create).toHaveBeenCalled();
      expect(mockUserRepository.save).toHaveBeenCalledWith(mockUser);
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
      });
      expect(result).toEqual({ accessToken: 'jwt-token' });
    });

    it('should throw ConflictException if user already exists', async () => {
      const existingUser = { id: 'existing-id', email: registerData.email };
      mockUserRepository.findOne.mockResolvedValue(existingUser);

      await expect(service.register(registerData)).rejects.toThrow(
        ConflictException
      );
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: registerData.email },
      });
      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });

    it('should hash password with bcrypt', async () => {
      const mockUser = {
        id: 'user-id',
        email: registerData.email,
      };

      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue(mockUser);
      mockUserRepository.save.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('jwt-token');

      await service.register(registerData);

      const createCall = mockUserRepository.create.mock.calls[0][0];
      expect(createCall.passwordHash).toBeDefined();
      expect(createCall.passwordHash).not.toBe(registerData.password);
      expect(createCall.salt).toBeInstanceOf(Buffer);
      expect(createCall.argon2Params).toEqual({ m: 131072, t: 3, p: 1 });
    });
  });

  describe('login', () => {
    const loginData: LoginRequest = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should successfully login user with valid credentials', async () => {
      const mockUser = {
        id: 'user-id',
        email: loginData.email,
        passwordHash: '$2a$12$mockHashedPassword',
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('jwt-token');

      // Mock bcrypt.compare to return true
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      jest.spyOn(require('bcryptjs'), 'compare').mockResolvedValue(true);

      const result = await service.login(loginData);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: loginData.email },
      });
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
      });
      expect(result).toEqual({ accessToken: 'jwt-token' });
    });

    it('should throw UnauthorizedException if user does not exist', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.login(loginData)).rejects.toThrow(
        UnauthorizedException
      );
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: loginData.email },
      });
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      const mockUser = {
        id: 'user-id',
        email: loginData.email,
        passwordHash: '$2a$12$mockHashedPassword',
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);

      // Mock bcrypt.compare to return false
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      jest.spyOn(require('bcryptjs'), 'compare').mockResolvedValue(false);

      await expect(service.login(loginData)).rejects.toThrow(
        UnauthorizedException
      );
    });
  });

  describe('validateUser', () => {
    it('should return user if found', async () => {
      const mockUser = { id: 'user-id', email: 'test@example.com' };
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.validateUser('user-id');

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'user-id' },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await service.validateUser('user-id');

      expect(result).toBeNull();
    });
  });

  describe('updateWrappedUMK', () => {
    it('should update user wrapped UMK data', async () => {
      const userId = 'user-id';
      const wrappedUMK = Buffer.from('new-wrapped-umk');
      const salt = Buffer.from('new-salt');
      const argon2Params = { m: 65536, t: 2, p: 1 };

      mockUserRepository.update.mockResolvedValue(undefined);

      await service.updateWrappedUMK(userId, wrappedUMK, salt, argon2Params);

      expect(mockUserRepository.update).toHaveBeenCalledWith(userId, {
        wrappedUMK,
        salt,
        argon2Params,
      });
    });
  });
});
