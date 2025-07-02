import { Injectable } from '@nestjs/common';
import { Ctx, Start, Update } from 'nestjs-telegraf';
import { AdminService } from './admin.service';
import { Context } from 'telegraf';

@Update()
@Injectable()
export class AdminUpdate {
  constructor(private readonly adminService: AdminService) {}

  @Start()
  async onStart(@Ctx() ctx: Context): Promise<object | undefined> {
    return await this.adminService.onStart(ctx);
  }
}
