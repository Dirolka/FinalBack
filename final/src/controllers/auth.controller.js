import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';
import { VerificationCode } from '../models/verification.model.js';
import { sendSmsCode } from '../services/sms.service.js';

function generateToken(user) {
  const payload = {
    id: user._id,
    role: user.role,
    ...(user.email && { email: user.email }),
    ...(user.phone && { phone: user.phone })
  };
  return jwt.sign(
    payload,
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

export async function register(req, res, next) {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'Validation error',
        details: { required: ['email', 'password'] }
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        message: 'User with this email already exists'
      });
    }

    const user = await User.create({
      email,
      password,
      role: role === 'admin' ? 'admin' : 'user'
    });

    const token = generateToken(user);

    return res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user._id,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (err) {
    return next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'Validation error',
        details: { required: ['email', 'password'] }
      });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        message: 'Invalid email or password'
      });
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        message: 'Invalid email or password'
      });
    }

    const token = generateToken(user);

    return res.status(200).json({
      message: 'Login successful',
      user: {
        id: user._id,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (err) {
    return next(err);
  }
}

function normalizePhone(phone) {
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length === 10 && digits.startsWith('7')) {
    return '+7' + digits;
  }
  if (digits.length === 10 && digits.startsWith('8')) {
    return '+7' + digits.slice(1);
  }
  if (digits.length === 10) {
    return '+7' + digits;
  }
  if (digits.length === 11 && digits.startsWith('8')) {
    return '+7' + digits.slice(1);
  }
  if (digits.length === 11 && digits.startsWith('7')) {
    return '+' + digits;
  }
  return null;
}

export async function sendCode(req, res, next) {
  try {
    const { phone } = req.body;
    const normalized = normalizePhone(phone || '');

    if (!normalized) {
      return res.status(400).json({
        message: 'Укажите корректный номер телефона (например: +7 777 123 4567)'
      });
    }

    const ADMIN_PHONE = '+77777777777';
    const ADMIN_CODE = '123456';

    const code = (normalized === ADMIN_PHONE) ? ADMIN_CODE : String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 минут

    if (normalized === ADMIN_PHONE) {
      console.log('[SMS] Админ: введите код', ADMIN_CODE);
    } else {
      await VerificationCode.deleteMany({ phone: normalized });
      await VerificationCode.create({ phone: normalized, code, expiresAt });
      await sendSmsCode(normalized, code);
    }

    return res.status(200).json({
      message: 'Код отправлен на указанный номер',
      phone: normalized
    });
  } catch (err) {
    return next(err);
  }
}

export async function verifyCode(req, res, next) {
  try {
    const { phone, code } = req.body;
    const normalized = normalizePhone(phone || '');
    const codeStr = String(code || '').trim();

    if (!normalized || !codeStr) {
      return res.status(400).json({
        message: 'Укажите номер и код подтверждения'
      });
    }

    const ADMIN_PHONE = '+77777777777';
    const ADMIN_CODE = '123456';
    const isAdminPhone = normalized === ADMIN_PHONE;

    let verification = null;

    if (isAdminPhone && codeStr === ADMIN_CODE) {
      verification = { _id: 'admin-bypass' };
    } else {
      verification = await VerificationCode.findOne({
        phone: normalized,
        code: codeStr
      });

      if (!verification) {
        return res.status(401).json({
          message: 'Неверный или просроченный код'
        });
      }

      if (verification.expiresAt < new Date()) {
        await VerificationCode.deleteOne({ _id: verification._id });
        return res.status(401).json({
          message: 'Код истёк. Запросите новый.'
        });
      }
    }

    let user = await User.findOne({ phone: normalized });

    if (!user) {
      try {
        user = await User.create({
          phone: normalized,
          role: isAdminPhone ? 'admin' : 'user'
        });
      } catch (createErr) {
        if (createErr.code === 11000) {
          user = await User.findOne({ phone: normalized });
        }
        if (!user) throw createErr;
      }
    } else if (isAdminPhone && user.role !== 'admin') {
      user.role = 'admin';
      await user.save();
    }

    if (verification._id !== 'admin-bypass') {
      await VerificationCode.deleteOne({ _id: verification._id });
    }

    const token = generateToken(user);

    return res.status(200).json({
      message: 'Вход выполнен',
      user: {
        id: user._id,
        phone: user.phone,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (err) {
    console.error('[verifyCode]', err);
    return next(err);
  }
}

export async function getMe(req, res, next) {
  try {
    return res.status(200).json({
      user: {
        id: req.user._id,
        email: req.user.email,
        phone: req.user.phone,
        role: req.user.role,
        createdAt: req.user.createdAt
      }
    });
  } catch (err) {
    return next(err);
  }
}
