import cookieParser from 'cookie-parser';
import express, { json } from 'express';
import mongoose from 'mongoose';
import path from 'path';
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

mongoose.connect("mongodb://localhost:27017", {
    dbname: "project1"
}).then(() => console.log("Database Connected"))
    .catch((e) => console.log(e));


const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password:String,
});

const User = mongoose.model("User", userSchema);
const app = express();

// Set the 'views' directory for views (ejs files)

app.set("view engine", "ejs");

// app.use(express.static(path.join(path.resolve(), "public")));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const isAuthenticated =  async (req, res, next) => {
  const { token } = req.cookies;
  if (token) {
     const decoded = jwt.verify(token,"csafasbvbkdcb")
     req.user = await User.findById(decoded._id);
      next()
      
  } else {
      res.redirect("/login");
  }
}

app.get("/", isAuthenticated, (req, res) => {
    res.render("logout", {name : req.user.name}) ;
});

app.get("/login",(req,res)=>{
  res.render("login");
})

app.get("/register",(req,res)=>{
  res.render("register")
})


app.post("/login",async (req,res)=>{
  const { email , password} =req.body
  let user = await User.findOne({email});

  if(!user){
    return res.redirect("/register");
  }
  
  const isMatched = await bcrypt.compare(password, user.password)
  if(!isMatched){
    return res.render("login", {email, message:"Incorrect Password"})
  }
  const token = jwt.sign({_id:user.id},"csafasbvbkdcb");
  res.cookie("token", token, {
    httpOnly: true,
    expires: new Date(Date.now() + 60 * 1000)
});
// Redirect the user to the homepage
res.redirect("/");
})


app.post("/register", async (req, res) => {
  const { name, email,password } = req.body;

  // Find the user based on the provided email
  let user = await User.findOne({ email });

  if (user) {
    console.log(user);
     return res.redirect("/login")
  }
  const hashedPassword = await bcrypt.hash(password,10)
  user = User.create({
    name,
    email,
    password: hashedPassword,
  });

  const token = jwt.sign({_id:user.id},"csafasbvbkdcb")
  res.cookie("token", token, {
      httpOnly: true,
      expires: new Date(Date.now() + 60 * 1000)
  });
  // Redirect the user to the homepage
  res.redirect("/");
});


app.get("/logout", (req, res) => {
    res.cookie("token", null, {
        httpOnly: true, expires: new Date(Date.now())
    });
    res.redirect("/");
});




app.listen(5000, () => {
    console.log("server is running on Port 5000")
});
