"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const taskController_1 = require("../controllers/taskController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
router.route('/')
    .post(authMiddleware_1.protect, (0, authMiddleware_1.authorize)('HR', 'General President', 'Head', 'Vice Head'), taskController_1.createTask)
    .get(authMiddleware_1.protect, taskController_1.getTasks);
router.route('/:id')
    .put(authMiddleware_1.protect, taskController_1.updateTask);
exports.default = router;
