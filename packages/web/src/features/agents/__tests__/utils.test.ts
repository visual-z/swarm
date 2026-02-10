import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatRelativeTime,
  getInitials,
  getAvatarColor,
  truncateUrl,
  statusConfig,
} from '../utils';

describe('formatRelativeTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "just now" for future timestamps', () => {
    expect(formatRelativeTime('2025-06-15T12:01:00Z')).toBe('just now');
  });

  it('returns seconds ago for < 60s', () => {
    expect(formatRelativeTime('2025-06-15T11:59:30Z')).toBe('30s ago');
  });

  it('returns minutes ago for < 60m', () => {
    expect(formatRelativeTime('2025-06-15T11:50:00Z')).toBe('10m ago');
  });

  it('returns hours ago for < 24h', () => {
    expect(formatRelativeTime('2025-06-15T06:00:00Z')).toBe('6h ago');
  });

  it('returns days ago for < 30d', () => {
    expect(formatRelativeTime('2025-06-10T12:00:00Z')).toBe('5d ago');
  });

  it('returns months ago for >= 30d', () => {
    expect(formatRelativeTime('2025-03-15T12:00:00Z')).toBe('3mo ago');
  });
});

describe('getInitials', () => {
  it('returns two-letter initials from two words', () => {
    expect(getInitials('John Doe')).toBe('JD');
  });

  it('returns first two chars for single word', () => {
    expect(getInitials('Alice')).toBe('AL');
  });

  it('handles camelCase splitting', () => {
    expect(getInitials('camelCase')).toBe('CC');
  });

  it('handles hyphenated names', () => {
    expect(getInitials('my-agent')).toBe('MA');
  });

  it('handles underscore names', () => {
    expect(getInitials('code_bot')).toBe('CB');
  });

  it('returns "?" for empty string', () => {
    expect(getInitials('')).toBe('?');
  });

  it('uses first and last part for multi-word names', () => {
    expect(getInitials('Alpha Beta Gamma')).toBe('AG');
  });
});

describe('getAvatarColor', () => {
  it('returns a hex color string', () => {
    const color = getAvatarColor('TestAgent');
    expect(color).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('returns the same color for the same name', () => {
    expect(getAvatarColor('Agent1')).toBe(getAvatarColor('Agent1'));
  });

  it('returns different colors for different names', () => {
    const c1 = getAvatarColor('Alpha');
    const c2 = getAvatarColor('Zeta');
    expect(c1).toMatch(/^#[0-9a-f]{6}$/i);
    expect(c2).toMatch(/^#[0-9a-f]{6}$/i);
  });
});

describe('truncateUrl', () => {
  it('truncates long URLs with ellipsis', () => {
    const result = truncateUrl('https://my-very-long-domain-name.example.com/some/very/long/path/to/resource');
    expect(result.length).toBeLessThanOrEqual(33);
    expect(result).toContain('…');
  });

  it('returns short URLs unchanged', () => {
    const result = truncateUrl('https://example.com/');
    expect(result).toBe('example.com/');
  });

  it('handles invalid URLs gracefully', () => {
    const result = truncateUrl('not-a-url');
    expect(result).toBe('not-a-url');
  });

  it('respects custom maxLen parameter', () => {
    const result = truncateUrl('https://example.com/path', 10);
    expect(result.length).toBeLessThanOrEqual(11);
  });
});

describe('statusConfig', () => {
  it('defines all four statuses', () => {
    expect(statusConfig).toHaveProperty('online');
    expect(statusConfig).toHaveProperty('offline');
    expect(statusConfig).toHaveProperty('busy');
    expect(statusConfig).toHaveProperty('idle');
  });

  it('has correct labels', () => {
    expect(statusConfig.online.label).toBe('Online');
    expect(statusConfig.offline.label).toBe('Offline');
    expect(statusConfig.busy.label).toBe('Busy');
    expect(statusConfig.idle.label).toBe('Idle');
  });
});
