const { generateTokens } = require('../utils/jwt');
const { User } = require('../models');
const { BadRequestError, UnauthorizedError, ConflictError } = require('../middleware/errorHandler');

const register = async (req, res, next) => {
  try {
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
  } catch (error) {
    console.error('Register error:', error);
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
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

    const { accessToken, refreshToken } = generateTokens(user._id);

    res.json({
      user: user.toPublicJSON(),
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error('Login error:', error);
    next(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
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
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (user) {
      user.status = 'offline';
      user.lastSeen = new Date();
      await user.save();
    }
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      throw new UnauthorizedError('User not found');
    }
    res.json({ user: user.toPublicJSON() });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { displayName, avatar, customStatus, settings } = req.body;
    const user = await User.findById(req.userId);

    if (displayName) user.username = displayName;
    if (avatar) user.avatar = avatar;
    if (customStatus !== undefined) user.customStatus = customStatus;
    if (settings) user.settings = { ...user.settings, ...settings };

    await user.save();
    res.json({ user: user.toPublicJSON() });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.userId).select('+password');

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      throw new UnauthorizedError('Current password is incorrect', 'WRONG_PASSWORD');
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};

const searchUsers = async (req, res, next) => {
  try {
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
  } catch (error) {
    next(error);
  }
};

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