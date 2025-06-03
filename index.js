const express = require("express");
const app = express();
const cors = require("cors");
const dbConnect = require("./db/dbConnect");
const UserRouter = require("./routes/UserRouter");
const PhotoRouter = require("./routes/PhotoRouter");
const session = require("express-session");

app.use(
  cors({
    origin: "https://7zjj22.csb.app", // chỉ định origin rõ ràng
    credentials: true, // cho phép gửi cookie
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
      sameSite: "none", // 👈 bắt buộc
      secure: true, // 👈 bắt buộc với HTTPS
    },
  })
);

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
//static files middleware để có thể hiển thị ảnh
app.use("/images", express.static("images"));
