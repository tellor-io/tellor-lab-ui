import { useState, useEffect } from 'react'
import { keccak256, encodeAbiParameters, parseAbiParameters } from 'viem'

const QueryIdBuilder = ({ onQueryIdCreated, onContinue, initialQueryInfo }) => {
  const [queryType, setQueryType] = useState('SpotPrice')
  const [customQueryType, setCustomQueryType] = useState('')
  const [args, setArgs] = useState([{ type: 'string', value: 'eth' }, { type: 'string', value: 'usd' }])
  const [generatedQueryId, setGeneratedQueryId] = useState('')
  const [generatedQueryData, setGeneratedQueryData] = useState('')
  const [currentQueryType, setCurrentQueryType] = useState('')
  const [currentArgs, setCurrentArgs] = useState([])

  // Restore previous query info when component mounts
  useEffect(() => {
    if (initialQueryInfo) {
      setGeneratedQueryId(initialQueryInfo.queryId || '')
      setGeneratedQueryData(initialQueryInfo.queryData || '')
      setCurrentQueryType(initialQueryInfo.queryType || '')
      setCurrentArgs(initialQueryInfo.args || [])

      // Restore form state if available
      if (initialQueryInfo.queryType) {
        const isCustom = initialQueryInfo.queryType !== 'SpotPrice'
        setQueryType(isCustom ? 'Custom' : initialQueryInfo.queryType)
        if (isCustom) {
          setCustomQueryType(initialQueryInfo.queryType)
        }
      }
      if (initialQueryInfo.args && initialQueryInfo.args.length > 0) {
        setArgs(initialQueryInfo.args)
      }
    }
  }, [initialQueryInfo])

  const addArg = () => {
    setArgs([...args, { type: 'string', value: '' }])
  }

  const removeArg = (index) => {
    setArgs(args.filter((_, i) => i !== index))
  }

  const updateArg = (index, field, value) => {
    const newArgs = [...args]
    newArgs[index][field] = value
    setArgs(newArgs)
  }

  const generateQueryId = () => {
    try {
      const activeQueryType = queryType === 'Custom' ? customQueryType : queryType

      if (!activeQueryType) {
        alert('Please specify a query type')
        return
      }

      let queryDataArgs
      if (args.length === 0) {
        queryDataArgs = '0x'
      } else {
        const types = args.map(arg => arg.type)
        const values = args.map(arg => {
          switch (arg.type) {
            case 'uint256':
            case 'int256':
              return BigInt(arg.value || '0')
            case 'bool':
              return arg.value === 'true'
            case 'address':
              return arg.value || '0x0000000000000000000000000000000000000000'
            case 'bytes32':
              return arg.value || '0x0000000000000000000000000000000000000000000000000000000000000000'
            default:
              return arg.value || ''
          }
        })
        queryDataArgs = encodeAbiParameters(parseAbiParameters(types.join(',')), values)
      }

      const queryData = encodeAbiParameters(
        parseAbiParameters('string,bytes'),
        [activeQueryType, queryDataArgs]
      )

      const queryId = keccak256(queryData)

      setGeneratedQueryId(queryId)
      setGeneratedQueryData(queryData)
      setCurrentQueryType(activeQueryType)
      setCurrentArgs([...args])

      if (onQueryIdCreated) {
        onQueryIdCreated({
          queryId,
          queryData,
          queryType: activeQueryType,
          args: [...args]
        })
      }
    } catch (error) {
      console.error('Error generating query ID:', error)
      alert('Error generating query ID: ' + error.message)
    }
  }

  const handleContinue = () => {
    if (!generatedQueryId) {
      alert('Please generate a Query ID first')
      return
    }
    if (onContinue) {
      onContinue()
    }
  }

  const resetToSpotPrice = () => {
    setQueryType('SpotPrice')
    setCustomQueryType('')
    setArgs([{ type: 'string', value: 'eth' }, { type: 'string', value: 'usd' }])
    setGeneratedQueryId('')
    setGeneratedQueryData('')
  }

  const resetToEmpty = () => {
    setQueryType('Custom')
    setCustomQueryType('MyQueryEmpty')
    setArgs([])
    setGeneratedQueryId('')
    setGeneratedQueryData('')
  }

  return (
    <div className="query-id-builder">
      <h3>Query ID Builder</h3>

      <div className="builder-layout">
        <div className="builder-form">
          <div className="preset-buttons">
            <button type="button" onClick={resetToSpotPrice}>SpotPrice Example</button>
            <button type="button" onClick={resetToEmpty}>Empty Args Example</button>
          </div>

          <div className="form-group">
            <label>Query Type:</label>
            <select value={queryType} onChange={(e) => setQueryType(e.target.value)}>
              <option value="SpotPrice">SpotPrice</option>
              <option value="Custom">Custom</option>
            </select>
            {queryType === 'Custom' && (
              <input
                type="text"
                placeholder="Enter custom query type"
                value={customQueryType}
                onChange={(e) => setCustomQueryType(e.target.value)}
              />
            )}
          </div>

          <div className="args-section">
            <h4>Arguments:</h4>
            {args.map((arg, index) => (
              <div key={index} className="arg-row">
                <select
                  value={arg.type}
                  onChange={(e) => updateArg(index, 'type', e.target.value)}
                >
                  <option value="string">string</option>
                  <option value="uint256">uint256</option>
                  <option value="int256">int256</option>
                  <option value="bool">bool</option>
                  <option value="address">address</option>
                  <option value="bytes32">bytes32</option>
                  <option value="bytes">bytes</option>
                </select>
                <input
                  type="text"
                  placeholder={`Enter ${arg.type} value`}
                  value={arg.value}
                  onChange={(e) => updateArg(index, 'value', e.target.value)}
                />
                <button
                  onClick={() => removeArg(index)}
                  className="icon-button"
                  type="button"
                  aria-label="Remove argument"
                >
                  ×
                </button>
              </div>
            ))}
            <button type="button" onClick={addArg}>Add Argument</button>
          </div>

          <button type="button" onClick={generateQueryId} className="generate-btn">
            Generate Query ID
          </button>
        </div>

        {generatedQueryId && (
          <div className="builder-results">
            <div className="generated-result">
              <h4>Generated Results:</h4>

              <div className="result-section">
                <h5>Input Parameters:</h5>
                <div className="result-item">
                  <label>Query Type:</label>
                  <code>{currentQueryType}</code>
                </div>
                <div className="result-item">
                  <label>Arguments:</label>
                  <div className="args-list">
                    {currentArgs.length > 0 ? (
                      currentArgs.map((arg, idx) => (
                        <div key={idx} className="arg-display">
                          <span className="arg-type">{arg.type}</span>: <code>{arg.value}</code>
                        </div>
                      ))
                    ) : (
                      <span className="empty-args">No arguments</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="result-section">
                <h5>Generated Output:</h5>
                <div className="result-item">
                  <label>Query Data:</label>
                  <code className="code-block">{generatedQueryData}</code>
                </div>
                <div className="result-item">
                  <label>Query ID:</label>
                  <code className="code-block">{generatedQueryId}</code>
                </div>
              </div>

              <button type="button" onClick={handleContinue} className="continue-btn">
                Continue to Value Encoder →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default QueryIdBuilder
