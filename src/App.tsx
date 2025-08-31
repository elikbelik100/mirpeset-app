import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import LessonsPage from './pages/LessonsPage';
import PostersPage from './pages/PostersPage';
import ArchivePage from './pages/ArchivePage';
import SettingsPage from './pages/SettingsPage';
import CalendarPage from './pages/CalendarPage';
import ImportPage from './pages/ImportPage';
import AdminPage from './pages/AdminPage';
import NotificationsPage from './pages/NotificationsPage';
import './App.css';

function App() {
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
