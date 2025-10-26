import { CetusClmmSDK } from '@cetusprotocol/sui-clmm-sdk'

class CetusService {
    private sdk: CetusClmmSDK;

    constructor() {
        const sdk = CetusClmmSDK.createSDK({
            env: 'mainnet',
        })
        this.sdk = sdk;
    }

    async getUserPositions(userAddress: string) {
        try {
            const account_address = userAddress;
            const assign_pool_ids = ['0xb8d7d9e66a60c239e7a60110efcf8de6c705580ed924d0dde141f4a0e2c90105']
            const res = await this.sdk.Position.getPositionList(account_address, assign_pool_ids, false)
            return res;
        } catch (error) {
            console.error('Error fetching user positions:', error);
            throw error;
        }
    }
}
export const cetusService = new CetusService();