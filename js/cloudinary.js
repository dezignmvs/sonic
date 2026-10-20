import { CLOUDINARY } from './config.js';

const MAX_AUDIO_BYTES = 150 * 1024 * 1024;
const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
const AUDIO_TYPES = new Set(['audio/mpeg','audio/mp3','audio/wav','audio/x-wav','audio/flac','audio/x-flac','audio/mp4','audio/aac','audio/ogg','audio/webm']);
const IMAGE_TYPES = new Set(['image/jpeg','image/png','image/webp','image/avif']);

function upload(file, kind, onProgress = () => {}, signal) {
  const audio = kind === 'audio';
  const preset = audio ? CLOUDINARY.audioUploadPreset : CLOUDINARY.imageUploadPreset;
  if (!CLOUDINARY.cloudName || !preset) return Promise.reject(new Error(`Cloudinary ${kind} preset is not configured.`));
  const allowed = audio ? AUDIO_TYPES : IMAGE_TYPES;
  const max = audio ? MAX_AUDIO_BYTES : MAX_IMAGE_BYTES;
  if (!allowed.has(file.type) && !(audio && /\.(mp3|wav|flac|m4a|aac|ogg)$/i.test(file.name))) return Promise.reject(new Error(`Unsupported ${kind} format.`));
  if (file.size > max) return Promise.reject(new Error(`${kind} file exceeds the ${Math.round(max/1024/1024)} MB limit.`));
  return new Promise((resolve, reject) => {
    const form = new FormData(); form.append('file', file); form.append('upload_preset', preset);
    const endpoint = `https://api.cloudinary.com/v1_1/${encodeURIComponent(CLOUDINARY.cloudName)}/${audio?'video':'image'}/upload`;
    const xhr = new XMLHttpRequest();
    xhr.open('POST', endpoint); xhr.upload.onprogress = e => { if(e.lengthComputable) onProgress(e.loaded/e.total); };
    xhr.onload = () => { try { const body = JSON.parse(xhr.responseText); if(xhr.status < 200 || xhr.status >= 300) throw new Error(body.error?.message || `Upload failed (${xhr.status})`); resolve({secureUrl:body.secure_url,publicId:body.public_id,bytes:body.bytes,format:body.format,duration:body.duration||0}); } catch(e) { reject(e); } };
    xhr.onerror = () => reject(new Error('Network error while uploading to Cloudinary.'));
    xhr.onabort = () => reject(new DOMException('Upload cancelled','AbortError'));
    if(signal){if(signal.aborted){xhr.abort();return;}signal.addEventListener('abort',()=>xhr.abort(),{once:true});}
    xhr.send(form);
  });
}

export const uploadAudio = (file, progress, signal) => upload(file, 'audio', progress, signal);
export const uploadArtwork = (file, progress, signal) => upload(file, 'image', progress, signal);
