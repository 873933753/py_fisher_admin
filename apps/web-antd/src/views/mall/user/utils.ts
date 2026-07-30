export const USER_LIST_AVATAR_SIZE = 48;

export function formatCellText(value: unknown): string {
  const text = typeof value === 'string' ? value.trim() : '';
  return text || '—';
}

export interface EmailAvatarLines {
  line1: string;
  line2: string;
}

export function formatEmailForAvatarLines(
  email?: null | string,
): EmailAvatarLines {
  const value = email?.trim() ?? '';
  if (!value) {
    return { line1: '—', line2: '' };
  }
  if (value.length <= 6) {
    const atIndex = value.indexOf('@');
    if (atIndex > 0) {
      return {
        line1: value.slice(0, atIndex + 1),
        line2: value.slice(atIndex + 1),
      };
    }
    const mid = Math.ceil(value.length / 2);
    return {
      line1: value.slice(0, mid),
      line2: value.slice(mid),
    };
  }
  return {
    line1: `${value.slice(0, 2)}**`,
    line2: value.slice(-4),
  };
}

export function formatEmailForAvatar(email?: null | string): string {
  const { line1, line2 } = formatEmailForAvatarLines(email);
  return line2 ? `${line1}${line2}` : line1;
}

export function hasAvatarUrl(avatarUrl?: null | string): boolean {
  return Boolean(avatarUrl?.trim());
}
