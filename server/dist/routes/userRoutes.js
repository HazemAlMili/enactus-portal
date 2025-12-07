"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userController_1 = require("../controllers/userController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
router.get('/leaderboard', authMiddleware_1.protect, userController_1.getLeaderboard);
router.route('/')
    .get(authMiddleware_1.protect, (0, authMiddleware_1.authorize)('HR', 'General President'), userController_1.getUsers)
    .post(authMiddleware_1.protect, (0, authMiddleware_1.authorize)('HR', 'General President'), userController_1.createUser);
router.route('/:id')
    .delete(authMiddleware_1.protect, (0, authMiddleware_1.authorize)('HR', 'General President'), userController_1.deleteUser);
exports.default = router;
