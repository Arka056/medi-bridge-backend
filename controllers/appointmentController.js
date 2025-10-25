import { z } from "zod";
import { appointmentSchema, specializationSchema } from "../utils/userType.js";
import Doctor from "../models/doctorModel.js";
import Appointment from "../models/Appointment.js";
import User from "../models/User.js";

// 🩺 1. Initiate phone booking
export const initiatePhoneBooking = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ message: "User not found" });

    return res.status(200).json({
      message: `Hello ${user.name}, please select your specialization.`,
      next: "/handle-specialization-choice"
    });
  } catch (error) {
    res.status(500).json({ message: "Error initiating booking", error: error.message });
  }
};

// 💡 2. Handle specialization choice
export const handleSpecializationChoice = async (req, res) => {
  try {
    const parsed = specializationSchema.parse(req.body);
    const { specialization } = parsed;

    const doctors = await Doctor.find({ specialization });
    if (!doctors.length)
      return res.status(404).json({ message: "No doctors found for this specialization." });

    return res.status(200).json({
      message: `We found ${doctors.length} doctor(s) for ${specialization}. Please choose a doctor.`,
      doctors,
      next: "/handle-doctor-choice"
    });
  } catch (error) {
    res.status(400).json({ message: "Invalid input", error: error.message });
  }
};

// 👨‍⚕️ 3. Handle doctor choice
export const handleDoctorChoice = async (req, res) => {
  try {
    const { doctorId } = req.body;
    const doctor = await Doctor.findById(doctorId);

    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    return res.status(200).json({
      message: `Doctor ${doctor.name} selected. Please choose a date for your appointment.`,
      next: "/handle-date-choice"
    });
  } catch (error) {
    res.status(500).json({ message: "Error selecting doctor", error: error.message });
  }
};

// 📅 4. Handle date choice
export const handleDateChoice = async (req, res) => {
  try {
    const { doctorId, date } = req.body;
    const doctor = await Doctor.findById(doctorId);

    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    const availableSlots = doctor.availableSlots?.[date] || [];

    if (!availableSlots.length)
      return res.status(404).json({ message: "No slots available for the selected date" });

    return res.status(200).json({
      message: `Available slots for ${date}`,
      slots: availableSlots,
      next: "/handle-slot-choice"
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching available slots", error: error.message });
  }
};

// ⏰ 5. Handle slot choice
export const handleSlotChoice = async (req, res) => {
  try {
    const { doctorId, date, slot } = req.body;

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    const isSlotAvailable = doctor.availableSlots?.[date]?.includes(slot);
    if (!isSlotAvailable)
      return res.status(400).json({ message: "Selected slot not available" });

    return res.status(200).json({
      message: `Slot ${slot} selected for ${date}. Please confirm your appointment.`,
      next: "/confirm-appointment"
    });
  } catch (error) {
    res.status(500).json({ message: "Error choosing slot", error: error.message });
  }
};

// ✅ 6. Confirm appointment
export const confirmAppointment = async (req, res) => {
  try {
    const parsed = appointmentSchema.parse(req.body);
    const { doctorId, date, slot } = parsed;

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    const appointment = await Appointment.create({
      user: req.user.id,
      doctor: doctorId,
      date,
      slot,
      status: "confirmed",
    });

    // remove booked slot from doctor
    doctor.availableSlots[date] = doctor.availableSlots[date].filter(s => s !== slot);
    await doctor.save();

    return res.status(201).json({
      message: "Appointment confirmed successfully!",
      appointment
    });
  } catch (error) {
    res.status(400).json({ message: "Error confirming appointment", error: error.message });
  }
};
