const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = 5000;
const SECRET_KEY = "liang20040207";

app.use(bodyParser.json());
app.use(
  cors({
    origin: "https://task-manager-frontend-flax.vercel.app",
  })
);

const authenticate = (req, res, next) => {
  const token = req.header("Authorization");
  if (!token)
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    next();
  } catch (ex) {
    res.status(400).json({ message: "Invalid token." });
  }
};

mongoose
  .connect(
    "mongodb+srv://1700616705:n7886843@cluster-t.2maqy.mongodb.net/?retryWrites=true&w=majority&appName=Cluster-t"
  )
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Error connecting to MongoDB:", err));

const TaskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    priority: { type: String, default: "中" },
    dueDate: { type: Date, required: true },
    tags: [String],
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      default: null,
    },
  },
  {
    validateBeforeSave: true,
  }
);

TaskSchema.path("userId").validate(function (value) {
  return value || this.teamId;
}, "Task must have either userId or teamId.");

TaskSchema.path("teamId").validate(function (value) {
  return value || this.userId;
}, "Task must have either userId or teamId.");

const Task = mongoose.model("Task", TaskSchema);

module.exports = Task;

const TeamSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: "" },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
});

const Team = mongoose.model("Team", TeamSchema);

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const User = mongoose.model("User", UserSchema);

app.get("/tasks", authenticate, async (req, res) => {
  const userId = req.user.userId;
  const teamId = req.query.teamId;
  try {
    let tasks;
    if (teamId) {
      tasks = await Task.find({ teamId: teamId });
    } else {
      tasks = await Task.find({ userId: userId, teamId: null });
    }
    res.json(tasks);
  } catch (error) {
    console.error("Error finding tasks:", error);
    res.status(500).json({ message: "Error finding tasks", error });
  }
});

app.post("/tasks", authenticate, async (req, res) => {
  const { teamId } = req.query;
  const newTask = new Task({
    ...req.body,
    userId: req.user.userId,
    teamId: teamId || null,
  });

  try {
    await newTask.save();
    res.json(newTask);
  } catch (error) {
    console.error("Error saving task:", error);
    res.status(500).json({ message: "Error saving task", error });
  }
});

app.put("/tasks/:id", authenticate, async (req, res) => {
  const { teamId } = req.query;
  const updatedTask = await Task.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.userId },
    { ...req.body, teamId: teamId || null },
    { new: true }
  );

  try {
    res.json(updatedTask);
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).json({ message: "Error updating task", error });
  }
});

app.delete("/tasks/:id", authenticate, async (req, res) => {
  const { teamId } = req.query; // 从查询参数中获取团队 ID
  const condition = teamId
    ? { _id: req.params.id, userId: req.user.userId, teamId: teamId }
    : { _id: req.params.id, userId: req.user.userId };

  try {
    await Task.findOneAndDelete(condition);
    res.json({ message: "Task deleted" });
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).json({ message: "Error deleting task", error });
  }
});

app.get("/teams", authenticate, async (req, res) => {
  const userId = req.user.userId;
  try {
    const teams = await Team.find({ members: { $in: [userId] } }).populate(
      "members",
      "username email"
    );
    res.json(teams);
  } catch (error) {
    console.error("Error finding teams:", error);
    res.status(500).json({ message: "Error finding teams", error });
  }
});

app.post("/teams", authenticate, async (req, res) => {
  const newTeam = new Team({ ...req.body, userId: req.user.userId });
  await newTeam.save();
  res.json(newTeam);
});

app.put("/teams/:id", authenticate, async (req, res) => {
  const updatedTeam = await Team.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.userId },
    req.body,
    { new: true }
  );
  res.json(updatedTeam);
});

app.delete("/teams/:id", authenticate, async (req, res) => {
  await Team.findOneAndDelete({ _id: req.params.id, userId: req.user.userId });
  res.json({ message: "Team deleted" });
});

app.post("/join-team", authenticate, async (req, res) => {
  const { name, user } = req.body;
  try {
    const team = await Team.findOne({ name });
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    // 检查用户是否已经是团队成员
    if (team.members.includes(user._id)) {
      return res
        .status(400)
        .json({ message: "You are already a member of this team" });
    }

    team.members.push(user._id);
    await team.save();
    res.json(team);
  } catch (error) {
    console.error("Error joining team:", error);
    res.status(500).json({ message: "Error joining team", error });
  }
});

app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(400).json({ message: "Error registering user", error });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign({ userId: user._id }, SECRET_KEY, {
      expiresIn: "1h",
    });
    res.json({ token, username: user.username, userId: user._id });
  } catch (error) {
    res.status(500).json({ message: "Error logging in", error });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
