if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const app = express();
const bcrypt = require("bcrypt");
const path = require("path");
const session = require("express-session");
const mongoose = require('mongoose');
const { error } = require("console");


mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

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

app.get('/', isAuthenticated,  (req, res) => {
  res.render("index.ejs");
});

app.get("/login", (req, res) => {
  res.render("login.ejs");
});

app.post("/login", async (req, res) => {
  const username = req.body.username
  const password = req.body.password

  try {
    const authenticatedUser = await authenticateUser(username, password)

    if (authenticatedUser){
      req.session.authenticated = true
      const Name = authenticatedUser.firstName
      const surName = authenticatedUser.surName
      const Username = authenticatedUser.username
      const imageLink = authenticatedUser.profilePicture
      const Email = authenticatedUser.email
      const PostalCode = authenticatedUser.postalcode
      const City = authenticatedUser.city
      const Country = authenticatedUser.country
      const Adress = authenticatedUser.adress
      res.render('index.ejs', { Name, surName, Username, imageLink, Email, PostalCode, City, Country, Adress } )
    }
  } catch (err) {
    console.log(err)

    if (err.message === 'User not found.'){
      const errorMessage = 'User not found.'
      res.render('login.ejs', { error: errorMessage })
    } else if (err.message === 'Incorrect password.'){
      const errorMessage = 'Incorrect password.'
      res.render('login.ejs', { error: errorMessage })
    } else {
      const errorMessage = 'An error occured'
      res.render('login.ejs', { error: errorMessage })
    }
  }
});

async function authenticateUser(username, password) {
  const user = await User.findOne({ username: username})

  if (!user){
    throw new Error('User not found.')
  }

  const hashedPassword = user.password
  const passwordMatch = await bcrypt.compare(password, hashedPassword)

  if (passwordMatch) {
    return user
  } else {
    throw new Error('Incorrect password.')
  }
}


app.get("/register", (req, res) => {
  res.render("register.ejs");
});

app.post("/register", async (req, res) => {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const name = req.body.name;
    const surname = req.body.surname;
    const username = req.body.username;
    const adress = req.body.adress;

    if (req.body.selectedText === "Profile Picture") {
      const errorMessage = "Please pick a Profile Picture.";
      return res.status(401).render("register.ejs", { error: errorMessage });
    }

    const selectedProfileText = req.body.selectedText;

    const profileImages = {
      Cat: "https://github.com/ExileWeirdo/loginPageTry/blob/b93c1f9232aa1878f8eb6be049df88f1d03bcdcd/public/images/catImagePic.jpg?raw=true",
      Dog: "https://github.com/ExileWeirdo/loginPageTry/blob/b93c1f9232aa1878f8eb6be049df88f1d03bcdcd/public/images/dogImagePic.jpg?raw=true",
      Monkey: "https://github.com/ExileWeirdo/loginPageTry/blob/b93c1f9232aa1878f8eb6be049df88f1d03bcdcd/public/images/monkeyImagePic.jpg?raw=true",
      Bunny: "https://github.com/ExileWeirdo/loginPageTry/blob/d2e878c78aaa999b6e54b21527762efa7dfd1687/public/images/bunnyImagePic.jpg?raw=true",
      Rhino: "https://github.com/ExileWeirdo/loginPageTry/blob/b93c1f9232aa1878f8eb6be049df88f1d03bcdcd/public/images/rhinoImagePic.jpg?raw=true",
      Eagle: "https://github.com/ExileWeirdo/loginPageTry/blob/b93c1f9232aa1878f8eb6be049df88f1d03bcdcd/public/images/eagleImagePic.jpg?raw=true",
    };

    const imageSrc = profileImages[selectedProfileText] || "https://github.com/ExileWeirdo/loginPageTry/blob/b93c1f9232aa1878f8eb6be049df88f1d03bcdcd/public/images/catImagePic.jpg?raw=true";
    const postalCode = req.body.postalCode;
    const city = req.body.city;
    const email = req.body.email;
    const country = req.body.country;

    User.findOne({ username: username })
   .then((existingUser) => {
    if (existingUser) {
      const errorMessage = "Username already taken";
      return res.render("register.ejs", { error: errorMessage });
    }

    const newUser = new User({
      firstName: name,
      surName: surname,
      username: req.body.username,
      password: hashedPassword,
      adress: adress,
      profilePicture: imageSrc,
      postalcode: postalCode,
      city: city,
      email: email,
      country: country,
    })

    newUser.save()
    return res.render('login.ejs')
   })
   .catch((err) => {
    console.error(err)
    return res.status(500).render('register.ejs', { error: 'Error while checking username availability'})
   })
});

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

const Schema = mongoose.Schema;

const userSchema = new Schema({
  firstName: String,
  surName: String,
  username: String,
  password: String,
  adress: String,
  profilePicture: String,
  postalcode: Number,
  city: String,
  email: String,
  country: String,
})

const User = mongoose.model('User', userSchema)

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log("the server is running on port 3000")
});