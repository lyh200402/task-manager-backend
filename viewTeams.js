const mongoose = require("mongoose");

mongoose.connect("mongodb://localhost:27017/task_manager", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const TeamSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: "" },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
});

const Team = mongoose.model("Team", TeamSchema);

const viewTasks = async () => {
  const teams = await Team.find();
  console.log(teams);
  mongoose.connection.close();
};

viewTasks();
