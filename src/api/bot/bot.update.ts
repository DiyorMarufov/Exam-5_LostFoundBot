import { Injectable } from '@nestjs/common';
import { Ctx, On, Start, Update } from 'nestjs-telegraf';
import { BotService, SessionContext } from './bot.service';

@Injectable()
@Update()
export class BotUpdate {
  constructor(private readonly botService: BotService) {}
  @Start()
  async onStart(@Ctx() ctx: SessionContext): Promise<object | undefined> {
    return await this.botService.onStart(ctx);
  }

  @On('contact')
  async OnContact(@Ctx() ctx: SessionContext): Promise<object | undefined> {
    return await this.botService.onContact(ctx);
  }

  @On('text')
  async onText(@Ctx() ctx: SessionContext): Promise<object | undefined> {
    return await this.botService.onText(ctx);
  }
}
