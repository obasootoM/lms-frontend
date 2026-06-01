// const mongoose = require('mongoose');
// const bcrypt   = require('bcryptjs');

// const userSchema = new mongoose.Schema(
//   {
//     fullName:       { type: String, required: true, trim: true },
//     email:          { type: String, required: true, unique: true, lowercase: true, trim: true },
//     passwordHash:   { type: String, required: true },
//     role:           { type: String, enum: ['lecturer', 'student', 'admin'], default: 'student' },
//     matricNumber:   { type: String, unique: true, sparse: true, trim: true }, // students only
//     department:     { type: String, trim: true },
//     profilePhotoUrl:{ type: String },
//     bio:            { type: String },
//     isActive:       { type: Boolean, default: true },
//     lastLogin:      { type: Date },
//     refreshToken:   { type: String },
//   },
//   { timestamps: true }
// );

// // Hash password before save
// userSchema.pre('save', async function (next) {
//   if (!this.isModified('passwordHash')) return next();
//   this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
//   next();
// });

// // Compare password
// userSchema.methods.comparePassword = async function (candidatePassword) {
//   return bcrypt.compare(candidatePassword, this.passwordHash);
// };

// // Strip sensitive fields from JSON output
// userSchema.methods.toJSON = function () {
//   const obj = this.toObject();
//   delete obj.passwordHash;
//   delete obj.refreshToken;
//   return obj;
// };

// module.exports = mongoose.model('User', userSchema);

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['lecturer', 'student', 'admin'], default: 'student' },
    matricNumber: { type: String, unique: true, sparse: true, trim: true },
    department: { type: String, trim: true },
    profilePhotoUrl: { type: String },
    bio: { type: String },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },
    refreshToken: { type: String },
  },
  { timestamps: true }
);

// FIXED: Hash password before save - Using async/await (no 'next' parameter)
userSchema.pre('save', async function () {
  if (this.isModified('passwordHash')) {
    this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Strip sensitive fields from JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.refreshToken;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
