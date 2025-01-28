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
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const body_parser_1 = __importDefault(require("body-parser"));
const app = (0, express_1.default)();
const prisma = new client_1.PrismaClient();
app.use(body_parser_1.default.json());
// Create a new student
app.post("/students", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { rollNo, studentName, batch, course } = req.body;
    try {
        const student = yield prisma.student.create({
            data: { rollNo, studentName, batch, course },
        });
        res.status(201).json({
            student,
            message: "data added success",
            success: true,
        });
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
}));
// Create a new attendance day
app.post("/days", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { date } = req.body;
    try {
        const day = yield prisma.day.create({
            data: { date: new Date(date) },
        });
        res.status(201).json(day);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
}));
// Mark attendance
app.post("/attendance", 
//@ts-ignore
(req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { rollNo, date, status } = req.body;
    try {
        // Check if the student and day exist
        const student = yield prisma.student.findUnique({ where: { rollNo } });
        const day = yield prisma.day.findUnique({
            where: { date: new Date(date) },
        });
        if (!student || !day) {
            return res.status(404).json({ error: "Student or Day not found" });
        }
        // Create or update attendance
        const attendance = yield prisma.attendance.upsert({
            where: {
                studentId_dayId: {
                    studentId: rollNo,
                    dayId: day.id,
                },
            },
            create: {
                studentId: rollNo,
                dayId: day.id,
                status,
            },
            update: {
                status,
            },
        });
        res.status(201).json(attendance);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
}));
// Get attendance for a specific day
app.get("/attendance/:date", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { date } = req.params;
    try {
        const attendance = yield prisma.attendance.findMany({
            where: { day: { date: new Date(date) } },
            include: { student: true },
        });
        res.status(200).json(attendance);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
}));
// Get attendance for a specific student
app.get("/students/:rollNo/attendance", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const rollNo = parseInt(req.params.rollNo);
    try {
        const attendance = yield prisma.attendance.findMany({
            where: { studentId: rollNo },
            include: { day: true },
        });
        res.status(200).json(attendance);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
}));
// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
