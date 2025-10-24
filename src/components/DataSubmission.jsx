import { useState, useEffect } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import tellorLabAbi from '../contracts/TellorLab.json'
import { isNetworkMismatch, getNetworkName, getContractNetworkId } from '../config/wagmi'
import useWalletChainId from '../hooks/useWalletChainId'

const DataSubmission = ({ queryId, encodedValue, contractAddress, onDataSubmitted, queryInfo, valueInfo }) => {
  const { isConnected } = useAccount()
  const chainId = useWalletChainId()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { writeContract, data: hash } = useWriteContract()

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash })

  // Fix the infinite re-render by using useEffect
  useEffect(() => {
    if (isConfirming) {
      setIsSubmitting(false)
    }
  }, [isConfirming])

  // Call callback when transaction is confirmed
  useEffect(() => {
    if (isConfirmed && onDataSubmitted) {
      onDataSubmitted()
    }
  }, [isConfirmed, onDataSubmitted])

  const hasChain = typeof chainId === 'number'
  const networkMismatch = Boolean(isConnected && hasChain && contractAddress && isNetworkMismatch(chainId, contractAddress))

  const submitData = async () => {
    if (!queryId) {
      alert('Please generate a Query ID first')
      return
    }

    if (!encodedValue) {
      alert('Please encode a value first')
      return
    }

    if (!contractAddress) {
      alert('Please set a contract address')
      return
    }

    if (!isConnected) {
      alert('Please connect your wallet first')
      return
    }

    if (networkMismatch) {
      const contractChainId = getContractNetworkId(contractAddress)
      const contractNetwork = getNetworkName(contractChainId)
      const currentNetwork = getNetworkName(chainId)
      alert(`Network mismatch! Your wallet is connected to ${currentNetwork}, but this contract is deployed on ${contractNetwork}. Please switch networks in your wallet.`)
      return
    }

    try {
      setIsSubmitting(true)

      await writeContract({
        address: contractAddress,
        abi: tellorLabAbi.abi,
        functionName: 'updateOracleDataLab',
        args: [queryId, encodedValue],
      })
    } catch (error) {
      console.error('Error submitting data:', error)
      alert('Error submitting data: ' + error.message)
      setIsSubmitting(false)
    }
  }

  return (
    <div className="data-submission">
      <h3>Submit Oracle Data</h3>

      <div className="submission-info">
        <div className="info-section">
          <h4>Query Information:</h4>
          {queryInfo ? (
            <>
              <div className="info-item">
                <label>Query Type:</label>
                <code>{queryInfo.queryType}</code>
              </div>
              <div className="info-item">
                <label>Arguments:</label>
                <div className="args-list">
                  {queryInfo.args && queryInfo.args.length > 0 ? (
                    queryInfo.args.map((arg, idx) => (
                      <div key={idx} className="arg-display">
                        <span className="arg-type">{arg.type}</span>: <code>{arg.value}</code>
                      </div>
                    ))
                  ) : (
                    <span className="empty-args">No arguments</span>
                  )}
                </div>
              </div>
              <div className="info-item">
                <label>Query Data:</label>
                <code className="code-block">{queryInfo.queryData}</code>
              </div>
              <div className="info-item">
                <label>Query ID:</label>
                <code className="code-block">{queryInfo.queryId}</code>
              </div>
            </>
          ) : (
            <p className="warning">Query information not available</p>
          )}
        </div>

        <div className="info-section">
          <h4>Value Information:</h4>
          {valueInfo && valueInfo.length > 0 ? (
            <>
              <div className="info-item">
                <label>Value Parameters:</label>
                <div className="values-display">
                  {valueInfo.map((val, idx) => (
                    <div key={idx} className="value-display-item">
                      <span className="value-type">{val.type}</span>: <code>{val.value}</code>
                      {(val.type === 'uint256' || val.type === 'int256') && val.decimals !== '0' && (
                        <span className="decimals"> (decimals: {val.decimals})</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="info-item">
                <label>Encoded Value:</label>
                <code className="code-block">{encodedValue}</code>
              </div>
            </>
          ) : (
            <p className="warning">Value information not available</p>
          )}
        </div>

        <div className="info-section">
          <h4>Lab Contract Information:</h4>
          <div className="info-item">
            <label>Lab Contract Address:</label>
            <code className="code-block">{contractAddress || 'Not set'}</code>
          </div>
        </div>
      </div>

      <div className="submission-status">
        {!isConnected && (
          <p className="warning">Please connect your wallet to submit data</p>
        )}

        {networkMismatch && isConnected && (
          <div className="warning">
            <p><strong>⚠️ Network Mismatch Detected!</strong></p>
            <p>Your wallet is on {getNetworkName(chainId)}, but the contract is deployed on {getNetworkName(getContractNetworkId(contractAddress))}.</p>
            <p>Please switch networks in your wallet to continue.</p>
          </div>
        )}

        {isConfirming && (
          <p className="info">Waiting for confirmation...</p>
        )}

        {isConfirmed && (
          <div className="success">
            <p>Transaction confirmed!</p>
            <p>Hash: <code>{hash}</code></p>
          </div>
        )}
      </div>

      <button
        onClick={submitData}
        disabled={!queryId || !encodedValue || !contractAddress || !isConnected || isSubmitting || isConfirming || networkMismatch}
        className="submit-btn"
      >
        {isSubmitting ? 'Submitting...' : isConfirming ? 'Confirming...' : networkMismatch ? 'Network Mismatch - Cannot Submit' : 'Submit Oracle Data'}
      </button>
    </div>
  )
}

export default DataSubmission
