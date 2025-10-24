import { useState, useEffect } from 'react'
import { encodeAbiParameters, parseAbiParameters, parseUnits } from 'viem'

const ValueEncoder = ({ onValueEncoded, onContinue, initialValueInfo }) => {
  const [values, setValues] = useState([{ type: 'uint256', value: '2100', decimals: '18' }])
  const [encodedValue, setEncodedValue] = useState('')
  const [currentValues, setCurrentValues] = useState([])

  // Restore previous value info when component mounts
  useEffect(() => {
    if (initialValueInfo && initialValueInfo.length > 0) {
      setValues(initialValueInfo)
      setCurrentValues(initialValueInfo)
      // Re-encode to restore the encoded value
      try {
        const types = initialValueInfo.map(val => val.type)
        const processedValues = initialValueInfo.map(val => {
          switch (val.type) {
            case 'uint256':
            case 'int256':
              if (val.decimals && val.decimals !== '0' && val.value) {
                return parseUnits(val.value.toString(), parseInt(val.decimals))
              }
              return BigInt(val.value || '0')
            case 'bool':
              return val.value === 'true'
            case 'address':
              return val.value || '0x0000000000000000000000000000000000000000'
            case 'bytes32':
              return val.value || '0x0000000000000000000000000000000000000000000000000000000000000000'
            case 'bytes':
              return val.value || '0x'
            default:
              return val.value || ''
          }
        })

        const encoded = encodeAbiParameters(
          parseAbiParameters(types.join(',')),
          processedValues
        )
        setEncodedValue(encoded)
      } catch (error) {
        console.error('Error restoring encoded value:', error)
      }
    }
  }, [initialValueInfo])

  const addValue = () => {
    setValues([...values, { type: 'uint256', value: '', decimals: '0' }])
  }

  const removeValue = (index) => {
    setValues(values.filter((_, i) => i !== index))
  }

  const updateValue = (index, field, value) => {
    const newValues = [...values]
    newValues[index][field] = value
    setValues(newValues)
  }

  const encodeValue = () => {
    try {
      if (values.length === 0) {
        alert('Please add at least one value to encode')
        return
      }

      const types = values.map(val => val.type)
      const processedValues = values.map(val => {
        switch (val.type) {
          case 'uint256':
          case 'int256':
            if (val.decimals && val.decimals !== '0' && val.value) {
              return parseUnits(val.value.toString(), parseInt(val.decimals))
            }
            return BigInt(val.value || '0')
          case 'bool':
            return val.value === 'true'
          case 'address':
            return val.value || '0x0000000000000000000000000000000000000000'
          case 'bytes32':
            return val.value || '0x0000000000000000000000000000000000000000000000000000000000000000'
          case 'bytes':
            return val.value || '0x'
          default:
            return val.value || ''
        }
      })

      const encoded = encodeAbiParameters(
        parseAbiParameters(types.join(',')),
        processedValues
      )

      setEncodedValue(encoded)
      setCurrentValues([...values])

      if (onValueEncoded) {
        onValueEncoded(encoded, values)
      }
    } catch (error) {
      console.error('Error encoding value:', error)
      alert('Error encoding value: ' + error.message)
    }
  }

  const handleContinue = () => {
    if (!encodedValue) {
      alert('Please encode values first')
      return
    }
    if (onContinue) {
      onContinue()
    }
  }

  const setPresetPrice = () => {
    setValues([{ type: 'uint256', value: '2100', decimals: '18' }])
    setEncodedValue('')
  }

  const setPresetMultiple = () => {
    setValues([
      { type: 'string', value: 'mystring', decimals: '0' },
      { type: 'uint256', value: '500', decimals: '0' },
      { type: 'bool', value: 'true', decimals: '0' }
    ])
    setEncodedValue('')
  }

  return (
    <div className="value-encoder">
      <h3>Value Encoder</h3>

      <div className="encoder-layout">
        <div className="encoder-form">
          <div className="preset-buttons">
            <button type="button" onClick={setPresetPrice}>Price Example ($2100 with 18 decimals)</button>
            <button type="button" onClick={setPresetMultiple}>Multiple Values Example</button>
          </div>

          <div className="values-section">
            <h4>Values to Encode:</h4>
            {values.map((val, index) => (
              <div key={index} className="value-row">
                <select
                  value={val.type}
                  onChange={(e) => updateValue(index, 'type', e.target.value)}
                >
                  <option value="uint256">uint256</option>
                  <option value="int256">int256</option>
                  <option value="string">string</option>
                  <option value="bool">bool</option>
                  <option value="address">address</option>
                  <option value="bytes32">bytes32</option>
                  <option value="bytes">bytes</option>
                </select>
                <input
                  type="text"
                  placeholder={`Enter ${val.type} value`}
                  value={val.value}
                  onChange={(e) => updateValue(index, 'value', e.target.value)}
                />
                {(val.type === 'uint256' || val.type === 'int256') && (
                  <input
                    type="number"
                    placeholder="Decimals (0 for whole numbers)"
                    value={val.decimals}
                    onChange={(e) => updateValue(index, 'decimals', e.target.value)}
                  />
                )}
                <button
                  onClick={() => removeValue(index)}
                  className="icon-button"
                  type="button"
                  aria-label="Remove value"
                >
                  ×
                </button>
              </div>
            ))}
            <button type="button" onClick={addValue}>Add Value</button>
          </div>

          <button type="button" onClick={encodeValue} className="encode-btn">
            Encode Values
          </button>
        </div>

        {encodedValue && (
          <div className="encoder-results">
            <div className="encoded-result">
              <h4>Encoded Results:</h4>

              <div className="result-section">
                <h5>Input Parameters:</h5>
                <div className="values-display">
                  {currentValues.map((val, idx) => (
                    <div key={idx} className="value-display-item">
                      <div className="result-item">
                        <label>Type:</label>
                        <code>{val.type}</code>
                      </div>
                      <div className="result-item">
                        <label>Value:</label>
                        <code>{val.value}</code>
                      </div>
                      {(val.type === 'uint256' || val.type === 'int256') && val.decimals !== '0' && (
                        <div className="result-item">
                          <label>Decimals:</label>
                          <code>{val.decimals}</code>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="result-section">
                <h5>Encoded Output:</h5>
                <div className="result-item">
                  <label>Encoded Value:</label>
                  <code className="code-block">{encodedValue}</code>
                </div>
              </div>

              <button type="button" onClick={handleContinue} className="continue-btn">
                Continue to Data Submission →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ValueEncoder
