export interface accessTokenPayload {
    sub: string
    email: string
}

export interface refreshTokenPayload {
    sub: string
    email: string
    sid: string
}