const express = require('express');
const mongoose = require('mongoose');

const app = express();
app.use(express.json());

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/bank_demo', { useNewUrlParser: true, useUnifiedTopology: true });

// User Schema
const userSchema = new mongoose.Schema({
  name: String,
  balance: Number,
});

const User = mongoose.model('User', userSchema);

// Create users endpoint
app.post('/create-users', async (req, res) => {
  try {
    const usersData = [
      { name: 'Alice', balance: 1000 },
      { name: 'Bob', balance: 500 },
    ];

    const users = await User.insertMany(usersData);
    res.status(201).json({
      message: "Users created",
      users: users.map(user => ({
        name: user.name,
        balance: user.balance,
        _id: user._id
      }))
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating users' });
  }
});

// Account transfer endpoint
app.post('/transfer', async (req, res) => {
  const { fromUserId, toUserId, amount } = req.body;

  if (!fromUserId || !toUserId || !amount || amount <= 0) {
    return res.status(400).json({ message: 'Invalid parameters' });
  }

  try {
    const sender = await User.findById(fromUserId);
    const receiver = await User.findById(toUserId);

    if (!sender) {
      return res.status(404).json({ message: 'Sender not found' });
    }
    if (!receiver) {
      return res.status(404).json({ message: 'Receiver not found' });
    }
    if (sender.balance < amount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    // Perform plain updates (sequential, not transaction)
    sender.balance -= amount;
    receiver.balance += amount;
    await sender.save();
    await receiver.save();

    res.status(200).json({
      message: `Transferred $${amount} from ${sender.name} to ${receiver.name}`,
      senderBalance: sender.balance,
      receiverBalance: receiver.balance
    });
  } catch (error) {
    res.status(500).json({ message: 'Transfer error' });
  }
});

// Start server
app.listen(3000, () => {
  console.log('API running on http://localhost:3000');
});
