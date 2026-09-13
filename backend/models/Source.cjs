const mongoose = require("mongoose");

const sourceSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    fileName: { type: String, required: true },
    sourceType: { type: String, required: true },
    extractedText: { type: String, required: true },
    notes: { type: String, default: "" },
    legacyNoteId: { type: mongoose.Schema.Types.ObjectId, unique: true, sparse: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Source", sourceSchema);
