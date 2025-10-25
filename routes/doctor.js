import express from "express";
import Doctor from "../models/doctorModel.js";
import Appointment from "../models/Appointment.js";
import jwt from "jsonwebtoken";

const router = express.Router();

// Middleware to verify doctor token
const verifyDoctorToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.doctorId = decoded.id;
    next();
  } catch (err) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

// 🩺 Doctor Signup
router.post("/signup", async (req, res) => {
  try {
    const { name, specialization } = req.body;

    if (!name || !specialization) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const doctor = new Doctor({ name, specialization });
    await doctor.save();

    const token = jwt.sign({ id: doctor._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.status(201).json({
      message: "Doctor registered successfully",
      doctor,
      token,
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// 🩺 Doctor Login (basic by name)
router.post("/login", async (req, res) => {
  try {
    const { name } = req.body;
    const doctor = await Doctor.findOne({ name });

    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    const token = jwt.sign({ id: doctor._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.status(200).json({
      message: "Login successful",
      doctor,
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// 📅 Set Availability
router.post("/set-availability", verifyDoctorToken, async (req, res) => {
  try {
    const { date, slots } = req.body;

    if (!date || !slots || !Array.isArray(slots)) {
      return res.status(400).json({ message: "Date and valid slots array required" });
    }

    const doctor = await Doctor.findById(req.doctorId);
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    doctor.availableSlots.push({ date, slots });
    await doctor.save();

    res.status(200).json({ message: "Availability updated", doctor });
  } catch (error) {
    console.error("Availability error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// 📖 Get Doctor Appointments
router.get("/appointments", verifyDoctorToken, async (req, res) => {
  try {
    const appointments = await Appointment.find({ doctorId: req.doctorId })
      .populate("userId", "name email")
      .sort({ date: 1 });

    res.status(200).json({ appointments });
  } catch (error) {
    console.error("Appointments error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// ✅ Update Appointment Status (accept/cancel)
router.put("/appointments/:id/status", verifyDoctorToken, async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    const appointment = await Appointment.findOneAndUpdate(
      { _id: id, doctorId: req.doctorId },
      { status },
      { new: true }
    );

    if (!appointment)
      return res.status(404).json({ message: "Appointment not found" });

    res.status(200).json({ message: "Status updated", appointment });
  } catch (error) {
    console.error("Update status error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

export default router;

