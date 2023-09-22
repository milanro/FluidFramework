/* eslint-disable @typescript-eslint/comma-dangle */
/* eslint-disable import/no-unassigned-import */
/* eslint-disable @typescript-eslint/quotes */
import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';

// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.querySelector('#root')
);
