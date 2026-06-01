require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const connectDB = require('../config/db');

const User   = require('../models/User');
const Course = require('../models/Course');
const { Publication, Announcement } = require('../models/Publication');
const Material = require('../models/Material');

async function seed() {
  await connectDB();
  console.log('🌱 Seeding database…');

  // Clear existing
  await Promise.all([
    User.deleteMany({}), Course.deleteMany({}),
    Publication.deleteMany({}), Announcement.deleteMany({}),
    Material.deleteMany({}),
  ]);

  // ── Lecturer ──────────────────────────────────────────────────────────────
  const lecturer = await User.create({
    fullName:   'Dr. Adebayo Okonkwo',
    email:      'lecturer@lms.edu.ng',
    passwordHash: 'password123',
    role:       'lecturer',
    department: 'Computer Science',
    bio:        'Senior Lecturer with 15 years of experience in software engineering and AI research.',
  });
  console.log('✅ Lecturer created:', lecturer.email);

  // ── Students ──────────────────────────────────────────────────────────────
  const students = await User.insertMany([
    { fullName: 'Chidi Nwachukwu', email: 'chidi@student.edu.ng', passwordHash: await bcrypt.hash('password123', 12), role: 'student', matricNumber: 'CSC/2021/001', department: 'Computer Science' },
    { fullName: 'Amaka Eze',       email: 'amaka@student.edu.ng', passwordHash: await bcrypt.hash('password123', 12), role: 'student', matricNumber: 'CSC/2021/002', department: 'Computer Science' },
    { fullName: 'Emeka Obi',       email: 'emeka@student.edu.ng', passwordHash: await bcrypt.hash('password123', 12), role: 'student', matricNumber: 'CSC/2022/001', department: 'Computer Science' },
  ]);
  console.log(`✅ ${students.length} students created`);

  // ── Courses ───────────────────────────────────────────────────────────────
  const courses = await Course.insertMany([
    {
      lecturer:        lecturer._id,
      courseCode:      'CSC 401',
      courseTitle:     'Data Structures and Algorithms',
      description:     'Advanced study of data structures including trees, graphs, hash tables, and algorithm design paradigms.',
      creditUnits:     3,
      semester:        'first',
      academicSession: '2024/2025',
      objectives:      [
        'Implement and analyse fundamental data structures',
        'Apply algorithm design techniques to solve complex problems',
        'Evaluate time and space complexity using Big-O notation',
      ],
      enrolledStudents: students.map((s) => s._id),
    },
    {
      lecturer:        lecturer._id,
      courseCode:      'CSC 403',
      courseTitle:     'Operating Systems',
      description:     'Principles of operating systems design including process management, memory management, and file systems.',
      creditUnits:     3,
      semester:        'first',
      academicSession: '2024/2025',
      objectives:      [
        'Understand process scheduling algorithms',
        'Analyse memory management techniques',
        'Implement file system concepts',
      ],
      enrolledStudents: [students[0]._id, students[1]._id],
    },
    {
      lecturer:        lecturer._id,
      courseCode:      'CSC 405',
      courseTitle:     'Database Management Systems',
      description:     'Relational database design, SQL, normalisation, transactions, and modern NoSQL databases.',
      creditUnits:     3,
      semester:        'second',
      academicSession: '2024/2025',
      objectives:      [
        'Design relational database schemas',
        'Write complex SQL queries',
        'Understand ACID properties and transactions',
      ],
      enrolledStudents: students.map((s) => s._id),
    },
  ]);
  console.log(`✅ ${courses.length} courses created`);

  // ── Publications ──────────────────────────────────────────────────────────
  await Publication.insertMany([
    {
      author:      lecturer._id,
      title:       'Adaptive Learning Systems in Nigerian Higher Education: A Framework Proposal',
      type:        'journal_article',
      journal:     'African Journal of Educational Technology',
      year:        2024,
      authors:     ['Dr. A. Okonkwo', 'Prof. B. Adeyemi'],
      abstract:    'This paper proposes a framework for implementing adaptive learning systems in resource-constrained university environments across sub-Saharan Africa.',
      isPublished: true,
    },
    {
      author:      lecturer._id,
      title:       'Evaluating Chatbot-Based Tutoring Systems for Computer Science Students',
      type:        'conference_paper',
      journal:     'IEEE AFRICON 2023',
      year:        2023,
      authors:     ['Dr. A. Okonkwo', 'Dr. C. Nwosu', 'Dr. E. Fadahunsi'],
      abstract:    'A comparative study of three chatbot-based tutoring implementations deployed in Nigerian universities, evaluating student engagement and learning outcomes.',
      isPublished: true,
    },
    {
      author:      lecturer._id,
      title:       'Machine Learning for Automated Code Assessment in Introductory Programming Courses',
      type:        'journal_article',
      journal:     'Computers & Education',
      year:        2022,
      authors:     ['Dr. A. Okonkwo'],
      abstract:    'A machine learning pipeline for automated assessment of student programming submissions, achieving 91% agreement with human graders.',
      isPublished: true,
    },
  ]);
  console.log('✅ Publications created');

  // ── Announcements ─────────────────────────────────────────────────────────
  await Announcement.insertMany([
    {
      author:   lecturer._id,
      title:    'Welcome to the 2024/2025 Academic Session',
      body:     'Welcome back, students! All course materials for the first semester have been uploaded. Please ensure you enroll in your registered courses on this platform.',
      isPinned: true,
    },
    {
      author:   lecturer._id,
      course:   courses[0]._id,
      title:    'CSC 401 — First Continuous Assessment',
      body:     'The first CA for Data Structures and Algorithms will hold in Week 6. It will cover Topics 1–5. Please review your lecture notes and past questions.',
      isPinned: false,
    },
  ]);
  console.log('✅ Announcements created');

  console.log('\n🎉 Seed complete! Login credentials:');
  console.log('   Lecturer: lecturer@lms.edu.ng / password123');
  console.log('   Student:  chidi@student.edu.ng / password123');

  await mongoose.connection.close();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
