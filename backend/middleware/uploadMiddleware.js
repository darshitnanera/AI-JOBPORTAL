import multer from "multer";

// Use memory storage to avoid local files (files are kept in RAM temporarily)
const storage = multer.memoryStorage();

export const upload = multer({ storage });