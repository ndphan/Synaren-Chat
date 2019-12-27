import React, { PureComponent } from 'react';
import { RootApp, FooterVersion } from './App.styles';
import SynarenBanner from '../SynarenBanner';
import { Route } from 'react-router-dom';
import EmbededChat from '../EmbededChat';

class App extends PureComponent {
	render() {
		return (
			<RootApp className="primary-colour">
				<div className="uk-visible@s">
					<SynarenBanner/>
				</div>
				<Route path="**" exact component={EmbededChat}/>
				<div className="uk-visible@s">
					<FooterVersion>© Nam Phan; v:{process.env.REACT_APP_API_VERSION_NUMBER}</FooterVersion>
				</div>
			</RootApp>
		);
	}
}

export default App;
