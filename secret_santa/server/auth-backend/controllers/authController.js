const jwt = require('jsonwebtoken');

// After verifying email and password...
const jwtToken = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
  expiresIn: '7d',
});

// 🍪 Set cookie
res.cookie('token', jwtToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
});

res.status(200).json({ message: 'Login successful', user: { id: user._id, email: user.email, name: user.name } });
// 🍪 Clear cookie
res.clearCookie('token', {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict'
});

res.status(200).json({ message: 'Logged out' });

