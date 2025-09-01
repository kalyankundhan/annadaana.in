// models/Request.ts
import { Schema, model, models, type Types } from "mongoose"

const RequestSchema = new Schema(
  {
    postId: { type: Schema.Types.ObjectId, ref: "Post", required: true, index: true },
    donorId: { type: String, required: true, index: true }, // post.donorId
    requesterId: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ["Pending", "Accepted", "Rejected", "Cancelled"],
      default: "Pending",
      index: true,
    },
    // Snapshot of donor details when accepted
    donorDetails: {
      name: String,
      phone: String,
      address: String,
    },
  },
  { timestamps: true },
)

export type IRequest = {
  _id: Types.ObjectId
  postId: Types.ObjectId
  donorId: string
  requesterId: string
  status: "Pending" | "Accepted" | "Rejected" | "Cancelled"
  donorDetails?: { name?: string; phone?: string; address?: string }
  createdAt?: Date
  updatedAt?: Date
}

export const RequestModel = models.Request || model("Request", RequestSchema)
