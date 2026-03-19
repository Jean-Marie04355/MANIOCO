import { Controller, Get, Post, Body, Param, Delete, Patch } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

@ApiTags('users') // important for Swagger
@Controller('users')
export class UsersController {

  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: 'List of all users' })
  @ApiResponse({ status: 200, description: 'List retrieved' })
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiResponse({ status: 200, description: 'User retrieved' })
  @ApiParam({ name: 'id', type: Number })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(Number(id)); // important conversion
  }

  @ApiOperation({ summary: 'Delete a user' })
  @ApiResponse({ status: 200, description: 'User deleted' })
  @ApiParam({ name: 'id', type: Number })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(Number(id)); // conversion
  }

  @ApiOperation({ summary: 'Update a user' })
  @ApiResponse({ status: 200, description: 'User updated' })
  @ApiParam({ name: 'id', type: Number })
  @Patch(':id')
  update(@Param('id') id: string, @Body() data: Partial<CreateUserDto>) {
    return this.usersService.update(Number(id), data); // conversion + typing
  }
}