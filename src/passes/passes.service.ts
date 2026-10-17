import {
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreatePassDto } from './dto/create-pass.dto';
import type { WalletProvider } from './providers/wallet-provider.interface';
import { Pass } from './entities/pass.entity';

@Injectable()
export class PassesService {
  constructor(
    @Inject('WalletProvider')
    private readonly walletProvider: WalletProvider,

    @InjectRepository(Pass)
    private readonly passRepository: Repository<Pass>,
  ) {}

  async createPass(createPassDto: CreatePassDto) {
    const { name, label, value } = createPassDto;

    const passId = `PASS-${Date.now()}`;

    const walletPass = await this.walletProvider.createPass({
      passId,
      name,
      label,
      value,
    });

    const pass = this.passRepository.create({
      passId,
      name,
      label,
      value,
      provider: 'google',
    });

    await this.passRepository.save(pass);

    return {
      passId,
      name,
      label,
      value,
      saveUrl: walletPass.saveUrl,
    };
  }

  async updatePass(passId: string, value: number) {
    const pass = await this.passRepository.findOne({
      where: { passId },
    });

    if (!pass) {
      throw new NotFoundException(
        `Pass not found: ${passId}`,
      );
    }

    try {
      await this.walletProvider.updatePass(
        passId,
        pass.label,
        value,
      );
    } catch (error) {
      console.error('Failed to update Google Wallet pass:', {
        passId,
        error,
      });

      throw new Error(
        `Failed to update Google Wallet pass: ${passId}`,
      );
    }

    try {
      pass.value = value;

      await this.passRepository.save(pass);
    } catch (error) {
      console.error('Failed to save pass to database:', {
        passId,
        value,
        error,
      });

      throw new Error(
        `Pass updated in Google Wallet, but database update failed: ${passId}`,
      );
    }

    return {
      passId: pass.passId,
      name: pass.name,
      label: pass.label,
      value: pass.value,
      message: 'Pass updated successfully',
    };
  }
}