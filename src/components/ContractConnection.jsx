import { useEffect, useState } from 'react'
import { useAccount, useConnect, useDisconnect, useDeployContract, useWaitForTransactionReceipt } from 'wagmi'
import { TELLOR_LAB_ADDRESS, hasKnownContract, getNetworkName } from '../config/wagmi'
import tellorLabAbi from '../contracts/TellorLab.json'

const ContractConnection = ({ onContractChange, contractAddress: selectedContractAddress, chainId }) => {
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()

  const [customAddress, setCustomAddress] = useState('')
  const [contractAddress, setContractAddress] = useState(() => {
    if (selectedContractAddress !== undefined && selectedContractAddress !== null) {
      return selectedContractAddress
    }
    if (chainId && hasKnownContract(chainId)) {
      return TELLOR_LAB_ADDRESS[chainId]
    }
    return ''
  })
  const [deploymentStatus, setDeploymentStatus] = useState('')
  const [walletCopied, setWalletCopied] = useState(false)
  const [contractCopied, setContractCopied] = useState(false)

  const { deployContract, data: deployHash } = useDeployContract()

  const {
    data: deploymentReceipt,
    error: deploymentError,
    isLoading: isDeploying,
  } = useWaitForTransactionReceipt({
    hash: deployHash,
  })

  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text)
      if (type === 'wallet') {
        setWalletCopied(true)
        setTimeout(() => setWalletCopied(false), 2000)
      } else if (type === 'contract') {
        setContractCopied(true)
        setTimeout(() => setContractCopied(false), 2000)
      }
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  useEffect(() => {
    if (selectedContractAddress !== undefined && selectedContractAddress !== null) {
      setContractAddress(selectedContractAddress)
      setCustomAddress('')
      return
    }

    const defaultAddress = chainId && hasKnownContract(chainId)
      ? TELLOR_LAB_ADDRESS[chainId]
      : ''

    setContractAddress(defaultAddress)
    setCustomAddress('')
  }, [selectedContractAddress, chainId])

  const useDefaultAddress = () => {
    const defaultAddr = chainId && hasKnownContract(chainId)
      ? TELLOR_LAB_ADDRESS[chainId]
      : ''
    if (defaultAddr) {
      setContractAddress(defaultAddr)
      setCustomAddress('')
      onContractChange?.(defaultAddr)
    }
  }

  const useCustomAddress = () => {
    if (customAddress.trim()) {
      const nextAddress = customAddress.trim()
      setContractAddress(nextAddress)
      onContractChange?.(nextAddress)
    }
  }


  const handleDeploy = async () => {
    if (!isConnected) {
      alert('Please connect your wallet first')
      return
    }

    try {
      setDeploymentStatus('Initiating contract deployment...')

      await deployContract({
        abi: tellorLabAbi.abi,
        bytecode: tellorLabAbi.bytecode,
      })
      setDeploymentStatus('Transaction sent! Waiting for confirmation...')
    } catch (error) {
      console.error('Deployment error:', error)
      setDeploymentStatus(`Deployment failed: ${error.message}`)
      setTimeout(() => setDeploymentStatus(''), 5000)
    }
  }

  useEffect(() => {
    if (!deploymentReceipt) return

    const newAddress = deploymentReceipt.contractAddress

    if (newAddress) {
      const shortAddress = `${newAddress.slice(0, 6)}...${newAddress.slice(-4)}`
      setContractAddress(newAddress)
      setCustomAddress('')
      setContractCopied(false)
      onContractChange?.(newAddress)
      setDeploymentStatus(`Deployment complete! New contract: ${shortAddress}`)
    } else {
      setDeploymentStatus('Deployment confirmed, but no contract address was provided.')
    }

    const timeout = setTimeout(() => setDeploymentStatus(''), 6000)
    return () => clearTimeout(timeout)
  }, [deploymentReceipt, onContractChange])

  useEffect(() => {
    if (!deploymentError) return
    setDeploymentStatus(`Deployment failed: ${deploymentError.message}`)
    const timeout = setTimeout(() => setDeploymentStatus(''), 6000)
    return () => clearTimeout(timeout)
  }, [deploymentError])

  return (
    <div className="contract-connection">
      <div className="connection-header">
        <h3>Connect Your Wallet & Configure Contract</h3>
        <p className="connection-subtitle">
          First, connect your wallet and we'll automatically configure the TellorLab contract for your network.
        </p>
      </div>

      <div className="connection-content">
        {/* Wallet Connection Section */}
        <div className="connection-card wallet-card">
          <div className="card-header">
            <h4>🦊 Wallet Connection</h4>
          </div>
          <div className="card-content">
            {isConnected ? (
              <div className="wallet-connected">
                <div className="connection-status">
                  <span className="status-icon">✅</span>
                  <div className="connection-details">
                    <p
                      className="wallet-address clickable-address"
                      onClick={() => copyToClipboard(address, 'wallet')}
                      title="Click to copy full address"
                    >
                      {walletCopied ? '✓ Copied!' : `${address?.slice(0, 6)}...${address?.slice(-4)}`}
                    </p>
                    <p className="network-info">Connected to {getNetworkName(chainId)}</p>
                  </div>
                </div>
                <button className="secondary-button" onClick={() => disconnect()}>
                  Disconnect
                </button>
              </div>
            ) : (
              <div className="wallet-disconnected">
                <p className="connect-prompt">Connect your wallet to continue</p>
                <div className="connect-options">
                  {connectors.map((connector) => (
                    <button
                      key={connector.uid}
                      className="connect-button"
                      onClick={() => connect({ connector })}
                      type="button"
                    >
                      Connect {connector.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Contract Configuration Section */}
        <div className="connection-card contract-card">
          <div className="card-header">
            <h4>📜 Contract Configuration</h4>
          </div>
          <div className="card-content">
            {isConnected && hasKnownContract(chainId) ? (
              <div className="contract-default">
                <div className="contract-status">
                  <span className="status-icon">✅</span>
                  <div className="contract-details">
                    <p className="contract-label">Using default TellorLab contract</p>
                    <p
                      className="contract-address clickable-address"
                      onClick={() => copyToClipboard(contractAddress, 'contract')}
                      title="Click to copy full address"
                    >
                      {contractCopied ? '✓ Copied!' : `${contractAddress?.slice(0, 6)}...${contractAddress?.slice(-4)}`}
                    </p>
                    <p className="network-info">Deployed on {getNetworkName(chainId)}</p>
                  </div>
                </div>
                <div className="contract-inline-action">
                  <button
                    type="button"
                    className="inline-action-button"
                    onClick={handleDeploy}
                    disabled={isDeploying}
                  >
                    {isDeploying ? 'Deploying...' : 'Deploy New Contract'}
                  </button>
                </div>
              </div>
            ) : isConnected ? (
              <div className="contract-missing">
                <div className="warning-section">
                  <span className="status-icon">⚠️</span>
                  <div className="warning-details">
                    <p className="warning-message">No TellorLab contract found on {getNetworkName(chainId)}</p>
                    <p className="warning-suggestion">You can deploy one or use a custom address</p>
                  </div>
                </div>

                <div className="contract-actions">
                  <button
                    onClick={handleDeploy}
                    disabled={isDeploying}
                    className="deploy-button"
                  >
                    {isDeploying ? 'Deploying...' : 'Deploy New Contract'}
                  </button>

                  <div className="custom-address-section">
                    <input
                      type="text"
                      placeholder="Or enter custom contract address"
                      value={customAddress}
                      onChange={(e) => setCustomAddress(e.target.value)}
                      className="custom-input"
                    />
                    <button
                      onClick={useCustomAddress}
                      disabled={!customAddress.trim()}
                      className="secondary-button"
                    >
                      Use Custom
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="contract-pending">
                <p className="pending-message">Please connect your wallet first to configure the contract</p>
              </div>
            )}

            {deploymentStatus && (
              <div className={`deployment-status ${isDeploying ? 'deploying' : 'completed'}`}>
                {deploymentStatus}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Continue Button */}
      <div className="continue-section">
        <button
          className="continue-button"
          disabled={!isConnected || !contractAddress}
          onClick={() => {
            // Trigger the onContractChange callback to move to next step
            if (contractAddress) {
              onContractChange?.(contractAddress)
            }
          }}
        >
          Continue to Query Builder
        </button>
        {(!isConnected || !contractAddress) && (
          <p className="continue-hint">
            {!isConnected ? 'Connect your wallet to continue' : 'Configure a contract address to continue'}
          </p>
        )}
      </div>
    </div>
  )
}

export default ContractConnection
