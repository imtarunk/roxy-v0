import express, { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import bodyParser from "body-parser";

const app = express();
const prisma = new PrismaClient();

app.use(bodyParser.json());

// Define types for request bodies
type CreateStudentBody = {
  rollNo: number;
  studentName: string;
  batch: number;
  course: number;
};

type CreateDayBody = {
  date: string;
};

type MarkAttendanceBody = {
  rollNo: number;
  date: string;
  status: boolean;
};

// Create a new student
app.post("/students", async (req, res) => {
  const { rollNo, studentName, batch, course } = req.body;

  try {
    const student = await prisma.student.create({
      data: { rollNo, studentName, batch, course },
    });
    res.status(201).json({
      student,
      message: "data added success",
      success: true,
    });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// Create a new attendance day
app.post(
  "/days",
  async (req: Request<{}, {}, CreateDayBody>, res: Response) => {
    const { date } = req.body;

    try {
      const day = await prisma.day.create({
        data: { date: new Date(date) },
      });
      res.status(201).json(day);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }
);

// Mark attendance
app.post(
  "/attendance",
  //@ts-ignore
  async (req: Request<{}, {}, MarkAttendanceBody>, res: Response) => {
    const { rollNo, date, status } = req.body;

    try {
      // Check if the student and day exist
      const student = await prisma.student.findUnique({ where: { rollNo } });
      const day = await prisma.day.findUnique({
        where: { date: new Date(date) },
      });

      if (!student || !day) {
        return res.status(404).json({ error: "Student or Day not found" });
      }

      // Create or update attendance
      const attendance = await prisma.attendance.upsert({
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
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }
);

// Get attendance for a specific day
app.get(
  "/attendance/:date",
  async (req: Request<{ date: string }>, res: Response) => {
    const { date } = req.params;

    try {
      const attendance = await prisma.attendance.findMany({
        where: { day: { date: new Date(date) } },
        include: { student: true },
      });

      res.status(200).json(attendance);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }
);

// Get attendance for a specific student
app.get(
  "/students/:rollNo/attendance",
  async (req: Request<{ rollNo: string }>, res: Response) => {
    const rollNo = parseInt(req.params.rollNo);

    try {
      const attendance = await prisma.attendance.findMany({
        where: { studentId: rollNo },
        include: { day: true },
      });

      res.status(200).json(attendance);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }
);

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
