import httpStatus from "http-status";
import { User } from "../models/user.model.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
const login = async (req, res) => {

    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(httpStatus.BAD_REQUEST).json({ message: "Please provide a username and password." });
    }

    try {
        const user = await User.findOne({ username });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid username or password." });
        }

        const token = crypto.randomBytes(20).toString("hex");
        user.token = token;
        await user.save();
        return res.status(httpStatus.OK).json({ token, message: "Signed in successfully." });
    } catch (error) {
        console.error("Login failed:", error);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: "Something went wrong." });
    }
}

const register = async (req, res) => {
    const { name, username, password } = req.body;
    if (!name?.trim() || !username?.trim() || !password) {
        return res.status(httpStatus.BAD_REQUEST).json({ message: "Please provide your name, username, and password." });
    }

    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(httpStatus.CONFLICT).json({ message: "User already exists." });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            name: name.trim(),
            username: username.trim(),
            password: hashedPassword
        });
        await newUser.save();
        return res.status(httpStatus.CREATED).json({ message: "User registered successfully." });
    }
    catch (error) {
        console.error("Registration failed:", error);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: "Something went wrong." });
    }
}

export {login, register}