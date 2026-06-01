// const jwt  = require('jsonwebtoken');
// const User = require('../models/User');
// const { sendEmail } = require('../utils/email');

// // ── Token helpers ─────────────────────────────────────────────────────────────
// const signAccessToken = (id) =>
//   jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1d' });

// const signRefreshToken = (id) =>
//   jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' });

// const sendTokens = async (user, statusCode, res) => {
//   try{
//     const accessToken  = signAccessToken(user._id);
//   const refreshToken = signRefreshToken(user._id);

//   // Store refresh token hash in DB
//   user.refreshToken = refreshToken;
//   user.save({ validateBeforeSave: false });

//    const userResponse = user.toObject();
//     delete userResponse.passwordHash;
//     delete userResponse.refreshToken;

//   res.status(statusCode).json({
//     success: true,
//     accessToken,
//     refreshToken,
//     user,
//   });
//   }catch(error) {
//     next(error);
//   }
// };

// // ── Register ──────────────────────────────────────────────────────────────────
// exports.register = async (req, res, next) => {
//   try{
//     const { fullName, email, password, role, matricNumber, department } = req.body;

//   // Prevent self-registering as admin
//   const safeRole = role === 'admin' ? 'student' : (role || 'student');

//   const user = await User.create({
//     fullName,
//     email,
//     passwordHash: password,
//     role: safeRole,
//     matricNumber: safeRole === 'student' ? matricNumber : undefined,
//     department,
//   });

//   // Welcome email (non-blocking)
//   sendEmail({
//     to: email,
//     subject: 'Welcome to the LMS Platform',
//     html: `<h2>Welcome, ${fullName}!</h2><p>Your account has been created successfully. You can now log in.</p>`,
//   }).catch(console.error);

//   sendTokens(user, 201, res);

//   }catch(error) {
//     next(error);
//   }
// };

// // ── Login ─────────────────────────────────────────────────────────────────────
// exports.login = async (req, res, next) => {
//   try{
//     const { email, password } = req.body;

//   const user = await User.findOne({ email }).select('+passwordHash');
//   if (!user || !(await user.comparePassword(password))) {
//     return res.status(401).json({ success: false, message: 'Invalid email or password' });
//   }
//   if (!user.isActive) {
//     return res.status(403).json({ success: false, message: 'Account is deactivated' });
//   }

//   user.lastLogin = new Date();
//   await user.save({ validateBeforeSave: false });

//   sendTokens(user, 200, res);
//   }catch(error) {
//      console.error('Registration error:', error);
//     next(error)
//   }
// };

// // ── Refresh token ─────────────────────────────────────────────────────────────
// exports.refreshToken = async (req, res, next) => {
//   try{
//     const { refreshToken } = req.body;
//   if (!refreshToken) {
//     return res.status(400).json({ success: false, message: 'Refresh token required' });
//   }

//   let decoded;
//   try {
//     decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
//   } catch {
//     return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
//   }

//   const user = await User.findById(decoded.id);
//   if (!user || user.refreshToken !== refreshToken) {
//     return res.status(401).json({ success: false, message: 'Refresh token mismatch' });
//   }

//   const newAccessToken  = signAccessToken(user._id);
//   const newRefreshToken = signRefreshToken(user._id);
//   user.refreshToken     = newRefreshToken;
//   await user.save({ validateBeforeSave: false });

//   res.json({ success: true, accessToken: newAccessToken, refreshToken: newRefreshToken });
//   }catch(error) {
//     next(error);
//   }
// };

// // ── Get current user ──────────────────────────────────────────────────────────
// exports.getMe = async (req, res, next) => {
//   try{
//     res.json({ success: true, user: req.user });
//   }catch(error) {
//     next(error);
//   }
// };

// // ── Update profile ────────────────────────────────────────────────────────────
// exports.updateProfile = async (req, res, next) => {
//   try{
//     const allowed = ['fullName', 'department', 'bio'];
//   const updates = {};
//   allowed.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

//   if (req.file) updates.profilePhotoUrl = req.file.path;

//   const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
//   res.json({ success: true, user });
//   }catch(error){
//     next(error);
//   }
// };

// // ── Change password ───────────────────────────────────────────────────────────
// exports.changePassword = async (req, res, next) => {
//   try{
//     const { currentPassword, newPassword } = req.body;
//   const user = await User.findById(req.user._id).select('+passwordHash');

//   if (!(await user.comparePassword(currentPassword))) {
//     return res.status(400).json({ success: false, message: 'Current password is incorrect' });
//   }

//   user.passwordHash = newPassword;
//   await user.save();
//   res.json({ success: true, message: 'Password updated successfully' });
//   }catch(error) {
//     next(error);
//   }
// };

// // ── Logout ────────────────────────────────────────────────────────────────────
// exports.logout = async (req, res, next) => {
//  try{
//    await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
//   res.json({ success: true, message: 'Logged out successfully' });
//  }catch(error) {
//   next(error);
//  }
// };

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendEmail } = require('../utils/email');

// ── Token helpers ─────────────────────────────────────────────────────────────
const signAccessToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1d' });

const signRefreshToken = (id) =>
  jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' });

// FIXED: Make this an async function that properly awaits
const sendTokens = async (user, statusCode, res) => {
  const accessToken = signAccessToken(user._id);
  const refreshToken = signRefreshToken(user._id);

  // Store refresh token in DB - MUST AWAIT THIS
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  // Remove sensitive data
  const userResponse = {
    _id: user._id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    department: user.department,
    matricNumber: user.matricNumber,
    isActive: user.isActive,
    profilePhotoUrl: user.profilePhotoUrl,
    bio: user.bio,
    createdAt: user.createdAt,
  };

  res.status(statusCode).json({
    success: true,
    accessToken,
    refreshToken,
    user: userResponse,
  });
};

// ── Register ──────────────────────────────────────────────────────────────────
exports.register = async (req, res, next) => {
  try {
    const { fullName, email, password, role, matricNumber, department } = req.body;

    // Basic validation
    if (!fullName || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide fullName, email, and password' 
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'User already exists with this email' 
      });
    }

    // Prevent self-registering as admin
    const safeRole = role === 'admin' ? 'student' : (role || 'student');

    const user = await User.create({
      fullName,
      email,
      passwordHash: password,
      role: safeRole,
      matricNumber: safeRole === 'student' ? matricNumber : undefined,
      department,
    });

    // Welcome email (non-blocking)
    sendEmail({
      to: email,
      subject: 'Welcome to the LMS Platform',
      html: `<h2>Welcome, ${fullName}!</h2><p>Your account has been created successfully. You can now log in.</p>`,
    }).catch(console.error);

    // Send tokens - THIS MUST BE AWAITED
    await sendTokens(user, 201, res);
    
  } catch (error) {
    console.error('Registration error:', error);
    next(error);
  }
};

// ── Login ─────────────────────────────────────────────────────────────────────
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide email and password' 
      });
    }

    const user = await User.findOne({ email }).select('+passwordHash');
    
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }
    
    if (!user.isActive) {
      return res.status(403).json({ 
        success: false, 
        message: 'Account is deactivated' 
      });
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    await sendTokens(user, 200, res);
    
  } catch (error) {
    console.error('Login error:', error);
    next(error);
  }
};

// ── Refresh token ─────────────────────────────────────────────────────────────
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ 
        success: false, 
        message: 'Refresh token required' 
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid or expired refresh token' 
      });
    }

    const user = await User.findById(decoded.id);
    
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ 
        success: false, 
        message: 'Refresh token mismatch' 
      });
    }

    const newAccessToken = signAccessToken(user._id);
    const newRefreshToken = signRefreshToken(user._id);
    user.refreshToken = newRefreshToken;
    await user.save({ validateBeforeSave: false });

    res.json({ 
      success: true, 
      accessToken: newAccessToken, 
      refreshToken: newRefreshToken 
    });
    
  } catch (error) {
    console.error('Refresh token error:', error);
    next(error);
  }
};

// ── Get current user ──────────────────────────────────────────────────────────
exports.getMe = async (req, res, next) => {
  try {
    res.json({ success: true, user: req.user });
  } catch (error) {
    next(error);
  }
};

// ── Update profile ────────────────────────────────────────────────────────────
exports.updateProfile = async (req, res, next) => {
  try {
    const allowed = ['fullName', 'department', 'bio'];
    const updates = {};
    allowed.forEach((f) => { 
      if (req.body[f] !== undefined) updates[f] = req.body[f]; 
    });

    if (req.file) updates.profilePhotoUrl = req.file.path;

    const user = await User.findByIdAndUpdate(
      req.user._id, 
      updates, 
      { new: true, runValidators: true }
    );
    
    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// ── Change password ───────────────────────────────────────────────────────────
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+passwordHash');

    if (!(await user.comparePassword(currentPassword))) {
      return res.status(400).json({ 
        success: false, 
        message: 'Current password is incorrect' 
      });
    }

    user.passwordHash = newPassword;
    await user.save();
    
    res.json({ 
      success: true, 
      message: 'Password updated successfully' 
    });
  } catch (error) {
    next(error);
  }
};

// ── Logout ────────────────────────────────────────────────────────────────────
exports.logout = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};
