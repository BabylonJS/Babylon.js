// From https://github.com/webpack/webpack/discussions/14648#discussioncomment-1589272
/**
 * This class wraps a regular URL worker into a blob.
 * It is a common scenario to have the website served from one domain, and scripts from another one.
 * This can cause CSP issues if worker-src does not include the domain that serves the scripts. By
 * wrapping the worker into a blob, the only CSP required for worker-src is blob and the worker will
 * load correctly. script-src must still include the domain that serves the worker script and dependencies.
 */
export class BlobWorkerWrapper {
    private readonly _worker: Worker;
    /**
     * Creates a new instance of the BlobWorkerWrapper class.
     * @param url The URL of the worker script that needs to be wrapper into a blob.
     */
    public constructor(url: URL) {
        const workerScript = `
            const scriptUrl = new URL("${url.toString()}");
            const originalImportScripts = self.importScripts;
            self.importScripts = (url) => originalImportScripts.call(self, new URL(url.split("/").pop(), scriptUrl).toString());
            importScripts(scriptUrl.toString());
        `;
        const objectURL = URL.createObjectURL(
            new Blob([workerScript], {
                type: "application/javascript",
            })
        );
        this._worker = new Worker(objectURL);
        URL.revokeObjectURL(objectURL);
    }

    /**
     * Gets the underlying Worker instance created by this CorsWorker.
     * @returns The underlying Worker instance created by this CorsWorker.
     */
    public getWorker(): Worker {
        return this._worker;
    }
}
