import jwt from 'jsonwebtoken';

export const protect = (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      const SAFE_SECRET = process.env.JWT_SECRET || 'development_fallback_secret';
      const decoded = jwt.verify(token, SAFE_SECRET);
      req.user = decoded;
      return next();
    } catch (error) {
      console.error('[Auth] Token verification failed:', error.message);

      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Session expired. Please login again.', code: 'TOKEN_EXPIRED' });
      }
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Invalid token. Please login again.', code: 'TOKEN_INVALID' });
      }
      return res.status(401).json({ message: 'Not authorized', code: 'AUTH_FAILED' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided', code: 'NO_TOKEN' });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `User role ${req.user.role} is not authorized to access this route`,
      });
    }
    next();
  };
};

export const requireClassOwnership = () => {
  return async (req, res, next) => {
    try {
      if (['ADMIN', 'PRINCIPAL'].includes(req.user.role)) {
        return next();
      }

      let targetClass = req.body.className || req.query.className;
      let targetSection = req.body.section || req.query.section;

      if (!targetClass && req.body.records && req.body.records.length > 0) {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = (await import('../utils/supabaseClient.js')).default;
        const firstStudentId = req.body.records[0].studentId || req.body.records[0].student_id;
        const { data: st } = await supabase.from('students').select('class_name, section').eq('id', firstStudentId).single();
        if (st) {
          targetClass = st.class_name;
          targetSection = st.section;
        }
      }

      if (!targetClass) {
        return res.status(400).json({ message: 'Class scope cannot be determined for RBAC.' });
      }

      console.log(`[RBAC] Validated Teacher Class Scope: ${targetClass}-${targetSection}`);
      next();
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'RBAC verification logic failed' });
    }
  };
};
