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
  const [guideCollapsed, setGuideCollapsed] = useState(() => {
    const saved = localStorage.getItem('guideCollapsed2026')
    return saved === 'true'
  })

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
  const successCells = dailyEntries.filter(e => e.status === 'success').length
  const failureCells = dailyEntries.filter(e => e.status === 'failure').length

  // Helper: Convert date to entry key format (month-day)
  const dateToKey = (date) => `${date.getMonth()}-${date.getDate()}`

  // Helper: Get entry status for a date
  const getEntryStatus = (date) => {
    const key = dateToKey(date)
    return entries[key]?.status || null
  }

  // Current Streak: consecutive ACHIEVED days backward from today
  // Stops when hitting a MISSED day (not empty/pending)
  const calculateStreak = () => {
    let streak = 0
    const today = new Date()
    let currentDate = new Date(today)
    currentDate.setHours(0, 0, 0, 0)

    while (true) {
      const status = getEntryStatus(currentDate)

      if (status === 'success') {
        // Achieved day - add to streak
        streak++
        currentDate.setDate(currentDate.getDate() - 1)
      } else if (status === 'failure') {
        // Missed day - streak breaks here
        break
      } else {
        // Empty/pending/not logged - skip this day, check previous
        // But if we haven't started counting yet, just go back
        if (streak === 0) {
          currentDate.setDate(currentDate.getDate() - 1)
          // Don't go before Jan 1, 2026
          if (currentDate.getFullYear() < 2026) break
        } else {
          // We already have a streak, empty day doesn't break it
          // but we stop counting here
          break
        }
      }
    }
    return streak
  }
  const currentStreak = calculateStreak()

  // This Month: ACHIEVED days in current month vs elapsed days
  const calculateThisMonth = () => {
    const today = new Date()
    const currentMonth = today.getMonth()
    const currentDay = today.getDate()

    let achievedDays = 0
    // Count achieved days from day 1 to today in current month
    for (let day = 1; day <= currentDay; day++) {
      const checkDate = new Date(2026, currentMonth, day)
      const status = getEntryStatus(checkDate)
      if (status === 'success') {
        achievedDays++
      }
    }
    return { achieved: achievedDays, elapsed: currentDay }
  }
  const thisMonthStats = calculateThisMonth()

  // Consistency: percentage of ACHIEVED days over elapsed days
  // elapsed = days from Jan 1, 2026 to today (inclusive)
  const calculateConsistency = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const startOfYear = new Date(2026, 0, 1) // Jan 1, 2026

    // Calculate elapsed days (from Jan 1 to today, inclusive)
    const msPerDay = 24 * 60 * 60 * 1000
    const elapsedDays = Math.floor((today - startOfYear) / msPerDay) + 1

    if (elapsedDays <= 0) return 0

    // Count achieved days in elapsed period
    let achievedDays = 0
    for (let i = 0; i < elapsedDays; i++) {
      const checkDate = new Date(startOfYear)
      checkDate.setDate(startOfYear.getDate() + i)
      const status = getEntryStatus(checkDate)
      if (status === 'success') {
        achievedDays++
      }
    }

    return Math.round((achievedDays / elapsedDays) * 100)
  }
  const consistency = calculateConsistency()

  // Status colors for momentum indicators
  const getStreakStatus = () => {
    if (currentStreak === 0) return 'danger'
    if (currentStreak >= 7) return 'success'
    if (currentStreak >= 3) return 'warning'
    return 'neutral'
  }

  const getMonthStatus = () => {
    const ratio = thisMonthStats.elapsed > 0 ? thisMonthStats.achieved / thisMonthStats.elapsed : 0
    if (ratio >= 0.7) return 'success'
    if (ratio >= 0.4) return 'warning'
    if (ratio === 0) return 'danger'
    return 'neutral'
  }

  const getConsistencyStatus = () => {
    if (consistency >= 70) return 'success'
    if (consistency >= 40) return 'warning'
    return 'danger'
  }

  const getAchievedMissedStatus = () => {
    const total = successCells + failureCells
    if (total === 0) return 'neutral'
    const ratio = successCells / total
    if (ratio >= 0.7) return 'success'
    if (ratio >= 0.4) return 'warning'
    return 'danger'
  }

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

  // Check if selected cell date is in the future (for daily entries only)
  const isSelectedDateFuture = () => {
    if (!selectedCell || modalType !== 'daily') return false

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const selectedDate = new Date(2026, selectedCell.month, selectedCell.day)
    selectedDate.setHours(0, 0, 0, 0)

    return selectedDate > today
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
        Goal{row.week}
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
          <div className="header-year-progress">
            <div className="header-progress-bar">
              <div
                className="header-progress-fill"
                style={{ width: `${((Math.floor((new Date() - new Date(2026, 0, 1)) / (24 * 60 * 60 * 1000)) + 1) / 365) * 100}%` }}
              ></div>
            </div>
          </div>
        </header>

        {/* Stats and Today's Goals Row */}
        <div className="dashboard-row">
          {/* Left: Stats Box */}
          <div className="stats-box">
            <h3 className="stats-box-title">Momentum</h3>
            <div className="stats-grid">
              <div className={`stat-item stat-${getStreakStatus()}`}>
                <span className="stat-info" title="How many productive days in a row you have right now.">ⓘ</span>
                <span className="stat-value">{currentStreak}</span>
                <span className="stat-label">current streak</span>
              </div>
              <div className={`stat-item stat-${getAchievedMissedStatus()}`}>
                <span className="stat-info" title="Total productive days vs unproductive days this year.">ⓘ</span>
                <div className="stat-combined">
                  <span className="stat-value success">{successCells}</span>
                  <span className="stat-separator">/</span>
                  <span className="stat-value failure">{failureCells}</span>
                </div>
                <span className="stat-label">productive / Unproductive</span>
              </div>
              <div className={`stat-item stat-${getMonthStatus()}`}>
                <span className="stat-info" title="Productive days so far this month.">ⓘ</span>
                <span className="stat-value">{thisMonthStats.achieved}<span className="stat-small"> / {thisMonthStats.elapsed}</span></span>
                <span className="stat-label">this month</span>
              </div>
              <div className={`stat-item stat-${getConsistencyStatus()}`}>
                <span className="stat-info" title="How often you stay productive since the start of the year.">ⓘ</span>
                <span className="stat-value">{consistency}%</span>
                <span className="stat-label">consistency</span>
              </div>
            </div>
            <div className="month-progress">
              <div className="month-progress-text">
                <span>{DAYS_IN_MONTH[new Date().getMonth()] - new Date().getDate()} days remaining in {MONTHS[new Date().getMonth()]}</span>
              </div>
              <div className="month-progress-bar">
                <div
                  className="month-progress-fill"
                  style={{ width: `${(new Date().getDate() / DAYS_IN_MONTH[new Date().getMonth()]) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Right: Today's Goals */}
          <div className="today-goals-box">
            <div className="today-header">
              <h3 className="today-goals-title">Today's Plan...</h3>
              <span className="today-date">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            </div>
            <textarea
              className="today-notes-input"
              placeholder="What do you want to achieve tomorrow?, Set plans today..."
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
              <span>Pending</span>
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
                  className={`status-btn success ${modalStatus === 'success' ? 'active' : ''} ${isSelectedDateFuture() ? 'disabled' : ''}`}
                  onClick={() => !isSelectedDateFuture() && setModalStatus('success')}
                  disabled={isSelectedDateFuture()}
                >
                  Productive day
                </button>
                <button
                  className={`status-btn failure ${modalStatus === 'failure' ? 'active' : ''} ${isSelectedDateFuture() ? 'disabled' : ''}`}
                  onClick={() => !isSelectedDateFuture() && setModalStatus('failure')}
                  disabled={isSelectedDateFuture()}
                >
                  Unproductive day
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

        {/* User Guide Section */}
        <div className="user-guide-section">
          <button
            className="guide-toggle-btn"
            onClick={() => {
              const newState = !guideCollapsed
              setGuideCollapsed(newState)
              localStorage.setItem('guideCollapsed2026', newState.toString())
            }}
          >
            <span>📖 How to Use This Planner</span>
            <span>{guideCollapsed ? '▼' : '▲'}</span>
          </button>
          {!guideCollapsed && (
            <div className="user-guide-content">
              <div className="guide-step">
                <span className="step-number">1</span>
                <p><strong>Set Your Yearly Goal</strong> — Write down one main goal you want to achieve this year at the top of the page.</p>
              </div>
              <div className="guide-step">
                <span className="step-number">2</span>
                <p><strong>Break It Into Monthly Goals</strong> — In the calendar below, click on the "MG" row to set what you want to accomplish each month that help you reach your yearly goal.</p>
              </div>
              <div className="guide-step">
                <span className="step-number">3</span>
                <p><strong>Set Weekly Goals</strong> — Click on the "Goal" rows to set smaller weekly targets that help you reach your monthly goals.</p>
              </div>
              <div className="guide-step">
                <span className="step-number">4</span>
                <p><strong>Plan Tomorrow</strong> — Each evening, write in "Today's Plan" what you want to accomplish the next day.</p>
              </div>
              <div className="guide-step">
                <span className="step-number">5</span>
                <p><strong>Log Your Day</strong> — At the end of each day, click on today's cell in the calendar. Write what you did, then mark it as <em>Productive</em> or <em>Unproductive</em>.</p>
              </div>
              <div className="guide-step">
                <span className="step-number">6</span>
                <p><strong>Track Your Progress</strong> — Watch your streaks grow and stay consistent throughout the year!</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
