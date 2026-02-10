import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatsCards } from '../stats-cards';

vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { variants, initial, animate, whileHover, whileTap, ...rest } = props;
      return <div {...rest}>{children}</div>;
    },
  },
}));

vi.mock('@/hooks/use-count-up', () => ({
  useCountUp: (value: number) => value,
}));

const defaultProps = {
  agentCount: 12,
  messageCount: 345,
  teamCount: 5,
  projectCount: 8,
  onlineCount: 7,
  isLoading: false,
};

describe('StatsCards', () => {
  it('renders all four stat labels', () => {
    render(<StatsCards {...defaultProps} />);

    expect(screen.getByText('Total Agents')).toBeInTheDocument();
    expect(screen.getByText('Active Messages')).toBeInTheDocument();
    expect(screen.getByText('Teams')).toBeInTheDocument();
    expect(screen.getByText('Projects')).toBeInTheDocument();
  });

  it('displays the correct count values', () => {
    render(<StatsCards {...defaultProps} />);

    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('345')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
  });

  it('shows online count in subtext', () => {
    render(<StatsCards {...defaultProps} />);

    expect(screen.getByText('7 online')).toBeInTheDocument();
  });

  it('shows loading skeletons when isLoading is true', () => {
    const { container } = render(<StatsCards {...defaultProps} isLoading={true} />);

    const skeletons = container.querySelectorAll('[data-slot="skeleton"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders subtext for each card', () => {
    render(<StatsCards {...defaultProps} />);

    expect(screen.getByText('7 online')).toBeInTheDocument();
    expect(screen.getByText('recent activity')).toBeInTheDocument();
    expect(screen.getByText('configured')).toBeInTheDocument();
    expect(screen.getByText('active')).toBeInTheDocument();
  });
});
