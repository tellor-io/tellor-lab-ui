import { createContext, useContext, useState, useEffect } from 'react'
import { themes, defaultTheme } from '../theme'

const ThemeContext = createContext()

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState(defaultTheme)

  const theme = themes[currentTheme]

  const switchTheme = (themeName) => {
    if (themes[themeName]) {
      setCurrentTheme(themeName)
      localStorage.setItem('tellor-theme', themeName)
    }
  }

  useEffect(() => {
    const savedTheme = localStorage.getItem('tellor-theme')
    if (savedTheme && themes[savedTheme]) {
      setCurrentTheme(savedTheme)
    }
  }, [])

  // Apply CSS variables for theme
  useEffect(() => {
    const root = document.documentElement
    Object.entries(theme).forEach(([key, value]) => {
      if (key !== 'name') {
        root.style.setProperty(`--color-${key}`, value)
      }
    })
  }, [theme])

  const value = {
    theme,
    currentTheme,
    switchTheme,
    themes: Object.keys(themes)
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}