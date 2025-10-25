import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const signUp = async (req, res) => {
  try {
    const { name, email, password, age, height, weight, gender } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      age,
      height,
      weight,
      gender
    });

    res.status(201).json({ message: "Signup successful", user });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Error while signing up", error: error.message });
  }
};

export const signIn = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.json({ message: "Login successful", token, user });
  } catch (error) {
    console.error("Signin error:", error);
    res.status(500).json({ message: "Error while signing in", error: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id; // from middleware
    const updates = req.body;

    const updatedUser = await User.findByIdAndUpdate(userId, updates, { new: true });

    res.json({ message: "Profile updated", updatedUser });
  } catch (error) {
    res.status(500).json({ message: "Error updating profile", error: error.message });
  }
};
