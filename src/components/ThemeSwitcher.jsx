import { useEffect, useMemo, useRef, useState } from 'react'
import { useTheme } from '../contexts/ThemeContext'

const ThemeSwitcher = () => {
  const { currentTheme, switchTheme, themes } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef(null)

  const themeColors = {
    light: '#2a6f3f',
    alien: '#39ff14',
    amber: '#fbbf24',
    cyan: '#06b6d4'
  }

  const activeColor = useMemo(
    () => themeColors[currentTheme] || '#2a6f3f',
    [currentTheme]
  )

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!menuRef.current?.contains(event.target)) {
        setIsOpen(false)
      }
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  const handleSelectTheme = (themeName) => {
    switchTheme(themeName)
    setIsOpen(false)
  }

  return (
    <div className="theme-switcher" ref={menuRef}>
      <button
        type="button"
        className="theme-toggle"
        onClick={() => setIsOpen(prev => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span>Theme</span>
        <span
          className="theme-indicator"
          style={{ backgroundColor: activeColor }}
        ></span>
        <span aria-hidden="true">{isOpen ? '▴' : '▾'}</span>
      </button>

      {isOpen && (
        <div className="theme-menu" role="listbox">
          {themes.map(themeName => {
            const swatchColor = themeColors[themeName] ?? '#6b7280'
            return (
              <button
                key={themeName}
                type="button"
                className={`theme-option ${currentTheme === themeName ? 'active' : ''}`}
                onClick={() => handleSelectTheme(themeName)}
                role="option"
                aria-selected={currentTheme === themeName}
              >
                <span
                  className="theme-swatch"
                  style={{ backgroundColor: swatchColor }}
                ></span>
                {themeName.toUpperCase()}
                {currentTheme === themeName && <span aria-hidden="true">✓</span>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default ThemeSwitcher
