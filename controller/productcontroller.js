import Property from "../models/propertymodel.js";

const addproperty = async (req, res) => {
    try {
        const { title, location, price, beds, baths, sqft, type, availability, description, amenities, phone, imageUrls } = req.body;

        // Ensure imageUrls is an array
        if (!Array.isArray(imageUrls)) {
            return res.status(400).json({ message: "Image URLs should be an array", success: false });
        }

        // Create a new property with image URLs
        const property = new Property({
            title,
            location,
            price,
            beds,
            baths,
            sqft,
            type,
            availability,
            description,
            amenities,
            phone,
            image: imageUrls,
        });

        // Save to database
        await property.save();

        res.json({ message: "Property added successfully", success: true });
    } catch (error) {
        console.error("Error adding property: ", error);
        res.status(500).json({ message: "Server Error", success: false });
    }
};

const updateproperty = async (req, res) => {
    try {
        const { id, title, location, price, beds, baths, sqft, type, availability, description, amenities, phone, imageUrls } = req.body;

        const property = await Property.findById(id);
        if (!property) {
            return res.status(404).json({ message: "Property not found", success: false });
        }

        // Ensure imageUrls is an array
        if (imageUrls && !Array.isArray(imageUrls)) {
            return res.status(400).json({ message: "Image URLs should be an array", success: false });
        }

        // Update property details
        property.title = title;
        property.location = location;
        property.price = price;
        property.beds = beds;
        property.baths = baths;
        property.sqft = sqft;
        property.type = type;
        property.availability = availability;
        property.description = description;
        property.amenities = amenities;
        property.phone = phone;

        // Only update images if new URLs are provided
        if (imageUrls) {
            property.image = imageUrls;
        }

        await property.save();
        res.json({ message: "Property updated successfully", success: true });
    } catch (error) {
        console.error("Error updating property: ", error);
        res.status(500).json({ message: "Server Error", success: false });
    }
};

export { addproperty, removeproperty, updateproperty, singleproperty };
