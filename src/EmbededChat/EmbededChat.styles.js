import styled from 'styled-components';

export const CommentContainer = styled.div`
	&&& {
		max-width: 80%;
		min-width: 300px;
		padding: 2px 5px;
		margin: 0;
	}
`;

export const CommentListContainer = styled.div`
	max-height: 0;
	min-height: 400px;
	overflow: auto;
	padding: 0 20px;
	padding-top: 10px;
`

export const ChatContainer = styled.div`
	overflow: hidden;
	margin: auto;
	max-width: 700px;
	padding: 16px 25px;
	min-height: 50vh;
`