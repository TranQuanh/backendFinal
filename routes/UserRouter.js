const express = require("express");
const User = require("../db/userModel");
const mongoose = require("mongoose");
const { request } = require("express");
const router = express.Router();

function requireAuth(request, response, next) {
  console.log("=== AUTH CHECK ===");
  console.log("Session ID:", request.sessionID);
  console.log("Session user_id:", request.session.user_id);
  console.log("Full session:", request.session);
  console.log("Cookies:", request.headers.cookie);
  console.log("==================");

  if (!request.session.user_id) {
    return response.status(401).json({ error: "Unauthorized - No session" }); // Thay đổi từ send sang json
  }
  next();
}

// dang nhap
router.post("/admin/login", async (request, response) => {
  const { login_name, password } = request.body;

  console.log("login_name:", login_name);
  console.log("password:", password);

  if (!login_name || !password) {
    return response.status(400).send("Missing login name or password");
  }

  try {
    const user = await User.findOne({ login_name });

    if (!user || user.password !== password) {
      return response.status(400).send("Invalid login name or password");
    }

    request.session.user_id = user._id;
    console.log("Logged in user_id:", request.session.user_id);

    response.status(200).json({
      _id: user._id,
      login_name: user.login_name,
      first_name: user.first_name,
      last_name: user.last_name,
    });
  } catch (err) {
    console.error(err);
    response.status(500).send("Server error");
  }
});

// dang ki
router.post("/register", async (request, response) => {
  const {
    login_name,
    password,
    first_name,
    last_name,
    location,
    description,
    occupation,
  } = request.body;
  if (!login_name || !password || !first_name || !last_name) {
    return response
      .status(400)
      .send("Missing login name, password, first name and last name");
  }
  const existingUser = await User.findOne({ login_name });
  if (existingUser) {
    return response.status(200).send("Login name already exists");
  }

  const newUser = new User({
    login_name,
    password,
    first_name,
    last_name,
    location: location || "",
    occupation: occupation || "",
    description: description || "",
  });
  console.log(newUser);
  await newUser.save();
  response.status(200).json({ login_name });
});

// dang xuat
router.post("/admin/logout", async (request, response) => {
  if (!request.session.user_id) {
    return response.status(401).send("Not logged in");
  }
  request.session.destroy((err) => {
    if (err) {
      return response.status(500).send("error logging out");
    }
    response.status(200).send("logged out");
  });
});

// hien thi danh sach user
router.get("/list", requireAuth, async (request, response) => {
  try {
    const users = await User.find({}, "_id first_name last_name").exec();
    response.status(200).json(users);
  } catch (err) {
    console.error(err);
    response.status(500).json({ error: "Internal server error" });
  }
});

// hien thi chi tiet user
router.get("/:id", requireAuth, async (request, response) => {
  const id = request.params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    response.status(404).json({ error: "Invalid user id format" });
  }
  try {
    const user = await User.findById(
      id,
      "_id first_name last_name location description occupation"
    ).exec();
    if (!user) {
      // Nếu không tìm thấy user
      return response.status(400).json({ error: "User not found" });
    }
    response.status(200).json(user);
  } catch (err) {
    console.error(err);
    response.status(500).json({ error: "Internal server error" });
  }
});
module.exports = router;
