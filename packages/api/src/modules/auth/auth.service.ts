import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../../entities/user.entity';
import {
  RegisterRequest,
  LoginRequest,
  Argon2Params,
} from '@encrypted-notes/common';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private _userRepository: Repository<User>,
    private _jwtService: JwtService
  ) {}

  async register(
    registerData: RegisterRequest
  ): Promise<{ accessToken: string }> {
    const { email, password } = registerData;

    // Check if user already exists
    const existingUser = await this._userRepository.findOne({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password with bcrypt (for server-side auth)
    const passwordHash = await bcrypt.hash(password, 12);

    // Generate salt and argon2 params for client-side crypto
    const salt = crypto.getRandomValues(new Uint8Array(32));
    const argon2Params = {
      m: 131072, // 128 MiB
      t: 3,
      p: 1,
    };

    // For now, create a placeholder wrapped UMK (will be set by client after registration)
    const placeholderUMK = crypto.getRandomValues(new Uint8Array(32));

    const user = this._userRepository.create({
      email,
      passwordHash,
      salt: Buffer.from(salt),
      argon2Params,
      wrappedUMK: Buffer.from(placeholderUMK),
    });

    await this._userRepository.save(user);

    // Generate access token
    const payload = { sub: user.id, email: user.email };
    const accessToken = this._jwtService.sign(payload);

    return { accessToken };
  }

  async login(loginData: LoginRequest): Promise<{ accessToken: string }> {
    const { email, password } = loginData;

    const user = await this._userRepository.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, email: user.email };
    const accessToken = this._jwtService.sign(payload);

    return { accessToken };
  }

  async validateUser(userId: string): Promise<User | null> {
    return this._userRepository.findOne({ where: { id: userId } });
  }

  async updateWrappedUMK(
    userId: string,
    wrappedUMK: Buffer,
    salt: Buffer,
    argon2Params: Argon2Params
  ): Promise<void> {
    await this._userRepository.update(userId, {
      wrappedUMK,
      salt,
      argon2Params,
    });
  }
}
