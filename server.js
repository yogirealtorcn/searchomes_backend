import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import connectdb from "./config/mongodb.js";
import { trackAPIStats } from "./middleware/statsMiddleware.js";
import userrouter from "./routes/UserRoute.js";
import formrouter from "./routes/formrouter.js";
import newsrouter from "./routes/newsRoute.js";
import appointmentRouter from "./routes/appointmentRoute.js";
import adminRouter from "./routes/adminRoute.js";
import propertyrouter from "./routes/ProductRouter.js";
import fetch from "node-fetch";
import "./models/statsModel.js";
import nodemailer from "nodemailer";

dotenv.config();

const app = express();

// Configuration
const REAL_ESTATE_API_BASE = "https://query.ampre.ca/odata";

// Security middlewares
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow images
  contentSecurityPolicy: false, // Disable CSP for now to debug
}));

app.use(compression());

// Middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(trackAPIStats);

// ✅ FIXED CORS CONFIGURATION
const corsOptions = {
  origin: function (origin, callback) {
    console.log(`CORS origin check: ${origin}`);
    
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) {
      console.log('CORS: No origin, allowing');
      return callback(null, true);
    }
    
    // List of allowed origins (no trailing slash - browser sends origin without it)
    const allowedOrigins = [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:4000",
      "https://www.searchomnes.com",
      "https://searchomnes.com",
      "https://searchomes.com",
      "https://searchomes-admin.vercel.app",
    ];
    
    // Check if origin is allowed
    if (allowedOrigins.includes(origin)) {
      console.log(`CORS: Allowed origin: ${origin}`);
      callback(null, true);
    } else {
      if (
        origin.includes("searchomnes.com") ||
        origin.includes("searchomes.com") ||
        origin.includes("searchomes-admin.vercel.app")
      ) {
        console.log(`CORS: Allowed origin: ${origin}`);
        callback(null, true);
      } else {
        console.log(`CORS: Blocked origin: ${origin}`);
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: [
    "Content-Type", 
    "Authorization", 
    "X-Requested-With",
    "Origin",
    "Accept",
    "X-API-Key",
    "X-Api-Key",
    "x-api-key"
  ],
  exposedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Total-Count",
    "Content-Range"
  ],
  optionsSuccessStatus: 204,
  maxAge: 86400 // 24 hours
};

// Apply CORS globally
app.use(cors(corsOptions));

// Handle preflight requests globally
app.options("*", cors(corsOptions));

// Database connection
connectdb()
  .then(() => {
    console.log("Database connected successfully");
  })
  .catch((err) => {
    console.error("Database connection error:", err);
  });

// Configure nodemailer
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || "gmail",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Email sending endpoint
app.post("/api/send-property-email", async (req, res) => {
  try {
    const { to, subject, body } = req.body;

    if (!to || !subject || !body) {
      return res.status(400).json({
        error: "Missing required fields: to, subject, or body",
      });
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      html: body,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "Email sent successfully" });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ error: "Failed to send email" });
  }
});

// API Routes
app.use("/api/users", userrouter);
app.use("/api/forms", formrouter);
app.use("/api/news", newsrouter);
app.use("/api/appointments", appointmentRouter);
app.use("/api/admin", adminRouter);
app.use("/api/products", propertyrouter);

// 📸 Enhanced Image Proxy
app.get("/api/proxy-image", async (req, res) => {
  const imageUrl = req.query.url;
  
  if (!imageUrl) {
    return res.status(400).json({ error: "Missing image URL" });
  }

  console.log(`Proxying image: ${imageUrl.substring(0, 100)}...`);

  try {
    // Set CORS headers
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    
    const headers = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "Accept": "image/webp,image/apng,image/*,*/*;q=0.8",
      "Referer": "https://www.searchomnes.com/"
    };

    if (imageUrl.includes('ampre.ca')) {
      headers["Authorization"] = `Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ2ZW5kb3IvdHJyZWIvODE0OSIsImF1ZCI6IkFtcFVzZXJzUHJkIiwicm9sZXMiOlsiQW1wVmVuZG9yIl0sImlzcyI6InByb2QuYW1wcmUuY2EiLCJleHAiOjI1MzQwMjMwMDc5OSwiaWF0IjoxNzQyNDg3MjI0LCJzdWJqZWN0VHlwZSI6InZlbmRvciIsInN1YmplY3RLZXkiOiI4MTQ5IiwianRpIjoiN2JmNTIzYzY5ZmEzYjliZiIsImN1c3RvbWVyTmFtZSI6InRycmViIn0.pdTKWIHU6PtOu6Qq1NHKJvgSU-yUEVrbqXSNmFG68RE`;
    }

    const response = await fetch(imageUrl, { headers });

    if (!response.ok) {
      console.error(`Image fetch failed: ${response.status}`);
      // Return placeholder
      return res.redirect("https://via.placeholder.com/400x300?text=Image+Not+Available");
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    res.set("Content-Type", contentType);
    res.set("Cache-Control", "public, max-age=86400");
    
    const imageBuffer = await response.buffer();
    res.send(imageBuffer);
  } catch (error) {
    console.error("Image proxy error:", error);
    res.redirect("https://via.placeholder.com/400x300?text=Error+Loading");
  }
});

// 🏡 MAIN PROXY WITH COMPLETE CORS FIX
app.get("/api/proxy/*", async (req, res) => {
  // Set CORS headers manually
  const origin = req.headers.origin;
  if (origin && (origin.includes('searchomnes.com') || origin.includes('localhost') || origin.includes('searchomes.com'))) {
    res.header("Access-Control-Allow-Origin", origin);
  } else {
    res.header("Access-Control-Allow-Origin", "*");
  }
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Origin, Accept");
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const path = req.path.replace("/api/proxy", "");
  const apiUrl = `${REAL_ESTATE_API_BASE}${path}${req._parsedUrl.search || ""}`;

  console.log(`\n=== PROXY REQUEST ===`);
  console.log(`From: ${req.headers.origin || req.headers.referer}`);
  console.log(`To: ${apiUrl}`);
  console.log(`Headers:`, {
    origin: req.headers.origin,
    referer: req.headers.referer,
    authorization: req.headers.authorization ? 'Present' : 'Missing'
  });

  try {
    const token = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ2ZW5kb3IvdHJyZWIvODE0OSIsImF1ZCI6IkFtcFVzZXJzUHJkIiwicm9sZXMiOlsiQW1wVmVuZG9yIl0sImlzcyI6InByb2QuYW1wcmUuY2EiLCJleHAiOjI1MzQwMjMwMDc5OSwiaWF0IjoxNzQyNDg3MjI0LCJzdWJqZWN0VHlwZSI6InZlbmRvciIsInN1YmplY3RLZXkiOiI4MTQ5IiwianRpIjoiN2JmNTIzYzY5ZmEzYjliZiIsImN1c3RvbWVyTmFtZSI6InRycmViIn0.pdTKWIHU6PtOu6Qq1NHKJvgSU-yUEVrbqXSNmFG68RE';
    
    const response = await fetch(apiUrl, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "Referer": "https://www.searchomnes.com/",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json",
        "Accept-Encoding": "gzip, deflate, br"
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error ${response.status}: ${errorText}`);
      return res.status(response.status).json({ 
        error: `API Error: ${response.status}`,
        details: errorText.substring(0, 500)
      });
    }

    const data = await response.json();
    
    // Transform image URLs
    const transformImages = (data) => {
      const backendUrl = "https://real-estate-ca-backend.onrender.com";
      
      if (data.value && Array.isArray(data.value)) {
        data.value = data.value.map(item => {
          if (!item || typeof item !== 'object') return item;
          
          const transformed = { ...item };
          
          // Transform common image fields
          const imageFields = ['Photo', 'Photo1', 'Photo2', 'Photo3', 'Photo4', 'Photo5', 
                              'MediaURL', 'Url', 'ThumbnailURL', 'ImageUrl', 'MainPhoto'];
          
          imageFields.forEach(field => {
            if (transformed[field] && typeof transformed[field] === 'string') {
              const url = transformed[field];
              if (url.startsWith('http') && 
                  (url.match(/\.(jpg|jpeg|png|gif|webp|bmp)(\?.*)?$/i) || 
                   field.toLowerCase().includes('photo') || 
                   field.toLowerCase().includes('image') || 
                   field.toLowerCase().includes('url'))) {
                transformed[field] = `${backendUrl}/api/proxy-image?url=${encodeURIComponent(url)}`;
              }
            }
          });
          
          return transformed;
        });
      }
      
      return data;
    };

    const transformedData = transformImages(data);
    res.json(transformedData);
  } catch (error) {
    console.error("Proxy error:", error);
    res.status(500).json({ 
      error: "Failed to fetch data",
      message: error.message,
      url: apiUrl
    });
  }
});

// Special test endpoint to debug CORS
app.get("/api/cors-test", (req, res) => {
  // Set CORS headers manually
  const origin = req.headers.origin;
  if (origin) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Access-Control-Allow-Credentials", "true");
  }
  
  res.json({
    message: "CORS test successful",
    timestamp: new Date().toISOString(),
    requestHeaders: {
      origin: req.headers.origin,
      referer: req.headers.referer,
      host: req.headers.host,
      'user-agent': req.headers['user-agent']
    },
    yourSite: "https://www.searchomnes.com",
    note: "If you can see this, CORS is working!"
  });
});

// Alternative proxy
app.get("/api/proxy2/*", async (req, res) => {
  // Set CORS headers
  res.header("Access-Control-Allow-Origin", "*");
  
  const path = req.path.replace("/api/proxy2", "");
  const apiUrl = `${REAL_ESTATE_API_BASE}${path}${req._parsedUrl.search || ""}`;

  try {
    const response = await fetch(apiUrl, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ2ZW5kb3IvdHJyZWIvODE0OSIsImF1ZCI6IkFtcFVzZXJzUHJkIiwicm9sZXMiOlsiQW1wVmVuZG9yIl0sImlzcyI6InByb2QuYW1wcmUuY2EiLCJleHAiOjI1MzQwMjMwMDc5OSwiaWF0IjoxNzQyNDg3MTgyLCJzdWJqZWN0VHlwZSI6InZlbmRvciIsInN1YmplY3RLZXkiOiI4MTQ5IiwianRpIjoiNzgyMzAwNGVhODNmNWNlNiIsImN1c3RvbWVyTmFtZSI6InRycmViIn0.k5g8Aat2_MSDx7d27GrR3iT0ZV9dQPNebMEFfj9uJwk`,
      },
    });

    if (!response.ok) throw new Error(`HTTP Error! Status: ${response.status}`);

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Real Estate API Fetch Error:", error);
    res.status(500).json({ error: "Failed to fetch real estate data" });
  }
});

// Debug endpoint with detailed info
app.get("/api/debug-headers", (req, res) => {
  // Allow all origins for debugging
  res.header("Access-Control-Allow-Origin", "*");
  
  const allHeaders = {};
  Object.keys(req.headers).forEach(key => {
    allHeaders[key] = req.headers[key];
  });
  
  res.json({
    message: "All request headers",
    headers: allHeaders,
    url: req.url,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString(),
    note: "Check if 'origin' header matches your frontend domain"
  });
});

// Simple health check
app.get("/api/health", (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.json({
    status: "healthy",
    server: "real-estate-ca-backend.onrender.com",
    time: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

// Handle 404
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Resource not found",
    requestedUrl: req.originalUrl,
  });
});

// Handle unhandled rejections
process.on("unhandledRejection", (err) => {
  console.log("UNHANDLED REJECTION! 💥 Shutting down...");
  console.error(err);
  process.exit(1);
});

// Root route with CORS test
app.get("/", (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Real Estate API - FIXED CORS</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; background: #f0f8ff; }
          .container { max-width: 900px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
          h1 { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 15px; }
          .success { color: #27ae60; background: #d5f4e6; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .warning { color: #e74c3c; background: #fadbd8; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .endpoints { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 25px 0; }
          .endpoint { background: #f8f9fa; padding: 15px; border-radius: 5px; border-left: 4px solid #3498db; }
          code { background: #2c3e50; color: #ecf0f1; padding: 3px 6px; border-radius: 3px; font-family: monospace; }
          .test-btn { display: inline-block; background: #3498db; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; margin: 10px 5px; }
          .test-btn:hover { background: #2980b9; }
          .note { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>✅ Real Estate API Server - CORS FIXED</h1>
          
          <div class="success">
            <h3>🚀 CORS Issue Resolved!</h3>
            <p>Your frontend should now be able to access this API from:</p>
            <ul>
              <li><code>https://www.searchomnes.com</code></li>
              <li><code>https://searchomnes.com</code></li>
              <li><code>http://localhost:5173</code></li>
            </ul>
          </div>
          
          <div class="note">
            <p><strong>Note:</strong> Your frontend Referer shows a typo: <code>searchomes.com</code> (missing 'n')</p>
            <p>This has been allowed in CORS configuration.</p>
          </div>
          
          <h3>Quick Test Links:</h3>
          <div>
            <a href="/api/cors-test" class="test-btn" target="_blank">Test CORS</a>
            <a href="/api/health" class="test-btn" target="_blank">Health Check</a>
            <a href="/api/debug-headers" class="test-btn" target="_blank">Debug Headers</a>
            <a href="/api/proxy/Property?$top=1" class="test-btn" target="_blank">Test API</a>
          </div>
          
          <h3>Diagnostic Endpoints:</h3>
          <div class="endpoints">
            <div class="endpoint">
              <strong>CORS Test</strong><br>
              <code>GET /api/cors-test</code><br>
              Tests if CORS is working for your domain
            </div>
            <div class="endpoint">
              <strong>Debug Headers</strong><br>
              <code>GET /api/debug-headers</code><br>
              Shows all request headers for debugging
            </div>
            <div class="endpoint">
              <strong>Health Check</strong><br>
              <code>GET /api/health</code><br>
              Simple API status check
            </div>
            <div class="endpoint">
              <strong>Test API Call</strong><br>
              <code>GET /api/proxy/Property?$top=1</code><br>
              Tests the main proxy endpoint
            </div>
          </div>
          
          <h3>Your Frontend URL:</h3>
          <p><a href="https://www.searchomnes.com" target="_blank">https://www.searchomnes.com</a></p>
          
          <h3>If you still get CORS errors:</h3>
          <ol>
            <li>Clear browser cache on searchomnes.com</li>
            <li>Open DevTools (F12) → Console tab</li>
            <li>Copy any CORS error messages</li>
            <li>Test the links above to confirm backend is working</li>
          </ol>
        </div>
        
        <script>
          // Auto-test CORS
          fetch('/api/cors-test')
            .then(r => r.json())
            .then(data => console.log('CORS test successful:', data))
            .catch(err => console.error('CORS test failed:', err));
        </script>
      </body>
    </html>
  `);
});

const port = process.env.PORT || 5000;

if (process.env.NODE_ENV !== "test") {
  app.listen(port, "0.0.0.0", () => {
    console.log(`\n🚀 Server running on port ${port}`);
    console.log(`🔗 Local: http://localhost:${port}`);
    console.log(`🌐 Production: https://real-estate-ca-backend.onrender.com`);
    console.log(`\n✅ CORS configured for:`);
    console.log(`   - https://www.searchomnes.com`);
    console.log(`   - https://searchomnes.com`);
    console.log(`   - https://searchomes.com (typo allowed)`);
    console.log(`   - http://localhost:*`);
    console.log(`\n📊 Test endpoints:`);
    console.log(`   - /api/cors-test`);
    console.log(`   - /api/debug-headers`);
    console.log(`   - /api/proxy/Property?$top=1`);
  });
}

export default app;

// import express from "express";
// import mongoose from "mongoose";
// import dotenv from "dotenv";
// import axios from "axios";
// import connectdb from "./config/mongodb.js";
// import cors from "cors";
// import fs from "fs";

// dotenv.config();
// const app = express();
// const PORT = process.env.PORT || 5000;

// const API_URL = "https://backend-theta-rust-73.vercel.app/api/proxy/Property";
// const GEOCODE_API =
//   "https://maps.googleapis.com/maps/api/geocode/json?address=";
// const GOOGLE_MAPS_API_KEY = "AIzaSyDlKnAJi9hC3r16lY5FXqm7_zHOQ760yHk";
// const BATCH_SIZE = 10;

// app.use(express.json({ limit: "50mb" }));
// app.use(express.urlencoded({ extended: true, limit: "50mb" }));
// app.use(cors());

// // ✅ MongoDB Schemas
// const propertySchema = new mongoose.Schema({
//   UnparsedAddress: { type: String, unique: true },
//   ListPrice: Number,
//   lat: Number,
//   lng: Number,
//   ParkingSpaces: Number,
//   BedroomsTotal: Number,
//   BathroomsTotalInteger: Number,
//   PropertySubType: String,
// });

// const failedSchema = new mongoose.Schema({
//   UnparsedAddress: { type: String, unique: true },
//   reason: String,
// });

// const Property = mongoose.model("Property", propertySchema);
// const Failed = mongoose.model("Failed", failedSchema);

// // 🌍 Geocode helper
// const geocodeAddress = async (address) => {
//   try {
//     const res = await axios.get(
//       `${GEOCODE_API}${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`
//     );
//     if (res.data.results.length > 0) {
//       return res.data.results[0].geometry.location;
//     }
//     return null;
//   } catch (err) {
//     console.error("Geocode error for:", address, err.message);
//     return null;
//   }
// };

// // ⏳ Delay helper
// const delay = (ms) => new Promise((res) => setTimeout(res, ms));

// // 🚀 Main fetch + save
// const fetchAndSaveProperties = async () => {
//   try {
//     let skip = 0;
//     const progressFile = "progress.txt";
//     if (fs.existsSync(progressFile)) {
//       skip = parseInt(fs.readFileSync(progressFile, "utf8")) || 0;
//     }

//     let savedCount = 0;
//     let totalFetched = 0;
//     let failedCount = 0;

//     while (true) {
//       console.log(`📦 Fetching batch from skip: ${skip}`);
//       const response = await axios.get(
//         `${API_URL}?$top=${BATCH_SIZE}&$skip=${skip}`
//       );
//       const data = response.data.value;

//       if (!data || data.length === 0) {
//         console.log("✅ No more data to fetch.");
//         break;
//       }

//       totalFetched += data.length;

//       for (const item of data) {
//         const exists = await Property.findOne({
//           UnparsedAddress: item.UnparsedAddress,
//         });
//         if (exists) continue;

//         const geo = await geocodeAddress(item.UnparsedAddress);
//         await delay(100);

//         if (geo) {
//           const property = new Property({
//             UnparsedAddress: item.UnparsedAddress,
//             ListPrice: item.ListPrice || 0,
//             ParkingSpaces: item.ParkingSpaces || 0,
//             BedroomsTotal: item.BedroomsTotal || item.Bedrooms || 0,
//             BathroomsTotalInteger:
//               item.BathroomsTotalInteger || item.Bathrooms || 0,
//             PropertySubType: item.PropertySubType || "",
//             lat: geo.lat,
//             lng: geo.lng,
//           });
//           await property.save();
//           savedCount++;
//         } else {
//           if (item.UnparsedAddress) {
//             const failedExists = await Failed.findOne({
//               UnparsedAddress: item.UnparsedAddress,
//             });
//             if (!failedExists) {
//               await Failed.create({
//                 UnparsedAddress: item.UnparsedAddress,
//                 reason: "Geocoding failed",
//               });
//               failedCount++;
//             }
//           }
//         }
//       }

//       skip += BATCH_SIZE;
//       fs.writeFileSync(progressFile, String(skip));
//       console.log(
//         `✅ Batch saved. Total saved: ${savedCount}, Failed: ${failedCount}`
//       );
//     }

//     console.log("🔥 All batches done:", {
//       totalFetched,
//       totalSaved: savedCount,
//       totalFailed: failedCount,
//     });
//   } catch (err) {
//     console.error("❌ Error during fetch-and-save:", err.message);
//   }
// };

// // ✅ Manual fetch trigger
// app.get("/fetch-and-save", async (req, res) => {
//   await fetchAndSaveProperties();
//   res.json({ message: "Fetch and save triggered." });
// });

// // ✅ Manual POST save
// app.post("/save-properties", async (req, res) => {
//   try {
//     const properties = req.body;
//     if (!Array.isArray(properties)) {
//       return res.status(400).json({ message: "Invalid payload" });
//     }

//     const normalizeAddress = (address) => address.trim().toLowerCase();
//     const results = [];

//     for (const item of properties) {
//       const normalizedAddress = normalizeAddress(item.UnparsedAddress);

//       const exists = await Property.findOne({
//         UnparsedAddress: { $regex: new RegExp(`^${normalizedAddress}$`, "i") },
//       });
//       if (exists) continue;

//       const newProperty = new Property({
//         UnparsedAddress: normalizedAddress,
//         Bedrooms: item.Bedrooms,
//         Bathrooms: item.Bathrooms,
//         ListPrice: item.ListPrice,
//         lat: item.lat,
//         lng: item.lng,
//         ParkingSpaces: item.ParkingSpaces || 0,
//         BedroomsTotal: item.BedroomsTotal || 0,
//         BathroomsTotalInteger: item.BathroomsTotalInteger || 0,
//         PropertySubType: item.PropertySubType || "",
//       });

//       await newProperty.save();
//       results.push(newProperty);
//     }

//     res.status(200).json({
//       message: "Saved successfully",
//       insertedCount: results.length,
//     });
//   } catch (error) {
//     console.error(error);
//     res
//       .status(500)
//       .json({ message: "Error saving properties", error: error.message });
//   }
// });

// // ✅ Get all properties
// app.get("/properties", async (req, res) => {
//   try {
//     const { north, south, east, west, limit } = req.query;
//     const query = {};

//     if (north && south && east && west) {
//       query.lat = { $gte: parseFloat(south), $lte: parseFloat(north) };
//       query.lng = { $gte: parseFloat(west), $lte: parseFloat(east) };
//     }

//     const maxLimit = Math.min(parseInt(limit) || 1000, 10000);
//     const props = await Property.find(query).limit(maxLimit);
//     res.json(props);
//   } catch (err) {
//     res.status(500).json({ error: "Failed to fetch properties" });
//   }
// });

// // ✅ Search properties
// app.get("/search-properties", async (req, res) => {
//   try {
//     const query = req.query.query;
//     if (!query) {
//       return res.status(400).json({ error: "Search query is required" });
//     }

//     const results = await Property.find({
//       $or: [
//         { UnparsedAddress: { $regex: query, $options: "i" } },
//         { PropertySubType: { $regex: query, $options: "i" } },
//         { ListPrice: isNaN(query) ? 0 : parseFloat(query) },
//       ],
//     }).limit(10);

//     res.json(results);
//   } catch (err) {
//     console.error("Search error:", err);
//     res.status(500).json({ error: "Server error during search" });
//   }
// });

// // ✅ Filter properties by map bounds
// app.get("/properties-within-bounds", async (req, res) => {
//   const {
//     nelat,
//     nelng,
//     swlat,
//     swlng,
//     propertyType,
//     bedrooms,
//     bathrooms,
//     parking,
//   } = req.query;

//   try {
//     const query = {
//       lat: { $gte: parseFloat(swlat), $lte: parseFloat(nelat) },
//       lng: { $gte: parseFloat(swlng), $lte: parseFloat(nelng) },
//     };

//     if (propertyType) query.PropertySubType = propertyType;
//     if (bedrooms) query.BedroomsTotal = { $gte: parseInt(bedrooms) };
//     if (bathrooms) query.BathroomsTotalInteger = { $gte: parseInt(bathrooms) };
//     if (parking) query.ParkingSpaces = { $gte: parseInt(parking) };

//     const properties = await Property.find(query);
//     res.json(properties);
//   } catch (error) {
//     console.error("Error fetching properties:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });

// // ✅ Failed geocode records
// app.get("/failed-properties", async (req, res) => {
//   try {
//     const failed = await Failed.find();
//     res.json(failed);
//   } catch (err) {
//     res.status(500).json({ error: "Error fetching failed addresses" });
//   }
// });

// // ✅ Start server
// connectdb().then(() => {
//   console.log("✅ MongoDB connected");
//   fetchAndSaveProperties(); // Auto-run on server star
//   app.listen(PORT, () => {
//     console.log(`🚀 Server is running at http://localhost:${PORT}`);
//   });
// });