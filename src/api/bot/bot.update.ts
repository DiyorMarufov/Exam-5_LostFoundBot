import { Injectable } from '@nestjs/common';
import {
  Action,
  Command,
  Ctx,
  Hears,
  On,
  Start,
  Update,
} from 'nestjs-telegraf';
import { BotService, SessionContext } from './bot.service';

@Injectable()
@Update()
export class BotUpdate {
  constructor(private readonly botService: BotService) {}
  @Start()
  async onStart(@Ctx() ctx: SessionContext): Promise<object | undefined> {
    return await this.botService.onStart(ctx);
  }

  async onMain(@Ctx() ctx: SessionContext): Promise<object | undefined> {
    return await this.botService.onMain(ctx);
  }

  @On('contact')
  async OnContact(@Ctx() ctx: SessionContext): Promise<object | undefined> {
    return await this.botService.onContact(ctx);
  }

  @Hears("Yangi e'lon berish")
  async onHearNewAnnouncement(
    @Ctx() ctx: SessionContext,
  ): Promise<object | undefined> {
    return await this.botService.onHearNewAnnouncement(ctx);
  }

  @Action('found_sth')
  async onActionFound(@Ctx() ctx: SessionContext): Promise<object | undefined> {
    return await this.botService.onActionFound(ctx);
  }

  @Hears('Yordam')
  async onHearHelp(@Ctx() ctx: SessionContext): Promise<object | undefined> {
    return await this.botService.onHearHelp(ctx);
  }

  @Hears('Bekor qilish va aniq lokatsiyani yozish')
  async onHearWriteLocation(@Ctx() ctx: SessionContext) {
    return await this.botService.onHearWriteLocation(ctx);
  }

  @Command('yordam')
  async onCommandHelp(@Ctx() ctx: SessionContext): Promise<object | undefined> {
    return await this.botService.onCommandHelp(ctx);
  }

  @On('text')
  async onText(@Ctx() ctx: SessionContext): Promise<object | undefined> {
    return await this.botService.onText(ctx);
  }
}
