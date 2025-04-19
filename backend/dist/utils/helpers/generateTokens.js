"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearAuthCookies = exports.verifyRefreshToken = exports.verifyAccessToken = exports.generateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const generateToken = (res, payload) => {
    const { userId, roleId, userType } = payload;
    const jwtSecret = process.env.JWT_SECRET;
    const refreshSecret = process.env.REFRESH_TOKEN_SECRET;
    if (!jwtSecret || !refreshSecret) {
        throw new Error("JWT secrets are not configured");
    }
    try {
        // Access Token (short-lived - 15 minutes)
        const accessToken = jsonwebtoken_1.default.sign({ userId, roleId, userType }, jwtSecret, { expiresIn: "15m" });
        // Refresh Token (long-lived - 7 days)
        const refreshToken = jsonwebtoken_1.default.sign({ userId }, refreshSecret, { expiresIn: "7d" });
        // Set cookies with secure flags
        const isProduction = process.env.NODE_ENV === "production";
        const cookieOptions = {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? "strict" : "lax",
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
    }
    catch (error) {
        console.error("Token generation error:", error);
        throw new Error("Failed to generate authentication tokens");
    }
};
exports.generateToken = generateToken;
const verifyAccessToken = (token) => {
    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET not configured");
    }
    return jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
};
exports.verifyAccessToken = verifyAccessToken;
const verifyRefreshToken = (token) => {
    if (!process.env.REFRESH_TOKEN_SECRET) {
        throw new Error("REFRESH_TOKEN_SECRET not configured");
    }
    return jsonwebtoken_1.default.verify(token, process.env.REFRESH_TOKEN_SECRET);
};
exports.verifyRefreshToken = verifyRefreshToken;
const clearAuthCookies = (res) => {
    res.clearCookie("access_token");
    res.clearCookie("refresh_token");
};
exports.clearAuthCookies = clearAuthCookies;
