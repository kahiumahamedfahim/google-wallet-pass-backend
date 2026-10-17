import { Module } from '@nestjs/common';
import { PassesController } from './passes.controller';
import { PassesService } from './passes.service';
import { GoogleWalletProvider } from './providers/google-wallet.provider';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pass } from './entities/pass.entity';
@Module({

   imports: [
    TypeOrmModule.forFeature([Pass]),
  ],
  controllers: [PassesController],
  providers: [
    PassesService,
    GoogleWalletProvider,
    {
      provide: 'WalletProvider',
      useExisting: GoogleWalletProvider,
    },
  ],
})
export class PassesModule {}