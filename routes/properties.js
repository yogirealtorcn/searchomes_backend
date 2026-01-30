const express = require("express");
const router = express.Router();
const axios = require("axios");
import Property from "../models/Property.js";

const GOOGLE_GEOCODE_API = "https://maps.googleapis.com/maps/api/geocode/json";
const GOOGLE_API_KEY = "AIzaSyDlKnAJi9hC3r16lY5FXqm7_zHOQ760yHk"; // Change this to environment variable

// 📌 Fetch properties and store geocoded data
router.post("/save-properties", async (req, res) => {
  try {
    const properties = req.body; // Frontend se properties milengi

    const storedProperties = await Promise.all(
      properties.map(async (property) => {
        // Check if the address is already in DB
        let existingProperty = await Property.findOne({ unparsedAddress: property.UnparsedAddress });

        if (!existingProperty) {
          // If not in DB, geocode the address
          const geoResponse = await axios.get(GOOGLE_GEOCODE_API, {
            params: {
              address: property.UnparsedAddress,
              key: GOOGLE_API_KEY,
            },
          });

          if (geoResponse.data.results.length > 0) {
            const { lat, lng } = geoResponse.data.results[0].geometry.location;

            // Save to DB
            existingProperty = await Property.create({
              unparsedAddress: property.UnparsedAddress,
              lat,
              lng,
              bedrooms: property.Bedrooms || null,
              bathrooms: property.Bathrooms || null,
              listPrice: property.ListPrice || null,
            });
          }
        }

        return existingProperty;
      })
    );

    res.json(storedProperties);
  } catch (error) {
    console.error("Error saving properties:", error);
    res.status(500).json({ error: "Server Error" });
  }
});

// 📌 Get all stored properties
router.get("/get-properties", async (req, res) => {
  try {
    const properties = await Property.find();
    res.json(properties);
  } catch (error) {
    console.error("Error fetching properties:", error);
    res.status(500).json({ error: "Server Error" });
  }
});

module.exports = router;
