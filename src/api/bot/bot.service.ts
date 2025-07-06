import { Injectable, OnModuleInit } from '@nestjs/common';
import { errorCatch } from 'src/infrastructure/lib/exception/error.catch';
import { Context, Markup, Telegraf } from 'telegraf';
import { CreateUserDto } from '../user/dto/create.user.dto';
import { UserService } from '../user/user.service';
import { InjectBot } from 'nestjs-telegraf';
import { ItemService } from '../item/item.service';
import {
  ItemStatus,
  ItemType,
  LocationDistrict,
  LocationRegion,
} from 'src/common/enum';
import { CreateItemDto } from '../item/dto/create-item.dto';
import { LocationService } from '../location/location.service';
import { CreateLocationDto } from '../location/dto/create-location.dto';
import { LocationEntity } from 'src/core/entity/locations.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { ItemImageEntity } from 'src/core/entity/items.images.entity';
import { ItemImageRepo } from 'src/core/repository/item.image.repository';
import { ItemEntity } from 'src/core/entity/items.entity';
import { UserEntity } from 'src/core/entity/users.entity';
import { InputMediaPhoto } from 'telegraf/typings/core/types/typegram';
import {
  sendMessageFunctionAcceptance,
  sendMessageFuncionReject,
} from 'src/infrastructure/lib/functions/functions';

export interface SessionContext extends Context {
  session?: {
    phone?: string;
    full_name?: string;
    user?: UserEntity;
    itemId?: string;
    state?: string;
    type?: ItemType;
    title?: string;
    descriptionItem?: string;
    location?: LocationEntity;
    location_id?: string;
    region?: LocationRegion;
    district?: LocationDistrict;
    latitude?: number;
    longitude?: number;
    descriptionLocation?: string;
    date_found_lost?: string;
    time_found_lost?: string;
    found_images?: string[];
    lost_images?: string[];
    saveImagesTimeout?: NodeJS.Timeout;
    is_resolved?: boolean;
    status?: ItemStatus;
    admin_reject_reason?: string;
  };
}

@Injectable()
export class BotService implements OnModuleInit {
  constructor(
    private userService: UserService,
    private locationService: LocationService,
    private itemService: ItemService,
    @InjectRepository(ItemImageEntity)
    private readonly itemImageRepo: ItemImageRepo,
    @InjectBot() private readonly bot: Telegraf,
  ) {}

  isAdmin(userId: number) {
    const admins = [887964728];
    return admins.includes(userId);
  }

  async onModuleInit() {
    await this.bot.telegram.setMyCommands([
      {
        command: 'start',
        description: 'Botni ishga tushirish',
      },
      {
        command: 'yordam',
        description: 'Yordam olish',
      },
    ]);
  }

  async onStart(ctx: SessionContext): Promise<object | undefined> {
    try {
      let telegramId: any;
      if (ctx.from) {
        telegramId = ctx.from.id;
      }

      if (this.isAdmin(telegramId)) {
        await this.onStartAdmin(ctx);
        return;
      }

      const hasUser = await this.userService.findUserByTelegramId(telegramId);

      if (!hasUser) {
        await ctx.reply(
          `👋 *Assalomu alaykum!*

Bu bot orqali *yo'qolgan yoki topilgan buyumlar* haqida e'lon berishingiz mumkin.

📞 Davom etish uchun iltimos, telefon raqamingizni ulashing.`,
          {
            parse_mode: 'Markdown',
            reply_markup: {
              resize_keyboard: true,
              one_time_keyboard: true,
              keyboard: [
                [
                  {
                    text: 'Share phone number',
                    request_contact: true,
                  },
                ],
              ],
            },
          },
        );
      } else {
        await ctx.reply(`Siz ro'yhatdan o'tib bo'lgansiz!`);
        await this.onMain(ctx);
      }
    } catch (e) {
      return errorCatch(e);
    }
  }

  async onStartAdmin(ctx: SessionContext): Promise<object | undefined> {
    try {
      const userId = ctx.from?.id;
      if (!userId || !this.isAdmin(userId)) {
        return;
      }

      await ctx.reply(
        `Admin bo'lim`,
        Markup.keyboard([
          ["Yangi e'lonlar"],
          ['Tasdiqlanganlar', 'Rad etilganlar'],
        ])
          .resize()
          .oneTime(),
      );
    } catch (e) {
      return errorCatch(e);
    }
  }

  async onMain(ctx: SessionContext): Promise<object | undefined> {
    try {
      await ctx.reply(
        'Asosiy menyu:',
        Markup.keyboard([
          ["Yangi e'lon berish", "E'lonlarni ko'rish", "Mening e'lonlarim"],
          ['Yordam'],
        ])
          .resize()
          .oneTime(),
      );
    } catch (e) {
      return errorCatch(e);
    }
  }

  async onContact(ctx: SessionContext): Promise<object | undefined> {
    try {
      if (ctx.message && 'contact' in ctx.message) {
        const phone = ctx.message.contact.phone_number;

        if (ctx.session) {
          ctx.session.phone = phone;
          ctx.session.state = 'entering_fullName';
          await ctx.reply(
            `✅ Rahmat! Endi iltimos, *ism va familyangizni* kiriting.\n\n_Misol: Akbar Shomansurov_`,
            {
              parse_mode: 'Markdown',
              reply_markup: {
                remove_keyboard: true,
              },
            },
          );
        }
      }
    } catch (e) {
      return errorCatch(e);
    }
  }

  async onHearNewAnnouncementAdmin(ctx: Context): Promise<object | undefined> {
    try {
      await ctx.reply(
        `E'lon turini tanlang:`,
        Markup.inlineKeyboard([
          [Markup.button.callback('Topilgan buyumlar', 'found_items_admin')],
          [Markup.button.callback("Yo'qolgan buyumlar", 'lost_items_admin')],
        ]),
      );
    } catch (e) {
      return errorCatch(e);
    }
  }

  async onHearAcceptedAnnouncementAdmin(
    ctx: Context,
  ): Promise<object | undefined> {
    try {
      const items = await this.itemService.findAllAcceptedAnnouncements();

      if ((items as ItemEntity[]).length > 0) {
        for (let item of items as ItemEntity[]) {
          const mediaGroup: InputMediaPhoto[] = [];

          if (item.itemImages.length > 0) {
            item.itemImages.forEach((img, index) => {
              mediaGroup.push({
                type: 'photo',
                media: img.image_url as string,
                caption:
                  index === 0
                    ? `🟢 *Qabul qilingan buyumlar*\n\n👜 *Buyum:* ${item.title}\n📍 *Joy:* ${item.location.description}\n🕰 *Vaqt:* ${item.time_found_lost}, ${item.date_found_lost}\n📝 *Tavsif:* ${item.description}\n👤 *Topuvchi:* [${item.user.username}](https://t.me/${item.user.username})\n📞 *Telefon:* ${item.user.phone_number}\n📝 *Holati:* ${item.status}\n 🗂️ *Xil:* ${item.type}`
                    : undefined,
                parse_mode: index === 0 ? 'Markdown' : undefined,
              });
            });
            const chunkSize = 10;
            for (let i = 0; i < mediaGroup.length; i += chunkSize) {
              const chunk = mediaGroup.slice(i, i + chunkSize);
              await ctx.replyWithMediaGroup(chunk);
            }
          } else {
            const text = `Rasm mavjud emas!\n\n🟢 *Qabul qilingan buyumlar*\n\n👜 *Buyum:* ${item.title}\n📍 *Joy:* ${item.location.description}\n🕰 *Vaqt:* ${item.time_found_lost}, ${item.date_found_lost}\n📝 *Tavsif:* ${item.description}\n👤 *Egasi:* [${item.user.username}](https://t.me/${item.user.username})\n📞 *Telefon:* ${item.user.phone_number}\n📝 *Holati:* ${item.status}\n 🗂️ *Xil:* ${item.type}`;
            await ctx.reply(text, {
              parse_mode: 'Markdown',
              // @ts-ignore
              disable_web_page_preview: true,
            });
          }
        }
      } else {
        await ctx.reply('🔍 Hozircha tasdiqlangan buyumlar mavjud emas.');
      }
    } catch (e) {
      return errorCatch(e);
    }
  }

  async onHearRejectedAnnouncementAdmin(
    ctx: Context,
  ): Promise<object | undefined> {
    try {
      const items = await this.itemService.findAllRejectedAnnouncements();

      if ((items as ItemEntity[]).length > 0) {
        for (let item of items as ItemEntity[]) {
          const mediaGroup: InputMediaPhoto[] = [];

          if (item.itemImages.length > 0) {
            item.itemImages.forEach((img, index) => {
              mediaGroup.push({
                type: 'photo',
                media: img.image_url as string,
                caption:
                  index === 0
                    ? `❌ *Qabul qilinmagan buyumlar*\n\n👜 *Buyum:* ${item.title}\n📍 *Joy:* ${item.location.description}\n🕰 *Vaqt:* ${item.time_found_lost}, ${item.date_found_lost}\n📝 *Tavsif:* ${item.description}\n👤 *Topuvchi:* [${item.user.username}](https://t.me/${item.user.username})\n📞 *Telefon:* ${item.user.phone_number}\n📝 *Holati:* ${item.status}\n 🗂️ *Xil:* ${item.type}`
                    : undefined,
                parse_mode: index === 0 ? 'Markdown' : undefined,
              });
            });
            const chunkSize = 10;
            for (let i = 0; i < mediaGroup.length; i += chunkSize) {
              const chunk = mediaGroup.slice(i, i + chunkSize);
              await ctx.replyWithMediaGroup(chunk);
            }
          } else {
            const text = `Rasm mavjud emas!\n\❌ *Qabul qilinmagan buyumlar*\n\n👜 *Buyum:* ${item.title}\n📍 *Joy:* ${item.location.description}\n🕰 *Vaqt:* ${item.time_found_lost}, ${item.date_found_lost}\n📝 *Tavsif:* ${item.description}\n👤 *Egasi:* [${item.user.username}](https://t.me/${item.user.username})\n📞 *Telefon:* ${item.user.phone_number}\n📝 *Holati:* ${item.status}\n 🗂️ *Xil:* ${item.type}`;
            await ctx.reply(text, {
              parse_mode: 'Markdown',
              // @ts-ignore
              disable_web_page_preview: true,
            });
          }
        }
      } else {
        await ctx.reply('🔍 Hozircha rad etilgan buyumlar mavjud emas.');
      }
    } catch (e) {
      return errorCatch(e);
    }
  }

  async onHearNewAnnouncement(
    ctx: SessionContext,
  ): Promise<object | undefined> {
    try {
      if (ctx.session) {
        ctx.session.state = 'select_item_type';
        await ctx.reply(
          `E'lon turini tanlang:`,
          Markup.inlineKeyboard([
            [Markup.button.callback('Topilgan buyum', 'found_sth')],
            [Markup.button.callback("Yo'qolgan buyum", 'lost_sth')],
          ]),
        );
      }
    } catch (e) {
      return errorCatch(e);
    }
  }

  async onHearAllAnouncement(ctx: SessionContext): Promise<object | undefined> {
    try {
      await ctx.reply(
        `Qaysi turdagi e'lonlarni ko'rishni xohlaysiz?`,
        Markup.inlineKeyboard([
          [Markup.button.callback('Topilgan buyumlar', 'found_items')],
          [Markup.button.callback("Yo'qolgan buyumlar", 'lost_items')],
        ]),
      );
    } catch (e) {
      return errorCatch(e);
    }
  }

  async onHearViewEditMyAnnouncements(
    ctx: SessionContext,
  ): Promise<object | undefined> {
    try {
      await ctx.reply(
        `Kerakli bo'limni tanlang:`,
        Markup.inlineKeyboard([
          [
            Markup.button.callback(
              'Mening topilgan buyumlarim',
              'my_found_items',
            ),
          ],
          [
            Markup.button.callback(
              "Mening yo'qolgan buyumlarim",
              'my_lost_items',
            ),
          ],
        ]),
      );
    } catch (e) {
      return errorCatch(e);
    }
  }

  async onActionPhotoAvailable(
    ctx: SessionContext,
  ): Promise<object | undefined> {
    try {
      if (ctx.session) {
        ctx.session.state = 'confirming_found_item_announcement';
        await ctx.reply(
          `E'lonni tasdiqlaysizmi?`,
          Markup.inlineKeyboard([
            [Markup.button.callback('Ha', 'yes')],
            [Markup.button.callback("Yo'q", 'not')],
          ]),
        );
      }
    } catch (e) {
      return errorCatch(e);
    }
  }

  async onActionFound(ctx: SessionContext): Promise<object | undefined> {
    await ctx.answerCbQuery();
    try {
      if (ctx.session) {
        ctx.session.state = 'creating_found_item';
        ctx.session.type = ItemType.FOUND;
        await ctx.reply('🏷️ Iltimos, topilgan buyumning nomini kiriting');
      }
    } catch (e) {
      return errorCatch(e);
    }
  }

  async onActionLost(ctx: SessionContext): Promise<object | undefined> {
    await ctx.answerCbQuery();
    try {
      if (ctx.session) {
        ctx.session.state = 'creating_found_item';
        ctx.session.type = ItemType.LOST;
        await ctx.reply("🏷️ Iltimos, yo'qolgan buyumning nomini kiriting");
      }
    } catch (e) {
      return errorCatch(e);
    }
  }

  async onActionYes(ctx: SessionContext): Promise<object | undefined> {
    await ctx.answerCbQuery();
    try {
      if (
        ctx.session &&
        ctx.session.state === 'confirming_found_item_announcement'
      ) {
        const region = ctx.session.region;
        const district = ctx.session.district;
        const description = ctx.session.descriptionLocation;
        const createLocation: CreateLocationDto = {
          region: region!,
          district: district!,
          description: description!,
        };

        const newLocation = (await this.locationService.create(
          createLocation,
        )) as LocationEntity;

        if (newLocation) {
          ctx.session.location = newLocation;
        }

        const user = ctx.session.user;
        const type = ctx.session.type;
        const title = ctx.session.title;
        const descriptionItem = ctx.session.descriptionItem;
        const location = ctx.session.location;
        const date_found_lost = ctx.session.date_found_lost;
        const time_found_lost = ctx.session.time_found_lost;

        const newItem: CreateItemDto = {
          user: user!,
          type: type!,
          title: title!,
          description: descriptionItem!,
          location: location!,
          date_found_lost: date_found_lost!,
          time_found_lost: time_found_lost!,
        };
        const createdItem = (await this.itemService.create(
          newItem,
        )) as ItemEntity;
        if (createdItem) {
          if (createdItem.type === ItemType.FOUND) {
            const { found_images } = ctx.session;
            if (found_images && found_images.length > 0) {
              const imagesUrl = found_images.map((imageUrl: string) => ({
                item: createdItem,
                image_url: imageUrl,
              }));

              await this.itemImageRepo.save(imagesUrl);
            }
            await ctx.reply(`Ma'lumotlaringiz muvaffaqiyatli saqlandi
Admin tasdiqlaganidan so'ng, e'loningiz e'lonlar ro'yxatida ko'rinadi.`);
            await this.onMain(ctx);
          } else if (createdItem.type === ItemType.LOST) {
            const { lost_images } = ctx.session;
            if (lost_images && lost_images.length > 0) {
              const imagesUrl = lost_images.map((imageUrl: string) => ({
                item: createdItem,
                image_url: imageUrl,
              }));

              await this.itemImageRepo.save(imagesUrl);
            }
            await ctx.reply(`Ma'lumotlaringiz muvaffaqiyatli saqlandi
Admin tasdiqlaganidan so'ng, e'loningiz e'lonlar ro'yxatida ko'rinadi.`);
            await this.onMain(ctx);
          }
        }
      }
    } catch (e) {
      return errorCatch(e);
    }
  }

  async onActionNot(ctx: SessionContext): Promise<object | undefined> {
    await ctx.answerCbQuery();
    try {
      if (
        ctx.session &&
        ctx.session.state === 'confirming_found_item_announcement'
      ) {
        ctx.session = {};
        await this.onMain(ctx);
      }
    } catch (e) {
      return errorCatch(e);
    }
  }

  async onActionFoundAllItemsAdmin(
    ctx: SessionContext,
  ): Promise<object | undefined> {
    await ctx.answerCbQuery();
    try {
      const items = await this.itemService.findAllFoundItemsAdmin();

      if ((items as ItemEntity[]).length > 0 && ctx.session) {
        for (let item of items as ItemEntity[]) {
          ctx.session.itemId = item.id;
          const mediaGroup: InputMediaPhoto[] = [];

          item.itemImages.forEach((img, index) => {
            mediaGroup.push({
              type: 'photo',
              media: img.image_url as string,
              caption:
                index === 0
                  ? `Yangi e'lon\n\n🟢 *Topilgan buyumlar*\n\n👜 *Buyum:* ${item.title}\n📍 *Joy:* ${item.location.description}\n🕰 *Vaqt:* ${item.time_found_lost}, ${item.date_found_lost}\n📝 *Tavsif:* ${item.description}\n👤 *Topuvchi:* [${item.user.username}](https://t.me/${item.user.username})\n📞 *Telefon:* ${item.user.phone_number}`
                  : undefined,
              parse_mode: index === 0 ? 'Markdown' : undefined,
            });
          });
          const chunkSize = 10;
          for (let i = 0; i < mediaGroup.length; i += chunkSize) {
            const chunk = mediaGroup.slice(i, i + chunkSize);
            await ctx.replyWithMediaGroup(chunk);
            await ctx.reply(
              `Elonni tasdiqlaysizmi:`,
              Markup.inlineKeyboard([
                [
                  Markup.button.callback(
                    '✅ Ha',
                    `confirm_found_item_admin:${ctx.session.itemId}`,
                  ),
                ],
                [Markup.button.callback("❌ Yo'q", `reject_found_item_admin`)],
              ]),
            );
          }
        }
      } else {
        await ctx.reply(
          `🔍 Topilgan buyumlar bo‘limida hozircha e’lonlar mavjud emas.`,
        );
      }
    } catch (e) {
      return errorCatch(e);
    }
  }

  async onActionLostAllItemsAdmin(
    ctx: SessionContext,
  ): Promise<object | undefined> {
    await ctx.answerCbQuery();
    try {
      const items = await this.itemService.findAllLostItemsAdmin();

      if ((items as ItemEntity[]).length > 0 && ctx.session) {
        for (let item of items as ItemEntity[]) {
          ctx.session.itemId = item.id;
          const mediaGroup: InputMediaPhoto[] = [];
          if (item.itemImages.length > 0) {
            item.itemImages.forEach((img, index) => {
              mediaGroup.push({
                type: 'photo',
                media: img.image_url as string,
                caption:
                  index === 0
                    ? `Yangi e'lon\n\n🟢 *Yo'qolgan buyumlar*\n\n👜 *Buyum:* ${item.title}\n📍 *Joy:* ${item.location.description}\n🕰 *Vaqt:* ${item.time_found_lost}, ${item.date_found_lost}\n📝 *Tavsif:* ${item.description}\n👤 *Egasi:* [${item.user.username}](https://t.me/${item.user.username})\n📞 *Telefon:* ${item.user.phone_number}`
                    : undefined,
                parse_mode: index === 0 ? 'Markdown' : undefined,
              });
            });
            const chunkSize = 10;
            for (let i = 0; i < mediaGroup.length; i += chunkSize) {
              const chunk = mediaGroup.slice(i, i + chunkSize);
              await ctx.replyWithMediaGroup(chunk);
              await ctx.reply(
                `Elonni tasdiqlaysizmi:`,
                Markup.inlineKeyboard([
                  [
                    Markup.button.callback(
                      '✅ Ha',
                      `confirm_found_item_admin:${ctx.session.itemId}`,
                    ),
                  ],
                  [
                    Markup.button.callback(
                      "❌ Yo'q",
                      `reject_found_item_admin`,
                    ),
                  ],
                ]),
              );
            }
          } else {
            const text = `Rasm mavjud emas!\n\nYangi e'lon\n\n🟢 *Yo'qolgan buyumlar*\n\n👜 *Buyum:* ${item.title}\n📍 *Joy:* ${item.location.description}\n🕰 *Vaqt:* ${item.time_found_lost}, ${item.date_found_lost}\n📝 *Tavsif:* ${item.description}\n👤 *Egasi:* [${item.user.username}](https://t.me/${item.user.username})\n📞 *Telefon:* ${item.user.phone_number}`;
            await ctx.reply(text, {
              parse_mode: 'Markdown',
              // @ts-ignore
              disable_web_page_preview: true,
            });
            await ctx.reply(
              `Elonni tasdiqlaysizmi:`,
              Markup.inlineKeyboard([
                [
                  Markup.button.callback(
                    '✅ Ha',
                    `confirm_found_item_admin:${ctx.session.itemId}`,
                  ),
                ],
                [Markup.button.callback("❌ Yo'q", `reject_found_item_admin`)],
              ]),
            );
          }
        }
      } else {
        await ctx.reply(
          `🔍 Yo'qolgan buyumlar bo‘limida hozircha e’lonlar mavjud emas.`,
        );
      }
    } catch (e) {
      return errorCatch(e);
    }
  }

  async onActionFoundItemAcceptance(
    ctx: SessionContext,
  ): Promise<object | undefined> {
    await ctx.answerCbQuery();
    try {
      if (ctx.callbackQuery && 'data' in ctx.callbackQuery) {
        const data = ctx.callbackQuery.data;
        const itemId = data.split(':')[1];
        const item = await this.itemService.updateItemStatusByIdForAcceptance(
          itemId as string,
        );
        if (item) {
          await ctx.reply(`Xabar foydalanuvchiga yuborildi`);
          const userId = (item as ItemEntity).user.telegram_id;
          await sendMessageFunctionAcceptance(
            userId,
            `✅ E’loningiz admin tomonidan tasdiqlandi.
Endi barcha foydalanuvchilar ko‘rishi mumkin.`,
          );
          return;
        }
        await ctx.reply(`❌ Xatolik yuz berdi`);
        return;
      }
    } catch (e) {
      return errorCatch(e);
    }
  }

  async onActionFoundItemReject(
    ctx: SessionContext,
  ): Promise<object | undefined> {
    await ctx.answerCbQuery();
    try {
      if (ctx.session) {
        ctx.session.state = 'rejecting_found_item_admin';
        await ctx.reply(`❌ Rad etish sababi?`);
      }
    } catch (e) {
      return errorCatch(e);
    }
  }

  async onActionFoundAllItems(
    ctx: SessionContext,
  ): Promise<object | undefined> {
    await ctx.answerCbQuery();
    try {
      const items = await this.itemService.findAllFoundItems();

      if ((items as ItemEntity[]).length > 0) {
        for (let item of items as ItemEntity[]) {
          const mediaGroup: InputMediaPhoto[] = [];

          item.itemImages.forEach((img, index) => {
            mediaGroup.push({
              type: 'photo',
              media: img.image_url as string,
              caption:
                index === 0
                  ? `🟢 *Topilgan buyumlar*\n\n👜 *Buyum:* ${item.title}\n📍 *Joy:* ${item.location.description}\n🕰 *Vaqt:* ${item.time_found_lost}, ${item.date_found_lost}\n📝 *Tavsif:* ${item.description}\n👤 *Topuvchi:* [${item.user.username}](https://t.me/${item.user.username}) < bog'lanish uchun shuni ustiga bosing\n📞 *Telefon:* ${item.user.phone_number}`
                  : undefined,
              parse_mode: index === 0 ? 'Markdown' : undefined,
            });
          });
          const chunkSize = 10;
          for (let i = 0; i < mediaGroup.length; i += chunkSize) {
            const chunk = mediaGroup.slice(i, i + chunkSize);
            await ctx.replyWithMediaGroup(chunk);
          }
        }
      } else {
        await ctx.reply(
          `🔍 Topilgan buyumlar bo‘limida hozircha e’lonlar mavjud emas.`,
        );
      }
    } catch (e) {
      return errorCatch(e);
    }
  }

  async onActionLostAllItems(ctx: SessionContext): Promise<object | undefined> {
    await ctx.answerCbQuery();
    try {
      const items = await this.itemService.findAllLostItems();

      if ((items as ItemEntity[]).length > 0) {
        for (let item of items as ItemEntity[]) {
          const mediaGroup: InputMediaPhoto[] = [];

          if (item.itemImages.length > 0) {
            item.itemImages.forEach((img, index) => {
              mediaGroup.push({
                type: 'photo',
                media: img.image_url as string,
                caption:
                  index === 0
                    ? `🟢 *Yo'qolgan buyumlar*\n\n👜 *Buyum:* ${item.title}\n📍 *Joy:* ${item.location.description}\n🕰 *Vaqt:* ${item.time_found_lost}, ${item.date_found_lost}\n📝 *Tavsif:* ${item.description}\n👤 *Egasi:* [${item.user.username}](https://t.me/${item.user.username}) < bog'lanish uchun shuni ustiga bosing\n📞 *Telefon:* ${item.user.phone_number}`
                    : undefined,
                parse_mode: index === 0 ? 'Markdown' : undefined,
              });
            });
            const chunkSize = 10;
            for (let i = 0; i < mediaGroup.length; i += chunkSize) {
              const chunk = mediaGroup.slice(i, i + chunkSize);
              await ctx.replyWithMediaGroup(chunk);
            }
          } else {
            const text = `Rasm mavjud emas!\n\n🟢 *Yo'qolgan buyumlar*\n\n👜 *Buyum:* ${item.title}\n📍 *Joy:* ${item.location.description}\n🕰 *Vaqt:* ${item.time_found_lost}, ${item.date_found_lost}\n📝 *Tavsif:* ${item.description}\n👤 *Egasi:* [${item.user.username}](https://t.me/${item.user.username}) < bog'lanish uchun shuni ustiga bosing\n📞 *Telefon:* ${item.user.phone_number}`;
            await ctx.reply(text, {
              parse_mode: 'Markdown',
              // @ts-ignore
              disable_web_page_preview: true,
            });
          }
        }
      } else {
        await ctx.reply(
          `🔍 Yo'qolgan buyumlar bo‘limida hozircha e’lonlar mavjud emas.`,
        );
      }
    } catch (e) {
      return errorCatch(e);
    }
  }

  async onActionResendItem(ctx: SessionContext): Promise<object | undefined> {
    await ctx.answerCbQuery();
    try {
      if (ctx.session && ctx.callbackQuery && 'data' in ctx.callbackQuery) {
        const data = ctx.callbackQuery.data;
        const itemId = data.split(':')[1];
        const updated = await this.itemService.updateItemStatusByIdForPending(
          itemId as string,
        );

        if (updated) {
          await ctx.reply(
            `E'loningiz adminga qayta yuborildi,admin javobini tez orada yozib yuboradi`,
          );
          return;
        }
        await ctx.reply(`Tizimda xatolik`);
        return;
      }
    } catch (e) {
      return errorCatch(e);
    }
  }

  async onActionDeleteItem(ctx: SessionContext): Promise<object | undefined> {
    await ctx.answerCbQuery();
    try {
      if (ctx.session && ctx.callbackQuery && 'data' in ctx.callbackQuery) {
        const data = ctx.callbackQuery.data;
        const itemId = data.split(':')[1];
        const affected = await this.itemService.deleteItemById(
          itemId as string,
        );
        if (affected) {
          await ctx.reply(`✅ E’lon o‘chirildi`);
          return;
        }
        await ctx.reply(`Tizimda xatolik`);
        return;
      }
    } catch (e) {
      return errorCatch(e);
    }
  }

  async onActionViewEditMyFoundItems(
    ctx: SessionContext,
  ): Promise<object | undefined> {
    await ctx.answerCbQuery();
    try {
      if (!ctx.from) {
        return;
      }

      const items = await this.itemService.findAllFoundItemsUser(ctx.from.id);

      if ((items as ItemEntity[]).length > 0 && ctx.session) {
        for (let item of items as ItemEntity[]) {
          const mediaGroup: InputMediaPhoto[] = [];
          ctx.session.itemId = item.id;
          let statusUz: string = 'kutilmoqda';

          if (item.status === ItemStatus.APPROVED) {
            statusUz = 'faol';
          } else if (item.status === ItemStatus.REJECTED) {
            statusUz = 'bekor qilindi';
          }

          item.itemImages.forEach((img, index) => {
            mediaGroup.push({
              type: 'photo',
              media: img.image_url as string,
              caption:
                index === 0
                  ? `🟢 *Topilgan buyumlarim*\n\n👜 *Buyum:* ${item.title}\n📍 *Joy:* ${item.location.description}\n🕰 *Vaqt:* ${item.time_found_lost}, ${item.date_found_lost}\n📝 *Tavsif:* ${item.description}\n👤 *Topuvchi:* [${item.user.username}](https://t.me/${item.user.username})\n📞 *Telefon:* ${item.user.phone_number}\n📝 *Holati:* ${statusUz}`
                  : undefined,
              parse_mode: index === 0 ? 'Markdown' : undefined,
            });
          });
          const chunkSize = 10;
          for (let i = 0; i < mediaGroup.length; i += chunkSize) {
            const chunk = mediaGroup.slice(i, i + chunkSize);
            await ctx.replyWithMediaGroup(chunk);
            await ctx.reply(
              "Ma'lumotlaringizni yangilamoqchimisiz yoki o'chirmoqchimisiz?\n\n" +
                'Agar hech qanday amal bajarmasangiz, tugmani bosishingiz shart emas.',
              Markup.inlineKeyboard([
                [
                  Markup.button.callback(
                    '🔄 Yangilash',
                    `update_my_item:${ctx.session.itemId}`,
                  ),
                  Markup.button.callback(
                    "❌ O'chirish",
                    `delete_my_item:${ctx.session.itemId}`,
                  ),
                ],
              ]),
            );
          }
        }
      } else {
        await ctx.reply('🔍 Hozircha topilgan buyumlaringiz mavjud emas.');
      }
    } catch (e) {
      return errorCatch(e);
    }
  }

  async onActionViewEditMyLostItems(
    ctx: SessionContext,
  ): Promise<object | undefined> {
    await ctx.answerCbQuery();
    try {
      if (!ctx.from) {
        return;
      }

      const items = await this.itemService.findAllLostItemsUser(ctx.from.id);

      if ((items as ItemEntity[]).length > 0 && ctx.session) {
        for (let item of items as ItemEntity[]) {
          const mediaGroup: InputMediaPhoto[] = [];
          ctx.session.itemId = item.id;
          let statusUz: string = 'kutilmoqda';

          if (item.status === ItemStatus.APPROVED) {
            statusUz = 'faol';
          } else if (item.status === ItemStatus.REJECTED) {
            statusUz = 'bekor qilindi';
          }

          if (item.itemImages.length > 0) {
            item.itemImages.forEach((img, index) => {
              mediaGroup.push({
                type: 'photo',
                media: img.image_url as string,
                caption:
                  index === 0
                    ? `🟢 *Yo'qolgan buyumlarim*\n\n👜 *Buyum:* ${item.title}\n📍 *Joy:* ${item.location.description}\n🕰 *Vaqt:* ${item.time_found_lost}, ${item.date_found_lost}\n📝 *Tavsif:* ${item.description}\n👤 *Egasi:* [${item.user.username}](https://t.me/${item.user.username})\n📞 *Telefon:* ${item.user.phone_number}\n📝 *Holati:* ${statusUz}`
                    : undefined,
                parse_mode: index === 0 ? 'Markdown' : undefined,
              });
            });
            const chunkSize = 10;
            for (let i = 0; i < mediaGroup.length; i += chunkSize) {
              const chunk = mediaGroup.slice(i, i + chunkSize);
              await ctx.replyWithMediaGroup(chunk);
              await ctx.reply(
                "Ma'lumotlaringizni yangilamoqchimisiz yoki o'chirmoqchimisiz?\n\n" +
                  'Agar hech qanday amal bajarmasangiz, tugmani bosishingiz shart emas.',
                Markup.inlineKeyboard([
                  [
                    Markup.button.callback(
                      '🔄 Yangilash',
                      `update_my_item:${ctx.session.itemId}`,
                    ),
                    Markup.button.callback(
                      "❌ O'chirish",
                      `delete_my_item:${ctx.session.itemId}`,
                    ),
                  ],
                ]),
              );
            }
          } else {
            const text = `Rasm mavjud emas!\n\n🟢 *Yo'qolgan buyumlarim*\n\n👜 *Buyum:* ${item.title}\n📍 *Joy:* ${item.location.description}\n🕰 *Vaqt:* ${item.time_found_lost}, ${item.date_found_lost}\n📝 *Tavsif:* ${item.description}\n👤 *Egasi:* [${item.user.username}](https://t.me/${item.user.username}) < bog'lanish uchun shuni ustiga bosing\n📞 *Telefon:* ${item.user.phone_number}\n📝 *Holati:* ${statusUz}`;
            await ctx.reply(text, {
              parse_mode: 'Markdown',
              // @ts-ignore
              disable_web_page_preview: true,
            });
            await ctx.reply(
              "Ma'lumotlaringizni yangilamoqchimisiz yoki o'chirmoqchimisiz?\n\n" +
                'Agar hech qanday amal bajarmasangiz, tugmani bosishingiz shart emas.',
              Markup.inlineKeyboard([
                [
                  Markup.button.callback(
                    '🔄 Yangilash',
                    `update_my_item:${ctx.session.itemId}`,
                  ),
                  Markup.button.callback(
                    "❌ O'chirish",
                    `delete_my_item:${ctx.session.itemId}`,
                  ),
                ],
              ]),
            );
          }
        }
      } else {
        await ctx.reply("🔍 Hozircha yo'qolgan buyumlaringiz mavjud emas.");
      }
    } catch (e) {
      return errorCatch(e);
    }
  }

  async onActionUpdateUserItem(
    ctx: SessionContext,
  ): Promise<object | undefined> {
    await ctx.answerCbQuery();
    try {
      if (ctx.session && ctx.callbackQuery && 'data' in ctx.callbackQuery) {
        const data = ctx.callbackQuery.data;
        const itemId = data.split(':')[1];
        ctx.session.itemId = itemId;
      }
      await ctx.reply(
        `Qaysi malumotingizni yangilamohchisz?`,
        Markup.inlineKeyboard([
          [Markup.button.callback('Buyum nomi', 'item_title')],
          [Markup.button.callback('Buyum joyi', 'item_location_description')],
          [Markup.button.callback('Buyum sana', 'item_date')],
          [Markup.button.callback('Buyum vahti', 'item_time')],
          [Markup.button.callback('Buyum tavsifi', 'item_description')],
          // [Markup.button.callback('Buyum rasmi', 'item_images')],
        ]),
      );
    } catch (e) {
      return errorCatch(e);
    }
  }

  async onActionDeleteUserItem(
    ctx: SessionContext,
  ): Promise<object | undefined> {
    await ctx.answerCbQuery();
    try {
      if (ctx.callbackQuery && 'data' in ctx.callbackQuery) {
        const data = ctx.callbackQuery.data;
        const itemId = data.split(':')[1];
        const deletedItem = await this.itemService.deleteItemById(
          itemId as string,
        );
        if (deletedItem) {
          await ctx.reply(`E'loningiz muvaffaqiyatli o'chirildi`);
          return;
        }
        await ctx.reply(`Tizimda xatolik`);
      }
    } catch (e) {
      return errorCatch(e);
    }
  }

  async onActionUpdateUserItemTitle(
    ctx: SessionContext,
  ): Promise<object | undefined> {
    await ctx.answerCbQuery();
    try {
      if (ctx.session) {
        ctx.session.state = 'updating_user_found_item_title';
        await ctx.reply(`Buyum nomini kiriting:`);
      }
    } catch (e) {
      return errorCatch(e);
    }
  }

  async onActionUpdateUserItemLocationDescription(
    ctx: SessionContext,
  ): Promise<object | undefined> {
    await ctx.answerCbQuery();
    try {
      if (ctx.session) {
        ctx.session.state = 'updating_user_found_item_location_description';
        await ctx.reply(`Buyum joyini kiriting:`);
      }
    } catch (e) {
      return errorCatch(e);
    }
  }

  async onActionUpdateUserItemDate(
    ctx: SessionContext,
  ): Promise<object | undefined> {
    await ctx.answerCbQuery();
    try {
      if (ctx.session) {
        ctx.session.state = 'updating_user_found_item_date';
        await ctx.reply(`Buyum sanani kiriting:`);
      }
    } catch (e) {
      return errorCatch(e);
    }
  }

  async onActionUpdateUserItemTime(
    ctx: SessionContext,
  ): Promise<object | undefined> {
    await ctx.answerCbQuery();
    try {
      if (ctx.session) {
        ctx.session.state = 'updating_user_found_item_time';
        await ctx.reply(`Buyum vahtini kiriting:`);
      }
    } catch (e) {
      return errorCatch(e);
    }
  }

  async onActionUpdateUserItemDescription(
    ctx: SessionContext,
  ): Promise<object | undefined> {
    await ctx.answerCbQuery();
    try {
      if (ctx.session) {
        ctx.session.state = 'updating_user_found_item_description';
        await ctx.reply(`Buyum tavsifini kiriting:`);
      }
    } catch (e) {
      return errorCatch(e);
    }
  }

  async onHearHelp(ctx: SessionContext): Promise<object | undefined> {
    try {
      await ctx.reply(
        `*Yordam:*

Yangi e'lon berish \\- Yo'qolgan yoki topilgan buyumlarni e'longa berish  
E'lonlarni ko'rish \\- Barcha yo'qolgan yoki topilgan buyumlarni ko'rish
Mening e'lonlarim \\- Foydalanuvchiga tegishli barcha e'lonlarni ko'rish

Biron bir taklif yoki savollar bo'lsa admin bilan bog'laning: [@MarufovD](https://t.me/MarufovD)`,
        { parse_mode: 'MarkdownV2' },
      );
    } catch (e) {
      return errorCatch(e);
    }
  }

  async onCommandHelp(ctx: SessionContext): Promise<object | undefined> {
    try {
      await ctx.reply(
        `*Yordam:*

Yangi e'lon berish \\- Yo'qolgan yoki topilgan buyumlarni e'longa berish  
E'lonlarni ko'rish \\- Barcha yo'qolgan yoki topilgan buyumlarni ko'rish
Mening e'lonlarim \\- Foydalanuvchiga tegishli barcha e'lonlarni ko'rish

Biron bir taklif yoki savollar bo'lsa admin bilan bog'laning: [@MarufovD](https://t.me/MarufovD)`,
        { parse_mode: 'MarkdownV2' },
      );
    } catch (e) {
      return errorCatch(e);
    }
  }

  async onTextFoundLostItem(ctx: SessionContext): Promise<object | undefined> {
    try {
      if (!ctx.session) ctx.session = {};

      if (
        ctx.session.state === 'updating_user_found_item_title' &&
        ctx.message &&
        'text' in ctx.message
      ) {
        const text = ctx.message.text;
        const itemId = ctx.session.itemId;

        const item: Partial<ItemEntity> = {
          title: text,
        };

        const updatedItem = await this.itemService.updateItem(
          itemId as string,
          item,
        );

        if (updatedItem) {
          await ctx.reply(`✅ Buyum nomi muvaffaqiyatli yangilandi`);
          return;
        } else {
          await ctx.reply(`❌ Buyum nomini yangilashda xatolik`);
        }
      }

      if (
        ctx.session.state === 'updating_user_found_item_location_description' &&
        ctx.message &&
        'text' in ctx.message
      ) {
        const text = ctx.message.text;
        const itemObj = await this.itemService.findItemById(
          ctx.session.itemId as string,
        );
        const locationId = (itemObj as ItemEntity).location.id;

        const item: Partial<LocationEntity> = {
          description: text,
        };
        const updatedLocation = await this.locationService.updateLocation(
          locationId as string,
          item,
        );

        if (updatedLocation) {
          await ctx.reply(`✅ Buyum joyi muvaffaqiyatli yangilandi`);
          return;
        }
        await ctx.reply(`❌ Buyum joyini yangilashda xatolik`);
      }

      if (
        ctx.session.state === 'updating_user_found_item_date' &&
        ctx.message &&
        'text' in ctx.message
      ) {
        const text = ctx.message.text;
        const itemId = ctx.session.itemId;

        const checkDash = text.split('');
        if (checkDash[4] !== '-' && checkDash[7] !== '-') {
          await ctx.reply(`❌ Iltimos korsatilgan korinishida sanani kiriting`);
          return;
        }

        if (checkDash.length > 10) {
          await ctx.reply(
            `❌ Ortiqcha ma'lumot kiritish mumkin emas faqat sanani kiriting`,
          );
          return;
        }
        const [year, month, day] = text.split('-');
        const formattedMonth = Number(month) < 10 ? `0${Number(month)}` : month;
        const formattedDay = Number(day) < 10 ? `0${Number(day)}` : day;
        const isValidYear = /^\d+$/.test(year);
        const isValidMonth = /^\d+$/.test(month);
        const isValidDay = /^\d+$/.test(day);

        if (!isValidYear || !isValidMonth || !isValidDay) {
          await ctx.reply(`❌ Yil,oy yoki kun faqat sonda kiritilishi kerak`);
          return;
        }

        if (formattedMonth === '02') {
          if (Number(formattedDay) > 29) {
            await ctx.reply(
              `❌ Fevral oyida maksimal 28 kun bo'lishi mumkin. Kabisa yili bo'lsa, 29 kun bo'ladi`,
            );
            return;
          }
        }

        const currentYear = new Date().getFullYear();
        if (Number(year) > currentYear) {
          await ctx.reply(
            `❌ Hali bunday yil kelmadi. Hozir ${currentYear}-yil`,
          );
          return;
        }

        if (Number(month) > 12) {
          await ctx.reply(`❌ Bunday oy mavjud emas`);
          return;
        }

        if (Number(day) > 31) {
          await ctx.reply(
            `❌ Oyda maksimum 31 kun bo‘ladi. Ba'zi oylarda 30 yoki 28-29 kun bor`,
          );

          return;
        }

        const item: Partial<ItemEntity> = {
          date_found_lost: new Date(text),
        };

        const updatedItem = await this.itemService.updateItem(
          itemId as string,
          item,
        );

        if (updatedItem) {
          await ctx.reply(`✅ Buyum sanasi muvaffaqiyatli yangilandi`);
          return;
        }
        await ctx.reply(`❌ Buyum sanasini yangilashda xatolik`);
      }

      if (
        ctx.session.state === 'updating_user_found_item_time' &&
        ctx.message &&
        'text' in ctx.message
      ) {
        const text = ctx.message.text;
        const itemId = ctx.session.itemId;

        const checkColon = text.split('');

        if (checkColon[2] !== ':') {
          await ctx.reply(
            "❌ Iltimos vaqtni ko'rsatilgan ko'rinishda kiriting",
          );
          return;
        }

        if (text.length > 5) {
          await ctx.reply(
            `❌ Ortiqcha ma'lumot kiritish mumkin emas faqat vaqtni kiriting`,
          );
          return;
        }

        const [hour, minute] = text.split(':');

        const isValidHour = /^\d+$/.test(hour);
        const isValidMinute = /^\d+$/.test(minute);

        if (!isValidHour || !isValidMinute) {
          await ctx.reply(`❌ Soat yoki daqiqa faqat sonda kiritilishi kerak`);
          return;
        }

        if (Number(hour) > 23) {
          await ctx.reply(`❌ 1 kunda 24 soat mavjud`);
          return;
        }

        if (Number(minute) > 59) {
          await ctx.reply(`❌ 1 soatda 60 minut mavjud`);
          return;
        }

        const item: Partial<ItemEntity> = {
          time_found_lost: text,
        };

        const updatedItem = await this.itemService.updateItem(
          itemId as string,
          item,
        );

        if (updatedItem) {
          await ctx.reply(`✅ Buyum vahti muvaffaqiyatli yangilandi`);
          return;
        }
        await ctx.reply(`❌ Buyum vahtini yangilashda xatolik`);
      }

      if (
        ctx.session.state === 'updating_user_found_item_description' &&
        ctx.message &&
        'text' in ctx.message
      ) {
        const text = ctx.message.text;
        const itemId = ctx.session.itemId;

        const item: Partial<ItemEntity> = {
          description: text,
        };

        const updatedItem = await this.itemService.updateItem(
          itemId as string,
          item,
        );

        if (updatedItem) {
          await ctx.reply(`✅ Buyum tavsifi muvaffaqiyatli yangilandi`);
          return;
        }
        await ctx.reply(`❌ Buyum tavsifini yangilashda xatolik`);
      }

      if (
        ctx.session.state === 'rejecting_found_item_admin' &&
        ctx.message &&
        'text' in ctx.message
      ) {
        ctx.session.admin_reject_reason = ctx.message.text;
        if (ctx.session) {
          const itemId = ctx.session.itemId;
          const item = await this.itemService.updateItemStatusByIdForReject(
            itemId as string,
          );
          if (item) {
            await ctx.reply(`✅ Xabar foydalanuvchiga yuborildi`);
            const userId = (item as ItemEntity).user.telegram_id;
            await sendMessageFuncionReject(
              userId,
              `❌ E’loningiz rad etildi.\n\n
📝 Sabab: ${ctx.session.admin_reject_reason}`,
              ctx,
            );
          }
        }
      }

      if (
        ctx.session.state === 'entering_fullName' &&
        ctx.session?.phone &&
        ctx.message &&
        'text' in ctx.message
      ) {
        const fullName = ctx.message.text;
        ctx.session.full_name = fullName;
        if (ctx.from) {
          const telegram_id = ctx.from.id;
          const username = String(ctx.from.username);
          if (!username) {
            await ctx.reply(
              `❌ Sizda username mavjud emas, Iltimos username qo'yib keyin yana qayta urinib ko'ring`,
            );
            return;
          }

          const phone_number = ctx.session.phone;
          const full_name = ctx.session.full_name;
          const createUserDto: CreateUserDto = {
            telegram_id,
            username,
            phone_number,
            full_name,
          };
          await this.userService.create(createUserDto);

          await ctx.reply(
            `✅ Rahmat! Ma'lumotlaringiz saqlandi va ularning xavfsizligi admin tomonidan kafolatlanadi`,
          );

          await this.onMain(ctx);
        }
      } else if (ctx.session.state === 'creating_found_item') {
        // Item title
        if (ctx.message && 'text' in ctx.message) {
          const itemTitle = ctx.message.text;
          ctx.session.title = itemTitle;

          if (ctx.from) {
            const hasUser = await this.userService.findUserByTelegramId(
              ctx.from.id,
            );
            if (hasUser && typeof hasUser === 'object') {
              // Item userId
              ctx.session.user = hasUser;

              ctx.session.state = 'entering_found_item_descriptionItem';
              await ctx.reply(`Buyum tavsifini kiriting:`);
            }
          }
        }
      } else if (ctx.session.state === 'entering_found_item_descriptionItem') {
        if (ctx.message && 'text' in ctx.message) {
          // Item description
          const description = ctx.message.text;
          ctx.session.descriptionItem = description;

          ctx.session.state = 'entering_found_item_location';
          await ctx.reply(
            "📍 Buyumni qayerda topdingiz yoki yo'qotdingiz?\n\n" +
              "Iltimos, lokatsiya va manzilni to'liq yozing.\n" +
              'Viloyat/Shahar va tuman nomini kiriting.\n\n' +
              '📝 Masalan: Toshkent shahar, Chilonzor tumani',
          );
        }
      } else if (ctx.session.state === 'entering_found_item_location') {
        if (ctx.message && 'text' in ctx.message) {
          // Item region,district and item description
          const text = ctx.message.text.split(' ');
          const combined = `${text[0].toLowerCase()} ${text[1].toLowerCase()}`;

          let region: any;
          if (combined === LocationRegion.TASHKENT_SHAHAR) {
            region = LocationRegion.TASHKENT_SHAHAR;
          } else if (combined === LocationRegion.TASHKENT_VILOYAT) {
            region = LocationRegion.TASHKENT_VILOYAT;
          } else {
            await ctx.reply(
              `❌ Bizda hozircha faqat Toshkent shahar va Toshkent viloyat mavjud`,
            );
            return;
          }

          const inputDistrict = text[2].toLowerCase();

          const districts = Object.values(LocationDistrict);

          let district: any;
          let found: boolean = false;
          for (let i = 0; i < districts.length; i++) {
            if (districts[i].toLowerCase() === inputDistrict) {
              district = inputDistrict;
              found = true;
              break;
            }
          }
          if (!found) {
            await ctx.reply(
              ` Bizda mavjud tumanlar:\n\n` +
                `   Toshkent shahar:\n` +
                `- Bektemir\n` +
                `- Chilonzor\n` +
                `- Yashnobod\n` +
                `- Mirobod\n` +
                `- Mirzo Ulug'bek\n` +
                `- Sergeli\n` +
                `- Shayxontohur\n` +
                `- Olmazor\n` +
                `- Uchtepa\n` +
                `- Yakkasaroy\n` +
                `- Yunusobod\n` +
                `- Yangihayot\n\n` +
                `   Toshkent viloyati:\n` +
                `- Bekabad\n` +
                `- Bo'stonliq\n` +
                `- Bo'ka\n` +
                `- Chinoz\n` +
                `- Qibray\n` +
                `- Ohangaron\n` +
                `- Oqqo'rg'on\n` +
                `- Parkent\n` +
                `- Piskent\n` +
                `- Quyichirchiq\n` +
                `- Zangiota\n` +
                `- O'rtachirchiq\n` +
                `- Yangiyo'l\n` +
                `- Yuqorichirchiq\n\n` +
                `   Toshkent tumani:\n` +
                `- Toshkent (markazi Keles)`,
            );
            return;
          }

          ctx.session.region = region;
          ctx.session.district = district;

          ctx.session.state = 'entering_found_item_descriptionLocation';
          await ctx.reply(
            "📍 Iltimos, buyumni topgan yoki yo'qotgan joyingizni aniq ko'rsating.\n\n" +
              '📝 Masalan:\n' +
              'Chilonzor tumani, 19-kvartal, 24-dom yonida.\n\n' +
              "ℹ️ Iloji boricha to'liq va tushunarli lokatsiya yozing.",
          );
        }
      } else if (
        ctx.session.state === 'entering_found_item_descriptionLocation'
      ) {
        if (ctx.message && 'text' in ctx.message) {
          // Item desciptionLocation
          const description = ctx.message.text;

          const inputDistrict = description.split(' ')[0].toLowerCase();

          if (ctx.session) {
            if (ctx.session.district !== inputDistrict) {
              await ctx.reply(
                '❌ Oldin kiritgan tumaningiz bilan hozir kiritgan tumaningiz bir xil emas',
              );
              return;
            }
            ctx.session.descriptionLocation = description;
          }

          ctx.session.state = 'entering_found_item_date';
          await ctx.reply(
            "📅 Iltimos, buyumni topgan yoki yo'qotgan sanani quyidagi formatda kiriting:\n\n" +
              '📌 Format: YIL-OY-KUN\n' +
              '📝 Masalan: 2020-04-04',
          );
        }
      } else if (ctx.session.state === 'entering_found_item_date') {
        if (ctx.message && 'text' in ctx.message) {
          // Item date_found_lost
          const date = ctx.message.text;
          const checkDash = date.split('');
          if (checkDash[4] !== '-' && checkDash[7] !== '-') {
            await ctx.reply(
              `❌ Iltimos korsatilgan korinishida sanani kiriting`,
            );
            return;
          }

          if (checkDash.length > 10) {
            await ctx.reply(
              `❌ Ortiqcha ma'lumot kiritish mumkin emas faqat sanani kiriting`,
            );
            return;
          }
          const [year, month, day] = date.split('-');
          const formattedMonth =
            Number(month) < 10 ? `0${Number(month)}` : month;
          const formattedDay = Number(day) < 10 ? `0${Number(day)}` : day;

          const isValidYear = /^\d+$/.test(year);
          const isValidMonth = /^\d+$/.test(formattedMonth);
          const isValidDay = /^\d+$/.test(formattedDay);

          if (!isValidYear || !isValidMonth || !isValidDay) {
            await ctx.reply(`❌ Yil,oy yoki kun faqat sonda kiritilishi kerak`);
            return;
          }

          if (formattedMonth === '02') {
            if (Number(formattedDay) > 29) {
              await ctx.reply(
                `❌ Fevral oyida maksimal 28 kun bo'lishi mumkin. Kabisa yili bo'lsa, 29 kun bo'ladi`,
              );
              return;
            }
          }

          const currentYear = new Date().getFullYear();
          if (Number(year) > currentYear) {
            await ctx.reply(
              `❌ Hali bunday yil kelmadi. Hozir ${currentYear}-yil`,
            );
            return;
          }

          if (Number(month) > 12) {
            await ctx.reply(`❌ Bunday oy mavjud emas`);
            return;
          }

          if (Number(day) > 31) {
            await ctx.reply(
              `❌ Oyda maksimum 31 kun bo‘ladi. Ba'zi oylarda 30 yoki 28-29 kun bor`,
            );

            return;
          }

          ctx.session.date_found_lost = date;

          ctx.session.state = 'entering_found_item_time';
          await ctx.reply(
            "⏰ Iltimos, buyumni taxminan soat nechchida topganingizni yoki yo'qotganingizni kiriting:\n\n" +
              '📌 Format: SOAT:MINUT\n' +
              '📝 Masalan: 13:30',
          );
        }
      } else if (ctx.session.state === 'entering_found_item_time') {
        if (ctx.message && 'text' in ctx.message && ctx.from) {
          // Item time_found_lost
          const time = ctx.message.text;

          const checkColon = time.split('');

          if (time.length > 5) {
            await ctx.reply(
              `❌ Ortiqcha ma'lumot kiritish mumkin emas faqat vaqtni kiriting`,
            );
            return;
          }

          if (checkColon[2] !== ':') {
            await ctx.reply(
              "❌ Iltimos vaqtni ko'rsatilgan ko'rinishda kiriting",
            );
            return;
          }

          const [hour, minute] = time.split(':');

          const isValidHour = /^\d+$/.test(hour);
          const isValidMinute = /^\d+$/.test(minute);

          if (!isValidHour || !isValidMinute) {
            await ctx.reply(
              `❌ Soat yoki daqiqa faqat sonda kiritilishi kerak`,
            );
            return;
          }

          if (Number(hour) > 23) {
            await ctx.reply(`❌ 1 kunda 24 soat mavjud`);
            return;
          }

          if (Number(minute) > 59) {
            await ctx.reply(`❌ 1 soatda 60 minut mavjud`);
            return;
          }

          ctx.session.time_found_lost = time;

          if (ctx.session.type === ItemType.FOUND) {
            ctx.session.state = 'entering_found_item_images';
            ctx.session.found_images = [];
            await ctx.reply(
              '🖼️ Iltimos, topgan buyumingizning rasmini shu yerga yuklang',
            );
          } else if (ctx.session.type === ItemType.LOST) {
            ctx.session.state = 'entering_lost_item_images';
            ctx.session.lost_images = [];
            await ctx.reply(
              '🖼️ Yo‘qolgan buyumingizning rasmi bormi?\n\n' +
                'Agar rasm mavjud bo‘lsa, iltimos, shu yerga yuklang\n\n' +
                '❌ Agar rasm mavjud bo‘lmasa, “Yo‘q” tugmasini bosing va davom eting',
              Markup.inlineKeyboard([
                [Markup.button.callback('Yoq', 'not_available')],
              ]),
            );
          }
        }
      }
    } catch (e) {
      return errorCatch(e);
    }
  }

  async onPhotoFoundItem(ctx: SessionContext): Promise<object | undefined> {
    try {
      if (ctx.message && 'photo' in ctx.message && ctx.session) {
        if (ctx.session.state === 'entering_found_item_images') {
          const largestPhoto = ctx.message.photo[ctx.message.photo.length - 1];

          ctx.session.found_images = ctx.session.found_images || [];
          ctx.session.found_images.push(largestPhoto.file_id);

          if (ctx.session.saveImagesTimeout) {
            clearTimeout(ctx.session.saveImagesTimeout);
          }

          ctx.session.saveImagesTimeout = setTimeout(async () => {
            if (ctx.session) {
              delete ctx.session.saveImagesTimeout;

              ctx.session.state = 'confirming_found_item_announcement';
              await ctx.reply(
                `E'lonni tasdiqlaysizmi?`,
                Markup.inlineKeyboard([
                  [Markup.button.callback('Ha', 'yes')],
                  [Markup.button.callback("Yo'q", 'not')],
                ]),
              );
              return;
            }
          }, 800);
        } else if (ctx.session.state === 'entering_lost_item_images') {
          const largestPhoto = ctx.message.photo[ctx.message.photo.length - 1];

          ctx.session.lost_images = ctx.session.lost_images || [];
          ctx.session.lost_images.push(largestPhoto.file_id);

          if (ctx.session.saveImagesTimeout) {
            clearTimeout(ctx.session.saveImagesTimeout);
          }

          ctx.session.saveImagesTimeout = setTimeout(async () => {
            if (ctx.session) {
              delete ctx.session.saveImagesTimeout;

              ctx.session.state = 'confirming_found_item_announcement';
              await ctx.reply(
                `E'lonni tasdiqlaysizmi?`,
                Markup.inlineKeyboard([
                  [Markup.button.callback('Ha', 'yes')],
                  [Markup.button.callback("Yo'q", 'not')],
                ]),
              );
              return;
            }
          }, 800);
        }
      }
      // Item images
    } catch (e) {
      return errorCatch(e);
    }
  }
}
