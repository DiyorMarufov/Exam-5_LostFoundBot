import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminUpdate } from './admin.update';

@Module({
  providers: [AdminService, AdminUpdate],
  exports: [AdminService],
})
export class AdminModule {}
