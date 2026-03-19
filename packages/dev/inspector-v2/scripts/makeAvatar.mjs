/* eslint-disable no-console */

/**
 * Resizes a PNG image to a 32x32 avatar and prints its base64 encoding to stdout.
 *
 * Usage: node scripts/makeAvatar.mjs <source> [zoom]
 *
 * The source can be:
 *   - A local file path
 *   - An HTTP/HTTPS URL pointing to a raw image
 *   - A Babylon.js forum username (e.g. "RaananW") — the avatar is fetched from the forum
 *
 * The optional zoom argument (0–1) crops to a centered portion of the source
 * before resizing. For example, 0.75 keeps the inner 75% of the image.
 */

import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { get as httpsGet } from "node:https";
import { get as httpGet } from "node:http";
import { resolve } from "node:path";
import sharp from "sharp";

const inputPath = process.argv[2];
if (!inputPath) {
    console.error("Usage: node scripts/makeAvatar.mjs <file-path | url | forum-username> [zoom]");
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
                const redirectUrl = new URL(res.headers.location, url).href;
                resolve(fetchUrl(redirectUrl, maxRedirects - 1));
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

async function fetchForumAvatarUrl(username, size = 96) {
    const userJson = JSON.parse((await fetchUrl(`https://forum.babylonjs.com/u/${username}.json`)).toString("utf-8"));
    const avatarTemplate = userJson.user?.avatar_template;
    if (!avatarTemplate) {
        throw new Error(`No avatar found for forum user "${username}"`);
    }
    const relativePath = avatarTemplate.replace("{size}", String(size));
    return `https://forum.babylonjs.com${relativePath}`;
}

const isUrl = /^https?:\/\//i.test(inputPath);
const isFilePath = !isUrl && (inputPath.includes("/") || inputPath.includes("\\") || existsSync(resolve(inputPath)));

let inputBuffer;
if (isUrl) {
    inputBuffer = await fetchUrl(inputPath);
} else if (isFilePath) {
    inputBuffer = await readFile(resolve(inputPath));
} else {
    // Treat as a Babylon.js forum username
    const avatarUrl = await fetchForumAvatarUrl(inputPath);
    inputBuffer = await fetchUrl(avatarUrl);
}

const pipeline = sharp(inputBuffer);

if (zoom !== undefined && zoom < 1) {
    const { width, height } = await pipeline.metadata();
    if (width === undefined || height === undefined) {
        console.error("Unable to determine image dimensions.");
        process.exit(1);
    }
    const cropWidth = Math.round(width * zoom);
    const cropHeight = Math.round(height * zoom);
    const left = Math.round((width - cropWidth) / 2);
    const top = Math.round((height - cropHeight) / 2);
    pipeline.extract({ left, top, width: cropWidth, height: cropHeight });
}

const resizedBuffer = await pipeline
    .resize(32, 32, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

console.log(resizedBuffer.toString("base64"));
