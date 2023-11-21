const express = require("express");
const app = express();
const path = require("path");
const multer = require("multer");
const AWS = require("aws-sdk");

require("dotenv").config();

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    // if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
    //     cb(null, true);
    // } else {
    //     cb(null, false);
    // }
    cb(null, true);
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 1024 * 1024 * 10 },
    fileFilter: fileFilter,
});

app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        res.status(400).send("Error uploading file: " + error.message);
    } else if (error) {
        res.status(400).send("Error: " + error.message);
    } else {
        next();
    }
});

app.post("/upload", upload.single("file"), async (req, res) => {
    // File upload handling and S3 upload logic goes here
    const file = req.file;

    const params = {
        Bucket: process.env.S3_BUCKET,
        Key: file.originalname,
        Body: file.buffer,
        ContentType: file.mimetype,
    };

    const s3 = new AWS.S3({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    });

    try {
        const awsResponse = await s3.upload(params).promise();
        console.log(awsResponse);
        res.status(200).send("File uploaded to S3 successfully!");
    } catch (error) {
        console.error(error);
        res.status(500).send("Error uploading file to S3");
    }
});

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}.`);
});
