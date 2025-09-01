// models/User.ts
import { Schema, model, models } from "mongoose"

const UserSchema = new Schema(
  {
    uid: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true, index: true },
    phone: { type: String, default: null },
    address: { type: String, default: "" }, // storing latest known address text
  },
  { timestamps: true },
)

export type IUser = {
  uid: string
  name: string
  email: string
  phone?: string | null
  address?: string
}

export const UserModel = models.User || model("User", UserSchema)
