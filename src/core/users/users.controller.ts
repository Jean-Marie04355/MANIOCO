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

@ApiTags('users') // important for Swagger
@ApiBearerAuth() // INDISPENSABLE pour Swagger
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: 'List of all users' })
  @ApiResponse({ status: 200, description: 'List retrieved' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @ApiOperation({ summary: 'Create a new user (Public)' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    // Les utilisateurs normaux ne peuvent pas s'inscrire en tant qu'admin
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
  createAdmin(@Body() createUserDto: CreateUserDto) {
    // Forcer le rôle administrateur
    createUserDto.role = UserRole.ADMIN;
    return this.usersService.create(createUserDto);
  }

  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiResponse({ status: 200, description: 'User retrieved' })
  @ApiParam({ name: 'id', type: String })
  @UseGuards(JwtAuthGuard) // On enlève RolesGuard ici pour permettre l'accès au profil propre
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    if (user.role !== UserRole.SUPER_ADMIN && user.role !== UserRole.ADMIN && user.userId !== id) {
      throw new ForbiddenException('You can only access your own profile.');
    }
    return this.usersService.findOne(id);
  }

  @ApiOperation({ summary: 'Delete a user' })
  @ApiResponse({ status: 200, description: 'User deleted' })
  @ApiParam({ name: 'id', type: String })
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    if (user.role !== UserRole.SUPER_ADMIN && user.userId !== id) {
      throw new ForbiddenException('Only the account owner or a Super Admin can perform this action.');
    }
    await this.usersService.remove(id);
    return { message: 'User deleted successfully' };
  }

  @ApiOperation({ summary: 'Update a user' })
  @ApiResponse({ status: 200, description: 'User updated' })
  @ApiParam({ name: 'id', type: String })
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() data: UpdateUserDto, @CurrentUser() user: AuthenticatedUser) {
    const isAdmin = user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ADMIN;
    
    if (!isAdmin && user.userId !== id) {
      throw new ForbiddenException('You can only update your own profile.');
    }

    return this.usersService.update(id, data);
  }
}
