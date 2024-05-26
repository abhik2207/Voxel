const mongoose = require('mongoose');

const postSchema = mongoose.Schema({
    title: String,
    content: String,
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    date: { type: Date, default: Date.now },
    likes: { type: [mongoose.Schema.Types.ObjectId], ref: "User" }
});

const PostModel = mongoose.model("Post", postSchema);
module.exports = PostModel;