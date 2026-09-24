import { useEffect, useState } from 'react'
import { seedDefaultMemberIfNeeded } from './db'
import { requestNotificationPermission } from './notifications'
import CalendarTab from './components/CalendarTab'
import TaskTab from './components/TaskTab'
import FamilyTab from './components/FamilyTab'
import InstallBanner from './components/InstallBanner'
import { ToastProvider } from './components/Toast'

type Tab = 'calendar' | 'tasks' | 'family'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'calendar', label: 'Calendrier', icon: '📅' },
  { id: 'tasks', label: 'Tâches', icon: '✅' },
  { id: 'family', label: 'Famille', icon: '👨‍👩‍👧' },
]

function App() {
  const [tab, setTab] = useState<Tab>('calendar')

  useEffect(() => {
    seedDefaultMemberIfNeeded()
    requestNotificationPermission()
  }, [])

  return (
    <ToastProvider>
      <div className="app-shell">
        <div className="app-content">
          <InstallBanner />
          {tab === 'calendar' && <CalendarTab />}
          {tab === 'tasks' && <TaskTab />}
          {tab === 'family' && <FamilyTab />}
        </div>

        <nav className="tab-bar">
          {TABS.map((t) => (
            <button key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)}>
              <span className="tab-icon">{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </ToastProvider>
  )
}

export default App
