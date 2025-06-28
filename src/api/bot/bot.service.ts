import { Injectable } from '@nestjs/common';
import { errorCatch } from 'src/infrastructure/lib/exception/error.catch';
import { Context } from 'telegraf';
import { CreateUserDto } from '../user/dto/create.user.dto';
import { UserService } from '../user/user.service';

export interface SessionContext extends Context {
  session?: {
    phone?: string;
    full_name?: string;
  };
}

@Injectable()
export class BotService {
  constructor(private userService: UserService) {}
  async onStart(ctx: SessionContext): Promise<object | undefined> {
    try {
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
            force_reply: true,
          },
        },
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
        }
      }
      await ctx.reply(
        `Rahmat,endi ism-familyangizni kiriting(Misol: Akbar Shomansurov):`,
      );
    } catch (e) {
      return errorCatch(e);
    }
  }

  async onText(ctx: SessionContext): Promise<object | undefined> {
    try {
      if (ctx.session?.phone && ctx.message && 'text' in ctx.message) {
        const fullName = ctx.message.text;
        ctx.session.full_name = fullName;
        if (ctx.from) {
          const telegram_id = ctx.from.id;
          const username = String(ctx.from.username);
          if (!username) {
            await ctx.reply(
              `Sizda username mavjud emas, Iltimos username qo'yib keyin yana qayta urinib ko'ring!`,
            );
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
          await ctx.reply(`Malumotlaringiz to'liq saqlandi!`);
        }
      }
    } catch (e) {
      return errorCatch(e);
    }
  }
}
