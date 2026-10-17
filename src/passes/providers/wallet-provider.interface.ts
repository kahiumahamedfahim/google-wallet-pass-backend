export interface WalletProvider {
  createPass(data: {
    passId: string;
    name: string;
    label: string;
    value: number;
  }): Promise<{
    saveUrl: string;
  }>;

  updatePass(
    passId: string,
    label: string,
    value: number,
  ): Promise<void>;
}