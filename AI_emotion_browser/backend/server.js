import express from "express";
import cors from "cors";

import photoRoutes from "./routes/photoRoutes.js";
import laughEventRoutes from "./routes/laughEventRoutes.js";
import sessionFinishRoutes from "./routes/sessionFinishRoutes.js";
import youtubeRoutes from "./routes/youtubeRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";


const app = express();

// middleware
app.use(cors());
app.use(express.json({ limit: "30mb" }));
app.use(express.urlencoded({ extended: true }));

// static folder
app.use("/uploads", express.static("uploads"));

// routes
app.use("/photos", photoRoutes);
app.use("/laugh-event", laughEventRoutes);   
app.use("/finish", sessionFinishRoutes);
app.use("/youtube", youtubeRoutes);
app.use("/report", reportRoutes);

// server start
app.listen(5001, () => {
  console.log("🚀 Node backend running at http://localhost:5001");
});
