const express = require("express");
const Photo = require("../db/photoModel");
const mongoose = require("mongoose");
const res = require("express/lib/response");
const router = express.Router();
const User = require("../db/userModel");
const multer = require("multer");
const {response, request} = require("express");

// xac thuc
function requireAuth(request, response, next) {
    if(!request.session.user_id){
        return response.status(401).send("Unauthorized");
    }
    next();
}

// upload anh
const path = require("path");

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'images')  // Vẫn lưu vào folder 'images' ở backend
    },
    filename: function (req, file, cb) {
        // Lấy extension từ file gốc (.jpg, .png, .jpeg...)
        const ext = path.extname(file.originalname);
        const filename = Date.now() + '-' + Math.round(Math.random() * 1E9) + ext;
        cb(null, filename);
    }
});

const upload = multer({ storage: storage });

router.post("/photos/new", upload.single("photo"), async (request, response) => {
    if (!request.file) {
        return response.status(400).json({error: "No file uploaded"});
    }
    console.log(request.file);
    try {
        const newPhoto = new Photo({
            user_id: request.session.user_id,
            file_name: request.file.filename,
            date_time: new Date(),
            comments: [],
        })
        await newPhoto.save();
        response.status(200).json(newPhoto);
    }
    catch (error) {
        console.log(error);
        response.status(500).json({error: "failed to save photo"});
    }
})

// them comment
router.post("/commentsOfPhoto/:photo_id", requireAuth, async (request, response) => {
    const photoId = request.params.photo_id;
    const userId = request.session.user_id;
    if(!userId){
        return response.status(401).send("not logged in");
    }

    const {comment} = request.body;
    if(!comment){
        return response.status(400).send("comment empty");
    }
    try {
        const photo= await Photo.findById(photoId);
        if(!photo){
            return response.status(404).send("photo not found");
        }
        const newComment={
            comment:comment,
            date_time: new Date(),
            user_id: userId,
        }
        photo.comments.push(newComment);
        await photo.save();
        await photo.populate("comments.user_id","_id first_name last_name");
        response.status(200).send(newComment);
    }
    catch(err){
        console.log(err);
        response.status(500).send("server error");
    }
});

// hien thi anh
router.get("/photosOfUser/:id", requireAuth, async (req, res) => {
    const userId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ error: "User ID is invalid" });
    }

    try {
        const photos = await Photo.find({ user_id: userId })
            .populate("comments.user_id", "_id first_name last_name")
            .exec();

        const photosWithPopulatedComments = photos.map(photo => {
            const comments = photo.comments.map(comment => ({
                _id: comment._id,
                comment: comment.comment,
                date_time: comment.date_time,
                user: comment.user_id, // Sau khi populate, user_id là 1 object chứa thông tin user
            }));

            return {
                _id: photo._id,
                user_id: photo.user_id,
                file_name: photo.file_name,
                date_time: photo.date_time,
                comments: comments,
            };
        });

        res.status(200).json(photosWithPopulatedComments);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});


module.exports = router;
