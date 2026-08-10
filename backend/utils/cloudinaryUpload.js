import cloudinary from "../config/cloudinary.js";

// Upload a file buffer (from memory) to Cloudinary
export const uploadToCloudinary = (fileBuffer, folderName, resourceType = "auto", publicId = null) => {
    return new Promise((resolve, reject) => {
        const options = {
            folder: folderName,
            resource_type: resourceType,
            type: "upload", // Explicitly set to 'upload' for public delivery
            access_mode: "public",
            use_filename: true,
            unique_filename: true,
        };

        if (publicId) {
            // For raw files, Cloudinary uses the public_id as the filename in the URL.
            // We want to keep the extension if it exists.
            if (resourceType === "raw") {
                options.public_id = publicId;
            } else {
                // For images/videos/auto, strip the extension for the public_id to avoid double-extensions in URLs
                options.public_id = publicId.includes(".") ? publicId.split('.').slice(0, -1).join('.') : publicId;
            }
        }

        const uploadStream = cloudinary.uploader.upload_stream(
            options,
            (error, result) => {
                if (error) {
                    console.log("Cloudinary Upload Error:", error);
                    return reject(error);
                }
                console.log("Cloudinary Upload Result:", result);
                resolve({
                    secure_url: result.secure_url,
                    public_id: result.public_id
                });
            }
        );

        // Pipe the buffer to the Cloudinary stream
        uploadStream.end(fileBuffer);
    });
};