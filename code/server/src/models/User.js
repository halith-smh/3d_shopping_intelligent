import bcrypt from "bcryptjs";
import mongoose, { Schema } from "mongoose";
import { SALT } from "../config/env.js";

const UserSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Please add a name"],
      trim: true,
      minLength: 4,
      maxLength: 50,
    },
    email: {
      type: String,
      required: [true, "Please add an email"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/\S+@\S+\.\S+/, "Please fill valid email address"],
    },
    password: {
      type: String,
      required: [true, "Please add a password"],
      minlength: 8,
    },
  },
  { timestamps: true }
);

// Password Hasing MiddleWare
UserSchema.pre("save", async function (next) {
  try {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, parseInt(SALT) || 10);
    next();
  } catch (error) {
    console.error("Password Hasing : " + error.message);
  }
});

export const User = mongoose.model("User", UserSchema);
