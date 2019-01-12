import React, { Component } from 'react'
import { Layout, Button } from 'antd';
import styled from 'styled-components';
import queryString from 'query-string';
const { Content } = Layout;

const Body = styled.div`
	font-size: 24px;
	font-weight: 400;
	margin-top: 30px;
`

const Title = styled.h1`
	font-size: 35px;
	font-weight: bold;
	color: black;
	margin: 0;
`

const ContentContainer = styled(Content)`
	border-radius: 8px;
	padding: 10px 20px;
	color: #0d0a0a;
	overflow: hidden;
	max-width: 100%;
	@media (min-width: 600px){
		margin-left: 45px;
		padding: 30px 20px;
		padding-left: 45px;
	}
	padding-left: 45px;

`

const BenefitList = styled.ul`
	width: 80%;
`

const ChatButton = styled(Button)`
	max-width: 300px;
	margin: 5px auto;
	height: 40px;
	font-size: 20px;
`

const CallAction = styled.div`
	text-align: left;
	margin: 0 16px;
	margin-top: 30px;
`

class Onboarding extends Component {
	goToChat = () => {
		const { history, location } = this.props;
		const parsed = queryString.parse(location.search);
		delete parsed.SessionId;
		history.push(`chat?${Object.keys(parsed).map((query, index) => `${index ? '&' : ''}${query}=${parsed[query]}` ).join('')}`);
	}

	render () {
		return (
			<ContentContainer>
				{/* <Title>Cloud Chat</Title>					 */}
				<Body>
					<h3 style={{color:"black",paddingLeft:20}}>The quickiest way to chat online.</h3>
					<BenefitList>
						<li>Create a chat session and begin chatting with anyone around the world.</li>
						<li>Your chat is automatically deleted after a few hours of inactivity. </li>
						<li>Create as many chat sessions as you like.</li>
					</BenefitList>
					<CallAction>
						<ChatButton type="primary" block onClick={this.goToChat}>Create Session</ChatButton>
					</CallAction>
				</Body>

			</ContentContainer>
		)
	}
}

export default Onboarding