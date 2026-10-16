/**
 * Payment-overdue login block.
 *
 * Any account email listed here is refused at login (and existing sessions
 * are cut off) with the OVERDUE_MESSAGE below.
 *
 * Override without a code change by setting the env var
 *   BLOCKED_LOGIN_EMAILS="admin@tiles.com,other@tiles.com"
 * To lift the block once payment is received, set BLOCKED_LOGIN_EMAILS="none"
 * (or remove the email from DEFAULT_BLOCKED_EMAILS) and redeploy.
 */

export const PAYMENT_OVERDUE_CODE = 'PAYMENT_OVERDUE'

export const OVERDUE_MESSAGE =
  'Due to non-payment, the server is rejecting this request. Unable to login — please pay the overdue amount first.'

const DEFAULT_BLOCKED_EMAILS = ['admin@tiles.com']

export function getBlockedEmails(): string[] {
  const raw = process.env.BLOCKED_LOGIN_EMAILS
  const list = raw !== undefined ? raw.split(',') : DEFAULT_BLOCKED_EMAILS
  return list
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e && e !== 'none')
}

export function isBlockedForOverdue(email?: string | null): boolean {
  if (!email) return false
  return getBlockedEmails().includes(email.trim().toLowerCase())
}
