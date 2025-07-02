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
import { AdminService } from '../admin/admin.service';
import { CreateItemDto } from '../item/dto/create-item.dto';
import { LocationService } from '../location/location.service';
import { CreateLocationDto } from '../location/dto/create-location.dto';
import { LocationEntity } from 'src/core/entity/locations.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { ItemImageEntity } from 'src/core/entity/items.images.entity';
import { ItemImageRepo } from 'src/core/repository/item.image.repository';
import { ItemEntity } from 'src/core/entity/items.entity';

export interface SessionContext extends Context {
  session?: {
    phone?: string;
    full_name?: string;
    user?: string;
    state?: string;
    type?: ItemType;
    title?: string;
    descriptionItem?: string;
    location?: string;
    region?: LocationRegion;
    district?: LocationDistrict;
    latitude?: number;
    longitude?: number;
    descriptionLocation?: string;
    date_found_lost?: string;
    time_found_lost?: string;
    images?: string[];
    saveImagesTimeout?: NodeJS.Timeout;
    is_resolved?: boolean;
    status?: ItemStatus;
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
    private readonly adminService: AdminService,
  ) {}

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

      // if (this.adminService.isAdmin(telegramId)) {
      //   await this.adminService.onStart(ctx);
      //   return;
      // }

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

  async onMain(ctx: SessionContext): Promise<object | undefined> {
    try {
      await ctx.reply(
        'Asosiy menyu:',
        Markup.keyboard([
          ["Yangi e'lon berish", "E'lonlarni ko'rish"],
          ['Yordam'],
        ]).resize(),
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
            `Rahmat,endi ism-familyangizni kiriting(Misol: Akbar Shomansurov):`,
            {
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
        await ctx.reply(`Buyum nomini kiriting:`);
        await this.onText(ctx);
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

        if (newLocation && 'id' in newLocation) {
          ctx.session.location = newLocation.id;
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
        if (createdItem && 'id' in createdItem) {
          const { images } = ctx.session;

          if (images) {
            const imagesUrl = images.map((image: string) => ({
              item: { id: createdItem.id },
              image_url: image,
            }));

            await this.itemImageRepo.save(imagesUrl);
          }
          await ctx.reply(`Ma'lumotlaringiz muvaffaqiyatli saqlandi
Admin tasdiqlaganidan so'ng, e'loningiz e'lonlar ro'yxatida ko'rinadi.`);
        }
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

Biron bir taklif yoki savollar bo'lsa admin bilan bog'laning: [@MarufovD](https://t.me/MarufovD)`,
        { parse_mode: 'MarkdownV2' },
      );
    } catch (e) {
      return errorCatch(e);
    }
  }

  async onText(ctx: SessionContext): Promise<object | undefined> {
    try {
      if (!ctx.session) ctx.session = {};

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
              `Sizda username mavjud emas, Iltimos username qo'yib keyin yana qayta urinib ko'ring!`,
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
            `Rahmat! Ma'lumotlaringiz saqlandi va ularning xavfsizligi admin tomonidan kafolatlanadi.`,
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
            if (hasUser && typeof hasUser === 'object' && 'id' in hasUser) {
              // Item userId
              ctx.session.user = String(hasUser.id);
              // Item type
              ctx.session.type = ItemType.FOUND;

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
            'Buyumni qayerda topib oldingiz?\n\n' +
              'Lokatsiya va manzilni yozib yuboring.\n' +
              'Viloyat yoki Shahar va Tuman.\n' +
              'Misol Toshkent Shahar Chilonzor tumani',
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
              `Bizda hozircha faqat Toshkent shahar va Toshkent viloyat mavjud!`,
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
            ` Iltimos, buyumni topgan joyingizni aniq ko'rsating.\n\n` +
              `Masalan:\n` +
              `Chilonzor tumani, 19-kvartal, 24-dom yonida.\n\n` +
              ` Iloji boricha to'liq va tushunarli lokatsiya yozing.`,
          );
        }
      } else if (
        ctx.session.state === 'entering_found_item_descriptionLocation'
      ) {
        if (ctx.message && 'text' in ctx.message) {
          // Item desciptionLocation
          const description = ctx.message.text;
          ctx.session.descriptionLocation = description;

          ctx.session.state = 'entering_found_item_date';
          await ctx.reply(
            'Buyumni topgan sanani quyidagi formatda kiriting:\n\n' +
              ' YIL-OY-KUN\n' +
              ' Masalan: 2020-04-04',
          );
        }
      } else if (ctx.session.state === 'entering_found_item_date') {
        if (ctx.message && 'text' in ctx.message) {
          // Item date_found_lost
          const date = ctx.message.text;
          ctx.session.date_found_lost = date;

          ctx.session.state = 'entering_found_item_time';
          await ctx.reply(
            'Buyumni taxminan soat nechchida topganingizni kiriting:\n\n' +
              ' Format: SOAT-MINUT\n' +
              ' Masalan: 13-30',
          );
        }
      } else if (ctx.session.state === 'entering_found_item_time') {
        if (ctx.message && 'text' in ctx.message && ctx.from) {
          // Item time_found_lost
          const time = ctx.message.text;
          ctx.session.time_found_lost = time;

          ctx.session.state = 'entering_found_item_images';
          await ctx.reply(
            " Yo'qotgan buyumingizning rasmi bormi?\n\n" +
              " Agar rasm mavjud bo'lsa, iltimos shu yerga yuklang.\n" +
              ' Agar rasm mavjud bo\'lmasa, quyidagi "Yo\'q" tugmasini bosing.',
            Markup.inlineKeyboard([
              [Markup.button.callback("Yo'q", 'not_available')],
            ]),
          );
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
          // Item images
          const largestPhoto = ctx.message.photo[ctx.message.photo.length - 1];
          const fileLink = await ctx.telegram.getFileLink(largestPhoto.file_id);

          ctx.session.images = ctx.session.images || [];
          ctx.session.images.push(fileLink.href);

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
            }
          }, 800);
        }
      }
    } catch (e) {
      return errorCatch(e);
    }
  }
}
