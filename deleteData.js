const mongoose = require("mongoose");

mongoose.connect("mongodb://localhost:27017/task_manager", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const TaskSchema = new mongoose.Schema({
  title: String,
  description: String,
  priority: String,
  dueDate: String,
  tags: [String],
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
});

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const TeamSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: "" },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
});

const Team = mongoose.model("Team", TeamSchema);
const Task = mongoose.model("Task", TaskSchema);
const User = mongoose.model("User", UserSchema);

const deleteData = async () => {
  await Team.deleteMany({});
  await Task.deleteMany({});
  await User.deleteMany({});
  console.log("All data deleted");
  mongoose.connection.close();
};

deleteData();
