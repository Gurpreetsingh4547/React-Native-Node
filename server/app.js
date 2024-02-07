import express from "express";
import cookieParser from "cookie-parser";

// Routers
import Routers from "./Routers/User.js";

export const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api/v1", Routers);