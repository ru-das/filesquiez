const by = {
  png: 'Convert it to JPEG or WebP (best for photos) to reach a smaller size.',
  jpg: 'Convert it to WebP, or reduce the target expectation; JPEG is already near its limit at this size.',
  jpeg: 'Convert it to WebP, or reduce the target expectation; JPEG is already near its limit at this size.',
  webp: 'Try a larger target size; WebP is already very efficient.',
  bmp: 'Convert it to PNG or JPEG; BMP is uncompressed.',
  gif: 'Convert it to WebP or MP4 for much smaller animations.',
  avif: 'Try a larger target size; AVIF is already very efficient.',
  pdf: 'Export or re-save the document with lower-resolution images, or split it into smaller PDFs.',
  docx: 'Export it to PDF, or remove large images from the document.',
  xlsx: 'Export the sheets to CSV and zip them, or remove large images and unused sheets.',
  pptx: 'Export it to PDF, or remove large images and media.',
  odt: 'Export it to PDF, or remove large images.',
  epub: 'Export it to PDF, or remove large images.',
  svg: 'Zip it (ZIP/GZIP), or simplify the paths in a vector editor.',
  json: 'Zip it (ZIP/GZIP) for a much smaller file.',
  xml: 'Zip it (ZIP/GZIP) for a much smaller file.',
  html: 'Zip it (ZIP/GZIP) for a much smaller file.',
  htm: 'Zip it (ZIP/GZIP) for a much smaller file.',
  css: 'Zip it (ZIP/GZIP) for a much smaller file.',
  js: 'Zip it (ZIP/GZIP) for a much smaller file.',
  mjs: 'Zip it (ZIP/GZIP) for a much smaller file.',
  txt: 'Convert it to a ZIP archive for a much smaller file.',
  csv: 'Convert it to a ZIP archive for a much smaller file.',
  md: 'Convert it to a ZIP archive for a much smaller file.',
  mp3: 'Re-encode it as a lower-bitrate MP3 or Opus.',
  wav: 'Convert it to MP3 or Opus.',
  flac: 'Convert it to MP3 or Opus.',
  aac: 'Re-encode it as a lower-bitrate AAC, MP3 or Opus.',
  ogg: 'Re-encode it at a lower bitrate.',
  mp4: 'Re-encode it as a lower-resolution H.264 MP4.',
  mov: 'Convert it to a lower-resolution H.264 MP4.',
  mkv: 'Convert it to a lower-resolution H.264 MP4.',
  avi: 'Convert it to a lower-resolution H.264 MP4.',
  webm: 'Re-encode it at a lower resolution or bitrate.',
  zip: 'Remove large files from the archive, or convert its contents (images to WebP, documents to PDF) before zipping.',
};

export function suggest(file, targetKB) {
  const ext = file.name.split('.').pop().toLowerCase();
  return `Could not reach ${targetKB} KB while keeping the ${ext.toUpperCase()} format. ` +
    (by[ext] || 'Convert it to a more compact format, or choose a larger target size.');
}

export const unsupportedNote = 'This file type cannot be compressed further while keeping its format.';
