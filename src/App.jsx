import { useState, useEffect } from 'react'
import QueryIdBuilder from './components/QueryIdBuilder'
import ValueEncoder from './components/ValueEncoder'
import ContractConnection from './components/ContractConnection'
import DataSubmission from './components/DataSubmission'
import DataFeed from './components/DataFeed'
import MissionSidebar from './components/MissionSidebar'
import SystemStatus from './components/SystemStatus'
import ThemeSwitcher from './components/ThemeSwitcher'
import { TELLOR_LAB_ADDRESS, hasKnownContract } from './config/wagmi'
import { useTheme } from './contexts/ThemeContext'
import useWalletChainId from './hooks/useWalletChainId'
import './App.css'

function App() {
  const { theme } = useTheme()
  const chainId = useWalletChainId()
  const [queryInfo, setQueryInfo] = useState(null)
  const [encodedValue, setEncodedValue] = useState('')
  const [valueTypes, setValueTypes] = useState([])
  const [valueInfo, setValueInfo] = useState([])
  const [contractAddress, setContractAddress] = useState('')
  const [lastSubmissionTime, setLastSubmissionTime] = useState(null)
  const [currentStep, setCurrentStep] = useState(1)

  // Update contract address when chainId changes
  useEffect(() => {
    if (chainId && hasKnownContract(chainId)) {
      setContractAddress(TELLOR_LAB_ADDRESS[chainId])
    } else {
      setContractAddress('')
    }
  }, [chainId])

  // Mission steps with completion tracking
  const [stepStatus, setStepStatus] = useState({
    1: 'active',    // connect
    2: 'locked',    // query
    3: 'locked',    // encode
    4: 'locked',    // submit
    5: 'locked',    // monitor
  })

  const handleQueryIdCreated = (queryData) => {
    setQueryInfo(queryData)
    setStepStatus(prev => ({ ...prev, 2: 'completed', 3: 'active' }))
  }

  const handleQueryContinue = () => {
    setCurrentStep(3)
  }

  const handleValueEncoded = (value, values) => {
    setEncodedValue(value)
    setValueTypes(values ? values.map(v => v.type) : [])
    setValueInfo(values || [])
    setStepStatus(prev => ({ ...prev, 3: 'completed', 4: 'active' }))
  }

  const handleValueContinue = () => {
    setCurrentStep(4)
  }

  const handleDataSubmitted = () => {
    setLastSubmissionTime(Date.now())
    setStepStatus(prev => ({ ...prev, 4: 'completed', 5: 'active' }))
    setCurrentStep(5)
  }

  const handleContractChange = (address) => {
    setContractAddress(address)
    setStepStatus(prev => ({ ...prev, 1: 'completed', 2: 'active' }))
    setCurrentStep(2)
  }

  const navigateToStep = (stepNumber) => {
    // Allow navigation to any step at any time
    setCurrentStep(stepNumber)
  }

  const stepComponents = {
    1: <ContractConnection
          chainId={chainId}
          contractAddress={contractAddress}
          onContractChange={handleContractChange}
        />,
    2: <QueryIdBuilder
          onQueryIdCreated={handleQueryIdCreated}
          onContinue={handleQueryContinue}
          initialQueryInfo={queryInfo}
        />,
    3: <ValueEncoder
          onValueEncoded={handleValueEncoded}
          onContinue={handleValueContinue}
          initialValueInfo={valueInfo}
        />,
    4: <DataSubmission
          queryId={queryInfo?.queryId}
          encodedValue={encodedValue}
          contractAddress={contractAddress}
          onDataSubmitted={handleDataSubmitted}
          queryInfo={queryInfo}
          valueInfo={valueInfo}
        />,
    5: <DataFeed
          queryId={queryInfo?.queryId}
          contractAddress={contractAddress}
          lastSubmissionTime={lastSubmissionTime}
          valueTypes={valueInfo}
        />
  }

  return (
    <div className="mission-control" style={{
      backgroundColor: theme.bg,
      color: theme.text
    }}>
      {/* Header with Theme Switcher */}
      <header className="mission-header">
        <div className="mission-title">
          <span className="terminal-bracket">┌─</span>
          <h1>TELLOR MISSION CONTROL</h1>
          <span className="terminal-bracket">─┐</span>
        </div>
        <ThemeSwitcher />
      </header>

      {/* Main Mission Control Layout */}
      <div className="mission-layout">
        {/* Left Sidebar - Mission Progress */}
        <aside className="mission-sidebar">
          <MissionSidebar
            currentStep={currentStep}
            stepStatus={stepStatus}
            onNavigate={navigateToStep}
          />
        </aside>

        {/* Main Content Area */}
        <main className="mission-main">
          {/* Current Step Display */}
          <div className="mission-step">
            <div className="step-header">
              <span className="step-indicator">▸ STEP {currentStep}</span>
              <div className="step-title">
                {currentStep === 1 && "CONNECT & CONFIGURE"}
                {currentStep === 2 && "CREATE QUERY ID"}
                {currentStep === 3 && "ENCODE ORACLE VALUE"}
                {currentStep === 4 && "SUBMIT DATA"}
                {currentStep === 5 && "MONITOR DATA FEED"}
              </div>
            </div>

            <div className="step-content">
              {stepComponents[currentStep]}
            </div>
          </div>
        </main>

        {/* Right Panel - System Status */}
        <aside className="status-panel">
          <SystemStatus
            queryInfo={queryInfo}
            encodedValue={encodedValue}
            contractAddress={contractAddress}
          />
        </aside>
      </div>

      {/* Footer */}
      <footer className="mission-footer">
        <span className="terminal-bracket">└─</span>
        <span>TELLOR LAB :: TESTING INTERFACE</span>
        <span className="terminal-bracket">─┘</span>
      </footer>
    </div>
  )
}

export default App
