import express from "express";
import { signUp, signIn, updateProfile } from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";
import { 
  initiatePhoneBooking,
  handleSpecializationChoice,
  handleDoctorChoice,
  handleDateChoice,
  handleSlotChoice,
  confirmAppointment 
} from "../controllers/appointmentController.js";

const router = express.Router();

router.post("/signup", signUp);
router.post("/signin", signIn);
router.put("/update", protect, updateProfile);

// Appointment routes
router.post("/initiate-phone-booking", protect, initiatePhoneBooking);
router.post("/handle-specialization-choice", protect, handleSpecializationChoice);
router.post("/handle-doctor-choice", protect, handleDoctorChoice);
router.post("/handle-date-choice", protect, handleDateChoice);
router.post("/handle-slot-choice", protect, handleSlotChoice);
router.post("/confirm-appointment", protect, confirmAppointment);

export default router;

