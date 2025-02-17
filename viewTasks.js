const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/task_manager', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const TaskSchema = new mongoose.Schema({
  title: String,
  description: String,
  priority: String,
  dueDate: String,
  tags: [String],
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
});

const Task = mongoose.model('Task', TaskSchema);

const viewTasks = async () => {
  const tasks = await Task.find();
  console.log(tasks);
  mongoose.connection.close();
};

viewTasks();
