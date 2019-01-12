import React from 'react'
import { Layout, Menu, Icon } from 'antd';
import './app.css';
import styled from 'styled-components';
import Chat from './chat';
import Onboarding from './onboarding';
import { Switch, Route, Redirect, Link } from 'react-router-dom';
import { withRouter } from 'react-router';
import queryString from 'query-string';

const { Header, Content, Sider } = Layout;


const AppLayout = styled(Layout)`
  && {
    height: 100vh !important;
    height: 100%;
  }
`

const MenuHeader = styled(Header)`
  & {
    background: #001529;
    padding: 0 20px;
    height: 64px;
    line-height: 64px;
    font-size: 22px;
    color: white;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`

const AppBody = styled(Content)`
  && {
    width: 100%;
    max-width: 700px;
    margin: auto;
  }
`

const AppHeader = styled(Link)`
`

class App extends React.Component {

  state = {

  };

  goToOnboarding = () => {
    const { history, location } = this.props;
    const parsed = queryString.parse(location.search);
    history.push(`onboarding?${Object.keys(parsed).map((query, index) => `${index ? '&' : ''}${query}=${parsed[query]}` ).join('')}`);
	}

	goToChat = () => {
		const { history, location } = this.props;
		const parsed = queryString.parse(location.search);
		history.push(`chat?${Object.keys(parsed).map((query, index) => `${index ? '&' : ''}${query}=${parsed[query]}` ).join('')}`);
	}
  
  handleChange = (event) => {
		this.setState({ [event.target.name] : event.target.value });
	}
	
	goToChatSession = () => {
    const { sessionId } = this.state;
    const { history, location } = this.props;
		const parsed = queryString.parse(location.search);
    parsed.SessionId = sessionId ? sessionId : '-';
    parsed.Onboarding = true;
    history.push(`chat?${Object.keys(parsed).map((query, index) => `${index ? '&' : ''}${query}=${parsed[query]}` ).join('')}`);
    window.location.reload();
  }

  goToNewChat = () => {
    const { history, location } = this.props;
    const parsed = queryString.parse(location.search);
    delete parsed.Onboarding;
    delete parsed.SessionId;
    history.push(`chat?${Object.keys(parsed).map((query, index) => `${index ? '&' : ''}${query}=${parsed[query]}` ).join('')}`);
  }

  render() {
    return (
      <AppLayout>
        <Layout>
          <Sider
            breakpoint="lg"
            collapsedWidth="0"
            theme="light"
            defaultCollapsed={false}
            collapsible={true}
            reverseArrow={false}
            width={200}
          >
          <Menu
            mode="inline"
            selectedKeys={[this.props.location.pathname.includes('onboarding') ? '/onboarding' : this.props.location.pathname.includes('chat') ? '/chat' : '']}
          >
            <Menu.Item key="/onboarding" onClick={this.goToOnboarding}>
              <Icon type="book" />
              Onboarding
            </Menu.Item>
            <Menu.Item key="/chat" onClick={this.goToChat}>
              <Icon type="message" />
              Chatting
            </Menu.Item>
            <Menu.Item onClick={this.goToNewChat}>
              <Icon type='reload' />
              New Session
            </Menu.Item>
          </Menu>
          </Sider>
          <Layout>
          <AppHeader to={{ pathname: 'onboarding', search: this.props.location.search}}>
            <MenuHeader>
              <Icon type="cloud" style={{marginRight:8}}/>
              Cloud Chat
            </MenuHeader>
          </AppHeader>
          <AppBody>
            <Switch>
              <Route path="*/chat*" component={Chat} />
              <Route path="*/onboarding" component={Onboarding} />
              <Redirect from="/*" to={{ pathname: 'onboarding', search: this.props.location.search}} />
            </Switch>
          </AppBody>
        </Layout>
        </Layout>

      </AppLayout>
    );
  }
}

export default withRouter(App);