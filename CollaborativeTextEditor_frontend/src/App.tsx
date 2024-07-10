import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import FileListPage from './pages/FileListPage';
import EditorPage from './pages/EditorPage';
import PrivateRoute from './components/PrivateRoute';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route element={<PrivateRoute />}>
          <Route path="/home" element={<HomePage />} />
          <Route path="/file-list" element={<FileListPage />} />
          <Route path="/editor/:documentId" element={<EditorPage />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
