import test from 'node:test';
import assert from 'node:assert/strict';
import { signPhoto,verifyPhoto,validPhotoRequest } from '../src/lib/google/photo-signature.mjs';
test('photo proxy accepts only signed fixed-shape resources and bounded widths',()=>{
 const name='places/place_123/photos/photo-456',key='fixture-signing-key';
 const signature=signPhoto(name,1200,key);
 assert.equal(verifyPhoto(name,1200,signature,key),true);
 assert.equal(verifyPhoto(name,800,signature,key),false);
 assert.equal(verifyPhoto(name,1200,signature,'different'),false);
 assert.equal(validPhotoRequest('places/../secrets?key=bad',1200),false);
 assert.equal(validPhotoRequest(name,4800),false);
 assert.equal(verifyPhoto(name,1200,null,key),false);
});
