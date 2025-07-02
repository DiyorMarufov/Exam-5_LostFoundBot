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

  @Action('not_available')
  async onActionPhotoAvailable(
    @Ctx() ctx: SessionContext,
  ): Promise<object | undefined> {
    await ctx.answerCbQuery();
    return await this.botService.onActionPhotoAvailable(ctx);
  }

  @Action('found_sth')
  async onActionFound(@Ctx() ctx: SessionContext): Promise<object | undefined> {
    return await this.botService.onActionFound(ctx);
  }

  @Action('yes')
  async onActionYes(@Ctx() ctx: SessionContext): Promise<object | undefined> {
    return await this.botService.onActionYes(ctx);
  }

  @Hears('Yordam')
  async onHearHelp(@Ctx() ctx: SessionContext): Promise<object | undefined> {
    return await this.botService.onHearHelp(ctx);
  }

  @Command('yordam')
  async onCommandHelp(@Ctx() ctx: SessionContext): Promise<object | undefined> {
    return await this.botService.onCommandHelp(ctx);
  }

  @On('text')
  async onText(@Ctx() ctx: SessionContext): Promise<object | undefined> {
    return await this.botService.onText(ctx);
  }

  @On('photo')
  async onPhotoFoundItem(
    @Ctx() ctx: SessionContext,
  ): Promise<object | undefined> {
    return this.botService.onPhotoFoundItem(ctx);
  }
}
