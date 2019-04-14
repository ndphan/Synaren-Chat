import React, { PureComponent } from 'react';
import { RootApp, FooterVersion } from './App.styles';
import SynarenBanner from '../SynarenBanner';
import Chat from '../Chat';
import { Route } from 'react-router-dom';
import EmbededChat from '../EmbededChat';

class App extends PureComponent {
	render() {
		return (
			<RootApp className="primary-colour">
				<SynarenBanner/>
				<Route path="/" exact component={EmbededChat}/>
				<FooterVersion>© Nam Phan; v:{process.env.REACT_APP_API_VERSION_NUMBER}</FooterVersion>
			</RootApp>
		);
	}
}

export default App;
