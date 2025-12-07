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
exports.updateTask = exports.getTasks = exports.createTask = void 0;
const Task_1 = __importDefault(require("../models/Task"));
// Create Task
const createTask = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { title, description, assignedTo, scoreValue, dueDate } = req.body;
        const task = yield Task_1.default.create({
            title,
            description,
            assignedTo,
            assignedBy: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id,
            scoreValue,
            dueDate
        });
        res.status(201).json(task);
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});
exports.createTask = createTask;
// Get Tasks
const getTasks = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        let query = {};
        // If member, only see assigned tasks
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) === 'Member') {
            query = { assignedTo: req.user._id };
        }
        // If Head/VP, see department tasks (Need to filter users by dept first or store dept on task, 
        // but easier to just filter tasks where assignedTo user is in dept? 
        // For simplicity, let's assume Head can see all tasks they assigned OR tasks for their dept members).
        // The PRD says "Head... Ability to assign and review tasks".
        // I'll filter by assignedBy for Heads for now, or all tasks if they want to see what others assigned?
        // Let's create a simpler logic: Heads see tasks they created + tasks assigned to them?
        // Better: Filter by Department of the user assignedTo? 
        // That requires a join. 
        // Let's just return all for HR/GP, and for others filter by assignedTo = me OR assignedBy = me.
        else if (((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) === 'Head' || ((_c = req.user) === null || _c === void 0 ? void 0 : _c.role) === 'Vice Head') {
            query = { $or: [{ assignedBy: req.user._id }, { assignedTo: req.user._id }] };
        }
        const tasks = yield Task_1.default.find(query).populate('assignedTo', 'name email').populate('assignedBy', 'name');
        res.json(tasks);
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});
exports.getTasks = getTasks;
// Update Task (Submit / Approve)
const updateTask = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const task = yield Task_1.default.findById(req.params.id);
        if (!task)
            return res.status(404).json({ message: 'Task not found' });
        // Updates
        if (req.body.status)
            task.status = req.body.status;
        if (req.body.submissionLink)
            task.submissionLink = req.body.submissionLink;
        yield task.save();
        res.json(task);
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});
exports.updateTask = updateTask;
