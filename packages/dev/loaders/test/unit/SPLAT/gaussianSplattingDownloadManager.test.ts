import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Tools } from "core/Misc/tools";
import { GaussianSplattingDownloadManager } from "loaders/SPLAT/gaussianSplattingDownloadManager";

// A fake in-flight request the test drives. Mirrors the subset of Tools.LoadFile the manager relies on.
interface IFakeRequest {
    url: string;
    succeed: (data?: ArrayBuffer) => void;
    fail: (error?: any) => void;
    aborted: boolean;
}

// Lets the microtask queue drain so the manager's async download loop can advance.
async function FlushAsync(): Promise<void> {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
}

describe("GaussianSplattingDownloadManager", () => {
    let requests: IFakeRequest[];
    let loadSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        requests = [];
        loadSpy = vi.spyOn(Tools, "LoadFile").mockImplementation(((url: string, onSuccess: any, _onProgress: any, _offline: any, _useArrayBuffer: any, onError: any) => {
            const req: IFakeRequest = {
                url,
                aborted: false,
                succeed: (data: ArrayBuffer = new ArrayBuffer(1)) => onSuccess(data, undefined),
                fail: (error: any = new Error("load failed")) => onError?.(undefined, error),
            };
            requests.push(req);
            // abort() intentionally does NOT call onError, matching the real IFileRequest.abort behavior.
            return { onCompleteObservable: undefined, abort: () => (req.aborted = true) } as any;
        }) as any);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    function FindRequest(url: string): IFakeRequest {
        const req = requests.find((r) => r.url === url);
        if (!req) {
            throw new Error(`No request started for ${url}`);
        }
        return req;
    }

    it("caps the number of concurrent downloads", async () => {
        const manager = new GaussianSplattingDownloadManager({ maxConcurrent: 2 });
        ["a", "b", "c", "d", "e"].forEach((u) => void manager.loadFileAsync(u));
        await FlushAsync();

        // Only the first two start; the rest wait in the FIFO queue.
        expect(requests.map((r) => r.url)).toEqual(["a", "b"]);

        // Completing one frees exactly one slot.
        FindRequest("a").succeed();
        await FlushAsync();
        expect(requests.map((r) => r.url)).toEqual(["a", "b", "c"]);

        FindRequest("b").succeed();
        FindRequest("c").succeed();
        await FlushAsync();
        expect(requests.map((r) => r.url)).toEqual(["a", "b", "c", "d", "e"]);
    });

    it("drains the queue in FIFO order", async () => {
        const manager = new GaussianSplattingDownloadManager({ maxConcurrent: 1 });
        ["x", "y", "z"].forEach((u) => void manager.loadFileAsync(u));
        await FlushAsync();

        FindRequest("x").succeed();
        await FlushAsync();
        FindRequest("y").succeed();
        await FlushAsync();
        FindRequest("z").succeed();
        await FlushAsync();

        expect(requests.map((r) => r.url)).toEqual(["x", "y", "z"]);
    });

    it("retries a failed download and resolves on success", async () => {
        const manager = new GaussianSplattingDownloadManager({ maxRetries: 2 });
        const result = manager.loadFileAsync("flaky");
        await FlushAsync();

        requests[0].fail();
        await FlushAsync();
        requests[1].fail();
        await FlushAsync();
        requests[2].succeed(new ArrayBuffer(8));

        expect((await result).byteLength).toBe(8);
        expect(requests).toHaveLength(3);
    });

    it("rejects after exhausting retries", async () => {
        const manager = new GaussianSplattingDownloadManager({ maxRetries: 2 });
        const result = manager.loadFileAsync("dead");

        // 1 initial attempt + 2 retries, each failing.
        for (let i = 0; i < 3; i++) {
            await FlushAsync();
            requests[i].fail(new Error("always fails"));
        }
        await expect(result).rejects.toThrow("always fails");
        expect(requests).toHaveLength(3);
    });

    it("is idempotent: concurrent requests for the same URL share one download", async () => {
        const manager = new GaussianSplattingDownloadManager();
        const p1 = manager.loadFileAsync("same");
        const p2 = manager.loadFileAsync("same");
        await FlushAsync();

        expect(requests).toHaveLength(1);
        FindRequest("same").succeed(new ArrayBuffer(4));
        const [r1, r2] = await Promise.all([p1, p2]);
        expect(r1).toBe(r2);
    });

    it("downloads again after a previous request for the same URL settled", async () => {
        const manager = new GaussianSplattingDownloadManager();
        const p1 = manager.loadFileAsync("twice");
        await FlushAsync();
        requests[0].succeed();
        await p1;

        const p2 = manager.loadFileAsync("twice");
        await FlushAsync();
        requests[1].succeed();
        await p2;

        expect(requests).toHaveLength(2);
    });

    it("aborts queued and in-flight downloads when disposed", async () => {
        const manager = new GaussianSplattingDownloadManager({ maxConcurrent: 1 });
        const active = manager.loadFileAsync("running");
        const queued = manager.loadFileAsync("waiting");
        await FlushAsync();
        expect(requests.map((r) => r.url)).toEqual(["running"]);

        manager.dispose();
        await expect(queued).rejects.toThrow("disposed");
        await expect(active).rejects.toThrow("disposed");
        // The in-flight HTTP request is actually aborted.
        expect(FindRequest("running").aborted).toBe(true);
        await expect(manager.loadFileAsync("after")).rejects.toThrow("disposed");
    });

    it("cancels a queued download before it starts", async () => {
        const manager = new GaussianSplattingDownloadManager({ maxConcurrent: 1 });
        const active = manager.loadFileAsync("a");
        const queued = manager.loadFileAsync("b");
        await FlushAsync();

        // "b" is still queued — cancelling it never starts a download for it.
        manager.cancel("b");
        await expect(queued).rejects.toThrow("cancelled");

        FindRequest("a").succeed();
        await active;
        expect(requests.map((r) => r.url)).toEqual(["a"]);
    });

    it("cancelling an in-flight download aborts it and frees its slot for the next queued download", async () => {
        const manager = new GaussianSplattingDownloadManager({ maxConcurrent: 1 });
        const active = manager.loadFileAsync("a");
        const queued = manager.loadFileAsync("b");
        await FlushAsync();
        expect(requests.map((r) => r.url)).toEqual(["a"]);

        manager.cancel("a");
        await expect(active).rejects.toThrow("cancelled");
        expect(FindRequest("a").aborted).toBe(true);
        await FlushAsync();
        // The freed slot lets "b" start.
        expect(requests.map((r) => r.url)).toEqual(["a", "b"]);

        // A late success on the aborted request is ignored (the promise stays rejected).
        FindRequest("a").succeed();
        await expect(active).rejects.toThrow("cancelled");

        FindRequest("b").succeed(new ArrayBuffer(2));
        await expect(queued).resolves.toBeInstanceOf(ArrayBuffer);
    });

    it("cancelGroup cancels every download tagged with the group", async () => {
        const manager = new GaussianSplattingDownloadManager({ maxConcurrent: 2 });
        const g1 = manager.loadFileAsync("g/1", "fileA");
        const g2 = manager.loadFileAsync("g/2", "fileA");
        const g3 = manager.loadFileAsync("g/3", "fileA");
        const other = manager.loadFileAsync("h/1", "fileB");
        await FlushAsync();

        manager.cancelGroup("fileA");
        await expect(g1).rejects.toThrow("cancelled");
        await expect(g2).rejects.toThrow("cancelled");
        await expect(g3).rejects.toThrow("cancelled");
        // The in-flight group members were aborted.
        expect(FindRequest("g/1").aborted).toBe(true);
        expect(FindRequest("g/2").aborted).toBe(true);

        // A download in a different group is untouched.
        await FlushAsync();
        FindRequest("h/1").succeed(new ArrayBuffer(1));
        await expect(other).resolves.toBeInstanceOf(ArrayBuffer);
    });

    it("ignores cancel for an unknown or already-settled URL", async () => {
        const manager = new GaussianSplattingDownloadManager();
        expect(() => manager.cancel("never")).not.toThrow();

        const result = manager.loadFileAsync("done");
        await FlushAsync();
        FindRequest("done").succeed(new ArrayBuffer(2));
        expect((await result).byteLength).toBe(2);

        // Already settled: cancel is a no-op and cancelGroup on an unknown group is safe.
        expect(() => manager.cancel("done")).not.toThrow();
        expect(() => manager.cancelGroup("missing")).not.toThrow();
    });
});
