/* eslint-disable no-console */

/**
 * Resizes a PNG image to a 32x32 avatar and prints its base64 encoding to stdout.
 *
 * Usage: node scripts/makeAvatar.mjs <path-or-url> [zoom]
 *
 * The first argument can be a local file path or an HTTP/HTTPS URL.
 * The optional zoom argument (0–1) crops to a centered portion of the source
 * before resizing. For example, 0.75 keeps the inner 75% of the image.
 */

import { readFile } from "node:fs/promises";
import { get as httpsGet } from "node:https";
import { get as httpGet } from "node:http";
import { resolve } from "node:path";
import sharp from "sharp";

const inputPath = process.argv[2];
if (!inputPath) {
    console.error("Usage: node scripts/makeAvatar.mjs <path-or-url> [zoom]");
    process.exit(1);
}

const zoom = process.argv[3] ? parseFloat(process.argv[3]) : undefined;
if (zoom !== undefined && (isNaN(zoom) || zoom <= 0 || zoom > 1)) {
    console.error("Zoom must be a number between 0 (exclusive) and 1 (inclusive).");
    process.exit(1);
}

function fetchUrl(url, maxRedirects = 5) {
    return new Promise((resolve, reject) => {
        const getter = url.startsWith("https") ? httpsGet : httpGet;
        getter(url, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                if (maxRedirects <= 0) {
                    reject(new Error("Too many redirects"));
                    return;
                }
                resolve(fetchUrl(res.headers.location, maxRedirects - 1));
                return;
            }
            if (res.statusCode !== 200) {
                reject(new Error(`HTTP ${res.statusCode} for ${url}`));
                return;
            }
            const chunks = [];
            res.on("data", (chunk) => chunks.push(chunk));
            res.on("end", () => resolve(Buffer.concat(chunks)));
            res.on("error", reject);
        }).on("error", reject);
    });
}

const isUrl = /^https?:\/\//i.test(inputPath);
const inputBuffer = isUrl ? await fetchUrl(inputPath) : await readFile(resolve(inputPath));

let pipeline = sharp(inputBuffer);

if (zoom !== undefined && zoom < 1) {
    const metadata = await sharp(inputBuffer).metadata();
    const srcWidth = metadata.width;
    const srcHeight = metadata.height;
    const cropWidth = Math.round(srcWidth * zoom);
    const cropHeight = Math.round(srcHeight * zoom);
    const left = Math.round((srcWidth - cropWidth) / 2);
    const top = Math.round((srcHeight - cropHeight) / 2);
    pipeline = pipeline.extract({ left, top, width: cropWidth, height: cropHeight });
}

const resizedBuffer = await pipeline
    .resize(32, 32, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

console.log(resizedBuffer.toString("base64"));
