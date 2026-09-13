// Run once after upgrading an existing NotesGenie database.
require("dotenv").config();
const mongoose = require("mongoose");
const Note = require("../models/Note.cjs");
const Source = require("../models/Source.cjs");

async function migrate() {
  await mongoose.connect(process.env.MONGO_URI);
  const notes = await Note.find({ notes: { $type: "string", $ne: "" } });
  let migrated = 0;
  for (const note of notes) {
    if (note.notes.trim().length < 20) continue;
    const exists = await Source.exists({ legacyNoteId: note._id });
    if (exists) continue;
    await Source.create({
      userId: note.userId,
      fileName: note.fileName || "Previously generated notes",
      sourceType: "legacy-notes",
      extractedText: note.notes,
      notes: note.notes,
      legacyNoteId: note._id,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt
    });
    migrated += 1;
  }
  console.log(`Migrated ${migrated} saved notes to sources.`);
  await mongoose.disconnect();
}

migrate().catch((error) => { console.error(error.message); process.exit(1); });
