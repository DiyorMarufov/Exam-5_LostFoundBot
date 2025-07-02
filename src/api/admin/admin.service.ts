import { Injectable } from '@nestjs/common';
import { errorCatch } from 'src/infrastructure/lib/exception/error.catch';
import { Context, Markup } from 'telegraf';

@Injectable()
export class AdminService {
  isAdmin(userId: number) {
    const admins = [887964728];
    return admins.includes(userId);
  }

  async onStart(ctx: Context): Promise<object | undefined> {
    try {
      if (ctx.from) {
        const userId = ctx.from.id;
        if (this.isAdmin(userId)) {
          await ctx.reply(`Admin paneliga xush kelibsiz`);
        }
      }
    } catch (e) {
      return errorCatch(e);
    }
  }
}
