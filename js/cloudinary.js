// Cloudinary Configuration provided by user
const CLOUDINARY_CLOUD_NAME = "dvrzhdeas";
const CLOUDINARY_UPLOAD_PRESET = "skillbridge_profile";

/**
 * Uploads an image file to Cloudinary and returns the secure URL.
 * @param {File} file - The image file to upload.
 * @returns {Promise<string>} - The secure URL of the uploaded image.
 */
export async function uploadImageToCloudinary(file) {
    if (!file) {
        throw new Error("No file provided for upload.");
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    try {
        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
            {
                method: "POST",
                body: formData
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || "Cloudinary upload failed.");
        }

        return data.secure_url;
    } catch (error) {
        console.error("Cloudinary upload error:", error);
        throw error;
    }
}
