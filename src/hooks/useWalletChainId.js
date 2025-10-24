import { useEffect, useState } from 'react'
import { useAccount, useChainId } from 'wagmi'

const parseChainId = (value) => {
  if (value == null) return null

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }

  if (typeof value === 'string') {
    const normalized = value.startsWith('0x')
      ? Number.parseInt(value, 16)
      : Number.parseInt(value, 10)
    return Number.isNaN(normalized) ? null : normalized
  }

  try {
    const numeric = Number(value)
    return Number.isNaN(numeric) ? null : numeric
  } catch (error) {
    console.error('Failed to parse chain id', error)
    return null
  }
}

const useWalletChainId = () => {
  const { chainId: accountChainId, isConnected } = useAccount()
  const fallbackChainId = useChainId()
  const [walletChainId, setWalletChainId] = useState(() => {
    const initial = accountChainId ?? fallbackChainId
    return parseChainId(initial)
  })

  useEffect(() => {
    if (!isConnected) {
      setWalletChainId(null)
    }
  }, [isConnected])

  useEffect(() => {
    const parsedAccountChain = parseChainId(accountChainId)
    if (parsedAccountChain != null) {
      setWalletChainId(parsedAccountChain)
      return
    }

    const parsedFallbackChain = parseChainId(fallbackChainId)
    if (parsedFallbackChain != null) {
      setWalletChainId(parsedFallbackChain)
    }
  }, [accountChainId, fallbackChainId])

  useEffect(() => {
    if (!isConnected) return undefined
    if (typeof window === 'undefined') return undefined
    const { ethereum } = window
    if (!ethereum?.request) return

    let cancelled = false

    const handleChainChange = (nextChainId) => {
      if (cancelled) return
      const parsed = parseChainId(nextChainId)
      if (parsed != null) {
        setWalletChainId(parsed)
      }
    }

    ethereum.request({ method: 'eth_chainId' })
      .then((response) => {
        handleChainChange(response)
      })
      .catch(() => {
        // Ignore failures: likely user not connected yet
      })

    ethereum.on?.('chainChanged', handleChainChange)

    return () => {
      cancelled = true
      ethereum.removeListener?.('chainChanged', handleChainChange)
    }
  }, [isConnected])

  return walletChainId
}

export default useWalletChainId
