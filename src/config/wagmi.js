import { http, createConfig } from 'wagmi'
import { sepolia, mainnet, hardhat, localhost, polygon, arbitrum, optimism, base, baseSepolia, bsc, avalanche, fantom } from 'wagmi/chains'
import { injected, metaMask } from 'wagmi/connectors'

export const config = createConfig({
  chains: [sepolia, mainnet, hardhat, localhost, polygon, arbitrum, optimism, base, baseSepolia, bsc, avalanche, fantom],
  connectors: [
    injected(),
    metaMask(),
  ],
  transports: {
    [sepolia.id]: http(),
    [mainnet.id]: http(),
    [hardhat.id]: http(),
    [localhost.id]: http(),
    [polygon.id]: http(),
    [arbitrum.id]: http(),
    [optimism.id]: http(),
    [base.id]: http(),
    [bsc.id]: http(),
    [baseSepolia.id]: http(),
    [avalanche.id]: http(),
    [fantom.id]: http(),
  },
  multiInjectedProviderDiscovery: false,
})

export const TELLOR_LAB_ADDRESS = {
  [sepolia.id]: '0x9825DA98095A56a442507288F6dcbe302a59d52C',
  [baseSepolia.id]: '0x145E61B9D7649A4686a010E22f59D375fc0FC797',
}

export const getNetworkName = (chainId) => {
  if (chainId == null) return 'UNKNOWN'
  switch (chainId) {
    case 1: return 'MAINNET'
    case 11155111: return 'SEPOLIA'
    case 137: return 'POLYGON'
    case 42161: return 'ARBITRUM'
    case 10: return 'OPTIMISM'
    case 8453: return 'BASE'
    case 84532: return 'BASE SEPOLIA'
    case 56: return 'BSC'
    case 43114: return 'AVALANCHE'
    case 250: return 'FANTOM'
    case 31337: return 'HARDHAT'
    case 1337: return 'LOCALHOST'
    default: return `CHAIN ${chainId}`
  }
}

export const hasKnownContract = (chainId) => {
  return Boolean(TELLOR_LAB_ADDRESS[chainId])
}

export const getContractNetworkId = (contractAddress) => {
  for (const [chainId, address] of Object.entries(TELLOR_LAB_ADDRESS)) {
    if (address.toLowerCase() === contractAddress?.toLowerCase()) {
      return Number(chainId)
    }
  }
  return null
}

export const isNetworkMismatch = (connectedChainId, contractAddress) => {
  if (!contractAddress || connectedChainId == null) return false
  const contractChainId = getContractNetworkId(contractAddress)
  if (!contractChainId) return false
  return contractChainId !== connectedChainId
}
