// routes/auth.js
const express  = require('express');
const router   = express.Router();
const ctrl     = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');

router.post('/register',        ctrl.register);
router.post('/login',           ctrl.login);
router.post('/refresh-token',   ctrl.refreshToken);
router.get( '/me',       protect, ctrl.getMe);
router.put( '/profile',  protect, upload.single('photo'), ctrl.updateProfile);
router.put( '/password', protect, ctrl.changePassword);
router.post('/logout',   protect, ctrl.logout);

module.exports = router;
