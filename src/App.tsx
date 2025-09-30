import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import Layout from './components/Layout';
import LessonsPage from './pages/LessonsPage';
import PostersPage from './pages/PostersPage';
import ArchivePage from './pages/ArchivePage';
import SettingsPage from './pages/SettingsPage';
import CalendarPage from './pages/CalendarPage';
import ImportPage from './pages/ImportPage';
import AdminPage from './pages/AdminPage';
import NotificationsPage from './pages/NotificationsPage';
import analyticsService from './services/analyticsService';
import './App.css';

function App() {
  // Load theme settings and record visit analytics on app startup
  useEffect(() => {
    const loadThemeSettings = () => {
      try {
        const saved = localStorage.getItem('mirpeset-settings');
        if (saved) {
          const settings = JSON.parse(saved);
          if (settings.appearance?.theme === 'dark') {
            document.documentElement.classList.add('dark-theme');
          } else {
            document.documentElement.classList.remove('dark-theme');
          }
        }
      } catch (error) {
        console.warn('Failed to load theme settings:', error);
      }
    };

    // Record app visit for analytics
    analyticsService.recordVisit('app-start');

    loadThemeSettings();
  }, []);

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<LessonsPage />} />
            <Route path="lessons" element={<LessonsPage />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="import" element={<ImportPage />} />
            <Route path="admin" element={<AdminPage />} />
            <Route path="posters" element={<PostersPage />} />
            <Route path="archive" element={<ArchivePage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App;
