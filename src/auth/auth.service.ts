import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from 'node:crypto';
import { promisify } from 'node:util';
import { PrismaService } from '../prisma/prisma.service';
import { TokenService } from '../Token/token.service';
import { CustomerService } from '../customer/customer.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

const scrypt = promisify(scryptCallback);
const PASSWORD_SALT_BYTES = 16;
const PASSWORD_KEY_LENGTH = 64;

type PublicUser = {
  id: string;
  email: string;
  name: string | null;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
    private readonly customerService: CustomerService,
  ) {}

  async register(dto: RegisterDto) {
    const email = this.normalizeEmail(dto.email);
    this.validateCredentials(email, dto.password);

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException('A user with this email already exists');
    }

    const user = await this.prisma.user.create({
      data: {
        email,
        name: dto.name?.trim() || null,
        password: await this.hashPassword(dto.password),
      },
    });

    await this.customerService.createOrGetCustomer(user.id);

    return this.issueTokens(user);
  }

  async login(dto: LoginDto) {
    const email = this.normalizeEmail(dto.email);
    this.validateCredentials(email, dto.password);

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !(await this.verifyPassword(dto.password, user.password))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.issueTokens(user);
  }

  async refresh(refreshToken: string) {
    try {
      const payload = await this.tokenService.verifyRefreshToken(refreshToken);
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) throw new UnauthorizedException('User no longer exists');
      return this.issueTokens(user);
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async findById(id: string): Promise<PublicUser | null> {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  private async issueTokens(user: {
    id: string;
    email: string;
    name: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    const payload = { sub: user.id, email: user.email };
    const [accessToken, refreshToken] = await Promise.all([
      this.tokenService.createAccessToken(payload),
      this.tokenService.createRefreshToken(payload),
    ]);

    return {
      user: this.toPublicUser(user),
      accessToken,
      refreshToken,
    };
  }

  private toPublicUser(user: {
    id: string;
    email: string;
    name: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): PublicUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  private validateCredentials(email: string, password: string) {
    if (
      typeof email !== 'string' ||
      !email.includes('@') ||
      typeof password !== 'string' ||
      password.length < 8
    ) {
      throw new BadRequestException(
        'A valid email and a password of at least 8 characters are required',
      );
    }
  }

  private async hashPassword(password: string) {
    const salt = randomBytes(PASSWORD_SALT_BYTES).toString('hex');
    const derivedKey = (await scrypt(
      password,
      salt,
      PASSWORD_KEY_LENGTH,
    )) as Buffer;
    return `${salt}:${derivedKey.toString('hex')}`;
  }

  private async verifyPassword(password: string, storedPassword: string) {
    const [salt, storedKey] = storedPassword.split(':');
    if (!salt || !storedKey) return false;

    const derivedKey = (await scrypt(
      password,
      salt,
      PASSWORD_KEY_LENGTH,
    )) as Buffer;
    const storedKeyBuffer = Buffer.from(storedKey, 'hex');
    return (
      storedKeyBuffer.length === derivedKey.length &&
      timingSafeEqual(storedKeyBuffer, derivedKey)
    );
  }
}
