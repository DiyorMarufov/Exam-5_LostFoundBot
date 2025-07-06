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

  async onStartAdmin(@Ctx() ctx: SessionContext): Promise<object | undefined> {
    return await this.botService.onStartAdmin(ctx);
  }

  async onMain(@Ctx() ctx: SessionContext): Promise<object | undefined> {
    return await this.botService.onMain(ctx);
  }

  @On('contact')
  async OnContact(@Ctx() ctx: SessionContext): Promise<object | undefined> {
    return await this.botService.onContact(ctx);
  }

  @Hears("Yangi e'lonlar")
  async onHearNewAnnouncementAdmin(
    @Ctx() ctx: SessionContext,
  ): Promise<object | undefined> {
    return await this.botService.onHearNewAnnouncementAdmin(ctx);
  }

  @Hears('Tasdiqlanganlar')
  async onHearAccepetedAnnouncementsAdmin(
    @Ctx() ctx: SessionContext,
  ): Promise<object | undefined> {
    return await this.botService.onHearAcceptedAnnouncementAdmin(ctx);
  }

  @Hears('Rad etilganlar')
  async onHearRejectedAnnouncementsAdmin(
    @Ctx() ctx: SessionContext,
  ): Promise<object | undefined> {
    return await this.botService.onHearRejectedAnnouncementAdmin(ctx);
  }

  @Hears("Yangi e'lon berish")
  async onHearNewAnnouncement(
    @Ctx() ctx: SessionContext,
  ): Promise<object | undefined> {
    return await this.botService.onHearNewAnnouncement(ctx);
  }

  @Hears("E'lonlarni ko'rish")
  async onHearAllAnouncement(
    @Ctx() ctx: SessionContext,
  ): Promise<object | undefined> {
    return await this.botService.onHearAllAnouncement(ctx);
  }

  @Hears("Mening e'lonlarim")
  async onHearViewEditMyAnnouncements(
    @Ctx() ctx: SessionContext,
  ): Promise<object | undefined> {
    return await this.botService.onHearViewEditMyAnnouncements(ctx);
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

  @Action('lost_sth')
  async onActionLost(@Ctx() ctx: SessionContext): Promise<object | undefined> {
    return await this.botService.onActionLost(ctx);
  }

  @Action('yes')
  async onActionYes(@Ctx() ctx: SessionContext): Promise<object | undefined> {
    return await this.botService.onActionYes(ctx);
  }

  @Action('not')
  async onActionNot(@Ctx() ctx: SessionContext): Promise<object | undefined> {
    return await this.botService.onActionNot(ctx);
  }

  @Action('found_items_admin')
  async onActionFoundItemsAdmin(
    @Ctx() ctx: SessionContext,
  ): Promise<object | undefined> {
    return await this.botService.onActionFoundAllItemsAdmin(ctx);
  }

  @Action('lost_items_admin')
  async onActionLostItemsAdmin(
    @Ctx() ctx: SessionContext,
  ): Promise<object | undefined> {
    return await this.botService.onActionLostAllItemsAdmin(ctx);
  }

  @Action(/confirm_found_item_admin:.+/)
  async onActionFoundItemAcceptance(
    @Ctx() ctx: SessionContext,
  ): Promise<object | undefined> {
    return await this.botService.onActionFoundItemAcceptance(ctx);
  }

  @Action('reject_found_item_admin')
  async onActionFoundItemReject(
    @Ctx() ctx: SessionContext,
  ): Promise<object | undefined> {
    return await this.botService.onActionFoundItemReject(ctx);
  }

  @Action('found_items')
  async onActionFoundAllItems(
    @Ctx() ctx: SessionContext,
  ): Promise<object | undefined> {
    return await this.botService.onActionFoundAllItems(ctx);
  }

  @Action('lost_items')
  async onActionLostAllItems(
    @Ctx() ctx: SessionContext,
  ): Promise<object | undefined> {
    return await this.botService.onActionLostAllItems(ctx);
  }

  @Action(/resend_item:.+/)
  async onActionResendItem(
    @Ctx() ctx: SessionContext,
  ): Promise<object | undefined> {
    return await this.botService.onActionResendItem(ctx);
  }

  @Action(/delete_item:.+/)
  async onActionDeleteItem(
    @Ctx() ctx: SessionContext,
  ): Promise<object | undefined> {
    return await this.botService.onActionDeleteItem(ctx);
  }

  @Action('my_found_items')
  async onActionViewEditMyFoundItems(
    @Ctx() ctx: SessionContext,
  ): Promise<object | undefined> {
    return await this.botService.onActionViewEditMyFoundItems(ctx);
  }

  @Action('my_lost_items')
  async onActionViewEditMyLostItems(
    @Ctx() ctx: SessionContext,
  ): Promise<object | undefined> {
    return await this.botService.onActionViewEditMyLostItems(ctx);
  }

  @Action(/update_my_item:.+/)
  async onActionUpdateUserItem(
    @Ctx() ctx: SessionContext,
  ): Promise<object | undefined> {
    return await this.botService.onActionUpdateUserItem(ctx);
  }

  @Action(/delete_my_item:.+/)
  async onActionDeleteUserItem(
    @Ctx() ctx: SessionContext,
  ): Promise<object | undefined> {
    return await this.botService.onActionDeleteUserItem(ctx);
  }

  @Action('item_title')
  async onActionUpdateUserItemTitle(
    @Ctx() ctx: SessionContext,
  ): Promise<object | undefined> {
    return await this.botService.onActionUpdateUserItemTitle(ctx);
  }

  @Action('item_location_description')
  async onActionUpdateUserItemLocatioinDescription(
    @Ctx() ctx: SessionContext,
  ): Promise<object | undefined> {
    return await this.botService.onActionUpdateUserItemLocationDescription(ctx);
  }

  @Action('item_date')
  async onActionUpdateUserItemDate(
    @Ctx() ctx: SessionContext,
  ): Promise<object | undefined> {
    return await this.botService.onActionUpdateUserItemDate(ctx);
  }

  @Action('item_time')
  async onActionUpdateUserItemTime(
    @Ctx() ctx: SessionContext,
  ): Promise<object | undefined> {
    return await this.botService.onActionUpdateUserItemTime(ctx);
  }

  @Action('item_description')
  async onActionUpdateUserItemDescription(
    @Ctx() ctx: SessionContext,
  ): Promise<object | undefined> {
    return await this.botService.onActionUpdateUserItemDescription(ctx);
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
  async onTextFoundItem(
    @Ctx() ctx: SessionContext,
  ): Promise<object | undefined> {
    return await this.botService.onTextFoundLostItem(ctx);
  }

  @On('photo')
  async onPhotoFoundItem(
    @Ctx() ctx: SessionContext,
  ): Promise<object | undefined> {
    return this.botService.onPhotoFoundItem(ctx);
  }
}
