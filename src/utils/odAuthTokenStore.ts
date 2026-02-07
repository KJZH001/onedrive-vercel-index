import Redis from 'ioredis'
import siteConfig from '../../config/site.config'

// Persistent key-value store is provided by Redis, hosted on Upstash
// https://vercel.com/integrations/upstash
const kv = new Redis(process.env.REDIS_URL || '')

export async function getOdAuthTokens(): Promise<{
  accessToken: unknown
  refreshToken: unknown
  accessTokenExpiryAt: number | null
}> {
  const accessToken = await kv.get(`${siteConfig.kvPrefix}access_token`)
  const refreshToken = await kv.get(`${siteConfig.kvPrefix}refresh_token`)
  const accessTokenExpiryAtRaw = await kv.get(`${siteConfig.kvPrefix}access_token_expiry`)
  const accessTokenExpiryAt =
    accessTokenExpiryAtRaw != null && accessTokenExpiryAtRaw !== ''
      ? parseInt(accessTokenExpiryAtRaw, 10)
      : null

  return {
    accessToken,
    refreshToken,
    accessTokenExpiryAt: Number.isNaN(accessTokenExpiryAt) ? null : accessTokenExpiryAt,
  }
}

export async function storeOdAuthTokens({
  accessToken,
  accessTokenExpiry,
  refreshToken,
}: {
  accessToken: string
  accessTokenExpiry: number
  refreshToken: string
}): Promise<void> {
  const expiryAt = Math.floor(Date.now() / 1000) + accessTokenExpiry
  await kv.set(`${siteConfig.kvPrefix}access_token`, accessToken, 'EX', accessTokenExpiry)
  await kv.set(`${siteConfig.kvPrefix}access_token_expiry`, String(expiryAt), 'EX', accessTokenExpiry)
  await kv.set(`${siteConfig.kvPrefix}refresh_token`, refreshToken)
}
