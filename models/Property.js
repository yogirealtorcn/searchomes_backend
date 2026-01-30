import mongoose from "mongoose";

// Check if model already exists
let Property;
try {
  Property = mongoose.model("Property");
} catch {
  // Define the model if it doesn't exist
  const PropertySchema = new mongoose.Schema({
    unparsedAddress: { 
      type: String, 
      required: true, 
      unique: true,
      trim: true,
      lowercase: true 
    },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    bedrooms: { type: Number, default: undefined },
    bathrooms: { type: Number, default: undefined },
    listPrice: { type: Number, default: undefined }
  }, {
    strict: true,
    timestamps: true
  });

  Property = mongoose.model("Property", PropertySchema, "properties");
}

export default Property;