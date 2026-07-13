const { generateTokens } = require('../utils/jwt');
const { User } = require('../models');
const { BadRequestError, UnauthorizedError, ConflictError } = require('../middleware/errorHandler');
const asyncHandler = require('../utils/asyncHandler');

const register = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;
  console.log('Register attempt:', { username, email });

  const existingUser = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (existingUser) {
    if (existingUser.email === email) {
      throw new ConflictError('Email already registered', 'EMAIL_EXISTS');
    }
    throw new ConflictError('Username already taken', 'USERNAME_EXISTS');
  }

  const user = await User.create({ username, email, password });
  console.log('User created:', user._id);

  const { accessToken, refreshToken } = generateTokens(user._id);

  res.status(201).json({
    user: user.toPublicJSON(),
    accessToken,
    refreshToken,
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  console.log('Login attempt:', { email, password: password ? '****' : 'none' });

  const user = await User.findOne({ email }).select('+password');
  console.log('User found:', user ? 'yes' : 'no');
  if (!user) {
    throw new UnauthorizedError('Invalid credentials', 'INVALID_CREDENTIALS');
  }

  const isMatch = await user.comparePassword(password);
  console.log('Password match:', isMatch);
  if (!isMatch) {
    throw new UnauthorizedError('Invalid credentials', 'INVALID_CREDENTIALS');
  }

  if (!user.isActive) {
    throw new UnauthorizedError('Account is deactivated', 'ACCOUNT_DEACTIVATED');
  }

  user.lastSeen = new Date();
  user.status = 'online';
  await user.save();
  console.log('User saved successfully');

  const { accessToken, refreshToken } = generateTokens(user._id);
  console.log('Tokens generated');

  res.json({
    user: user.toPublicJSON(),
    accessToken,
    refreshToken,
  });
});

const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    throw new BadRequestError('Refresh token required', 'REFRESH_TOKEN_REQUIRED');
  }

  const { verifyRefreshToken } = require('../utils/jwt');
  const decoded = verifyRefreshToken(refreshToken);

  const user = await User.findById(decoded.userId);
  if (!user || !user.isActive) {
    throw new UnauthorizedError('Invalid refresh token', 'INVALID_REFRESH_TOKEN');
  }

  const tokens = generateTokens(user._id);
  res.json(tokens);
});

const logout = asyncHandler(async (req, res) => {
  const user = await User.findById(req.userId);
  if (user) {
    user.status = 'offline';
    user.lastSeen = new Date();
    await user.save();
  }
  res.json({ message: 'Logged out successfully' });
});

const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) {
    throw new UnauthorizedError('User not found');
  }
  res.json({ user: user.toPublicJSON() });
});

const updateProfile = asyncHandler(async (req, res) => {
  const { displayName, avatar, customStatus, settings } = req.body;
  const user = await User.findById(req.userId);

  if (displayName) user.username = displayName;
  if (avatar) user.avatar = avatar;
  if (customStatus !== undefined) user.customStatus = customStatus;
  if (settings) user.settings = { ...user.settings, ...settings };

  await user.save();
  res.json({ user: user.toPublicJSON() });
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.userId).select('+password');

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw new UnauthorizedError('Current password is incorrect', 'WRONG_PASSWORD');
  }

  user.password = newPassword;
  await user.save();

  res.json({ message: 'Password changed successfully' });
});

const searchUsers = asyncHandler(async (req, res) => {
  const { q, limit = 20 } = req.query;
  if (!q || q.length < 2) {
    return res.json({ users: [] });
  }

  const users = await User.find({
    $and: [
      { _id: { $ne: req.userId } },
      { isActive: true },
      {
        $or: [
          { username: { $regex: q, $options: 'i' } },
          { email: { $regex: q, $options: 'i' } },
        ],
      },
    ],
  })
    .select('username email avatar status lastSeen')
    .limit(parseInt(limit));

  res.json({ users: users.map(u => u.toPublicJSON()) });
});

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getMe,
  updateProfile,
  changePassword,
  searchUsers,
};