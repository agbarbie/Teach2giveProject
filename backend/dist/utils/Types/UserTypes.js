"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isUser = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole[UserRole["ADMIN"] = 1] = "ADMIN";
    UserRole[UserRole["EMPLOYER"] = 2] = "EMPLOYER";
    UserRole[UserRole["JOB_SEEKER"] = 3] = "JOB_SEEKER";
})(UserRole || (exports.UserRole = UserRole = {}));
const isUser = (obj) => {
    return obj && typeof obj.user_id === 'number' && typeof obj.email === 'string';
};
exports.isUser = isUser;
