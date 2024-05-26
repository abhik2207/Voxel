const mongoose = require('mongoose');

mongoose.connect("mongodb://127.0.0.1:27017/voxel");

const userSchema = mongoose.Schema({
    username: String,
    name: String,
    age: Number,
    email: String,
    phone: Number,
    password: String,
    posts: { type: [mongoose.Schema.Types.ObjectId], ref: "Post" }
});

const UserModel = mongoose.model("User", userSchema);
module.exports = UserModel;