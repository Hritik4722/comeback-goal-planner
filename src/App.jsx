import { useState, useEffect } from 'react'
import './index.css'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
const WEEKLY_ROWS = [7, 14, 21, 28]

function App() {
  const [goal, setGoal] = useState('')
  const [entries, setEntries] = useState({})
  const [weeklyGoals, setWeeklyGoals] = useState({})
  const [monthlyGoals, setMonthlyGoals] = useState({})
  const [selectedCell, setSelectedCell] = useState(null)
  const [modalText, setModalText] = useState('')
  const [modalStatus, setModalStatus] = useState('pending')
  const [modalType, setModalType] = useState('daily')
  const [isLoaded, setIsLoaded] = useState(false)
  const [todayNotes, setTodayNotes] = useState('')
  const [calendarExpanded, setCalendarExpanded] = useState(false)

  // Export/Backup functionality
  const handleExport = () => {
    const backupData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      data: {
        goal: goal,
        entries: entries,
        weeklyGoals: weeklyGoals,
        monthlyGoals: monthlyGoals,
        todayNotes: todayNotes
      }
    }

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `goal-planner-backup-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Import functionality
  const handleImport = (event) => {
    const file = event.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const backupData = JSON.parse(e.target.result)

        if (backupData.data) {
          if (backupData.data.goal !== undefined) setGoal(backupData.data.goal)
          if (backupData.data.entries) setEntries(backupData.data.entries)
          if (backupData.data.weeklyGoals) setWeeklyGoals(backupData.data.weeklyGoals)
          if (backupData.data.monthlyGoals) setMonthlyGoals(backupData.data.monthlyGoals)
          if (backupData.data.todayNotes !== undefined) setTodayNotes(backupData.data.todayNotes)
          alert('Data imported successfully!')
        } else {
          alert('Invalid backup file format.')
        }
      } catch (error) {
        alert('Error reading backup file. Please ensure it is a valid JSON file.')
        console.error('Import error:', error)
      }
    }
    reader.readAsText(file)
    // Reset file input so the same file can be imported again if needed
    event.target.value = ''
  }

  // Get today's date key for notes
  const getTodayKey = () => {
    const today = new Date()
    return `notes-${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`
  }

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedGoal = localStorage.getItem('goal2026')
      const savedEntries = localStorage.getItem('entries2026')
      const savedWeeklyGoals = localStorage.getItem('weeklyGoals2026')
      const savedMonthlyGoals = localStorage.getItem('monthlyGoals2026')
      const savedTodayNotes = localStorage.getItem(getTodayKey())

      if (savedGoal) setGoal(savedGoal)
      if (savedEntries) setEntries(JSON.parse(savedEntries))
      if (savedWeeklyGoals) setWeeklyGoals(JSON.parse(savedWeeklyGoals))
      if (savedMonthlyGoals) setMonthlyGoals(JSON.parse(savedMonthlyGoals))
      if (savedTodayNotes) setTodayNotes(savedTodayNotes)
    } catch (error) {
      console.error('Error loading from localStorage:', error)
    }
    setIsLoaded(true)
  }, [])

  // Save to localStorage only after initial load
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('goal2026', goal)
    }
  }, [goal, isLoaded])

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('entries2026', JSON.stringify(entries))
    }
  }, [entries, isLoaded])

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('weeklyGoals2026', JSON.stringify(weeklyGoals))
    }
  }, [weeklyGoals, isLoaded])

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('monthlyGoals2026', JSON.stringify(monthlyGoals))
    }
  }, [monthlyGoals, isLoaded])

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(getTodayKey(), todayNotes)
    }
  }, [todayNotes, isLoaded])

  const getCellKey = (month, day) => `${month}-${day}`
  const getWeeklyKey = (month, week) => `week-${month}-${week}`
  const getMonthlyKey = (month) => `month-${month}`

  const handleCellClick = (month, day) => {
    const key = getCellKey(month, day)
    const entry = entries[key] || { text: '', status: 'pending' }
    setSelectedCell({ month, day })
    setModalText(entry.text)
    setModalStatus(entry.status)
    setModalType('daily')
  }

  const handleWeeklyClick = (month, week) => {
    const key = getWeeklyKey(month, week)
    const entry = weeklyGoals[key] || { text: '', status: 'pending' }
    setSelectedCell({ month, week, type: 'weekly' })
    setModalText(entry.text)
    setModalStatus(entry.status)
    setModalType('weekly')
  }

  const handleMonthlyClick = (month) => {
    const key = getMonthlyKey(month)
    const entry = monthlyGoals[key] || { text: '', status: 'pending' }
    setSelectedCell({ month, type: 'monthly' })
    setModalText(entry.text)
    setModalStatus(entry.status)
    setModalType('monthly')
  }

  const handleSave = () => {
    if (!selectedCell) return

    if (modalType === 'weekly') {
      const key = getWeeklyKey(selectedCell.month, selectedCell.week)
      setWeeklyGoals(prev => ({
        ...prev,
        [key]: { text: modalText, status: modalStatus }
      }))
    } else if (modalType === 'monthly') {
      const key = getMonthlyKey(selectedCell.month)
      setMonthlyGoals(prev => ({
        ...prev,
        [key]: { text: modalText, status: modalStatus }
      }))
    } else {
      const key = getCellKey(selectedCell.month, selectedCell.day)
      setEntries(prev => ({
        ...prev,
        [key]: { text: modalText, status: modalStatus }
      }))
    }

    setSelectedCell(null)
    setModalText('')
    setModalStatus('pending')
  }

  const handleClose = () => {
    setSelectedCell(null)
    setModalText('')
    setModalStatus('pending')
  }

  const dailyEntries = Object.values(entries)
  const totalCells = dailyEntries.length
  const successCells = dailyEntries.filter(e => e.status === 'success').length
  const failureCells = dailyEntries.filter(e => e.status === 'failure').length

  // Yearly rate calculation (achieved goals out of 365 days)
  const yearlyRate = Math.round((successCells / 365) * 100)

  // Monthly rate calculation (for current month)
  const currentMonth = new Date().getMonth()
  const monthlyEntries = Object.entries(entries).filter(([key]) => {
    const monthIndex = parseInt(key.split('-')[0])
    return monthIndex === currentMonth
  }).map(([, value]) => value)

  const monthlySuccess = monthlyEntries.filter(e => e.status === 'success').length
  const monthlyFailure = monthlyEntries.filter(e => e.status === 'failure').length
  const monthlyRate = (monthlySuccess + monthlyFailure) > 0
    ? Math.round((monthlySuccess / (monthlySuccess + monthlyFailure)) * 100)
    : 0

  const buildGridRows = () => {
    const rows = []
    let weekNumber = 1

    for (let dayIndex = 0; dayIndex < 31; dayIndex++) {
      const day = dayIndex + 1
      rows.push({ type: 'day', day, key: `day-${day}` })

      if (WEEKLY_ROWS.includes(day)) {
        rows.push({ type: 'weekly', week: weekNumber, key: `week-${weekNumber}` })
        weekNumber++
      }
    }

    rows.push({ type: 'monthly', key: 'monthly' })
    return rows
  }

  const gridRows = buildGridRows()

  const getModalTitle = () => {
    if (modalType === 'weekly') {
      return `Week ${selectedCell.week} Goals`
    } else if (modalType === 'monthly') {
      return 'Monthly Goal'
    } else {
      return `${MONTHS[selectedCell.month]} ${selectedCell.day}, 2026`
    }
  }

  // Render a single row of cells for day/weekly/monthly
  const renderDayRow = (row) => {
    const cells = MONTHS.map((month, monthIndex) => {
      const isValidDay = row.day <= DAYS_IN_MONTH[monthIndex]
      const key = getCellKey(monthIndex, row.day)
      const entry = entries[key]

      if (!isValidDay) {
        return (
          <div
            key={`cell-${month}-${row.day}`}
            className="grid-cell invalid"
          />
        )
      }

      return (
        <div
          key={`cell-${month}-${row.day}`}
          className={`grid-cell ${entry?.status || ''} ${entry?.text ? 'has-content' : ''}`}
          onClick={() => handleCellClick(monthIndex, row.day)}
          title={entry?.text || 'Click to add'}
        >
          {entry?.text || ''}
        </div>
      )
    })

    return [
      <div key={`label-day-${row.day}`} className="grid-day-label">
        {row.day}
      </div>,
      ...cells
    ]
  }

  const renderWeeklyRow = (row) => {
    const cells = MONTHS.map((month, monthIndex) => {
      const key = getWeeklyKey(monthIndex, row.week)
      const entry = weeklyGoals[key]

      return (
        <div
          key={`cell-weekly-${month}-${row.week}`}
          className={`grid-cell weekly-cell ${entry?.status || ''} ${entry?.text ? 'has-content' : ''}`}
          onClick={() => handleWeeklyClick(monthIndex, row.week)}
          title={entry?.text || 'Set weekly goal'}
        >
          {entry?.text || ''}
        </div>
      )
    })

    return [
      <div key={`label-week-${row.week}`} className="grid-week-label">
        WG{row.week}
      </div>,
      ...cells
    ]
  }

  const renderMonthlyRow = () => {
    const cells = MONTHS.map((month, monthIndex) => {
      const key = getMonthlyKey(monthIndex)
      const entry = monthlyGoals[key]

      return (
        <div
          key={`cell-monthly-${month}`}
          className={`grid-cell monthly-cell ${entry?.status || ''} ${entry?.text ? 'has-content' : ''}`}
          onClick={() => handleMonthlyClick(monthIndex)}
          title={entry?.text || 'Set monthly goal'}
        >
          {entry?.text || ''}
        </div>
      )
    })

    return [
      <div key="label-monthly" className="grid-monthly-label">
        MG
      </div>,
      ...cells
    ]
  }

  return (
    <div className="book-container">
      <div className="book-page">
        <header className="header">
          <div className="year-badge">2026</div>
          <div className="goal-input-container">
            <label className="goal-label">Your Yearly Goal</label>
            <input
              type="text"
              className="goal-input"
              placeholder="Enter your main goal for 2026..."
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
            />
          </div>
        </header>

        {/* Stats and Today's Goals Row */}
        <div className="dashboard-row">
          {/* Left: Stats Box */}
          <div className="stats-box">
            <h3 className="stats-box-title">Progress</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-value">{totalCells}</span>
                <span className="stat-label">tracked</span>
              </div>
              <div className="stat-item">
                <div className="stat-combined">
                  <span className="stat-value success">{successCells}</span>
                  <span className="stat-separator">/</span>
                  <span className="stat-value failure">{failureCells}</span>
                </div>
                <span className="stat-label">achieved / missed</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{monthlyRate}%</span>
                <span className="stat-label">{MONTHS[currentMonth]} rate</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{yearlyRate}%</span>
                <span className="stat-label">yearly rate</span>
              </div>
            </div>
            <div className="progress-bar-mini">
              <div className="progress-bar-mini-fill" style={{ width: `${monthlyRate}%` }}></div>
            </div>
          </div>

          {/* Right: Today's Goals */}
          <div className="today-goals-box">
            <div className="today-header">
              <h3 className="today-goals-title">Today</h3>
              <span className="today-date">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            </div>
            <textarea
              className="today-notes-input"
              placeholder="Your goals for today..."
              value={todayNotes}
              onChange={(e) => setTodayNotes(e.target.value)}
            />
          </div>
        </div>

        {/* Mini Calendars Section */}
        <div className="mini-calendars-section">
          <div className="mini-calendars-header">
            <h3 className="mini-calendars-title">Year Overview</h3>
            <button
              className="expand-toggle-btn"
              onClick={() => setCalendarExpanded(!calendarExpanded)}
            >
              {calendarExpanded ? 'Show Less ▲' : 'Show All ▼'}
            </button>
          </div>

          {/* First Row - Always Visible (Jan - Jun) */}
          <div className="mini-calendars-grid">
            {MONTHS.slice(0, 6).map((month, monthIndex) => {
              const daysInMonth = DAYS_IN_MONTH[monthIndex]
              const firstDayOfMonth = new Date(2026, monthIndex, 1).getDay()

              return (
                <div key={month} className="mini-calendar">
                  <div className="mini-calendar-header">{month.substring(0, 3)}</div>
                  <div className="mini-calendar-weekdays">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                      <span key={i} className="mini-weekday">{day}</span>
                    ))}
                  </div>
                  <div className="mini-calendar-days">
                    {Array.from({ length: firstDayOfMonth }, (_, i) => (
                      <span key={`empty-${i}`} className="mini-day empty"></span>
                    ))}
                    {Array.from({ length: daysInMonth }, (_, i) => {
                      const day = i + 1
                      const key = getCellKey(monthIndex, day)
                      const entry = entries[key]
                      const status = entry?.status || ''

                      return (
                        <span
                          key={day}
                          className={`mini-day ${status}`}
                          title={`${month} ${day}: ${entry?.text || 'No entry'}`}
                        >
                          {day}
                        </span>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Second Row - Expandable (Jul - Dec) */}
          {calendarExpanded && (
            <div className="mini-calendars-grid second-row">
              {MONTHS.slice(6, 12).map((month, idx) => {
                const monthIndex = idx + 6
                const daysInMonth = DAYS_IN_MONTH[monthIndex]
                const firstDayOfMonth = new Date(2026, monthIndex, 1).getDay()

                return (
                  <div key={month} className="mini-calendar">
                    <div className="mini-calendar-header">{month.substring(0, 3)}</div>
                    <div className="mini-calendar-weekdays">
                      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                        <span key={i} className="mini-weekday">{day}</span>
                      ))}
                    </div>
                    <div className="mini-calendar-days">
                      {Array.from({ length: firstDayOfMonth }, (_, i) => (
                        <span key={`empty-${i}`} className="mini-day empty"></span>
                      ))}
                      {Array.from({ length: daysInMonth }, (_, i) => {
                        const day = i + 1
                        const key = getCellKey(monthIndex, day)
                        const entry = entries[key]
                        const status = entry?.status || ''

                        return (
                          <span
                            key={day}
                            className={`mini-day ${status}`}
                            title={`${month} ${day}: ${entry?.text || 'No entry'}`}
                          >
                            {day}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="grid-container">
          <h2 className="grid-title">Daily Progress Tracker</h2>
          <div className="monthly-grid">
            <div key="header-day" className="grid-header">Day</div>
            {MONTHS.map(month => (
              <div key={`header-${month}`} className="grid-header">
                {month.substring(0, 3)}
              </div>
            ))}

            {gridRows.map((row) => {
              if (row.type === 'day') {
                return renderDayRow(row)
              } else if (row.type === 'weekly') {
                return renderWeeklyRow(row)
              } else if (row.type === 'monthly') {
                return renderMonthlyRow()
              }
              return null
            })}
          </div>

          <div className="legend">
            <div className="legend-item">
              <div className="legend-color success"></div>
              <span>Goal Achieved</span>
            </div>
            <div className="legend-item">
              <div className="legend-color failure"></div>
              <span>Goal Missed</span>
            </div>
            <div className="legend-item">
              <div className="legend-color pending"></div>
              <span>Pending/Empty</span>
            </div>
            <div className="legend-item">
              <span style={{ fontWeight: 600 }}>WG</span>
              <span>= Weekly Goal</span>
            </div>
            <div className="legend-item">
              <span style={{ fontWeight: 600 }}>MG</span>
              <span>= Monthly Goal</span>
            </div>
          </div>
        </div>

        {selectedCell && (
          <div className="modal-overlay" onClick={handleClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h3 className="modal-title">
                {getModalTitle()}
              </h3>

              <input
                type="text"
                className="modal-input"
                placeholder={modalType === 'daily' ? "What did you work on?" : "What's your goal?"}
                value={modalText}
                onChange={(e) => setModalText(e.target.value)}
                autoFocus
              />

              <div className="status-buttons">
                <button
                  className={`status-btn success ${modalStatus === 'success' ? 'active' : ''}`}
                  onClick={() => setModalStatus('success')}
                >
                  Achieved
                </button>
                <button
                  className={`status-btn failure ${modalStatus === 'failure' ? 'active' : ''}`}
                  onClick={() => setModalStatus('failure')}
                >
                  Missed
                </button>
                <button
                  className={`status-btn pending ${modalStatus === 'pending' ? 'active' : ''}`}
                  onClick={() => setModalStatus('pending')}
                >
                  Pending
                </button>
              </div>

              <div className="modal-actions">
                <button className="btn btn-secondary" onClick={handleClose}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handleSave}>
                  Save Entry
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Backup Footer */}
        <div className="backup-footer">
          <input
            type="file"
            id="import-file"
            accept=".json"
            onChange={handleImport}
            style={{ display: 'none' }}
          />
          <button className="backup-btn" onClick={handleExport} title="Export data as backup">
            ↓ Export
          </button>
          <button className="backup-btn" onClick={() => document.getElementById('import-file').click()} title="Import data from backup">
            ↑ Import
          </button>
        </div>
      </div>
    </div>
  )
}

export default App
