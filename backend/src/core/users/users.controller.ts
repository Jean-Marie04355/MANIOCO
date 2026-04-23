import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Param,
  Post,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enum/role.enum';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/audit-log.entity';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly auditService: AuditService,
  ) {}

  @ApiOperation({ summary: 'List of all users' })
  @ApiResponse({ status: 200, description: 'List retrieved' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Get()
  findAll() {
    return this.usersService.findAllWithDeleted();
  }

  @ApiOperation({ summary: 'Create a new user (Public)' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    if (createUserDto.role === UserRole.ADMIN || createUserDto.role === UserRole.SUPER_ADMIN) {
      createUserDto.role = UserRole.CLIENT;
    }
    return this.usersService.create(createUserDto);
  }

  @ApiOperation({ summary: 'Create a new Admin (Super Admin only)' })
  @ApiResponse({ status: 201, description: 'Admin created successfully' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @Post('admin')
  async createAdmin(@Body() createUserDto: CreateUserDto, @CurrentUser() admin: AuthenticatedUser) {
    createUserDto.role = UserRole.ADMIN;
    const result = await this.usersService.create(createUserDto);
    
    await this.auditService.log({
      adminName: admin.name || 'Admin',
      adminEmail: admin.email,
      action: AuditAction.CREATE_ADMIN,
      details: `A créé le compte administrateur pour ${createUserDto.email}`,
      targetId: result.id,
    });

    return result;
  }

  @ApiOperation({ summary: 'List all users including suspended (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Full list retrieved' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @Get('admin/all')
  findAllWithDeleted() {
    return this.usersService.findAllWithDeleted();
  }

  @ApiOperation({ summary: 'Restore a suspended user (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'User restored' })
  @ApiParam({ name: 'id', type: String })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @Patch(':id/restore')
  async restore(@Param('id') id: string, @CurrentUser() admin: AuthenticatedUser) {
    const target = await this.usersService.findOne(id);
    await this.usersService.restore(id);
    
    await this.auditService.log({
      adminName: admin.name || 'Admin',
      adminEmail: admin.email,
      action: AuditAction.RESTORE_ADMIN,
      details: `A réactivé le compte de ${target.email}`,
      targetId: id,
    });

    return { message: 'User restored successfully' };
  }

  @ApiOperation({ summary: 'Reset a user password (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Password reset' })
  @ApiParam({ name: 'id', type: String })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @Patch(':id/reset-password')
  async resetPassword(@Param('id') id: string, @Body() body: { password: string }, @CurrentUser() admin: AuthenticatedUser) {
    const target = await this.usersService.findOne(id);
    await this.usersService.update(id, { password: body.password });
    
    await this.auditService.log({
      adminName: admin.name || 'Admin',
      adminEmail: admin.email,
      action: AuditAction.RESET_PASSWORD,
      details: `A réinitialisé le mot de passe de ${target.email}`,
      targetId: id,
    });

    return { message: 'Password reset successfully' };
  }

  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiResponse({ status: 200, description: 'User retrieved' })
  @ApiParam({ name: 'id', type: String })
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    if (user.role !== UserRole.SUPER_ADMIN && user.role !== UserRole.ADMIN && user.userId !== id) {
      throw new ForbiddenException('You can only access your own profile.');
    }
    return this.usersService.findOne(id);
  }

  @ApiOperation({ summary: 'Delete a user (Suspend)' })
  @ApiResponse({ status: 200, description: 'User deleted' })
  @ApiParam({ name: 'id', type: String })
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() admin: AuthenticatedUser) {
    if (admin.role !== UserRole.SUPER_ADMIN && admin.userId !== id) {
      throw new ForbiddenException('Only the account owner or a Super Admin can perform this action.');
    }
    
    const target = await this.usersService.findOne(id);
    await this.usersService.remove(id);

    if (admin.role === UserRole.SUPER_ADMIN) {
      await this.auditService.log({
        adminName: admin.name || 'Admin',
        adminEmail: admin.email,
        action: AuditAction.SUSPEND_ADMIN,
        details: `A suspendu le compte de ${target.email}`,
        targetId: id,
      });
    }

    return { message: 'User suspended successfully' };
  }

  @ApiOperation({ summary: 'Permanently delete a user (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'User permanently deleted' })
  @ApiParam({ name: 'id', type: String })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @Delete(':id/permanent')
  async hardDelete(@Param('id') id: string, @CurrentUser() admin: AuthenticatedUser) {
    const target = await this.usersService.findOne(id);
    await this.usersService.hardDelete(id);
    
    await this.auditService.log({
      adminName: admin.name || 'Admin',
      adminEmail: admin.email,
      action: AuditAction.DELETE_ADMIN,
      details: `A supprimé DÉFINITIVEMENT le compte de ${target.email}`,
      targetId: id,
    });

    return { message: 'User permanently deleted' };
  }

  @ApiOperation({ summary: 'Update a user' })
  @ApiResponse({ status: 200, description: 'User updated' })
  @ApiParam({ name: 'id', type: String })
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() data: UpdateUserDto, @CurrentUser() user: AuthenticatedUser) {
    const isAdmin = user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ADMIN;
    
    if (!isAdmin && user.userId !== id) {
      throw new ForbiddenException('You can only update your own profile.');
    }

    const result = await this.usersService.update(id, data);

    if (isAdmin && user.userId !== id) {
      const target = await this.usersService.findOne(id);
      await this.auditService.log({
        adminName: user.name || 'Admin',
        adminEmail: user.email,
        action: AuditAction.UPDATE_USER,
        details: `A modifié le profil de ${target.email}`,
        targetId: id,
      });
    }

    return result;
  }

}

