import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import * as serviceWorker from './serviceWorker';
import { BrowserRouter } from "react-router-dom";
import UIkit from "uikit";
import './index.css';
import 'uikit';
import 'react-app-polyfill/ie11';
import Icons from 'uikit/dist/js/uikit-icons';
UIkit.use(Icons);

ReactDOM.render(
<BrowserRouter>
	<App />
</BrowserRouter>
, document.getElementById('root'));

serviceWorker.register();

if(process.env.NODE_ENV === 'production'){
	console.warn = () => {}
}