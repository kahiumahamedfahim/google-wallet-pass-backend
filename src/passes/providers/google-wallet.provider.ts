import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { google } from 'googleapis';
import { WalletProvider } from './wallet-provider.interface';
import { IsJWT } from 'class-validator';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class GoogleWalletProvider implements WalletProvider {
  private readonly issuerId: string;
  private readonly classId: string;
  private readonly serviceAccountEmail: string;
  private readonly privateKey: string;

  private readonly walletClient;

  constructor(private readonly configService: ConfigService) {
    this.issuerId = this.configService.getOrThrow<string>(
      'GOOGLE_WALLET_ISSUER_ID',
    );

    this.classId = this.configService.getOrThrow<string>(
      'GOOGLE_WALLET_CLASS_ID',
    );

    this.serviceAccountEmail = this.configService.getOrThrow<string>(
      'GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL',
    );

    this.privateKey = this.configService
      .getOrThrow<string>('GOOGLE_WALLET_PRIVATE_KEY')
      .replace(/\\n/g, '\n');
      console.log({
  hasKey: !!this.privateKey,
  startsCorrectly: this.privateKey.startsWith(
    '-----BEGIN PRIVATE KEY-----',
  ),
  endsCorrectly: this.privateKey.trim().endsWith(
    '-----END PRIVATE KEY-----',
  ),
  containsNewlines: this.privateKey.includes('\n'),
  keyLength: this.privateKey.length,
});

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: this.serviceAccountEmail,
        private_key: this.privateKey,
      },
      scopes: ['https://www.googleapis.com/auth/wallet_object.issuer'],
    });

    this.walletClient = google.walletobjects({
      version: 'v1',
      auth,
    });
  }

 async createPass(data: {
  passId: string;
  name: string;
  label: string;
  value: number;
}): Promise<{ saveUrl: string }> {
  const classId = await this.createClass();

  const objectId = await this.createObject(data);

  const saveUrl = this.generateSaveUrl(objectId, classId);

  return {
    saveUrl,
  };
}

async updatePass(
  passId: string,
  label: string,
  value: number,
): Promise<void> {
  const objectId = `${this.issuerId}.${passId}`;

  await this.walletClient.genericobject.patch({
    resourceId: objectId,
    requestBody: {
      textModulesData: [
        {
          id: 'label',
          header: label,
          body: String(value),
        },
      ],
    },
  });

  console.log('Google Wallet pass updated:', {
    objectId,
    label,
    value,
  });
}
  private async createClass(): Promise<string> {
  const classId = `${this.issuerId}.${this.classId}`;

  try {
    await this.walletClient.genericclass.get({
      resourceId: classId,
    });

    console.log(`Google Wallet class already exists: ${classId}`);

    return classId;
  } catch (error: any) {
    if (error.response?.status !== 404) {
      throw error;
    }
  }

  const response = await this.walletClient.genericclass.insert({
    requestBody: {
      id: classId,
    },
  });

  console.log('Google Wallet class created:', response.data.id);

  return response.data.id;
}
private async createObject(data: {
  passId: string;
  name: string;
  label: string;
  value: number;
}): Promise<string> {
  const objectId = `${this.issuerId}.${data.passId}`;
  const classId = `${this.issuerId}.${this.classId}`;

  try {
    await this.walletClient.genericobject.get({
      resourceId: objectId,
    });

    console.log(`Google Wallet object already exists: ${objectId}`);

    return objectId;
  } catch (error: any) {
    if (error.response?.status !== 404) {
      throw error;
    }
  }

  const newObject = {
    id: objectId,
    classId,
    state: 'ACTIVE',

    cardTitle: {
      defaultValue: {
        language: 'en-US',
        value: 'Google Wallet Pass Demo',
      },
    },

    header: {
      defaultValue: {
        language: 'en-US',
        value: data.name,
      },
    },

    textModulesData: [
      {
        id: 'label',
        header: data.label,
        body: String(data.value),
      },
    ],

    barcode: {
      type: 'QR_CODE',
      value: data.passId,
      alternateText: data.passId,
    },

    hexBackgroundColor: '#ffffff',
  };

  const response = await this.walletClient.genericobject.insert({
    requestBody: newObject,
  });

  console.log('Google Wallet object created:', response.data.id);

  return response.data.id;
}
private generateSaveUrl(objectId: string, classId: string): string {
  const payload = {
    iss: this.serviceAccountEmail,
    aud: 'google',
    origins: [],
    typ: 'savetowallet',
    payload: {
      genericObjects: [
        {
          id: objectId,
          classId: classId,
        },
      ],
    },
  };

  const token = jwt.sign(payload, this.privateKey, {
    algorithm: 'RS256',
  });

  return `https://pay.google.com/gp/v/save/${token}`;
}

async testIssuer(): Promise<void> {
  try {
    const response = await this.walletClient.issuer.get({
      resourceId: this.issuerId,
    });

    console.log('========== ISSUER FOUND ==========');
    console.log(response.data);
    console.log('==================================');
  } catch (error: any) {
    console.log('========== ISSUER ERROR ==========');
    console.log(error.response?.data || error.message);
    console.log('==================================');

    throw error;
  }
}

async testClass(): Promise<void> {
  const classId = `${this.issuerId}.${this.classId}`;

  try {
    const response = await this.walletClient.genericclass.get({
      resourceId: classId,
    });

    console.log('========== CLASS FOUND ==========');
    console.log(response.data);
    console.log('=================================');
  } catch (error: any) {
    console.log('========== CLASS ERROR ==========');
    console.log(error.response?.data || error.message);
    console.log('=================================');

    throw error;
  }
}

async listIssuers(): Promise<void> {
  try {
    const response = await this.walletClient.issuer.list();

    console.log('========== ISSUERS FOUND ==========');
    console.log(response.data);
    console.log('===================================');
  } catch (error: any) {
    console.log('========== ISSUER LIST ERROR ==========');
    console.log(error.response?.data || error.message);
    console.log('=======================================');

    throw error;
  }
}
}