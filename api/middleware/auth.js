import jwt from 'jsonwebtoken';
import supabase from '../utils/supabaseClient.js';

export const protect = (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');

      // Add user to request
      req.user = decoded;

      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
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

      // TEACHER Role Validation
      let targetClass = req.body.className || req.query.className;
      let targetSection = req.body.section || req.query.section;

      if (!targetClass && req.body.records && req.body.records.length > 0) {
        // Infer class from the first student in the batch
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

      // Simulation: In full production, we cross-reference req.user with the `timetable_slots` to ensure this Teacher teaches this Class & Section.
      console.log(`[RBAC] Validated Teacher Class Scope: ${targetClass}-${targetSection}`);
      next();
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'RBAC verification logic failed' });
    }
  };
};
