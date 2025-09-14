import jwt from 'jsonwebtoken'
import env from '#start/env'

export interface JwtPayload {
  userId: string
  email: string
  role: string
}

export interface JwtToken {
  type: string
  token: string
  expiresAt: Date
}

export default class JwtService {
  private static secret: string = (() => {
    const value = env.get('JWT_SECRET')
    if (!value) {
      throw new Error('JWT_SECRET is not set in environment variables')
    }
    return value
  })()
  // Default expiration time for JWT tokens
  private static expiresIn = env.get('JWT_EXPIRES_IN', '7d')

  /**
   * Generate JWT token for authenticated user
   */
  static generateToken(payload: JwtPayload): JwtToken {
    const token = jwt.sign(payload, this.secret, {
      expiresIn: '7d',
      issuer: 'learning-management-backend',
      audience: 'learning-management-frontend',
    })

    // Calculate expiration date
    const expiresAt = new Date()
    const expiresDays = Number.parseInt(this.expiresIn.replace('d', ''))
    expiresAt.setDate(expiresAt.getDate() + expiresDays)

    return {
      type: 'Bearer',
      token,
      expiresAt,
    }
  }

  /**
   * Verify and decode JWT token
   */
  static verifyToken(token: string): JwtPayload {
    try {
      const decoded = jwt.verify(token, this.secret, {
        issuer: 'learning-management-backend',
        audience: 'learning-management-frontend',
      }) as jwt.JwtPayload

      return {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      }
    } catch (error) {
      throw new Error('Invalid or expired token')
    }
  }

  /**
   * Extract token from Authorization header
   */
  static extractTokenFromHeader(authorization: string | undefined): string | null {
    if (!authorization) {
      return null
    }

    const [type, token] = authorization.split(' ')

    if (type !== 'Bearer' || !token) {
      return null
    }

    return token
  }

  /**
   * Check if token is expired
   */
  static isTokenExpired(token: string): boolean {
    try {
      const decoded = jwt.decode(token) as jwt.JwtPayload
      if (!decoded || !decoded.exp) {
        return true
      }

      const currentTime = Math.floor(Date.now() / 1000)
      return decoded.exp < currentTime
    } catch (error) {
      return true
    }
  }
}
