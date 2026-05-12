import express from "express";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import cors from "cors";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import e from "express";

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
    origin: "http://127.0.0.1:5500",
    methods: ["GET", "POST"]
}));

/* ---------------- DATABASE ---------------- */

mongoose.connect(process.env.MONGO_URL)
    .then(() => {
        console.log("MongoDB Connected");
    })
    .catch((err) => {
        console.log(err);
    });

/* ---------------- SCHEMA ---------------- */

const userSchema = new mongoose.Schema({

    email: {
        type: String,
        required: true,
        unique: true
    },

    password: {
        type: String,
        required: true
    }

});

const User = mongoose.model("User", userSchema);

/* ---------------- EMAIL ---------------- */

const transporter = nodemailer.createTransport({

    service: "gmail",

    auth: {

        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS

    }

});

/* ---------------- SIGNUP ---------------- */

app.post("/signup", async (req, res) => {

    try {

        const { email, password } = req.body;

        // check existing user
        const existingUser = await User.findOne({ email });

        if (existingUser) {

            return res.json({
                success: false,
                message: "User already exists,please login"
            });

        }

        // hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // save user
        const user = new User({

            email,
            password: hashedPassword

        });

        await user.save();

        // send email notification
        await transporter.sendMail({

            from: process.env.EMAIL_USER,

            to: process.env.EMAIL_USER,

            subject: "New User Signup",

            text: `
New Signup on Anurag Art

Email: ${email}
            `

        });

        res.json({

            success: true,
            message: "Signup Successful"

        });

    } catch (error) {

        console.log(error);

        res.json({

            success: false,
            message: "Signup Failed"

        });

    }

});

/* ---------------- LOGIN ---------------- */

app.post("/login", async (req, res) => {

    try {

        const { email, password } = req.body;

        // check user
        const user = await User.findOne({ email });

        if (!user) {

            return res.json({

                success: false,
                message: "User not found"

            });

        }

        // compare password
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {

            return res.json({

                success: false,
                message: "Wrong Password"

            });

        }

        // login success
        res.json({

            success: true,
            message: "Login Successful"

        });

    } catch (error) {

        console.log(error);

        res.json({

            success: false,
            message: "Login Failed"

        });

    }

});

/* ---------------- SERVER ---------------- */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {

    console.log(`Server Running On Port ${PORT}`);

});