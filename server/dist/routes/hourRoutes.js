"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const hourController_1 = require("../controllers/hourController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
router.route('/')
    .post(authMiddleware_1.protect, hourController_1.submitHours)
    .get(authMiddleware_1.protect, hourController_1.getHours);
router.route('/:id')
    .put(authMiddleware_1.protect, (0, authMiddleware_1.authorize)('HR', 'General President', 'Head', 'Vice Head'), hourController_1.updateHourStatus);
exports.default = router;
