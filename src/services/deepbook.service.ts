import { DeepBookClient } from '@mysten/deepbook-v3';
import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';


class DeepBookMarketMaker {
    suiClient: SuiClient; // For executing transactions

    constructor() {
        this.suiClient = new SuiClient({
            url: getFullnodeUrl('mainnet'),
        });
    }

    async getDeepbookBalances(ownerAddress: string) {

        const balanceManagers = {
            MANAGER_1: {
                address: ownerAddress,
                tradeCap: '',
            },
        };

        const dbClient = new DeepBookClient({
            address: '0x0',
            env: 'mainnet',
            client: new SuiClient({
                url: getFullnodeUrl('mainnet'),
            }),
        });
        const assets = ['SUI', 'USDC', 'WUSDT', 'WUSDC', 'BETH', 'DEEP']; // Update assets as needed
        const BALANCE_MANAGER_KEY = 'MANAGER_1';

        let balances = [];
        for (const asset of assets) {
            balances.push(await dbClient.checkManagerBalance(BALANCE_MANAGER_KEY, asset));
        }
        return balances;
    }


}

export const deepbookMarketMaker = new DeepBookMarketMaker();