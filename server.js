// import express from "express";
// import dotenv from "dotenv";
// import cors from "cors";
// import rateLimit from "express-rate-limit";
// import helmet from "helmet";
// import compression from "compression";
// import connectdb from "./config/mongodb.js";
// import { trackAPIStats } from "./middleware/statsMiddleware.js";
// // import propertyrouter from "./routes/ProductRouter.js";
// import userrouter from "./routes/UserRoute.js";
// import formrouter from "./routes/formrouter.js";
// import newsrouter from "./routes/newsRoute.js";
// import appointmentRouter from "./routes/appointmentRoute.js";
// import adminRouter from "./routes/adminRoute.js";
// import fetch from "node-fetch";
// import "./models/statsModel.js";
// import Property from "./models/Property.js";
// const router = express.Router();

// dotenv.config();

// const app = express();

// // Configuration
// const REAL_ESTATE_API_BASE = "https://query.ampre.ca/odata";

// const GOOGLE_GEOCODE_API = "https://maps.googleapis.com/maps/api/geocode/json";
// const GOOGLE_API_KEY = "AIzaSyDlKnAJi9hC3r16lY5FXqm7_zHOQ760yHk"; // Change this to environment variable

// // Security middlewares
// app.use(helmet());
// app.use(compression());

// // Middleware
// app.use(express.json({ limit: "50mb" }));
// app.use(express.urlencoded({ extended: true, limit: "50mb" }));
// app.use(trackAPIStats);

// // CORS Configuration
// app.use(
//   cors({
//     origin: [
//       "http://localhost:4000",
//       "https://real-estate-website-backend-fullcode.onrender.com",
//       "https://real-estate-website-sepia-two.vercel.app",
//       "https://real-estate-backend-gamma-nine.vercel.app",
//       "https://real-estate-website-admin.onrender.com",
//       "http://localhost:5174",
//       "http://localhost:5173",
//     ],
//     credentials: true,
//     methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"],
//     allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
//   })
// );

// // Database connection
// connectdb()
//   .then(() => {
//     console.log("Database connected successfully");
//   })
//   .catch((err) => {
//     console.error("Database connection error:", err);
//   });

// // API Routes
// // app.use("/api/products", propertyrouter);
// app.use("/api/users", userrouter);
// app.use("/api/forms", formrouter);
// app.use("/api/news", newsrouter);
// app.use("/api/appointments", appointmentRouter);
// app.use("/api/admin", adminRouter);

// // 🏡 Proxy for Real Estate API
// app.get("/api/proxy/*", async (req, res) => {
//   const path = req.path.replace("/api/proxy", "");
//   const apiUrl = `${REAL_ESTATE_API_BASE}${path}${req._parsedUrl.search || ""}`;

//   try {
//     const response = await fetch(apiUrl, {
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ2ZW5kb3IvdHJyZWIvODE0OSIsImF1ZCI6IkFtcFVzZXJzUHJkIiwicm9sZXMiOlsiQW1wVmVuZG9yIl0sImlzcyI6InByb2QuYW1wcmUuY2EiLCJleHAiOjI1MzQwMjMwMDc5OSwiaWF0IjoxNzQyNDg3MjI0LCJzdWJqZWN0VHlwZSI6InZlbmRvciIsInN1YmplY3RLZXkiOiI4MTQ5IiwianRpIjoiN2JmNTIzYzY5ZmEzYjliZiIsImN1c3RvbWVyTmFtZSI6InRycmViIn0.pdTKWIHU6PtOu6Qq1NHKJvgSU-yUEVrbqXSNmFG68RE`,
//       },
//     });

//     if (!response.ok) throw new Error(`HTTP Error! Status: ${response.status}`);

//     const data = await response.json();
//     res.json(data);
//   } catch (error) {
//     console.error("Real Estate API Fetch Error:", error);
//     res.status(500).json({ error: "Failed to fetch real estate data" });
//   }
// });

// app.get("/api/proxy2/*", async (req, res) => {
//   const path = req.path.replace("/api/proxy2", "");
//   const apiUrl = `${REAL_ESTATE_API_BASE}${path}${req._parsedUrl.search || ""}`;

//   try {
//     const response = await fetch(apiUrl, {
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ2ZW5kb3IvdHJyZWIvODE0OSIsImF1ZCI6IkFtcFVzZXJzUHJkIiwicm9sZXMiOlsiQW1wVmVuZG9yIl0sImlzcyI6InByb2QuYW1wcmUuY2EiLCJleHAiOjI1MzQwMjMwMDc5OSwiaWF0IjoxNzQyNDg3MTgyLCJzdWJqZWN0VHlwZSI6InZlbmRvciIsInN1YmplY3RLZXkiOiI4MTQ5IiwianRpIjoiNzgyMzAwNGVhODNmNWNlNiIsImN1c3RvbWVyTmFtZSI6InRycmViIn0.k5g8Aat2_MSDx7d27GrR3iT0ZV9dQPNebMEFfj9uJwk`,
//       },
//     });

//     if (!response.ok) throw new Error(`HTTP Error! Status: ${response.status}`);

//     const data = await response.json();
//     res.json(data);
//   } catch (error) {
//     console.error("Real Estate API Fetch Error:", error);
//     res.status(500).json({ error: "Failed to fetch real estate data" });
//   }
// });

// // 📌 Fetch properties and store geocoded data

// // Global error handler
// app.use((err, req, res, next) => {
//   console.error("Error:", err);
//   res.status(err.status || 500).json({
//     success: false,
//     message: err.message || "Internal server error",
//     ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
//   });
// });

// // Handle 404
// app.use("*", (req, res) => {
//   res.status(404).json({
//     success: false,
//     message: "Resource not found",
//   });
// });

// // Handle unhandled rejections
// process.on("unhandledRejection", (err) => {
//   console.log("UNHANDLED REJECTION! 💥 Shutting down...");
//   console.error(err);
//   process.exit(1);
// });

// // Root route
// app.get("/", (req, res) => {
//   res.send(`
//     <html>
//       <head>
//         <title>API Status</title>
//       </head>
//       <body>
//         <h1>API is working</h1>
//         <p>Welcome to the Real Estate website. Everything is running smoothly.</p>
//       </body>
//     </html>
//   `);
// });

// const port = process.env.PORT || 5000;

// // Start server
// if (process.env.NODE_ENV !== "test") {
//   app.listen(port, "0.0.0.0", () => {
//     console.log(`Server running on port ${port}`);
//   });
// }

// export default app;
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import axios from "axios";
import connectdb from "./config/mongodb.js";
import cors from "cors";
import fs from "fs";
import userrouter from "./routes/UserRoute.js";
import formrouter from "./routes/formrouter.js";
import newsrouter from "./routes/newsRoute.js";
import appointmentRouter from "./routes/appointmentRoute.js";
import adminRouter from "./routes/adminRoute.js";
import propertyrouter from "./routes/ProductRouter.js";
// import blogRouter from "./routes/blogRoute.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

const API_URL = "https://backend-theta-rust-73.vercel.app/api/proxy/Property";
const GEOCODE_API =
  "https://maps.googleapis.com/maps/api/geocode/json?address=";
const GOOGLE_MAPS_API_KEY = "AIzaSyDlKnAJi9hC3r16lY5FXqm7_zHOQ760yHk";
const BATCH_SIZE = 10;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(
  cors({
    origin: [
      "https://searchomes-admin.vercel.app",
      "http://localhost:5173",
      "http://localhost:5174",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
    credentials: true,
  })
);

// API routes (admin, products, appointments, blogs, etc.)
app.use("/api/users", userrouter);
app.use("/api/forms", formrouter);
app.use("/api/news", newsrouter);
app.use("/api/appointments", appointmentRouter);
app.use("/api/admin", adminRouter);
app.use("/api/products", propertyrouter);
// app.use("/api/blogs", blogRouter);

// ✅ MongoDB Schemas
const propertySchema = new mongoose.Schema({
  UnparsedAddress: { type: String, unique: true },
  ListPrice: Number,
  lat: Number,
  lng: Number,
  ParkingSpaces: Number,
  BedroomsTotal: Number,
  BathroomsTotalInteger: Number,
  PropertySubType: String,
});

const failedSchema = new mongoose.Schema({
  UnparsedAddress: { type: String, unique: true },
  reason: String,
});

const Property = mongoose.model("Property", propertySchema);
const Failed = mongoose.model("Failed", failedSchema);

// 🌍 Geocode helper
const geocodeAddress = async (address) => {
  try {
    const res = await axios.get(
      `${GEOCODE_API}${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`
    );
    if (res.data.results.length > 0) {
      return res.data.results[0].geometry.location;
    }
    return null;
  } catch (err) {
    console.error("Geocode error for:", address, err.message);
    return null;
  }
};

// ⏳ Delay helper
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

// 🚀 Main fetch + save
const fetchAndSaveProperties = async () => {
  try {
    let skip = 0;
    const progressFile = "progress.txt";
    if (fs.existsSync(progressFile)) {
      skip = parseInt(fs.readFileSync(progressFile, "utf8")) || 0;
    }

    let savedCount = 0;
    let totalFetched = 0;
    let failedCount = 0;

    while (true) {
      console.log(`📦 Fetching batch from skip: ${skip}`);
      const response = await axios.get(
        `${API_URL}?$top=${BATCH_SIZE}&$skip=${skip}`
      );
      const data = response.data.value;

      if (!data || data.length === 0) {
        console.log("✅ No more data to fetch.");
        break;
      }

      totalFetched += data.length;

      for (const item of data) {
        const exists = await Property.findOne({
          UnparsedAddress: item.UnparsedAddress,
        });
        if (exists) continue;

        const geo = await geocodeAddress(item.UnparsedAddress);
        await delay(100);

        if (geo) {
          const property = new Property({
            UnparsedAddress: item.UnparsedAddress,
            ListPrice: item.ListPrice || 0,
            ParkingSpaces: item.ParkingSpaces || 0,
            BedroomsTotal: item.BedroomsTotal || item.Bedrooms || 0,
            BathroomsTotalInteger:
              item.BathroomsTotalInteger || item.Bathrooms || 0,
            PropertySubType: item.PropertySubType || "",
            lat: geo.lat,
            lng: geo.lng,
          });
          await property.save();
          savedCount++;
        } else {
          if (item.UnparsedAddress) {
            const failedExists = await Failed.findOne({
              UnparsedAddress: item.UnparsedAddress,
            });
            if (!failedExists) {
              await Failed.create({
                UnparsedAddress: item.UnparsedAddress,
                reason: "Geocoding failed",
              });
              failedCount++;
            }
          }
        }
      }

      skip += BATCH_SIZE;
      fs.writeFileSync(progressFile, String(skip));
      console.log(
        `✅ Batch saved. Total saved: ${savedCount}, Failed: ${failedCount}`
      );
    }

    console.log("🔥 All batches done:", {
      totalFetched,
      totalSaved: savedCount,
      totalFailed: failedCount,
    });
  } catch (err) {
    console.error("❌ Error during fetch-and-save:", err.message);
  }
};

// ✅ Manual fetch trigger
app.get("/fetch-and-save", async (req, res) => {
  await fetchAndSaveProperties();
  res.json({ message: "Fetch and save triggered." });
});

// ✅ Manual POST save
app.post("/save-properties", async (req, res) => {
  try {
    const properties = req.body;
    if (!Array.isArray(properties)) {
      return res.status(400).json({ message: "Invalid payload" });
    }

    const normalizeAddress = (address) => address.trim().toLowerCase();
    const results = [];

    for (const item of properties) {
      const normalizedAddress = normalizeAddress(item.UnparsedAddress);

      const exists = await Property.findOne({
        UnparsedAddress: { $regex: new RegExp(`^${normalizedAddress}$`, "i") },
      });
      if (exists) continue;

      const newProperty = new Property({
        UnparsedAddress: normalizedAddress,
        Bedrooms: item.Bedrooms,
        Bathrooms: item.Bathrooms,
        ListPrice: item.ListPrice,
        lat: item.lat,
        lng: item.lng,
        ParkingSpaces: item.ParkingSpaces || 0,
        BedroomsTotal: item.BedroomsTotal || 0,
        BathroomsTotalInteger: item.BathroomsTotalInteger || 0,
        PropertySubType: item.PropertySubType || "",
      });

      await newProperty.save();
      results.push(newProperty);
    }

    res.status(200).json({
      message: "Saved successfully",
      insertedCount: results.length,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error saving properties", error: error.message });
  }
});

// ✅ Get all properties
app.get("/properties", async (req, res) => {
  try {
    const { north, south, east, west, limit } = req.query;
    const query = {};

    if (north && south && east && west) {
      query.lat = { $gte: parseFloat(south), $lte: parseFloat(north) };
      query.lng = { $gte: parseFloat(west), $lte: parseFloat(east) };
    }

    const maxLimit = Math.min(parseInt(limit) || 1000, 10000);
    const props = await Property.find(query).limit(maxLimit);
    res.json(props);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch properties" });
  }
});

// ✅ Search properties
app.get("/search-properties", async (req, res) => {
  try {
    const query = req.query.query;
    if (!query) {
      return res.status(400).json({ error: "Search query is required" });
    }

    const results = await Property.find({
      $or: [
        { UnparsedAddress: { $regex: query, $options: "i" } },
        { PropertySubType: { $regex: query, $options: "i" } },
        { ListPrice: isNaN(query) ? 0 : parseFloat(query) },
      ],
    }).limit(10);

    res.json(results);
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ error: "Server error during search" });
  }
});

// ✅ Filter properties by map bounds
app.get("/properties-within-bounds", async (req, res) => {
  const {
    nelat,
    nelng,
    swlat,
    swlng,
    propertyType,
    bedrooms,
    bathrooms,
    parking,
  } = req.query;

  try {
    const query = {
      lat: { $gte: parseFloat(swlat), $lte: parseFloat(nelat) },
      lng: { $gte: parseFloat(swlng), $lte: parseFloat(nelng) },
    };

    if (propertyType) query.PropertySubType = propertyType;
    if (bedrooms) query.BedroomsTotal = { $gte: parseInt(bedrooms) };
    if (bathrooms) query.BathroomsTotalInteger = { $gte: parseInt(bathrooms) };
    if (parking) query.ParkingSpaces = { $gte: parseInt(parking) };

    const properties = await Property.find(query);
    res.json(properties);
  } catch (error) {
    console.error("Error fetching properties:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ✅ Failed geocode records
app.get("/failed-properties", async (req, res) => {
  try {
    const failed = await Failed.find();
    res.json(failed);
  } catch (err) {
    res.status(500).json({ error: "Error fetching failed addresses" });
  }
});

// ✅ Start server
connectdb().then(() => {
  console.log("✅ MongoDB connected");
  fetchAndSaveProperties(); // Auto-run on server star 
  app.listen(PORT, () => {
    console.log(`🚀 Server is running at http://localhost:${PORT}`);
  });
});
