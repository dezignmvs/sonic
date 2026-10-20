// Copy this file to config.js and add your own public client identifiers.
// Never put Cloudinary API secrets, private keys, or service account JSON here.
export const APP_NAME = 'Sonic';
export const AUDIUS_API_KEY = ''; // Optional: public read-only key for higher rate limits.
export const JAMENDO_CLIENT_ID = ''; // Required to enable Jamendo discovery. Public API client ID, not a secret.
export const FIREBASE_CONFIG = {
  apiKey: '', authDomain: '', projectId: '', appId: ''
};
export const CLOUDINARY = {
  cloudName: '',
  audioUploadPreset: '', // Restrict formats and size in Cloudinary settings.
  imageUploadPreset: ''
};
