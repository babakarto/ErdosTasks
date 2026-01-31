// Claim expiration utilities

// Claim duration: 1 hour
const CLAIM_DURATION_MS = 60 * 60 * 1000

/**
 * Check if a claim is still valid (not expired)
 */
export function isClaimValid(claimedAt: string | null): boolean {
  if (!claimedAt) {
    return false
  }

  const claimTime = new Date(claimedAt).getTime()
  const expirationTime = claimTime + CLAIM_DURATION_MS

  return Date.now() < expirationTime
}

/**
 * Get the expiration time for a claim
 */
export function getClaimExpiration(claimedAt: string): Date {
  const claimTime = new Date(claimedAt).getTime()
  return new Date(claimTime + CLAIM_DURATION_MS)
}

/**
 * Get the remaining time on a claim in milliseconds
 */
export function getClaimRemainingTime(claimedAt: string): number {
  const expiration = getClaimExpiration(claimedAt).getTime()
  return Math.max(0, expiration - Date.now())
}
