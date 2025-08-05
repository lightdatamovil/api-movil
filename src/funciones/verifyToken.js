import jwt from 'jsonwebtoken';
import { logRed, logYellow } from './logsCustom.js';

function verifyToken(req, res, next) {
  const rawAuthHeader = req.headers.authorization;

  if (!rawAuthHeader) {
    logRed('Token no proporcionado');
    return res.status(401).json({ message: 'Token no proporcionado' });
  }


  const token = rawAuthHeader.startsWith('Bearer ')
    ? rawAuthHeader.split(' ')[1]
    : rawAuthHeader;

  if (!token) {
    logRed('Token vacío o malformado');
    return res.status(401).json({ message: 'Token no válido o malformado' });
  }

  jwt.verify(token, 'ruteate', (err, decoded) => {
    if (err) {
      logRed('Token inválido');
      return res.status(403).json({ message: 'Token inválido' });
    }

    req.decoded = decoded;

    req.context = {
      deviceId: req.header('X-Device-Id'),
      androidVersion: req.header('X-Android-Version'),
      appVersion: req.header('X-App-Version'),
      brand: req.header('X-Brand'),
      model: req.header('X-Model')
    };

    logYellow(`[Auth OK] Usuario ID: ${decoded.userId} desde ${req.context.brand} ${req.context.model}, App ${req.context.appVersion}`);

    next();
  });
}

export default verifyToken;