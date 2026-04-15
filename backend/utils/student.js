const db = require('../config/database');

const isProvided = (value) => value !== undefined && value !== null && value !== '';

async function getStudentRecordByUserId(userId) {
  if (!isProvided(userId)) {
    return null;
  }

  return db.get('SELECT * FROM students WHERE user_id = ?', [userId]);
}

async function resolveStudentRecord(candidate, fallbackUserId = null) {
  if (isProvided(candidate)) {
    const byStudentId = await db.get('SELECT * FROM students WHERE id = ?', [candidate]);
    if (byStudentId) {
      return byStudentId;
    }

    const byUserId = await db.get('SELECT * FROM students WHERE user_id = ?', [candidate]);
    if (byUserId) {
      return byUserId;
    }
  }

  if (isProvided(fallbackUserId)) {
    return getStudentRecordByUserId(fallbackUserId);
  }

  return null;
}

async function requireStudentRecord(candidate, fallbackUserId = null) {
  const student = await resolveStudentRecord(candidate, fallbackUserId);

  if (!student) {
    const error = new Error('Student record not found');
    error.status = 400;
    throw error;
  }

  return student;
}

module.exports = {
  getStudentRecordByUserId,
  resolveStudentRecord,
  requireStudentRecord
};
