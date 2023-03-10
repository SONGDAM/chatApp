import React, { useRef, useState } from 'react';
import { auth } from '../firebaseConfig';
import { serverTimestamp } from 'firebase/firestore';
import styled from '@emotion/styled';
import useGetFirebaseQuery from '../hooks/useGetFirebaseQuery';
import createFirebaseDocument from './common/util/createFirebaseDocument';
import updateFirebaseDocument from './common/util/updateFirebaseDocument';
import type { UserProps } from '../types/UserProps';
import type { ChatMessageProps } from '../types/ChatMessageProps';

import { colorPalatte } from '../style/color';
import { FlexColmunCenter } from './common/UI/Layout';
import ChatMessageInput from './ChatMessageInput';

interface ChatRoomLocalProps {
  chatMember: UserProps[];
}

function ChatRoom({ chatMember }: ChatRoomLocalProps) {
  const [newMessage, setNewMessage] = useState<string>('');
  const uid: string = auth?.currentUser?.uid;
  const messageListBottomRef = useRef<HTMLDivElement>();
  const chatRoomDatabaseName: string = chatMember
    .map((it) => it.uid)
    .sort()
    .join('');

  const chatRoomMemberName: string = chatMember
    .map((it) => it.name)
    .sort()
    .join(',');

  const messageQueryResult: ChatMessageProps[] = useGetFirebaseQuery(`message=${chatRoomDatabaseName}`, 'createdAt');

  const handleNewMessage = (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    setNewMessage(e.target.value);
  };

  const sendNewMessage = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();

    createFirebaseDocument(`message=${chatRoomDatabaseName}`, {
      text: newMessage,
      createdAt: serverTimestamp(),
      memberName: chatRoomMemberName,
      own: uid,
    });

    updateFirebaseDocument(`chatrooms`, chatRoomDatabaseName, {
      profilePicPath: chatMember[0].profilePicPath,
      name: chatRoomMemberName,
      createdAt: serverTimestamp(),
      recentMessage: newMessage,
      member: chatMember,
      own: uid,
    });

    setTimeout(() => {
      messageListBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }, 100);

    setNewMessage('');
  };

  return (
    <>
      <FlexColmunCenter>
        <ChatRoomMessage>
          {messageQueryResult.map((it) =>
            it.own === uid ? (
              <React.Fragment key={it.id}>
                <ChatBoxWrapper key={it.id}>
                  <ChatBox> {it.text}</ChatBox>
                </ChatBoxWrapper>
                <MessageListBottom ref={messageListBottomRef} />
              </React.Fragment>
            ) : (
              <OtherUserChatBoxWrapper key={it.id}>
                <OtherUserChatBox key={it.id}>{it.text}</OtherUserChatBox>
              </OtherUserChatBoxWrapper>
            )
          )}
        </ChatRoomMessage>
      </FlexColmunCenter>
      <ChatMessageInput handleNewMessage={handleNewMessage} newMessage={newMessage} sendNewMessage={sendNewMessage} />
    </>
  );
}

//TODO: Semantic Tag update

const ChatRoomMessage = styled.div`
  width: 46rem;
  padding: 1rem 1rem 2rem 1.2rem;
  flex: 24rem;
  flex-wrap: wrap;
  align-items: flex-start;
  background-color: ${colorPalatte.primary};
  overflow: scroll;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const ChatBoxWrapper = styled.div`
  display: flex;
  flex-flow: column wrap;
  justify-content: flex-end;
  align-items: flex-end;
`;

const OtherUserChatBoxWrapper = styled.div`
  justify-content: flex-start;
  align-items: flex-start;
`;

const ChatBox = styled.div`
  margin-bottom: 8px;
  padding: 0.4rem 0.625rem 1.4rem 0.625rem;
  width: fit-content;
  height: 2rem;
  background-color: #fff;
  color: #191919;
  border-radius: 12px;
  font-weight: 300;
`;

const OtherUserChatBox = styled(ChatBox)`
  background-color: #6c89cc;
  color: #fff;
`;

const MessageListBottom = styled.div`
  margin-bottom: 12px;
`;

export default ChatRoom;
