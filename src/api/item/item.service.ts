import { Injectable } from '@nestjs/common';
import { CreateItemDto } from './dto/create-item.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { ItemEntity } from 'src/core/entity/items.entity';
import { ItemRepo } from 'src/core/repository/item.repository';
import { errorCatch } from 'src/infrastructure/lib/exception/error.catch';
import { ItemStatus, ItemType } from 'src/common/enum';

@Injectable()
export class ItemService {
  constructor(
    @InjectRepository(ItemEntity) private readonly itemRepo: ItemRepo,
  ) {}
  async create(createItemDto: CreateItemDto): Promise<object | undefined> {
    try {
      const newItemObj = this.itemRepo.create(createItemDto);
      const saved = await this.itemRepo.save(newItemObj);
      return saved;
    } catch (error) {
      return errorCatch(error);
    }
  }

  async findAllFoundItems(): Promise<object | undefined> {
    try {
      const items = await this.itemRepo.find({
        where: { type: ItemType.FOUND, status: ItemStatus.APPROVED },
        relations: ['user', 'location', 'itemImages'],
      });

      if (items.length > 0) {
        return items.map((item) => ({
          id: item.id,
          user: item.user,
          type: item.type,
          title: item.title,
          description: item.description,
          location: item.location,
          date_found_lost: item.date_found_lost,
          time_found_lost: item.time_found_lost,
          is_resolved: item.is_resolved,
          status: item.status,
          itemImages: item.itemImages,
        }));
      } else {
        return [];
      }
    } catch (e) {
      return errorCatch(e);
    }
  }

  async findAllFoundItemsUser(
    telegram_id: number,
  ): Promise<object | undefined> {
    try {
      const items = await this.itemRepo.find({
        where: { user: { telegram_id }, type: ItemType.FOUND },
        relations: ['user', 'location', 'itemImages'],
      });

      if (items.length > 0) {
        return items.map((item) => ({
          id: item.id,
          user: item.user,
          type: item.type,
          title: item.title,
          description: item.description,
          location: item.location,
          date_found_lost: item.date_found_lost,
          time_found_lost: item.time_found_lost,
          is_resolved: item.is_resolved,
          status: item.status,
          itemImages: item.itemImages,
        }));
      } else {
        return [];
      }
    } catch (e) {
      return errorCatch(e);
    }
  }

  async findAllLostItemsUser(telegram_id: number): Promise<object | undefined> {
    try {
      const items = await this.itemRepo.find({
        where: { user: { telegram_id }, type: ItemType.LOST },
        relations: ['user', 'location', 'itemImages'],
      });

      if (items.length > 0) {
        return items.map((item) => ({
          id: item.id,
          user: item.user,
          type: item.type,
          title: item.title,
          description: item.description,
          location: item.location,
          date_found_lost: item.date_found_lost,
          time_found_lost: item.time_found_lost,
          is_resolved: item.is_resolved,
          status: item.status,
          itemImages: item.itemImages,
        }));
      } else {
        return [];
      }
    } catch (e) {
      return errorCatch(e);
    }
  }

  async findAllLostItems(): Promise<object | undefined> {
    try {
      const items = await this.itemRepo.find({
        where: { type: ItemType.LOST, status: ItemStatus.APPROVED },
        relations: ['user', 'location', 'itemImages'],
      });

      if (items.length > 0) {
        return items.map((item) => ({
          id: item.id,
          user: item.user,
          type: item.type,
          title: item.title,
          description: item.description,
          location: item.location,
          date_found_lost: item.date_found_lost,
          time_found_lost: item.time_found_lost,
          is_resolved: item.is_resolved,
          status: item.status,
          itemImages: item.itemImages,
        }));
      } else {
        return [];
      }
    } catch (e) {
      return errorCatch(e);
    }
  }

  async findAllFoundItemsAdmin(): Promise<object | undefined> {
    try {
      const items = await this.itemRepo.find({
        where: { type: ItemType.FOUND, status: ItemStatus.PENDING },
        relations: ['user', 'location', 'itemImages'],
      });
      if (items.length > 0) {
        return items.map((item) => ({
          id: item.id,
          user: item.user,
          type: item.type,
          title: item.title,
          description: item.description,
          location: item.location,
          date_found_lost: item.date_found_lost,
          time_found_lost: item.time_found_lost,
          is_resolved: item.is_resolved,
          status: item.status,
          itemImages: item.itemImages,
        }));
      } else {
        return [];
      }
    } catch (e) {
      return errorCatch(e);
    }
  }

  async findAllLostItemsAdmin(): Promise<object | undefined> {
    try {
      const items = await this.itemRepo.find({
        where: { type: ItemType.LOST, status: ItemStatus.PENDING },
        relations: ['user', 'location', 'itemImages'],
      });

      if (items.length > 0) {
        return items.map((item) => ({
          id: item.id,
          user: item.user,
          type: item.type,
          title: item.title,
          description: item.description,
          location: item.location,
          date_found_lost: item.date_found_lost,
          time_found_lost: item.time_found_lost,
          is_resolved: item.is_resolved,
          status: item.status,
          itemImages: item.itemImages,
        }));
      } else {
        return [];
      }
    } catch (e) {
      return errorCatch(e);
    }
  }

  async findItemByTelegramId(telegram_id: number): Promise<object | undefined> {
    try {
      const item = await this.itemRepo.findOne({
        where: { user: { telegram_id } },
      });

      if (item) {
        return item;
      }
      return {};
    } catch (e) {
      return errorCatch(e);
    }
  }

  async findItemById(item_id: string): Promise<object | undefined> {
    try {
      const item = await this.itemRepo.findOne({
        where: { id: item_id },
        relations: ['location'],
      });

      if (item) {
        return item;
      }
      return {};
    } catch (e) {
      return errorCatch(e);
    }
  }

  async updateItem(
    item_id: string,
    updateDto: object,
  ): Promise<object | undefined | boolean> {
    try {
      const { affected } = await this.itemRepo.update(item_id, updateDto);

      if (!affected) {
        return false;
      }
      return true;
    } catch (e) {
      return errorCatch(e);
    }
  }

  async updateItemStatusByIdForAcceptance(
    itemId: string,
  ): Promise<object | undefined | boolean> {
    try {
      await this.itemRepo.update(itemId, {
        status: ItemStatus.APPROVED,
      });

      const updatedItem = await this.itemRepo.findOne({
        where: { id: itemId },
        relations: ['user'],
      });

      if (updatedItem) {
        return updatedItem;
      }
      return undefined;
    } catch (e) {
      return errorCatch(e);
    }
  }

  async updateItemStatusByIdForReject(
    itemId: string,
  ): Promise<object | undefined | boolean> {
    try {
      await this.itemRepo.update(itemId, {
        status: ItemStatus.REJECTED,
      });

      const updatedItem = await this.itemRepo.findOne({
        where: { id: itemId },
        relations: ['user'],
      });
      if (updatedItem) {
        return updatedItem;
      }
      return undefined;
    } catch (e) {
      return errorCatch(e);
    }
  }

  async updateItemStatusByIdForPending(
    itemId: string,
  ): Promise<object | undefined> {
    try {
      await this.itemRepo.update(itemId, {
        status: ItemStatus.PENDING,
      });

      const updatedItem = await this.itemRepo.findOne({
        where: { id: itemId },
        relations: ['user'],
      });
      if (updatedItem) {
        return updatedItem;
      }
      return undefined;
    } catch (e) {
      return errorCatch(e);
    }
  }

  async deleteItemById(itemId: string): Promise<object | undefined | boolean> {
    try {
      const { affected } = await this.itemRepo.delete(itemId);

      if (affected === 1) {
        return true;
      }
      return false;
    } catch (e) {
      return errorCatch(e);
    }
  }
}
