const express = require("express");
const mongoose = require("mongoose");
const userModel = require("./schema");
const courseModal = require("./courseSchema");
const {
  checkExistingUser,
  generatePasswordHash,
  dynamicSort,
} = require("./utility");
const jwt = require("jsonwebtoken");
const multer = require("multer")();
const bcrypt = require("bcryptjs");
const cors = require("cors");
const app = express();
require("dotenv").config();
app.use(multer.array());

app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: false }));

app.listen("3000", (err) => {
  if (!err) {
    console.log("server running at 3000 port");
  }
});

mongoose.connect("mongodb://localhost:27017/schbangq", (err, res) => {
  if (err) {
    console.log(err);
  }

  console.log("connected to db");
});

app.post("/login", (req, res) => {
  userModel.find({ email: req.body.email }).then((user) => {
    if (user.length) {
      bcrypt.compare(req.body.password, user[0].password).then((match) => {
        if (match) {
          const authToken = jwt.sign(req.body.email, process.env.SECRET_KEY);
          res.status(200).send({ authToken });
        } else {
          res.status(400).send("Invalid password");
        }
      });
    } else {
      res.status(400).send("User Not Exist");
    }
  });
});

app.post("/signup", async (req, res) => {
  if (await checkExistingUser(req.body.email)) {
    res.status(400).send("email exist. Please try with different email");
  } else {
    generatePasswordHash(req.body.password).then((passwordHash) => {
      userModel
        .create({
          name: req.body.name,
          email: req.body.email,
          password: passwordHash,
          role: req.body.role,
        })
        .then(() => {
          res.status(200).send(`${req.body.email} added successfully`);
        })
        .catch((err) => {
          res.status(400).send(err.message);
        });
    });
  }
});

app.post("/post", async (req, res) => {
  if (req.headers.authorization) {
    try {
      const email = jwt.verify(
        req.headers.authorization,
        process.env.SECRET_KEY
      );
      userModel.find({ email: email }).then((data) => {
        if (data[0].role == "admin") {
          courseModal.create({
            user: email,
            title: req.body.title,
            description: req.body.description,
            video_Url: req.body.video_Url,
            topics: req.body.topics,
            duration: req.body.duration,
            category: req.body.category,
          }).then(()=>{
            res.send('course added successfully').status(200)
          })

        } else {
          res.send("You cannot post the course");
        }
      });
    } catch (err) {
      res.status(403).send("User Not Authorized");
    }
  } else {
    res.status(400).send("Missing Authorization token");
  }
});

app.put("/update", (req, res) => {
  if (req.headers.authorization) {
    try {
      const email = jwt.verify(
        req.headers.authorization,
        process.env.SECRET_KEY
      );
      userModel.find({ email: email }).then((data) => {
        if (data[0].role == "admin") {
          courseModal.find({ _id: req.headers.course_id }).then((data) => {
            courseModal
              .updateOne(
                { _id: req.headers.course_id },
                {
                  $set: {
                    title: req.body.title,
                    description: req.body.description,
                    video_Url: req.body.video_Url,
                    topics: req.body.topics,
                    duration: req.body.duration,
                    category: req.body.category,
                    approved: false,
                  },
                }
              )
              .then((data) => {
                res.status(200).send("Updated sucessfully");
              });
          });
        } else if (data[0].role == "super_admin") {
          courseModal.find({ _id: req.headers.course_id }).then((data) => {
            courseModal
              .updateOne(
                { _id: req.headers.course_id },
                { $set: { approved: true } }
              )
              .then((data) => {
                res.status(200).send("Approved sucessfully");
              });
          });
        } else {
          res.status(403).send("UnAuthorized user cant update the post");
        }
      });
    } catch (err) {
      res.status(403).send("User Not Authorized");
    }
  } else {
    res.status(400).send("Missing Authorization token");
  }
});
app.delete("/delete", (req, res) => {
  if (req.headers.authorization) {
    try {
      const email = jwt.verify(
        req.headers.authorization,
        process.env.SECRET_KEY
      );
      userModel.find({ email: email }).then((data) => {
        if (data[0].role == "admin") {
          courseModal.deleteOne({ _id: req.headers.course_id }).then((data) => {
            res.send("course has been successfully deleted");
          });
        } else {
          res.send("You can't delete the course");
        }
      });
    } catch {
      res.status(403).send("User Not Authorized");
    }
  } else {
    res.status(400).send("Missing Authorization token");
  }
});

app.get("/course", (req, res) => {
  if (req.headers.authorization) {
    try {
      const email = jwt.verify(
        req.headers.authorization,
        process.env.SECRET_KEY
      );
      userModel.find({ email: email }).then((data) => {
        courseModal.find().then((data) => {
          let availablecourses = data.filter((e) => e.approved == true);
          let sorted_course = availablecourses.sort(dynamicSort("category"));
          res.status(200).send(sorted_course);
        });
      });
    } catch {
      res.status(403).send("User Not Authorized");
    }
  } else {
    res.status(400).send("Missing Authorization token");
  }
});
