import crypto from 'crypto';

export function generateUUID(title, startTime) {
    const hash = crypto.createHash('sha3-256');
    const data = `${title}${startTime}`;
    hash.update(data);
    return hash.digest('hex');
  }