import { useTheme } from '../contexts/ThemeContext'

const MissionSidebar = ({ currentStep, stepStatus, onNavigate }) => {
  const { theme } = useTheme()

  const steps = [
    { id: 1, name: 'CONNECT', icon: '◉', desc: 'Wallet & Contract' },
    { id: 2, name: 'QUERY', icon: '◈', desc: 'Generate Query ID' },
    { id: 3, name: 'ENCODE', icon: '◇', desc: 'Encode Value' },
    { id: 4, name: 'SUBMIT', icon: '◆', desc: 'Send Transaction' },
    { id: 5, name: 'MONITOR', icon: '●', desc: 'Track Data Feed' },
  ]

  const getStepIcon = (step) => {
    const status = stepStatus[step.id]
    if (status === 'completed') return '✓'
    if (status === 'active') return step.icon
    return '○'
  }

  const getStepClass = (step) => {
    const status = stepStatus[step.id]
    const isCurrentStep = currentStep === step.id

    let classes = ['mission-step-item']

    if (status === 'completed') classes.push('completed')
    if (status === 'active') classes.push('active')
    if (status === 'locked') classes.push('locked')
    if (isCurrentStep) classes.push('current')

    return classes.join(' ')
  }

  return (
    <div className="mission-progress" style={{ borderColor: theme.border }}>
      <div className="progress-header">
        <span className="terminal-bracket">┌─</span>
        <h3>MISSION PROGRESS</h3>
        <span className="terminal-bracket">─┐</span>
      </div>

      <div className="progress-steps">
        {steps.map((step) => (
          <div
            key={step.id}
            className={getStepClass(step)}
            onClick={() => onNavigate(step.id)}
            style={{
              borderColor: theme.border,
              backgroundColor: currentStep === step.id ? theme.highlight : 'transparent'
            }}
          >
            <div className="step-number">
              <span
                className="step-icon"
                style={{
                  color: stepStatus[step.id] === 'completed' ? theme.success :
                         stepStatus[step.id] === 'active' ? theme.accent : theme.grey
                }}
              >
                {getStepIcon(step)}
              </span>
              <span className="step-id">{step.id}</span>
            </div>
            <div className="step-info">
              <div className="step-name">{step.name}</div>
              <div className="step-desc" style={{ color: theme.textDim }}>
                {step.desc}
              </div>
            </div>
            <div className="step-status">
              {stepStatus[step.id] === 'active' && currentStep === step.id && (
                <div className="pulse-indicator" style={{ backgroundColor: theme.accent }}></div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="progress-footer" style={{ borderColor: theme.border }}>
        <span className="terminal-bracket">└─</span>
        <span>ORACLE DEPLOYMENT</span>
        <span className="terminal-bracket">─┘</span>
      </div>
    </div>
  )
}

export default MissionSidebar