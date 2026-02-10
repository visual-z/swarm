import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MessageBubble, type Message } from '../message-bubble';

const baseMessage: Message = {
  id: 'msg-1',
  from: 'agent-alpha',
  to: 'dashboard',
  senderType: 'agent',
  content: 'Hello from Agent Alpha!',
  type: 'query',
  read: false,
  createdAt: '2025-06-15T12:00:00Z',
};

describe('MessageBubble', () => {
  it('renders message content', () => {
    render(<MessageBubble message={baseMessage} isSent={false} />);

    expect(screen.getByText('Hello from Agent Alpha!')).toBeInTheDocument();
  });

  it('displays the sender name when provided', () => {
    render(
      <MessageBubble message={baseMessage} isSent={false} senderName="Agent Alpha" />,
    );

    expect(screen.getByText('Agent Alpha')).toBeInTheDocument();
  });

  it('renders the correct message type badge', () => {
    render(<MessageBubble message={baseMessage} isSent={false} />);

    expect(screen.getByText('Query')).toBeInTheDocument();
  });

  it('shows "Sent" status for unread sent messages', () => {
    render(<MessageBubble message={baseMessage} isSent={true} />);

    expect(screen.getByText('Sent')).toBeInTheDocument();
  });

  it('shows "Read" status for read sent messages', () => {
    const readMessage = { ...baseMessage, read: true };
    render(<MessageBubble message={readMessage} isSent={true} />);

    expect(screen.getByText('Read')).toBeInTheDocument();
  });

  it('does not show read status for received messages', () => {
    render(<MessageBubble message={baseMessage} isSent={false} />);

    expect(screen.queryByText('Sent')).not.toBeInTheDocument();
    expect(screen.queryByText('Read')).not.toBeInTheDocument();
  });

  it('applies justify-end class for sent messages', () => {
    const { container } = render(
      <MessageBubble message={baseMessage} isSent={true} />,
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('justify-end');
  });

  it('applies justify-start class for received messages', () => {
    const { container } = render(
      <MessageBubble message={baseMessage} isSent={false} />,
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('justify-start');
  });

  it('renders different badge for broadcast type', () => {
    const broadcastMsg = { ...baseMessage, type: 'broadcast' as const };
    render(<MessageBubble message={broadcastMsg} isSent={false} />);

    expect(screen.getByText('Broadcast')).toBeInTheDocument();
  });

  it('renders notification type badge', () => {
    const notifMsg = { ...baseMessage, type: 'notification' as const };
    render(<MessageBubble message={notifMsg} isSent={false} />);

    expect(screen.getByText('Notice')).toBeInTheDocument();
  });

  it('renders response type badge', () => {
    const responseMsg = { ...baseMessage, type: 'response' as const };
    render(<MessageBubble message={responseMsg} isSent={false} />);

    expect(screen.getByText('Reply')).toBeInTheDocument();
  });
});
