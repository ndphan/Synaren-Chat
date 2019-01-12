import React from 'react'
import { Icon, Input, Avatar, Alert, Spin } from 'antd';
import ifvisible from 'ifvisible.js';
import styled from 'styled-components';
import config from '../config/url.config.json';
import queryString from 'query-string';
import randomWords from '../random-words';

ifvisible.setIdleDuration(30);

const Search = Input.Search;

const Username = styled.div`
  && {
				vertical-align: middle;
    line-height: 32px;
    padding-left: 6px;
    font-size: 24px;
    padding-top: 10px;
				width: 90%;
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;	
  }
`

const ButtonLink = styled.button`
		background: transparent;
		border: none;
		padding: 0;
		padding-left: 6px;
		outline: none;
		& : hover {
			color: #1890ff;
			cursor: pointer;
		}
`

const HeaderContainer = styled.div`
	background: azure;
	padding: 14px 5px;
	border-radius: 4px;
	margin-top: 10px;
}
`

const GroupSession = styled.div`
  && {
    vertical-align: middle;
    line-height: 32px;
    padding-left: 6px;
    font-size: 24px;
    padding-top: 10px;
				width: 90%;
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;
  }
`
const ChatContainer = styled.div`
  && {
    background: white;

				@media (max-height: 600px){
					min-height: 200px;
				}
				@media (min-height: 601px){
					min-height: 50vh;
				}
				box-shadow: 1px 2px;
				height: 100%;
				max-height: 50vh;
    border-radius: 2px;
    margin: 10px 0;
    padding: 20px 20px;
				overflow: auto;
  }
`

const ChatMessage = styled.div`
  margin: 6px;
		font-size: 14px;
`

const ChatNickname = styled.div`
  margin: 3px;
  font-size: 18px;
  font-weight: bold;
  word-break: break-all;
  overflow: auto;
  flex-basis: 150%;
`

const ShareIcon = styled(Icon)`
	padding-left: 6px;
	padding-right: 8px;
`

const SendContainer = styled.div`
  && {
    min-height: 100px;
    font-size: 20px;
  }
`

const AppInput = styled.input`
  & {
				border: none;
    margin: -1px;
    padding-left: 5px;
				border-radius: 4px;
  }
`

const EditButton = styled.a`
  & {
    color: #1890ff;
    height: 32px;
    display: inline-block;
    margin: 0;
    border-radius: 2px;
    font-size: 18px;
				padding-left: 8px;
    padding-right: 8px;
  }
`

const ClickableLink = styled.a`
	color: black;
	border-bottom: 1px dashed black;
`

function getChatUrl() {
	return config.CHAT_BASE_URL;
}

let singleLongPoll;


class Chat extends React.Component {

	state = {
		username: this.randomNickname(),
		sessionId: '',
		isEditSession: false,
		isEditName: false,
		messages: [],
		copiedCheck: false,
		isSending: false
	}

	randomNickname() {
		return randomWords({
			exactly: 2, formatter: (word, index) => {
				return index === 0 ? word.slice(0, 1).toUpperCase().concat(word.slice(1)) : word;
			}
		}).join('');
	}

	getSession = (sessionId) => {
		return (sessionId ?
			send(`${getChatUrl()}?session=${sessionId}`, 'GET') :
			send(`${getChatUrl()}?new-session=true`, 'GET')
		).then(data => {
			const newMessages = JSON.parse(data.messages).messages;
			const { messages } = this.state;
			this.setState({ session: data, sessionId: data.sessionId, messages: newMessages });
			if (messages.length !== newMessages.length) {
				this.scrollMessageInView();
			}
		}).catch(error => {
			// cancel long poll
			if (singleLongPoll) {
				clearInterval(singleLongPoll);
			}
			throw error;
		})
	}

	pushQueryParameter(parmeters) {
		const { history } = this.props;
		history.push({
			search: `?${Object.keys(parmeters).map((query, index) => `${index ? '&' : ''}${query}=${parmeters[query]}`).join('')}`
		});
	}

	componentDidUpdate(prevProps, prevState) {
		if ((prevState.username !== this.state.username && !this.state.isEditName)
			|| (prevState.isEditName && !this.state.isEditName)) {
			const { location } = this.props;
			const { username } = this.state;
			const parsed = queryString.parse(location.search);
			parsed.Nickname = username;
			this.pushQueryParameter(parsed);
		}

		if ((prevState.sessionId !== this.state.sessionId && !this.state.isEditSession)
			|| (prevState.isEditSession && !this.state.isEditSession)) {
			const { location } = this.props;
			const { sessionId } = this.state;
			const parsed = queryString.parse(location.search);
			parsed.SessionId = sessionId;
			this.pushQueryParameter(parsed);
		} else if (prevState.sessionId !== this.state.sessionId &&
			prevProps.location.search !== this.props.location.search) {
			this.reloadSession();
		} else if (prevProps.location.search !== this.props.location.search){
			const sessionId = this.getSessionId();
			if(sessionId !== this.state.sessionId){
				this.reloadSession();
			}
		}
	}

	getSessionId() {
		const { location } = this.props;
		let sessionId = queryString.parse(location.search).SessionId;
		return sessionId ? sessionId : '';
	}

	getNickname() {
		const { location } = this.props;
		return queryString.parse(location.search).Nickname
	}

	reloadSession = () => {
		const sessionId = this.getSessionId();
		this.setState({
			sessionId: sessionId
		}, () => {
				this.getSession(this.state.sessionId)
					.catch(error => {
						this.setState({ errorMessage: "Session not found" });
						throw error;
					})
					.then(this.longPoll);
		});

	}


	componentDidMount() {
		this.reloadSession();

		const nickname = this.getNickname();
		if (nickname) {
			this.setState({ username: nickname })
		} else {
			const { location } = this.props;
			const { username } = this.state;
			const parsed = queryString.parse(location.search);
			parsed.Nickname = username;
			this.pushQueryParameter(parsed);
		}
	}

	componentWillUnmount() {
		if (singleLongPoll) {
			clearInterval(singleLongPoll);
		}
	}


	longPoll = () => {
		if (singleLongPoll) {
			clearInterval(singleLongPoll);
		}
		singleLongPoll = setInterval(() => {
			if (!ifvisible.now('hidden')) {
				const { sessionId } = this.state;
				if (sessionId) {
					this.getSession(sessionId);
				}
			} else {
				console.log("skipping poll when idle")
			}
		}, 3000);
	}


	sendMessage = () => {
		const { username, sessionId, message } = this.state;

		if (message.length === 0) {
			return;
		}

		const performSend = _ => send(`${getChatUrl()}`, 'POST', undefined, {
			username: username,
			message: message,
			sessionId: sessionId
		})
			.then(data => {
				const newMessages = JSON.parse(data.messages).messages;
				const { messages } = this.state;
				this.setState({
					message: '',
					messages: newMessages,
					isSending: false,
				})
				if (messages.length !== newMessages.length) {
					this.scrollMessageInView();
				}
			})
			.catch(error => {
				this.setState({
					message: '',
					isSending: false,
				})
			});

		this.setState({ isSending: true }, performSend);
	}

	scrollMessageInView = () => {
		let chatContainer = document.getElementById("chat-container");
		if (chatContainer) {
			chatContainer.scrollTop = chatContainer.scrollHeight;
		}
	}

	onClickEditSession = () => {
		const isEdit = !this.state.isEditSession;
		if (!isEdit) {
			this.getSession(this.state.sessionId)
			.catch(error => {
				this.setState({ errorMessage: "Session not found" });
				throw error;
			})
			.then(this.longPoll);
		}
		this.setState({ isEditSession: isEdit })
	}

	onClickEditNickname = () => {
		this.setState({ isEditName: !this.state.isEditName })
	}

	handleChange = (event) => {
		this.setState({ [event.target.name]: event.target.value });
	}

	handleShare = (event) => {
		this.copyTextToClipboard(`www.synaren.com/cloud-chat/chat?SessionId=${this.state.sessionId}&Nickname=${this.randomNickname()}`)
	}

	fallbackCopyTextToClipboard = (text) => {
		var textArea = document.createElement("textarea");
		textArea.value = text;
		document.body.appendChild(textArea);
		textArea.focus();
		textArea.select();
		try {
			document.execCommand('copy');
		} catch (err) { }
		document.body.removeChild(textArea);
	}
	copyTextToClipboard = (text) => {
		if (!navigator.clipboard) {
			this.fallbackCopyTextToClipboard(text);
			this.setState({ copiedCheck: true });
			setTimeout(() => {
				this.setState({ copiedCheck: false })
			}, 1000);
			return;
		}
		navigator.clipboard.writeText(text).then(() => {
			this.setState({ copiedCheck: true });
			setTimeout(() => {
				this.setState({ copiedCheck: false })
			}, 1000);
		}, () => {
			this.setState({ copiedCheck: false })
		});
	}

	render() {
		const { username, isSending, sessionId, isEditSession, isEditName, messages, message, errorMessage } = this.state;
		return (
			<div style={{padding:'10px 40px'}}>
				<HeaderContainer>
					{/* <UsernameContainer> */}
						<Username>
							{
								isEditName ?
									<React.Fragment>
										<EditButton onClick={this.onClickEditNickname}><Icon type="edit" /></EditButton>
										<AppInput style={{ width: '100%' }} placeholder="Nickname" name="username" onChange={this.handleChange} />
									</React.Fragment>
									:
									<React.Fragment>
										<Avatar style={{ backgroundColor: '#87d068', marginLeft: 8, marginRight: 8 }} icon="user" />
										<ClickableLink onClick={this.onClickEditNickname}>{username}</ClickableLink>
									</React.Fragment>
							}
						</Username>
					{/* </UsernameContainer> */}
					<GroupSession>
						{
							isEditSession ?
								<React.Fragment>
									<EditButton onClick={this.onClickEditSession}><Icon type="edit" /></EditButton>
									<AppInput style={{ width: '100%' }} placeholder="Session Number" name="sessionId" onChange={this.handleChange} />
								</React.Fragment>
								:
								<React.Fragment>
									<ButtonLink onClick={this.handleShare}>
										<ShareIcon type={this.state.copiedCheck ? "check" : "share-alt"} />
									</ButtonLink>
									<ClickableLink onClick={this.onClickEditSession}>{sessionId}</ClickableLink>
								</React.Fragment>
						}
					</GroupSession>
					{
						errorMessage ? (
							<Alert
								type="error"
								style={{ marginTop: 10 }}
								banner
								message={errorMessage}
								closable
								onClose={() => this.setState({ errorMessage: undefined })}
							/>
						) :
							null
					}
				</HeaderContainer>
				<ChatContainer id="chat-container">
					{messages.map((message, index) => (
						<div key={index}>
							<ChatNickname>{message.username}</ChatNickname>
							<ChatMessage>{message.message}</ChatMessage>
						</div>
					))}
				</ChatContainer>
				<SendContainer>
					<Search
						addonBefore={isSending ? <Spin style={{marginTop: 6}}/> : undefined}
						style={{ boxShadow: '1px 2px', borderRadius: 4 }}
						placeholder="Message"
						enterButton="Send"
						size="large"
						onSearch={this.sendMessage}
						name="message"
						onChange={this.handleChange}
						onPressEnter={this.sendMessage}
						value={message}
					/>
				</SendContainer>
			</div>
		)
	}
}

function send(url, method, headers, body) {
	return new Promise(function (resolve, reject) {
		var xhr = new XMLHttpRequest();
		xhr.open(method, url, true);
		if (headers) {
			Object
				.keys(headers)
				.forEach(header => xhr.setRequestHeader(header, headers[header]));
		}
		xhr.onreadystatechange = function () {
			if (this.readyState === XMLHttpRequest.DONE) {
				var response = null;
				try {
					response = JSON.parse(xhr.response);
				} catch (error) { }
				if (this.status === 200) {
					resolve(response);
				} else {
					reject(response);
				}
			}
		}
		xhr.onerror = function () {
			var response = null;
			try {
				response = JSON.parse(xhr.response);
			} catch (error) { }
			reject(response);
		};
		xhr.send(JSON.stringify(body));
	}).catch(error => {
		console.error(error);
		throw error;
	})
}

export default Chat