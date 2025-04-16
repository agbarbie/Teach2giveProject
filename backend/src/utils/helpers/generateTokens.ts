import { Response } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

interface TokenPayload {
  userId: number;
  roleId?: number;
  userType?: 'job_seeker' | 'employer';
}

export const generateToken = (res: Response, payload: TokenPayload) => {
  const { userId, roleId, userType } = payload;
  const jwtSecret = process.env.JWT_SECRET;
  const refreshSecret = process.env.REFRESH_TOKEN_SECRET;

  if (!jwtSecret || !refreshSecret) {
    throw new Error("JWT secrets are not configured");
  }

  try {
    // Access Token (short-lived - 15 minutes)
    const accessToken = jwt.sign(
      { userId, roleId, userType },
      jwtSecret,
      { expiresIn: "15m" }
    );

    // Refresh Token (long-lived - 7 days)
    const refreshToken = jwt.sign(
      { userId },
      refreshSecret,
      { expiresIn: "7d" }
    );

    // Set cookies with secure flags
    const isProduction = process.env.NODE_ENV === "production";
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "strict" : "lax" as "strict" | "lax" | "none",
    };

    res.cookie("access_token", accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie("refresh_token", refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return { accessToken, refreshToken };

  } catch (error) {
    console.error("Token generation error:", error);
    throw new Error("Failed to generate authentication tokens");
  }
};

export const verifyAccessToken = (token: string) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET not configured");
  }
  return jwt.verify(token, process.env.JWT_SECRET) as TokenPayload;
};

export const verifyRefreshToken = (token: string) => {
  if (!process.env.REFRESH_TOKEN_SECRET) {
    throw new Error("REFRESH_TOKEN_SECRET not configured");
  }
  return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET) as { userId: number };
};

export const clearAuthCookies = (res: Response) => {
  res.clearCookie("access_token");
  res.clearCookie("refresh_token");
};