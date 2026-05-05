import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './user.entity';
import { hashPassword } from '../../common/helpers/hash.helper';
import { UserRole } from '../../common/enum/role.enum';
import { IBaseRepository } from '../../database/index';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/audit-log.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/notification.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Store } from '../store/store.entity';
import { Product } from '../products/product.entity';
import { Order } from '../orders/order.entity';
import { S3StorageService } from '../../libs/storage/s3-storage.service';
import { CacheService } from '../../libs/cache/cache.service';

const USER_CACHE_KEY = 'user_profile_';
const USER_EMAIL_CACHE_KEY = 'user_email_';

@Injectable()
export class UsersService {
  constructor(
    @Inject('USER_REPOSITORY')
    private readonly userRepository: IBaseRepository<User>,
    @InjectRepository(Store)
    private readonly storeRepo: Repository<Store>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    private readonly auditService: AuditService,
    private readonly storageService: S3StorageService,
    private readonly notificationsService: NotificationsService,
    private readonly cache: CacheService,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    const cacheKey = `${USER_EMAIL_CACHE_KEY}${email}`;
    const cached = await this.cache.get<User>(cacheKey);
    if (cached) return cached;

    const user = await this.userRepository.findOne({ email } as object);
    if (user) {
      await this.cache.set(cacheKey, user, { ttlSeconds: 3600 });
    }
    return user;
  }

  async findByResetToken(token: string): Promise<User | null> {
    return this.userRepository.findOne({ resetPasswordToken: token } as object);
  }

  async findAll(): Promise<any[]> {
    const users = await this.userRepository.find();

    // Calcul des statistiques en parallèle pour chaque utilisateur
    return Promise.all(
      users.map(async (user) => {
        let stats = { productCount: 0, totalRevenue: 0, seniority: 0 };

        // Calcul ancienneté (en jours)
        const diffTime = Math.abs(
          new Date().getTime() - new Date(user.createdAt).getTime(),
        );
        stats.seniority = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (user.role === UserRole.VENDEUR) {
          const store = await this.storeRepo.findOne({
            where: { ownerId: user.id },
          });
          if (store) {
            stats.productCount = await this.productRepo.count({
              where: { storeId: store.id },
            });
            const orders = await this.orderRepo.find({
              where: { storeId: store.id },
            });
            stats.totalRevenue = orders.reduce(
              (sum, order) => sum + Number(order.totalAmount || 0),
              0,
            );
          }
        }

        return { ...user, stats };
      }),
    );
  }

  async findAllWithDeleted(): Promise<User[]> {
    return this.userRepository.find({ withDeleted: true });
  }

  async restore(id: string) {
    // 1. On restaure techniquement le compte (soft-delete recovery)
    await this.userRepository.restore(id);

    // 2. On récupère le compte (en incluant les supprimés au cas où) pour forcer le nettoyage
    const user = await this.userRepository.findOne({
      id,
      withDeleted: true,
    } as any);
    if (user) {
      user.suspensionUntil = null;
      user.suspensionReason = null;
      await this.userRepository.save(user); // Force la sauvegarde de l'entité propre
      await this.clearUserCache(id, user.email);
    }
    return { message: 'User fully restored and unsuspended' };
  }

  async create(createUserDto: CreateUserDto) {
    const existing = await this.findByEmail(createUserDto.email);
    if (existing) {
      throw new ConflictException('This email is already in use.');
    }

    // Check how many users already exist
    const userCount = await this.userRepository.count();

    // Logic: First registered user becomes SUPER_ADMIN
    // Every other user becomes whatever is in the DTO (default to CLIENT)
    let finalRole = createUserDto.role ?? UserRole.CLIENT;

    if (userCount === 0) {
      finalRole = UserRole.SUPER_ADMIN;
    } else if (finalRole === UserRole.SUPER_ADMIN) {
      // Security: Prevent a profile from being created as SUPER_ADMIN if one already exists
      finalRole = UserRole.CLIENT;
    }

    const hashedPassword = await hashPassword(createUserDto.password);
    const newUser = await this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
      role: finalRole,
      isVerified: finalRole !== UserRole.VENDEUR, // Les vendeurs commencent non vérifiés
    });

    const res = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
    };

    // 10. Notify admins if a new user (Seller or Client) is created
    if (finalRole === UserRole.VENDEUR || finalRole === UserRole.CLIENT) {
      this.notifyAdminsOfNewUser(newUser);
    }

    return res;
  }

  private async notifyAdminsOfNewUser(user: User) {
    try {
      const admins = await this.userRepository.find({
        where: [{ role: UserRole.ADMIN }, { role: UserRole.SUPER_ADMIN }],
      } as any);

      const roleLabel = user.role === UserRole.VENDEUR ? 'Vendeur' : 'Client';
      const colorTag = user.role === UserRole.VENDEUR ? 'INFO' : 'USER';

      for (const admin of admins) {
        await this.notificationsService.create({
          userId: admin.id,
          type: colorTag as any,
          title: `Nouveau ${roleLabel} inscrit`,
          message: `${user.name} (${user.email}) vient de rejoindre la plateforme Afrigari en tant que ${roleLabel}.`,
          metadata: JSON.stringify({ userId: user.id }),
        });
      }
    } catch (error) {
      console.error('Failed to notify admins of new user registration', error);
    }
  }

  async findOne(id: string) {
    const cacheKey = `${USER_CACHE_KEY}${id}`;
    const cached = await this.cache.get<User>(cacheKey);
    if (cached) return cached;

    const user = await this.userRepository.findOne({
      id,
      withDeleted: true,
    } as any);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found.`);
    }
    
    await this.cache.set(cacheKey, user, { ttlSeconds: 3600 });
    return user;
  }

  async hardDelete(id: string) {
    await this.findOne(id);

    // Si c'est un vendeur, on tente de supprimer sa boutique d'abord pour éviter les erreurs SQL (FK constraint)
    const store = await this.storeRepo.findOne({ where: { ownerId: id } });
    if (store) {
      await this.storeRepo.delete(store.id);
    }

    const user = await this.findOne(id);
    const result = await this.userRepository.delete(id);
    await this.clearUserCache(id, user.email);
    return result;
  }

  async remove(id: string) {
    const user = await this.findOne(id);
    const result = await this.userRepository.softDelete(id);
    await this.clearUserCache(id, user.email);
    return result;
  }

  async update(id: string, updateUserDto: UpdateUserDto = {}) {
    await this.findOne(id);
    if (updateUserDto.password) {
      updateUserDto.password = await hashPassword(updateUserDto.password);
    }

    // Handle Base64 profile photo upload to S3
    if (
      updateUserDto.profilePhoto &&
      updateUserDto.profilePhoto.startsWith('data:image')
    ) {
      try {
        const base64Data = updateUserDto.profilePhoto.split(',')[1];
        const mimeType = updateUserDto.profilePhoto.split(';')[0].split(':')[1];
        const extension = mimeType.split('/')[1];
        const buffer = Buffer.from(base64Data, 'base64');

        const fileUrl = await this.storageService.uploadFile({
          buffer,
          originalname: `profile-${id}-${Date.now()}.${extension}`,
          mimetype: mimeType,
        });

        updateUserDto.profilePhoto = fileUrl;
      } catch (error) {
        console.error(
          "Erreur lors de l'upload de la photo de profil vers S3",
          error,
        );
      }
    }

    const result = await this.userRepository.update(id, updateUserDto || {});
    const user = await this.findOne(id);
    await this.clearUserCache(id, user.email);
    return result;
  }

  async submitKyc(id: string, kycData: any) {
    const user = await this.findOne(id);

    // Process photos if provided in Base64
    const photoFields = ['idCardFront', 'idCardBack', 'sellerSelfie'];
    const updatedFields: any = { ...kycData, kycStatus: 'PENDING' };

    for (const field of photoFields) {
      if (kycData[field] && kycData[field].startsWith('data:image')) {
        const base64Data = kycData[field].split(',')[1];
        const mimeType = kycData[field].split(';')[0].split(':')[1];
        const extension = mimeType.split('/')[1];
        const buffer = Buffer.from(base64Data, 'base64');

        const fileUrl = await this.storageService.uploadFile({
          buffer,
          originalname: `kyc-${field}-${id}-${Date.now()}.${extension}`,
          mimetype: mimeType,
        });

        updatedFields[field] = fileUrl;
      }
    }

    await this.userRepository.update(id, updatedFields);
    await this.clearUserCache(id, user.email);

    // Notify admins of the new KYC submission
    await this.notifyAdminsOfKycSubmission(user);

    return this.findOne(id);
  }

  private async notifyAdminsOfKycSubmission(user: User) {
    try {
      const admins = await this.userRepository.find({
        where: [{ role: UserRole.ADMIN }, { role: UserRole.SUPER_ADMIN }],
      } as any);

      for (const admin of admins) {
        await this.notificationsService.create({
          userId: admin.id,
          type: 'INFO' as any,
          title: 'Nouveau Dossier KYC',
          message: `Le vendeur ${user.name} a soumis ses documents d'identité pour examen.`,
          metadata: JSON.stringify({ userId: user.id, action: 'KYC_REVIEW' }),
        });
      }
    } catch (error) {
      console.error('Failed to notify admins of KYC submission', error);
    }
  }

  async reviewKyc(
    id: string,
    reviewData: { status: 'APPROVED' | 'REJECTED'; reasons?: any },
  ) {
    const user = await this.findOne(id);

    const updateData: any = {
      kycStatus: reviewData.status,
      kycRejectionReasons:
        reviewData.status === 'REJECTED'
          ? JSON.stringify(reviewData.reasons)
          : null,
      isVerified: reviewData.status === 'APPROVED', // Si approuvé, le compte est vérifié
    };

    await this.userRepository.update(id, updateData);
    await this.clearUserCache(id, user.email);

    // Notify the user
    const title =
      reviewData.status === 'APPROVED' ? 'Identité vérifiée' : 'Dossier rejeté';
    const message =
      reviewData.status === 'APPROVED'
        ? 'Félicitations ! Votre identité a été vérifiée avec succès. Vous avez maintenant accès à votre compte vendeur.'
        : "Votre dossier d'identité a été rejeté. Veuillez corriger les erreurs signalées pour continuer.";

    await this.notificationsService.create({
      userId: id,
      type: NotificationType.INFO,
      title,
      message,
    });

    return this.findOne(id);
  }

  private async clearUserCache(id: string, email: string) {
    await this.cache.del(`${USER_CACHE_KEY}${id}`);
    await this.cache.del(`${USER_EMAIL_CACHE_KEY}${email}`);
  }
}
