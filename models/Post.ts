// models/Post.ts
import { Schema, model, models, type Types } from "mongoose"

const PostSchema = new Schema(
  {
    donorId: { type: String, required: true, index: true }, // Firebase uid
    donorName: { type: String, required: true },
    foodName: { type: String, required: true },
    description: { type: String, required: true },
    photoUrl: { type: String, required: true },
    expiryAt: { type: Date, required: true },
    locationText: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    completed: { type: Boolean, default: false },
  },
  { timestamps: true },
)

export type IPost = {
  _id: Types.ObjectId
  donorId: string
  donorName: string
  foodName: string
  description: string
  photoUrl: string
  expiryAt: string | Date
  locationText: string
  lat: number
  lng: number
  completed: boolean
  createdAt?: Date
}

export const PostModel = models.Post || model("Post", PostSchema)
