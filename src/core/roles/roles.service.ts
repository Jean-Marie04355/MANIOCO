import { Injectable, Inject, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { IBaseRepository } from '../../database/index';
import { Role } from './role.entity';

@Injectable()
export class RolesService {
  constructor(
    @Inject('ROLE_REPOSITORY')
    private readonly roleRepository: IBaseRepository<Role>,
  ) {}

  async findAll() {
    return this.roleRepository.find();
  }

  async findByName(name: string) {
    return this.roleRepository.findOne({ name });
  }

  async create(data: Partial<Role>) {
    const existing = await this.findByName(data.name);
    if (existing) {
      throw new ConflictException(`Role with name ${data.name} already exists.`);
    }
    return this.roleRepository.create(data);
  }

  async update(id: string, data: Partial<Role>) {
    const role = await this.roleRepository.findOne({ id });
    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found.`);
    }

    if (role.isSystem) {
      throw new ForbiddenException('System roles cannot be modified.');
    }

    return this.roleRepository.update(id, data);
  }

  async remove(id: string) {
    const role = await this.roleRepository.findOne({ id });
    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found.`);
    }

    if (role.isSystem) {
      throw new ForbiddenException('System roles cannot be deleted.');
    }

    return this.roleRepository.softDelete(id);
  }

  async initializeSystemRoles() {
    const systemRoles = [
      { name: 'super_admin', isSystem: true, permissions: ['*'] },
      { name: 'admin', isSystem: true, permissions: ['user:manage'] },
      { name: 'vendeur', isSystem: true, permissions: ['product:manage', 'order:manage'] },
      { name: 'livreur', isSystem: true, permissions: ['delivery:manage'] },
      { name: 'client', isSystem: true, permissions: [] },
    ];

    for (const roleData of systemRoles) {
      const exists = await this.findByName(roleData.name);
      if (!exists) {
        await this.roleRepository.create(roleData);
      }
    }
  }
}
