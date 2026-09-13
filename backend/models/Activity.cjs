const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    sourceId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    type: { type: String, enum: ["ask", "quiz", "assessment"], required: true },
    question: { type: String, default: "" },
    answer: { type: String, default: "" },
    score: Number,
    total: Number
  },
  { timestamps: true }
);

module.exports = mongoose.model("Activity", activitySchema);
