 
const express = require('express'); const User = require('./User'); const router = express.Router();

const projectList = [ { id: 1, price: 100, percent: 1 }, { id: 2, price: 300, percent: 1.2 }, { id: 3, price: 500, percent: 1.5 }, { id: 4, price: 1000, percent: 1.8 }, { id: 5, price: 3000, percent: 2 } ];

router.post('/buy', async (req, res) => { try { const { username, projectId } = req.body;

const user = await User.findOne({ username });
if (!user) {
  return res.status(404).json({ message: 'User not found' });
}

if (!user.depositApproved) {
  return res.status(400).json({
    message: 'Deposit not approved yet. Minimum deposit is 100 USDT'
  });
}

const project = projectList.find(
  (item) => item.id === Number(projectId)
);

if (!project) {
  return res.status(400).json({ message: 'Project not found' });
}

if (user.balance < project.price) {
  return res.status(400).json({ message: 'Insufficient balance' });
}

user.balance -= project.price;

user.projects.push({
  id: project.id,
  price: project.price,
  percent: project.percent,
  buyDate: new Date()
});

await user.save();

res.json({
  message: 'Project purchased successfully',
  balance: user.balance
});

} catch (error) { res.status(500).json({ message: error.message }); } });

router.post('/profit', async (req, res) => { try { const { username } = req.body;

const user = await User.findOne({ username });
if (!user) {
  return res.status(404).json({ message: 'User not found' });
}

let totalProfit = 0;

user.projects.forEach((project) => {
  totalProfit += (project.price * project.percent) / 100;
});

user.balance += totalProfit;
await user.save();

res.json({
  message: 'Daily profit added successfully',
  profit: totalProfit,
  balance: user.balance
});

} catch (error) { res.status(500).json({ message: error.message }); } });

module.exports = router;
