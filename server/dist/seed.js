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
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const User_1 = __importDefault(require("./models/User"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
dotenv_1.default.config();
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/enactus_portal';
const seedUsers = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield mongoose_1.default.connect(MONGO_URI);
        console.log('MongoDB Connected');
        yield User_1.default.deleteMany({});
        const salt = yield bcryptjs_1.default.genSalt(10);
        const hashedPassword = yield bcryptjs_1.default.hash('123456', salt);
        const users = [
            {
                name: 'General President',
                email: 'gp@enactus.com',
                password: hashedPassword,
                role: 'General President',
                department: 'PR', // Can be anything or null, keeping PR for now
            },
            {
                name: 'HR Head',
                email: 'hr@enactus.com',
                password: hashedPassword,
                role: 'HR',
                department: 'HR',
            },
            {
                name: 'IT Head',
                email: 'it@enactus.com',
                password: hashedPassword,
                role: 'Head',
                department: 'IT',
            },
            {
                name: 'IT Member',
                email: 'member@enactus.com',
                password: hashedPassword,
                role: 'Member',
                department: 'IT',
            }
        ];
        yield User_1.default.insertMany(users);
        console.log('Users Seeded');
        process.exit();
    }
    catch (error) {
        console.error(error);
        process.exit(1);
    }
});
seedUsers();
