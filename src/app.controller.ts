import { Controller, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';
import { User as UserModel } from '@prisma/client';

@Controller('user')
export class AppController {
  constructor(private readonly appService: AppService) {}
}
