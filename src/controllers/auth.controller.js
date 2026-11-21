const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../models/user.model');
const HttpError = require('../utils/httpError');

async function register(req, res) {
  const { email, password } = req.valid.body;
  const passwordHash = await bcrypt.hash(password, 10);
  try {
    const user = await User.create(email, passwordHash);
    res.status(201).json(user);
  } catch (e) {
    if (e.code === '23505') throw new HttpError(409, 'Email already registered');
    throw e;
  }
}

async function login(req, res) {
  const { email, password } = req.valid.body;
  const user = await User.findByEmail(email);
  const ok = user && (await bcrypt.compare(password, user.password_hash));
  if (!ok) throw new HttpError(401, 'Invalid email or password');

  const token = jwt.sign({ id: user.id }, config.jwtSecret, { expiresIn: '1h' });
  res.json({ token });
}

async function me(req, res) {
  res.json(await User.findById(req.user.id));
}

module.exports = { register, login, me };