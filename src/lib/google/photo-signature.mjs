import { createHmac, timingSafeEqual } from 'node:crypto';
export function validPhotoRequest(name,width){return typeof name==='string'&&name.length<=2500&&/^places\/[A-Za-z0-9_-]+\/photos\/[A-Za-z0-9_-]+$/.test(name)&&Number.isInteger(width)&&width>=64&&width<=1600;}
export function signPhoto(name,width,key){return key&&validPhotoRequest(name,width)?createHmac('sha256',key).update(`place-photo:${name}:${width}`).digest('base64url'):null;}
export function verifyPhoto(name,width,signature,key){const expected=signPhoto(name,width,key);return !!expected&&typeof signature==='string'&&signature.length===expected.length&&timingSafeEqual(Buffer.from(expected),Buffer.from(signature));}
