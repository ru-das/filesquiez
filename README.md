# FileSquiez

Compress a file toward a size you choose. The work happens in your browser: the page reads the file locally, compresses it, and hands you a download. There is no upload and no account.

If the result would be larger than the original, you get the original back. If the file is already under the target, it is left unchanged. When the target cannot be reached without changing the format, the page says so and suggests what to try instead.

## Run it

There is no build step. The service worker needs HTTP, so open the folder through a local server rather than as a file.

```sh
python3 -m http.server 8080 --bind 127.0.0.1
```

Then open http://127.0.0.1:8080

The first visit caches the page. The PNG, document, and PDF engines download the first time you compress that kind of file, then stay cached for later visits.

## What it can compress

| Files | What happens |
|---|---|
| JPEG, PNG, WebP | Quality and dimensions are reduced until the file is near the target. Metadata is stripped. JPEG and WebP stay in their own format; PNG is requantized. |
| PDF | The file is repacked first. If that is still too big, each page is redrawn as an image. Text in that result is no longer selectable or searchable. |
| DOCX, XLSX, PPTX, ODT, EPUB | The package is repacked, and embedded images are recompressed. A document with no images may not get much smaller. |
| JSON, CSS, SVG, XML, HTML, JS | Whitespace and comments are removed. An aggressive target often needs a real archive format instead. |

Anything else is returned unchanged, with a note. Audio and video are not compressed.