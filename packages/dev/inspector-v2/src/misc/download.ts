/**
 * Downloads a blob through an active document.
 * @param blob The data to download.
 * @param filename The suggested filename.
 * @param document The document used to initiate the download.
 * @internal
 */
export function DownloadBlob(blob: Blob, filename: string, document: Document): void {
    const url = URL.createObjectURL(blob);
    try {
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = filename;
        document.body.appendChild(anchor);
        try {
            anchor.click();
        } finally {
            anchor.remove();
        }
    } finally {
        // Give the browser time to consume the download before releasing its backing URL.
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
}
