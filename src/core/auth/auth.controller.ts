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
  @ApiOperation({ summary: "Connexion (email + password) -> JWT" })
  @ApiResponse({ status: 201, description: 'Token JWT retourné' })
  login(@Body() body: LoginDto) {
    return this.authService.login(body.email, body.password);
  }

  @Post('admin/login')
  @ApiOperation({ summary: "Connexion Admin Étape 1 (email + password) -> Envoi OTP" })
  @ApiResponse({ status: 201, description: 'OTP généré et affiché en console' })
  adminLogin(@Body() body: LoginDto) {
    return this.authService.adminLogin(body.email, body.password);
  }

  @Post('admin/verify-otp')
  @ApiOperation({ summary: "Connexion Admin Étape 2 (email + otp) -> JWT" })
  @ApiResponse({ status: 201, description: 'Token JWT retourné après validation OTP' })
  verifyOtp(@Body() body: VerifyOtpDto) {
    return this.authService.verifyAdminOtp(body.email, body.otpCode);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiOperation({ summary: 'Infos du compte courant' })
  me(@Req() req: { user: AuthenticatedUser }) {
    return this.authService.me(req.user);
  }
}

