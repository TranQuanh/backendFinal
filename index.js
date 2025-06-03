const express = require("express");
const app = express();
const cors = require("cors");
const path = require("path");
const dbConnect = require("./db/dbConnect");
const UserRouter = require("./routes/UserRouter");
const PhotoRouter = require("./routes/PhotoRouter");
const session = require("express-session");

app.use(
  cors({
    origin: "http://localhost:3000", // Cho phép frontend local truy cập
    credentials: true,
  })
);

app.use(
  session({
    secret: "your_secret_key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 60 * 30 * 1000,
      sameSite: "lax", // Đổi thành lax cho local development
      secure: false, // Tắt secure vì dùng HTTP ở local
    },
  })
);

// Cấu hình static files cho images
const imagesPath = path.join(__dirname, 'images');
app.use("/images", express.static(imagesPath));

dbConnect();

app.use(express.json());
app.use("/api/user", UserRouter);
app.use("/api/photo", PhotoRouter);

app.get("/", (request, response) => {
  response.send({ message: "Hello from photo-sharing app API!" });
});

app.listen(8081, () => {
  console.log("server listening on port 8081");
});
