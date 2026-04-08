import { test, expect, type Page } from "@playwright/test";
import { getGlobalConfig } from "@tools/test-tools";

/**
 * Integration tests for Tools.LoadScript in web workers.
 *
 * Requires the CDN server (babylon-server) to be running on localhost:1337.
 */
test.describe("Tools.LoadScript in workers", () => {
    /**
     * Helper: creates a worker, waits for it to post a message back, and returns that message.
     * @param page - Playwright page to create the worker from.
     * @param workerCode - JavaScript source for the worker.
     * @param workerType - "classic" or "module".
     * @returns The message string posted by the worker.
     */
    async function runWorker(page: Page, workerCode: string, workerType: "classic" | "module"): Promise<string> {
        return page.evaluate(
            async ({ code, type }) => {
                return new Promise<string>((resolve, reject) => {
                    const blob = new Blob([code], { type: "text/javascript" });
                    const blobUrl = URL.createObjectURL(blob);
                    const worker = new Worker(blobUrl, { type });

                    const timeout = setTimeout(() => {
                        worker.terminate();
                        URL.revokeObjectURL(blobUrl);
                        reject(new Error("Worker timed out"));
                    }, 15000);

                    worker.onmessage = (e) => {
                        clearTimeout(timeout);
                        worker.terminate();
                        URL.revokeObjectURL(blobUrl);
                        resolve(e.data as string);
                    };

                    worker.onerror = (e) => {
                        clearTimeout(timeout);
                        worker.terminate();
                        URL.revokeObjectURL(blobUrl);
                        reject(new Error("Worker error: " + e.message));
                    };
                });
            },
            { code: workerCode, type: workerType }
        );
    }

    test("succeeds in a classic worker via importScripts", async ({ browser }) => {
        const page = await browser.newPage();
        const baseUrl = getGlobalConfig().baseUrl;
        const babylonUrl = `${baseUrl}/babylon.js`;

        await page.goto(`${baseUrl}/empty.html`, { waitUntil: "load", timeout: 0 });

        // In a classic worker, importScripts is available and LoadScript
        // should use it directly without needing the import() fallback.
        const workerCode = `
            importScripts("${babylonUrl}");
            self.BABYLON.Tools.LoadScript(
                "${babylonUrl}",
                () => self.postMessage("success"),
                (msg) => self.postMessage("error:" + msg)
            );
        `;

        const result = await runWorker(page, workerCode, "classic");
        expect(result).toBe("success");
        await page.close();
    });

    test("succeeds in a module-type worker via import() fallback", async ({ browser }) => {
        const page = await browser.newPage();
        const baseUrl = getGlobalConfig().baseUrl;
        const babylonUrl = `${baseUrl}/babylon.js`;

        await page.goto(`${baseUrl}/empty.html`, { waitUntil: "load", timeout: 0 });

        // In a module worker, importScripts throws TypeError. LoadScript
        // should fall back to dynamic import() — the code path from PR #18144.
        const workerCode = `
            import("${babylonUrl}").then(() => {
                self.BABYLON.Tools.LoadScript(
                    "${babylonUrl}",
                    () => self.postMessage("success"),
                    (msg) => self.postMessage("error:" + msg)
                );
            }).catch((e) => {
                self.postMessage("import-failed:" + e.message);
            });
        `;

        const result = await runWorker(page, workerCode, "module");
        expect(result).toBe("success");
        await page.close();
    });
});
