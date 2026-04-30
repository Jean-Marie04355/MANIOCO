import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { AuthenticatedUser } from './strategies/jwt.strategy';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Login (email + password) -> JWT' })
  @ApiResponse({ status: 201, description: 'JWT Token successfully returned' })
  login(@Body() body: LoginDto): Promise<Record<string, unknown>> {
    return this.authService.login(body.email, body.password);
  }

  @Post('admin/login')
  @ApiOperation({
    summary: 'Admin Login Step 1 (email + password) -> Send OTP',
  })
  @ApiResponse({
    status: 201,
    description: 'OTP generated and displayed in console',
  })
  adminLogin(@Body() body: LoginDto): Promise<Record<string, unknown>> {
    return this.authService.adminLogin(body.email, body.password);
  }

  @Post('admin/verify-otp')
  @ApiOperation({ summary: 'Admin Login Step 2 (email + otp) -> JWT' })
  @ApiResponse({
    status: 201,
    description: 'JWT Token returned after OTP validation',
  })
  verifyOtp(@Body() body: VerifyOtpDto): Promise<Record<string, unknown>> {
    return this.authService.verifyAdminOtp(body.email, body.otpCode);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiOperation({ summary: 'Current account information' })
  me(@Req() req: { user: AuthenticatedUser }) {
    return this.authService.me(req.user);
  }
}
