import { useState } from 'react'
import { useAccount } from 'wagmi'
import { useTheme } from '../contexts/ThemeContext'
import { getNetworkName, isNetworkMismatch } from '../config/wagmi'
import useWalletChainId from '../hooks/useWalletChainId'

const SystemStatus = ({ queryInfo, encodedValue, contractAddress }) => {
  const { theme } = useTheme()
  const { address, isConnected } = useAccount()
  const chainId = useWalletChainId()
  const [copiedItem, setCopiedItem] = useState(null)


  const copyToClipboard = async (value, label) => {
    if (!value || value === 'DISCONNECTED' || value === 'NOT CONNECTED' || value === 'NOT SET' || value === 'NOT GENERATED' || value === 'NOT ENCODED') {
      return
    }

    try {
      await navigator.clipboard.writeText(value)
      setCopiedItem(label)
      setTimeout(() => setCopiedItem(null), 2000)
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }

  const hasChain = typeof chainId === 'number'
  const networkMismatch = Boolean(isConnected && hasChain && contractAddress && isNetworkMismatch(chainId, contractAddress))

  const statusItems = [
    {
      label: 'NETWORK',
      displayValue: isConnected ? (hasChain ? getNetworkName(chainId) : 'UNKNOWN') : 'DISCONNECTED',
      copyValue: isConnected && hasChain ? chainId?.toString() : null,
      status: isConnected ? (networkMismatch || !hasChain ? 'error' : 'online') : 'offline',
      icon: '◉'
    },
    {
      label: 'WALLET',
      displayValue: isConnected ? `${address?.slice(0, 6)}...${address?.slice(-4)}` : 'NOT CONNECTED',
      copyValue: address,
      status: isConnected ? 'online' : 'offline',
      icon: '◈'
    },
    {
      label: 'LAB CONTRACT',
      displayValue: contractAddress ? `${contractAddress.slice(0, 6)}...${contractAddress.slice(-4)}` : 'NOT SET',
      copyValue: contractAddress,
      status: contractAddress ? (networkMismatch ? 'error' : 'online') : 'offline',
      icon: '◇'
    },
    {
      label: 'QUERY ID',
      displayValue: queryInfo?.queryId ? `${queryInfo.queryId.slice(0, 8)}...` : 'NOT GENERATED',
      copyValue: queryInfo?.queryId,
      status: queryInfo?.queryId ? 'online' : 'offline',
      icon: '◆'
    },
    {
      label: 'VALUE',
      displayValue: encodedValue ? `${encodedValue.slice(0, 10)}...` : 'NOT ENCODED',
      copyValue: encodedValue,
      status: encodedValue ? 'online' : 'offline',
      icon: '●'
    }
  ]

  return (
    <div className="system-status" style={{ borderColor: theme.border }}>
      <div className="status-header">
        <span className="terminal-bracket">┌─</span>
        <h3>SYSTEM STATUS</h3>
        <span className="terminal-bracket">─┐</span>
      </div>

      <div className="status-grid">
        {statusItems.map((item, index) => (
          <div
            key={index}
            className={`status-item ${item.status} ${item.copyValue ? 'clickable' : ''}`}
            style={{ borderColor: theme.border }}
            onClick={() => copyToClipboard(item.copyValue, item.label)}
            title={item.copyValue ? `Click to copy ${item.label.toLowerCase()}` : ''}
          >
            <div className="status-icon">
              <span
                style={{
                  color: item.status === 'online' ? theme.success :
                         item.status === 'warning' ? theme.warning :
                         item.status === 'error' ? theme.error : theme.grey
                }}
              >
                {item.icon}
              </span>
            </div>
            <div className="status-info">
              <div className="status-label" style={{ color: theme.textDim }}>
                {item.label}
                {copiedItem === item.label && (
                  <span className="copy-feedback" style={{ color: theme.success }}>
                    {' '}✓ COPIED
                  </span>
                )}
              </div>
              <div className="status-value" style={{ color: theme.text }}>
                {item.displayValue}
              </div>
            </div>
            <div className="status-indicator">
              <div
                className={`indicator-dot ${item.status}`}
                style={{
                  backgroundColor: item.status === 'online' ? theme.success :
                                  item.status === 'warning' ? theme.warning :
                                  item.status === 'error' ? theme.error : theme.grey
                }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      <div className="status-footer" style={{ borderColor: theme.border }}>
        <span className="terminal-bracket">└─</span>
        <span>MISSION PARAMETERS</span>
        <span className="terminal-bracket">─┘</span>
      </div>
    </div>
  )
}

export default SystemStatus
