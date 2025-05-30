import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard/Dashboard';
import SinglePrediction from './pages/SinglePrediction/SinglePrediction';
import BatchPrediction from './pages/BatchPrediction/BatchPrediction';
import LogsViewer from './pages/LogsViewer/LogsViewer';

function App() {
  return (
    <Router>
      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} />
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/single-prediction" element={<SinglePrediction />} />
          <Route path="/batch-prediction" element={<BatchPrediction />} />
          <Route path="/logs" element={<LogsViewer />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;