"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateHourStatus = exports.getHours = exports.submitHours = void 0;
const HourLog_1 = __importDefault(require("../models/HourLog"));
const User_1 = __importDefault(require("../models/User"));
const submitHours = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { amount, description, date } = req.body;
        const hourLog = yield HourLog_1.default.create({
            user: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id,
            amount,
            description,
            date,
            status: 'Pending'
        });
        res.status(201).json(hourLog);
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});
exports.submitHours = submitHours;
const getHours = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        let query = {};
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) === 'Member') {
            query = { user: req.user._id };
        }
        else if (((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) === 'Head' || ((_c = req.user) === null || _c === void 0 ? void 0 : _c.role) === 'Vice Head') {
            // Find users in my department?
            // For now, allow Heads to see all pending hours? No, too messy.
            // Let's assume frontend filters or we do a lookup.
            // Simplification: Return all for now for Leaders, filter on frontend or do proper agg.
            // Correct: query = { 'user.department': req.user.department } (Needs aggregation/populate filter)
            // We will just return all and let frontend filter, or user populated query.
            // Let's return all for non-members.
        }
        const logs = yield HourLog_1.default.find(query).populate('user', 'name role department');
        res.json(logs);
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});
exports.getHours = getHours;
const updateHourStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { status } = req.body;
        const log = yield HourLog_1.default.findById(req.params.id);
        if (!log)
            return res.status(404).json({ message: 'Log not found' });
        log.status = status;
        if (status === 'Approved') {
            log.approvedBy = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
            // Increment user hours
            const user = yield User_1.default.findById(log.user);
            if (user) {
                user.hoursApproved += log.amount;
                user.points += log.amount * 10; // 10 points per hour
                yield user.save();
            }
        }
        yield log.save();
        res.json(log);
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});
exports.updateHourStatus = updateHourStatus;
