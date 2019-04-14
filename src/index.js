import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import * as serviceWorker from './serviceWorker';
import { BrowserRouter } from "react-router-dom";
import './index.css';
import 'uikit';

ReactDOM.render(
<BrowserRouter>
	<App />
</BrowserRouter>
, document.getElementById('root'));

serviceWorker.register();

if(process.env.NODE_ENV === 'production'){
	console.warn = () => {}
}