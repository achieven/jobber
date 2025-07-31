import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WebServerModule } from './web-server/web-server.module';

@Module({
  imports: [WebServerModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
