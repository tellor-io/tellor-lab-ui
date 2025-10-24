import { useState, useEffect, useCallback } from 'react'
import { useReadContract, useReadContracts } from 'wagmi'
import { decodeAbiParameters, parseAbiParameters } from 'viem'
import tellorLabAbi from '../contracts/TellorLab.json'

const DataFeed = ({ queryId, contractAddress, lastSubmissionTime, valueTypes = [] }) => {
  const [historicalData, setHistoricalData] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [currentData, setCurrentData] = useState(null)
  const [refreshInterval, setRefreshInterval] = useState(30000) // 30 seconds default
  const [lastRefresh, setLastRefresh] = useState(null)

  const { data: currentAggregateData, refetch: refetchCurrent } = useReadContract({
    address: contractAddress,
    abi: tellorLabAbi.abi,
    functionName: 'getCurrentAggregateData',
    args: [queryId],
    enabled: !!queryId && !!contractAddress,
  })

  const { data: valueCount, refetch: refetchCount } = useReadContract({
    address: contractAddress,
    abi: tellorLabAbi.abi,
    functionName: 'getAggregateValueCount',
    args: [queryId],
    enabled: !!queryId && !!contractAddress,
  })

  // Decode value with error handling
  const decodeValue = useCallback((encodedValue) => {
    if (!encodedValue || encodedValue === '0x') {
      return { decoded: null, error: null, raw: encodedValue }
    }

    if (!valueTypes || valueTypes.length === 0) {
      return { decoded: null, error: 'No value types configured', raw: encodedValue }
    }

    try {
      const types = valueTypes.map(val => val.type).join(',')
      const decoded = decodeAbiParameters(parseAbiParameters(types), encodedValue)

      // Format the decoded values nicely
      const formatted = decoded.map((value, index) => {
        const val = valueTypes[index]
        if ((val.type === 'uint256' || val.type === 'int256') && val.decimals && val.decimals !== '0') {
          const divisor = BigInt(10) ** BigInt(val.decimals)
          const wholePart = value / divisor
          const fractionalPart = value % divisor
          return `${wholePart}.${fractionalPart.toString().padStart(parseInt(val.decimals), '0').replace(/0+$/, '') || '0'}`
        }
        return value.toString()
      })

      return {
        decoded: formatted.length === 1 ? formatted[0] : formatted.join(', '),
        error: null,
        raw: encodedValue
      }
    } catch (error) {
      return { decoded: null, error: error.message, raw: encodedValue }
    }
  }, [valueTypes])

  useEffect(() => {
    if (currentAggregateData) {
      const decodedData = decodeValue(currentAggregateData.value)
      setCurrentData({ ...currentAggregateData, ...decodedData })
    }
  }, [currentAggregateData, decodeValue])

  // Auto-refresh functionality
  const refreshData = useCallback(async () => {
    if (!queryId || !contractAddress) return

    try {
      await Promise.all([refetchCurrent(), refetchCount()])
      setLastRefresh(new Date())
    } catch (error) {
      console.error('Error refreshing data:', error)
    }
  }, [queryId, contractAddress, refetchCurrent, refetchCount])

  // Set up auto-refresh intervals
  useEffect(() => {
    if (!queryId || !contractAddress) return

    const interval = setInterval(refreshData, refreshInterval)
    return () => clearInterval(interval)
  }, [queryId, contractAddress, refreshInterval, refreshData])

  // Faster refresh after transactions
  useEffect(() => {
    if (lastSubmissionTime) {
      // Refresh immediately
      refreshData()

      // Use faster refresh (5 seconds) for 2 minutes after submission
      setRefreshInterval(5000)

      const resetTimer = setTimeout(() => {
        setRefreshInterval(30000) // Back to 30 seconds
      }, 120000) // 2 minutes

      return () => clearTimeout(resetTimer)
    }
  }, [lastSubmissionTime, refreshData])

  // Create contracts for historical data fetching (latest 5 entries)
  const createHistoricalContracts = useCallback(() => {
    if (!queryId || !contractAddress || !valueCount) return []

    const count = Number(valueCount)
    const entriesToFetch = Math.min(count, 5)
    const contracts = []

    for (let i = 0; i < entriesToFetch; i++) {
      const index = count - 1 - i // Start from most recent
      contracts.push({
        address: contractAddress,
        abi: tellorLabAbi.abi,
        functionName: 'getAggregateByIndex',
        args: [queryId, BigInt(index)],
      })
    }

    return contracts
  }, [queryId, contractAddress, valueCount])

  const { data: historicalContracts, refetch: refetchHistorical } = useReadContracts({
    contracts: createHistoricalContracts(),
    enabled: !!queryId && !!contractAddress && !!valueCount && Number(valueCount) > 0, // Auto-fetch when prerequisites are met
  })

  // Process historical data when contracts return
  useEffect(() => {
    if (historicalContracts && Array.isArray(historicalContracts)) {
      const count = Number(valueCount)
      const entriesToFetch = Math.min(count, 5)
      const processedData = []

      historicalContracts.forEach((result, i) => {
        if (result && result.status === 'success' && result.result) {
          const index = count - 1 - i
          // Check if result.result is an array before destructuring
          if (Array.isArray(result.result) && result.result.length >= 3) {
            const [value, aggregateTimestamp, power] = result.result
            const decodedData = decodeValue(value)

            processedData.push({
              index,
              value,
              aggregateTimestamp,
              power,
              ...decodedData
            })
          }
        }
      })

      setHistoricalData(processedData)
      setIsLoading(false)
    }
  }, [historicalContracts, valueCount, decodeValue])

  const fetchHistoricalData = () => {
    if (!queryId || !contractAddress || !valueCount) {
      alert('Query ID, contract address, and value count are required')
      return
    }

    setIsLoading(true)
    refetchHistorical()
  }

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A'
    const date = new Date(Number(timestamp))
    return date.toLocaleString()
  }

  const formatValue = (value) => {
    if (!value) return 'N/A'
    return value.length > 42 ? `${value.slice(0, 42)}...` : value
  }

  return (
    <div className="data-feed">
      <h3>Oracle Data Feed</h3>

      <div className="feed-controls">
        <button onClick={fetchHistoricalData} disabled={!queryId || !contractAddress || isLoading}>
          {isLoading ? 'Refreshing...' : 'Refresh Historical Data'}
        </button>
        {valueCount && (
          <p className="value-count-info">
            Total entries for this queryId: <strong>{valueCount.toString()}</strong>
          </p>
        )}
      </div>

      {!queryId && (
        <p className="info">Generate a Query ID to view its data feed</p>
      )}

      {currentData && (
        <div className="current-data">
          <div className="data-header">
            <h4>Live Data Feed</h4>
            <div className="refresh-info">
              <span className="refresh-status">
                {refreshInterval === 5000 ? '🔄 Fast refresh (5s)' : '🔄 Auto refresh (30s)'}
              </span>
              {lastRefresh && (
                <span className="last-refresh">
                  Last: {lastRefresh.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>

          {currentData.decoded !== null && (
            <div className="data-item">
              <label>Decoded Value:</label>
              <code className="decoded-value">{currentData.decoded}</code>
            </div>
          )}

          <div className="data-item">
            <label>Raw Value (bytes):</label>
            <code className="raw-value-full">{currentData.raw || currentData.value}</code>
          </div>

          {currentData.error && (
            <div className="data-item">
              <label>Decode Error:</label>
              <code className="decode-error">undecodable - {currentData.error}</code>
            </div>
          )}

          <div className="data-item">
            <label>Timestamp:</label>
            <code>{formatTimestamp(currentData.aggregateTimestamp)} (ms: {currentData.aggregateTimestamp?.toString()})</code>
          </div>
        </div>
      )}

      {valueCount > 0 && (
        <div className="historical-data">
          <div className="data-table-header">
            <h4>◈ HISTORICAL REPORTS</h4>
            <div className="table-info">
              <span>Total Entries: {valueCount.toString()}</span>
            </div>
          </div>

          <div className="data-table">
            <div className="table-header">
              <div className="table-row">
                <div className="table-cell header">INDEX</div>
                <div className="table-cell header">RAW VALUE</div>
                <div className="table-cell header">DECODED</div>
                <div className="table-cell header">TIMESTAMP</div>
              </div>
            </div>

            <div className="table-body">
              {/* Show historical data if available */}
              {historicalData.length > 0 ? (
                historicalData.map((entry, idx) => (
                  <div key={entry.index} className={`table-row ${idx === 0 ? 'current' : ''}`}>
                    <div className="table-cell">{entry.index}</div>
                    <div className="table-cell raw-value">
                      <code>{formatValue(entry.raw || entry.value)}</code>
                    </div>
                    <div className="table-cell decoded-cell">
                      {entry.decoded !== null ? (
                        <code className="decoded-display">{entry.decoded}</code>
                      ) : entry.error ? (
                        <span className="undecodable">undecodable</span>
                      ) : (
                        <span className="no-decoder">no decoder</span>
                      )}
                    </div>
                    <div className="table-cell timestamp">
                      {formatTimestamp(entry.aggregateTimestamp)}
                    </div>
                  </div>
                ))
              ) : currentData ? (
                /* Fallback to current data if no historical data */
                <div className="table-row current">
                  <div className="table-cell">{Number(valueCount) - 1}</div>
                  <div className="table-cell raw-value">
                    <code>{formatValue(currentData.raw || currentData.value)}</code>
                  </div>
                  <div className="table-cell decoded-cell">
                    {currentData.decoded !== null ? (
                      <code className="decoded-display">{currentData.decoded}</code>
                    ) : currentData.error ? (
                      <span className="undecodable">undecodable</span>
                    ) : (
                      <span className="no-decoder">no decoder</span>
                    )}
                  </div>
                  <div className="table-cell timestamp">
                    {formatTimestamp(currentData.aggregateTimestamp)}
                  </div>
                </div>
              ) : (
                /* Placeholder when no data */
                <div className="table-row placeholder">
                  <div className="table-cell">-</div>
                  <div className="table-cell">
                    <span className="placeholder-text">Click "Load Historical Data" to fetch entries</span>
                  </div>
                  <div className="table-cell">
                    <span className="placeholder-text">-</span>
                  </div>
                  <div className="table-cell">
                    <span className="placeholder-text">-</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="table-footer">
            <span className="terminal-bracket">└─</span>
            <span>QUERY DATA HISTORY</span>
            <span className="terminal-bracket">─┘</span>
          </div>
        </div>
      )}

      {historicalData.length === 0 && !isLoading && queryId && valueCount > 0 && (
        <p className="info">Historical data will load automatically. Click "Refresh" to reload.</p>
      )}

      {valueCount === 0 && queryId && (
        <p className="info">No data has been submitted for this Query ID yet</p>
      )}
    </div>
  )
}

export default DataFeed
