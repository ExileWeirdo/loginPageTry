if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const app = express();
const bcrypt = require("bcrypt");
const path = require("path");
const fs = require("fs");
const session = require("express-session");

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  }),
);

app.get('/', isAuthenticated, (req, res) => {
  res.render("index.ejs");
});

app.get("/login", (req, res) => {
  res.render("login.ejs");
});

app.post("/login", (req, res) => {
  fs.readFile("userInfo.txt", "utf8", (err, data) => {
    if (err) {
      console.error(err);
      res.status(500).send("Internal Server Error");
      return;
    }

    const lines = data.split("\n");
    let authenticated = false;

    const username = req.body.username;
    const password = req.body.password;

    for (const line of lines) {
      const [
        savedName,
        savedSurname,
        savedUsername,
        savedHashedPassword,
        savedAdress,
        savedImageSrc,
        savedPostalCode,
        savedCity,
        savedEmail,
        savedCountry,
      ] = line.split(";");

      console.log(`Comparing: ${username} with ${savedUsername}`);

      if (username === savedUsername) {
        bcrypt.compare(password, savedHashedPassword, (err, result) => {
          if (err) {
            console.error(err);
            res.status(500).send("Internal Server Error brrr");
            return;
          }

          if (result) {
            req.session.authenticated = true;
            const Name = savedName;
            const surName = savedSurname;
            const Adress = savedAdress;
            const imageLink = savedImageSrc;
            const PostalCode = savedPostalCode;
            const Username = savedUsername;
            const City = savedCity;
            const Email = savedEmail;
            const Country = savedCountry;
            res.render("index.ejs", {
              Name,
              surName,
              Adress,
              imageLink,
              PostalCode,
              Username,
              City,
              Email,
              Country,
            });
            return;
          } else {
            const errorMessage = "Incorrect password.";
            res.status(401).render("login.ejs", { error: errorMessage });
            return;
          }
        });
        authenticated = true;
        break;
      }
    }

    if (!authenticated) {
      const errorMessage = "User not found.";
      res.status(401).render("login.ejs", { error: errorMessage });
      return;
    }
  });
});

app.get("/register", (req, res) => {
  res.render("register.ejs");
});

app.post("/register", async (req, res) => {
  try {
    const usernameExists = await userNameExistsInFile(req.body.username);

    if (usernameExists) {
      const errorMessage = "Username is already taken";
      return res.render("register.ejs", { error: errorMessage });
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const name = req.body.name;
    const surname = req.body.surname;
    const username = req.body.username;
    const password = hashedPassword;
    const adress = req.body.adress;

    if (req.body.selectedText === "Profile Picture") {
      const errorMessage = "Please pick a Profile Picture.";
      res.status(401).render("register.ejs", { error: errorMessage });
      return;
    }

    const selectedProfileText = req.body.selectedText;

    const profileImages = {
      Cat: "/images/catImagePic.jpg",
      Dog: "/images/dogImagePic.jpg",
      Monkey: "/images/monkeyImagePic.jpg",
      Bunny: "/images/bunnyImagePic.jpg",
      Rhino: "/images/rhinoImagePic.jpg",
      Eagle: "/images/eagleImagePic.jpg",
    };

    const imageSrc =
      profileImages[selectedProfileText] || "/images/catImagePic.jpg";
    const postalCode = req.body.postalCode;
    const city = req.body.city;
    const email = req.body.email;
    const country = req.body.country;

    const row =
      name +
      ";" +
      surname +
      ";" +
      username +
      ";" +
      password +
      ";" +
      adress +
      ";" +
      imageSrc +
      ";" +
      postalCode +
      ";" +
      city +
      ";" +
      email +
      ";" +
      country +
      "\n";
    fs.appendFile("userInfo.txt", row, (err) => {
      if (err) {
        console.log("Error appending to userInfo.txt:", err);
        return res.status(500).send("Internal Server Error");
      }

      console.log("User registered succesfully");
      res.redirect("/login");
    });
    console.log(
      "Name: " +
        name +
        "\n" +
        "Surname: " +
        surname +
        "\n" +
        "Username: " +
        username +
        "\n" +
        "Password: " +
        hashedPassword +
        "\n" +
        "Adress: " +
        adress +
        "\n" +
        "Image: " +
        selectedProfileText +
        "\n" +
        "PostalCode: " +
        postalCode +
        "\n" +
        "City: " +
        city +
        "\n" +
        "Email: " +
        email +
        "\n" +
        "Country: " +
        country,
    );
  } catch (error) {
    console.log(error);
    res.redirect("/register");
  }
});

const userNameExistsInFile = (usernameToCheck) => {
  return new Promise((resolve, reject) => {
    fs.readFile("./userInfo.txt", "utf8", (err, data) => {
      if (err) {
        reject(err);
        return;
      }

      if (data.trim() === "") {
        resolve(false);
        return;
      }
      const lowerCaseUsernameToCheck = usernameToCheck.toLowerCase();
      const lines = data.split("\n");
      for (const line of lines) {
        const savedUsername = line.split(";")[2];
        if (
          savedUsername &&
          savedUsername.trim().toLowerCase() === lowerCaseUsernameToCheck
        ) {
          resolve(true);
          return;
        }
      }

      resolve(false);
    });
  });
};

function isAuthenticated(req, res, next) {
  if (req.session.authenticated) {
    return next;
  } else {
    res.redirect("/login");
  }
}

app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error(err);
    }
    res.redirect("/login");
  });
});

app.listen(3000);