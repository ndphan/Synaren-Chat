import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import Comment from './Comment';
import { ChatContainer, CommentListContainer } from './EmbededChat.styles';
import { getSession, performSend } from './ChatService';
import queryString from 'query-string';
import randomWords from '../Sevices/random-words';
import moment from 'moment';
import UIkit from 'uikit';
import ifvisible from 'ifvisible.js';


let singleLongPoll;

const chatContainerId = `chat-container-${Math.floor(Math.random() * 1000.0)}`

const scrollMessageInView = () => {
  let chatContainer = document.getElementById(chatContainerId);
  if (chatContainer) {
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }
}

const randomNickname = () => {
  return randomWords({
    exactly: 2, formatter: (word, index) => {
      return index === 0 ? word.slice(0, 1).toUpperCase().concat(word.slice(1)) : word;
    }
  }).join('');
}

const usePrevious = (value) => {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

const isDateWithinDay = (dateStr1, dateStr2) => {
  if(!dateStr1 || !dateStr2){
    return false;
  }
  try {
    let dateWithinDay = false;
    const date1 = moment(dateStr1);
    const date2 = moment(dateStr2);
    if(date1.isValid() && date2.isValid()){
      dateWithinDay = date1.diff(date2, 'hours') <= 1 
    }
    return dateWithinDay;
  } catch(e) { console.error(e) }
}

const EmbededChat = (props) => {

  const showAlert = (message) => {
    UIkit.notification({message: message, status: 'danger', timeout: '3000', pos: 'top-right'})
  }

  const getSessionId = () => {
		let sessionId = queryString.parse(props.location.search || "{}").session;
		return sessionId ? sessionId : '';
  }

  const getNickname = () => {
		let nickname = queryString.parse(props.location.search || "{}").nickname;
		return nickname ? nickname : '';
  }

  const updateNicknameQueryParam = nickname => {
    const parsed = queryString.parse(props.location.search);
    parsed.nickname = nickname;
    const { history } = props;
		history.push({
			search: `?${Object.keys(parsed).map((query, index) => `${index ? '&' : ''}${query}=${parsed[query]}`).join('')}`
    });
    return nickname;
  }
  
  const updateSessionIdQueryParam = sessionId => {
    const parsed = queryString.parse(props.location.search);
    parsed.session = sessionId;
    const { history } = props;
		history.push({
			search: `?${Object.keys(parsed).map((query, index) => `${index ? '&' : ''}${query}=${parsed[query]}`).join('')}`
    });
    return sessionId;
  }

  const onError = error => {
    // cancel long poll
    if (singleLongPoll) {
      clearInterval(singleLongPoll);
    }
    setMessages([]);
    setError(error);
    showAlert('No session found');
    setIsLoading(false);
  }

  const [messages, setMessages] = useState([]);
  const [sessionId, setSessionId] = useState(getSessionId());
  const [error, setError] = useState();
  const [isloadSession, setIsLoadSession] = useState(true);
  const [nickname, setNickname] = useState(getNickname());
  const [newMessage, setNewMessage] = useState(undefined);
  const [isLoading, setIsLoading] = useState(false);

  const prevLocation = usePrevious(props.location);
  useEffect(() => {
    if (props.location.search && prevLocation && prevLocation.search) {
      const queryLocation = queryString.parse(props.location.search);
      const queryPrevLocation = queryString.parse(prevLocation.search);
      if(queryLocation.session !== queryPrevLocation.session){
        setIsLoadSession(true);
        setSessionId(getSessionId());
      }
      if(queryLocation.nickname !== queryPrevLocation.nickname){
        setNickname(getNickname());
      }
      if(!queryLocation.nickname){
        setNickname(updateNicknameQueryParam(randomNickname()))
      }
    }
  });

  const groupMessages = () => {
    let messageComponent = [];
    let currentUser;
    let currentDate;
    let currentAccordianItems = [];
    let accordianCount = 0;
    for (let index = 0; index < messages.length; index++) {
      const message = messages[index];
      const isSameUserAsPrev = message.username === currentUser;
      const isSameUserAsOwner = message.username === nickname;
      const commentFragment = <Comment showDate={!isDateWithinDay(currentDate, message.createdDate) || !isSameUserAsPrev} showUsername={!isSameUserAsPrev} message={message} key={index} align={isSameUserAsOwner ? 'left' : 'right'}/>;

      if(!isSameUserAsPrev && index > 0){
        messageComponent.push(
          <li className="uk-parent" key={accordianCount}>
            <ul className={`uk-accordion-content ${accordianCount === 0 ? 'uk-margin-remove' : ''}`}>
              {currentAccordianItems}
            </ul>
          </li>
        );
        messageComponent.push(<hr key={`${accordianCount}.1`}/>)
        currentAccordianItems = [];
        accordianCount++;
      }
      currentAccordianItems.push(commentFragment);
      if(index == messages.length - 1) {
        if(index == messages.length - 1){
          messageComponent.push(
            <li className="uk-parent" key={accordianCount}>
              <ul className="uk-nav-sub uk-accordion-content">
                {currentAccordianItems}
              </ul>
            </li>
          );
        }
      }
      currentUser = message.username;
      currentDate = message.createdDate;
    }
    return messageComponent
  }

  const longPoll = () => {
    if (singleLongPoll) {
      clearInterval(singleLongPoll);
    }
    singleLongPoll = setInterval(() => {
      if (!ifvisible.now('hidden')) {
        if (sessionId) {
          setIsLoadSession(true);
        }
      } else {
        console.log("skipping poll when idle")
      }
    }, 3000);
  };

  useEffect(() => {
    if(isloadSession){
      setIsLoadSession(false);
      const sessionId = getSessionId();
      setIsLoading(true);
      getSession(sessionId)
        .then(data => {
          const newMessages = JSON.parse(data.messages).messages || [];
          updateSessionIdQueryParam(data.sessionId);
          setSessionId(data.sessionId);
          if (messages.length !== newMessages.length) {
            setMessages(newMessages);
            scrollMessageInView();
          } else {
            setMessages(newMessages);
          }
          longPoll();
          setIsLoading(false);
        })
        .catch(onError)
    }
  });

  const sendMessage = () => {
    if(newMessage){
      const sentMessage = newMessage;
      setIsLoading(true);
      setNewMessage(""); 
      performSend({
        username: nickname,
        message: newMessage,
        sessionId: sessionId
      }).then(_ => {
        setIsLoadSession(true);
        setIsLoading(false);
      }).catch(_ => {
        setIsLoading(false);
        showAlert("There was an issue sending your message, please try again.");
        setNewMessage(sentMessage);
      })
    }
  };

  return (
    <ChatContainer>
      <form className="uk-form-stacked" uk-grid="true">
        <div>
          <label className="uk-form-label" htmlFor="nickname-text">Nickname</label>
          <input 
            id="nickname-text" 
            onChange={e => setNickname(e.target.value)}
            onBlur={e => updateNicknameQueryParam(e.target.value)} 
            className="uk-input uk-form-width-medium uk-form-small" type="text" value={nickname}
          />
        </div>
        <div>
          <label className="uk-form-label" htmlFor="session-id-text">Session Id</label>
          <input 
            id="session-id-text" 
            onChange={e => setSessionId(e.target.value)}
            onBlur={e => updateSessionIdQueryParam(e.target.value) && sessionId !== getSessionId() ? setIsLoadSession(true) : undefined} 
            className="uk-input uk-form-width-medium uk-form-small" type="text" value={sessionId}
          />
        </div>
      </form>
      <hr style={{margin:0, marginTop:"20px"}}></hr>
      <CommentListContainer id={chatContainerId}>
        <ul className="uk-nav">
          {groupMessages()}
        </ul>
      </CommentListContainer>
      <hr/>
      <form onSubmit={e => {e.preventDefault(); sendMessage();}}>
        <textarea value={newMessage} onChange={e => setNewMessage(e.target.value)} style={{resize:"none",height:"36px"}} className="uk-textarea uk-form-width-medium uk-width-3-4" type="text"></textarea>
        <button style={{height:"36px"}} className="uk-button uk-button-primary uk-width-1-4">Submit {isLoading ? <div uk-spinner="ratio: 0.5" style={{position:"absolute",padding:"11px 0",paddingLeft: "20px"}}/> : undefined}</button>
      </form>
    </ChatContainer>
  )
}

EmbededChat.propTypes = {};

EmbededChat.defaultProps = {};

export default EmbededChat;

