import React, { useState, useEffect, useRef } from 'react';
import Comment from './Comment';
import { ChatContainer, CommentListContainer } from './EmbededChat.styles';
import { getSession, performSend, shareLink, getUsersSession, getCorrelationId } from './ChatService';
import queryString from 'query-string';
import randomWords from '../Service/random-words';
import moment from 'moment';
import UIkit from 'uikit';
import ifvisible from 'ifvisible.js';
import Avatar from 'react-avatar';
import { stringToRGB } from '../Service/common'

ifvisible.setIdleDuration(30);

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
  
  const updateHistoryRoute = (parameter, isReplace) => {
    const { history } = props;
    const newParams = `?${Object.keys(parameter).map((query, index) => `${index ? '&' : ''}${query}=${parameter[query]}`).join('')}`;
    if(isReplace){
      history.replace({
        search: newParams
      });
    } else {
      history.push({
        search: newParams
      });
    }
  }

  const updateNicknameQueryParam = nickname => {
    const parsed = queryString.parse(props.location.search);
    if(nickname !== parsed.nickname){
      parsed.nickname = nickname;
      updateHistoryRoute(parsed, !!!nickname);
    }
    return nickname;
  }

  const updateSessionIdQueryParam = sessionId => {
    const parsed = queryString.parse(props.location.search);
    if(sessionId !== parsed.session){
      parsed.session = sessionId;
      updateHistoryRoute(parsed, !!!parsed.session);
    }
    return sessionId;
  }

  const onError = error => {
    // cancel long poll
    if (singleLongPoll) {
      clearInterval(singleLongPoll);
    }
    setMessages([]);
    showAlert('No session found');
    setIsLoading(false);
  }

  const [messages, setMessages] = useState([]);
  const [sessionId, setSessionId] = useState(getSessionId());
  const [isloadSession, setIsLoadSession] = useState(true);
  const [nickname, setNickname] = useState(getNickname());
  const [newMessage, setNewMessage] = useState(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [isShareLinkToggle, setIsShareLinkToggle] = useState(false);
  const [usersInSession, setUsersInSession] = useState([]);

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
      if(index === messages.length - 1) {
        if(index === messages.length - 1){
          messageComponent.push(
            <li className="uk-parent" key={accordianCount}>
              <ul className="uk-accordion-content">
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
    }, 5000);
  };

  useEffect(() => {
    if(isloadSession){
      setIsLoadSession(false);
      const sessionId = getSessionId();
      setIsLoading(true);
      getSession(sessionId, nickname)
        .then(data => {
          getUsersSession(data.sessionId).then(setUsersInSession).catch(_ => setUsersInSession([]));
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
        .catch(onError);
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
      <button
        style={{ position: "absolute", top: "10px", right: "10px", background: 'transparent' }}
        type="button"
        className="uk-hidden@s uk-button"
        uk-toggle="target: #chat-details; mode: click; media: @s; cls: uk-visible@s"
      >
        <span uk-icon="icon: more"></span>
      </button>
      <form id="chat-details" className="uk-form-stacked uk-visible@s" uk-grid="true">
        <div>
          <label
            className="uk-form-label"
            style={{ paddingTop: "5px" }}
            htmlFor="nickname-text"
          >
            Nickname
          </label>
          <input
            id="nickname-text"
            onChange={e => setNickname(e.target.value)}
            onBlur={e => updateNicknameQueryParam(e.target.value)}
            className="uk-input uk-form-width-medium uk-form-small"
            type="text"
            value={nickname}
          />
        </div>
        <div className="uk-margin-remove">
          <label
            className="uk-form-label"
            style={{ paddingTop: "5px" }}
            htmlFor="session-id-text"
          >
            Session Id
          </label>
          <input
            id="session-id-text"
            onChange={e => setSessionId(e.target.value)}
            onBlur={e =>
              updateSessionIdQueryParam(e.target.value) &&
              sessionId !== getSessionId()
                ? setIsLoadSession(true)
                : undefined
            }
            className="uk-input uk-form-width-medium uk-form-small"
            type="text"
            value={sessionId}
          />
          <a
            style={{ marginLeft: "4px" }}
            href="#/"
            className="uk-link-text"
            onClick={_ => {
              shareLink(sessionId, randomNickname()).then(_ => {
                setIsShareLinkToggle(true);
                setTimeout(_ => setIsShareLinkToggle(false), 1000);
              });
            }}
          >
            {isShareLinkToggle ? (
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
                data-svg="check"
              >
                <polyline
                  fill="none"
                  stroke="#008000"
                  strokeWidth="1.1"
                  points="4,10 8,15 17,4"
                ></polyline>
              </svg>
            ) : (
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
                data-svg="link"
              >
                <path
                  fill="none"
                  stroke="#000"
                  strokeWidth="1.1"
                  d="M10.625,12.375 L7.525,15.475 C6.825,16.175 5.925,16.175 5.225,15.475 L4.525,14.775 C3.825,14.074 3.825,13.175 4.525,12.475 L7.625,9.375"
                ></path>
                <path
                  fill="none"
                  stroke="#000"
                  strokeWidth="1.1"
                  d="M9.325,7.375 L12.425,4.275 C13.125,3.575 14.025,3.575 14.724,4.275 L15.425,4.975 C16.125,5.675 16.125,6.575 15.425,7.275 L12.325,10.375"
                ></path>
                <path
                  fill="none"
                  stroke="#000"
                  strokeWidth="1.1"
                  d="M7.925,11.875 L11.925,7.975"
                ></path>
              </svg>
            )}
          </a>
          <a
            style={{ marginLeft: "4px" }}
            href="#/"
            className="uk-link-text"
            onClick={_ => {
              setSessionId("");
              updateSessionIdQueryParam("");
              setIsLoadSession(true);
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
              data-svg="refresh"
            >
              <path
                fill="none"
                stroke="#000"
                strokeWidth="1.1"
                d="M17.08,11.15 C17.09,11.31 17.1,11.47 17.1,11.64 C17.1,15.53 13.94,18.69 10.05,18.69 C6.16,18.68 3,15.53 3,11.63 C3,7.74 6.16,4.58 10.05,4.58 C10.9,4.58 11.71,4.73 12.46,5"
              ></path>
              <polyline
                fill="none"
                stroke="#000"
                points="9.9 2 12.79 4.89 9.79 7.9"
              ></polyline>
            </svg>
          </a>
        </div>
      </form>
      <div style={{ width: "100%", maxHeight: "24px" }}>
        <Avatar
          className="uk-animation-slide-top-small"
          color={stringToRGB(getCorrelationId())}
          key={-1}
          style={{ paddingLeft: "5px", marginLeft: "-5px" }}
          name={nickname}
          round={true}
          size={20}
        />
        {usersInSession && usersInSession.length > 0 ? (
          usersInSession
            .filter(user => user.correlationId !== getCorrelationId())
            .map((user, index) => (
              <Avatar
                className="uk-animation-slide-top-small"
                color={stringToRGB(user.username)}
                key={index}
                style={{ marginLeft: "-5px" }}
                name={user.username}
                round={true}
                size={20}
              />
            ))
        ) : (
          <div style={{ height: "24px" }}></div>
        )}
      </div>
      <hr style={{ margin: 0, marginTop: "3px" }} />
      {messages && messages.length === 0 ? (
        <div uk-alert="true" style={{ position: "absolute" }}>
          <h3>Your chat session</h3>
          <p>
            Share this chat session with others to begin chatting.
            <br />
            You can configure your nickname or change sessions above.
            <br />
            Chat sessions are destroyed after a certain amount of time.
          </p>
        </div>
      ) : (
        undefined
      )}
      <CommentListContainer id={chatContainerId}>
        <ul className="uk-nav">{groupMessages()}</ul>
      </CommentListContainer>
      <hr />
      <form
        onSubmit={e => {
          e.preventDefault();
          sendMessage();
        }}
      >
        <textarea
          value={newMessage}
          onFocus={e => e.target.focus()}
          onChange={e => setNewMessage(e.target.value)}
          style={{ resize: "none", height: "36px" }}
          className="uk-textarea uk-form-width-medium uk-width-3-4@s uk-width-3-5"
          type="text"
        ></textarea>
        <button
          style={{ height: "36px" }}
          className="uk-button uk-button-primary uk-width-1-4@s uk-width-2-5"
        >
          Submit{" "}
          {isLoading ? (
            <div
              uk-spinner="ratio: 0.5"
              style={{
                position: "absolute",
                padding: "11px 0",
                paddingLeft: "20px"
              }}
            />
          ) : (
            undefined
          )}
        </button>
      </form>
    </ChatContainer>
  );
}

EmbededChat.propTypes = {};
EmbededChat.defaultProps = {};

export default EmbededChat;