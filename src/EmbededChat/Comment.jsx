import React from 'react';
import PropTypes from 'prop-types';
import { CommentContainer } from './EmbededChat.styles';
import moment from 'moment';
import { stringToRGB } from '../Sevices/common';


const Comment = (props) => {
	const message = props.message;
	const isLeft = props.align === 'left';
	let date = '';
	try {
		if(props.showDate && message.createdDate){
			const dateMoment = moment(message.createdDate);
			date = dateMoment.isValid() ? dateMoment.format('h:mm A DD/MMM/YY') : undefined;
		}
	} catch(e) { console.error(e)}
	return (
		<CommentContainer className={`${isLeft ? 'uk-align-left' : 'uk-align-right'}`}>
			<article className="uk-comment">
				<header className="uk-grid-medium uk-flex-middle" uk-grid="true">
					<div className={`${isLeft ? 'uk-text-left' : 'uk-text-right'}`} style={{marginLeft:isLeft ? '' :'auto', marginRight:isLeft ? 'auto' :''}}>
						{props.showUsername ? <h4 style={{fontWeight:700, color: stringToRGB(message.username)}} className="uk-comment-title">{message.username}</h4> : undefined}
					</div>
				</header>
				<div className={`${isLeft ? 'uk-text-left' : 'uk-text-right'} uk-comment-body`}>
					<p className="uk-margin-remove-bottom">{message.message}</p>
					{date ?
							<ul style={{marginTop:"-6px"}} className={`${isLeft ? 'uk-text-left' : 'uk-text-right'} uk-comment-meta`}>
									<small>{date}</small> 
							</ul>
						: undefined}
				</div>
			</article>
		</CommentContainer>
	)

}

Comment.propTypes = {
	align: PropTypes.string,
	message: PropTypes.shape({
		message: PropTypes.string,
		username: PropTypes.string,
		createdDate: PropTypes.object | undefined
	}),
	showUsername: PropTypes.bool,
	showDate: PropTypes.bool
};

Comment.defaultProps = {
	align: 'left',
	message: {},
	showUsername: true,
	showDate: true
};

export default Comment;
