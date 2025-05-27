import React from 'react';
import './App.css';

export default function App() {
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Plataforma de Treinamento de Modelos de Machine Learning</h1>
        <p>Escolha um modelo, envie seus dados e treine seu algoritmo com facilidade.</p>
      </header>

      <main className="app-main">
        <section className="section">
          <h2>Selecione um Modelo</h2>
          <select className="select-model">
            <option value="">-- Escolha um modelo --</option>
            <option value="random_forest">Random Forest</option>
            <option value="svm">Support Vector Machine</option>
            <option value="logistic_regression">Regressão Logística</option>
            <option value="xgboost">XGBoost</option>
          </select>
        </section>

        <section className="section">
          <h2>Envie seus Dados</h2>
          <input type="file" accept=".csv" className="file-input" />
        </section>

        <div>
          <button className="train-button">Treinar Modelo</button>
        </div>
      </main>
    </div>
  );
}
