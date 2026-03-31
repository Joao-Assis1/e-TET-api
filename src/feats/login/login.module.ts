import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { LoginService } from './login.service';
import { LoginController } from './login.controller';

@Module({
  imports: [UsersModule],
  providers: [LoginService],
  controllers: [LoginController],
})
export class LoginModule {}
