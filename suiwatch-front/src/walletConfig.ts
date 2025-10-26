import type { AppKitNetwork } from '@reown/appkit/networks'
import type { CustomCaipNetwork } from '@reown/appkit-common'
import { UniversalConnector } from '@reown/appkit-universal-connector'

// Get projectId from https://dashboard.reown.com
export const projectId = import.meta.env.VITE_PROJECT_ID || "4b17e929bbccd594e2f2bd1e494ecd4c" // Replace with your actual project ID

if (!projectId || projectId === "YOUR_PROJECT_ID_HERE") {
  throw new Error('Project ID is not defined. Please set your project ID from the WalletConnect Dashboard.')
}

const suiMainnet: CustomCaipNetwork<'sui'> = {
  id: 784,
  chainNamespace: 'sui' as const,
  caipNetworkId: 'sui:mainnet',
  name: 'Sui',
  nativeCurrency: { name: 'SUI', symbol: 'SUI', decimals: 9 },
  rpcUrls: { default: { http: ['https://fullnode.mainnet.sui.io:443'] } }
}

const solanaMainnet = {
  id: 'solana-mainnet',
  chainNamespace: 'solana',
  caipNetworkId: 'solana:mainnet',
  name: 'Solana',
  nativeCurrency: { name: 'SOL', symbol: 'SOL', decimals: 9 },
  rpcUrls: { default: { http: ['https://api.mainnet-beta.solana.com'] } }
}

export const networks = [suiMainnet, solanaMainnet] as [AppKitNetwork, ...AppKitNetwork[]]

export async function getUniversalConnector() {
  const universalConnector = await UniversalConnector.init({
    projectId,
    metadata: {
      name: 'Universal Connector',
      description: 'Universal Connector',
      url: 'https://suiwatch.vercel.app',
      icons: ['https://appkit.reown.com/icon.png']
    },
    networks: [
      {
        methods: ['sui_signPersonalMessage'],
        chains: [suiMainnet as CustomCaipNetwork],
        events: [],
        namespace: 'sui'
      },
      {
        methods: ['solana_signMessage', 'solana_signTransaction'],
        chains: [solanaMainnet as CustomCaipNetwork],
        events: [],
        namespace: 'solana'
      }
    ]
  })

  return universalConnector
}