const express = require("express");
const router = express.Router();
const passport = require('passport');
const validateNoteInput = require('../../validation/note');
const Note = require('../../models/Note');
const mongodb = require('mongodb');

router.post("/",
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    const { errors, isValid } = validateNoteInput(req.body);
    if (!isValid) {
      return res.status(400).json(errors);
    }

    const newNote = new Note({
      body: req.body.body,
      content: req.body.content,
      tags: req.body.tags,
      author: req.body.author_id
    });
    newNote.save().then(note => res.json(note));
    return res
  }
);

router.get("/", (req, res) => {
  Note.find()
    .then(notes => res.json(notes))
    .catch(err => res.status(404).json({ noNotesFound: "No notes found" }))
});

router.delete("/:id", (req, res) => {
  Note.deleteOne({ "_id": new mongodb.ObjectId(`${req.params.id}`) })
  return req.params.id
});

module.exports = router;