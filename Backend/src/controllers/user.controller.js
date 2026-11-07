import httpStatus from "http-status";
import { User } from "../models/user.model.js";
import bcrypt from "bcrypt";
import { randomBytes } from "node:crypto";

const login = async (req, res) => {
    const { username, password } = req.body ?? {};

    if (typeof username !== "string" || !username.trim() ||
        typeof password !== "string" || !password) {
        return res.status(httpStatus.BAD_REQUEST).json({ message: "Please provide a username and password." });
    }

    try {
        const normalizedUsername = username.trim();
        const user = await User.findOne({ username: normalizedUsername });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid username or password." });
        }

        const token = randomBytes(20).toString("hex");
        user.token = token;
        await user.save();
        return res.status(httpStatus.OK).json({
            token,
            name: user.name,
            message: "Signed in successfully.",
        });
    } catch (error) {
        console.error("Login failed:", error);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: "Something went wrong." });
    }
}

const register = async (req, res) => {
    const { name, username, password } = req.body ?? {};
    if (typeof name !== "string" || !name.trim() ||
        typeof username !== "string" || !username.trim() ||
        typeof password !== "string" || !password) {
        return res.status(httpStatus.BAD_REQUEST).json({ message: "Please provide your name, username, and password." });
    }

    try {
        const normalizedUsername = username.trim();
        const existingUser = await User.findOne({ username: normalizedUsername });
        if (existingUser) {
            return res.status(httpStatus.CONFLICT).json({ message: "User already exists." });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            name: name.trim(),
            username: normalizedUsername,
            password: hashedPassword
        });
        await newUser.save();
        return res.status(httpStatus.CREATED).json({ message: "User registered successfully." });
    }
    catch (error) {
        if (error?.code === 11000) {
            return res.status(httpStatus.CONFLICT).json({ message: "User already exists." });
        }
        console.error("Registration failed:", error);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: "Something went wrong." });
    }
}

export {login, register}