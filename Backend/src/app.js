import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";

import mongoose from "mongoose";
import cors from "cors";
import { connectToSocket } from "./controllers/socketManager.js";
import userRoutes from "./routes/users.routes.js";

const app = express();

const server = createServer(app);

connectToSocket(server);

app.set("port", process.env.PORT || 8000);

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.use("/api/v1/users", userRoutes);
// app.use("/api/v2/users", newUserRoutes);

app.get("/", (req, res) => {
    res.send("Hello World!");
});

const start = async () => {
    try {
        const connectionDb = await mongoose.connect(
        "mongodb+srv://241210015_db_user:aniketrajd8340@cluster0.nkylvwo.mongodb.net/test?retryWrites=true&w=majority"
        );

        console.log(
            `Mongo connected to Host: ${connectionDb.connection.host}`
        );

        server.listen(app.get("port"), () => {
            console.log(`Server is running on port ${app.get("port")}`);
        });
    } catch (err) {
        console.error(err);
    }
};

start();