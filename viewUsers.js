const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/task_manager', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const User = mongoose.model('User', UserSchema);

const viewUsers = async () => {
  const users = await User.find();
  console.log(users);
  mongoose.connection.close();
};

viewUsers();
