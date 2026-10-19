/**
 * @vitest-environment jsdom
 */

import { type EngineContext, type Screenshot, type SurfaceContext } from "@babylonjs/lite";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CaptureController } from "../../src/lite/services/panes/captureController";

const { CaptureScreenshot } = vi.hoisted(() => ({
    CaptureScreenshot: vi.fn<(surface: SurfaceContext) => Promise<Screenshot>>(),
}));

vi.mock("@babylonjs/lite", () => ({ captureScreenshot: CaptureScreenshot }));

function Deferred<T>() {
    let resolve!: (value: T) => void;
    let reject!: (error: unknown) => void;
    const promise = new Promise<T>((resolvePromise, rejectPromise) => {
        resolve = resolvePromise;
        reject = rejectPromise;
    });
    return { promise, resolve, reject };
}

const Shot: Screenshot = { width: 2, height: 1, data: new Uint8ClampedArray([255, 0, 0, 255, 0, 255, 0, 255]) };

describe("Babylon Lite capture controller", () => {
    let controller: CaptureController;
    let engine: EngineContext;
    let surfaces: SurfaceContext[];
    let drawPixels: ReturnType<typeof vi.fn>;
    let createImage: ReturnType<typeof vi.fn>;
    let click: ReturnType<typeof vi.spyOn>;
    let stopTrack: ReturnType<typeof vi.fn>;
    let stream: MediaStream;
    let recorder: TestRecorder | undefined;
    let encodingCallback: BlobCallback;

    class TestRecorder {
        public static isTypeSupported = vi.fn((type: string) => type === "video/webm");
        public state: RecordingState = "inactive";
        public mimeType = "video/webm";
        public ondataavailable: ((event: { data: Blob }) => void) | null = null;
        public onstop: (() => void) | null = null;
        public onerror: (() => void) | null = null;
        public start = vi.fn(() => {
            this.state = "recording";
        });
        public stop = vi.fn(() => {
            this.state = "inactive";
        });
        public constructor() {
            recorder = this;
        }
        public finish() {
            this.ondataavailable?.({ data: new Blob(["video"]) });
            this.onstop?.();
        }
    }

    beforeEach(() => {
        vi.useFakeTimers();
        vi.clearAllMocks();
        recorder = undefined;
        const canvas = document.createElement("canvas");
        surfaces = [];
        engine = { canvas, surfaces } as unknown as EngineContext;
        surfaces.push(engine);
        controller = new CaptureController(engine);
        CaptureScreenshot.mockResolvedValue(Shot);
        stopTrack = vi.fn();
        stream = { getTracks: () => [{ stop: stopTrack }] } as unknown as MediaStream;
        Object.assign(canvas, { captureStream: vi.fn(() => stream) });
        vi.stubGlobal("MediaRecorder", TestRecorder);
        vi.stubGlobal("URL", { createObjectURL: vi.fn(() => "blob:screenshot"), revokeObjectURL: vi.fn() });
        drawPixels = vi.fn();
        createImage = vi.fn(() => ({ data: new Uint8ClampedArray(8) }));
        vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({ putImageData: drawPixels, createImageData: createImage } as unknown as CanvasRenderingContext2D);
        vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation((callback) => {
            encodingCallback = callback;
            callback(new Blob(["png"], { type: "image/png" }));
        });
        click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    });

    afterEach(() => {
        controller.dispose();
        vi.runAllTimers();
        vi.useRealTimers();
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it("uses the selected auxiliary surface and encodes the exact native RGBA image", async () => {
        const auxiliary = { canvas: document.createElement("canvas") } as SurfaceContext;
        surfaces.push(auxiliary);
        controller.selectSurface(auxiliary);
        await controller.screenshotAsync(document);
        expect(CaptureScreenshot).toHaveBeenCalledWith(auxiliary);
        expect(createImage).toHaveBeenCalledWith(2, 1);
        expect(drawPixels.mock.calls[0][0].data).toEqual(Shot.data);
        expect(click.mock.instances[0]).toHaveProperty("download", "screenshot.png");
        expect(controller.pending).toBe(false);
        expect(controller.error).toBeUndefined();
        expect(document.querySelector("a")).toBeNull();
        vi.runAllTimers();
        expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:screenshot");
    });

    it("prevents overlapping captures and surface changes while waiting for GPU readback", async () => {
        const deferred = Deferred<Screenshot>();
        CaptureScreenshot.mockReturnValue(deferred.promise);
        const auxiliary = {} as SurfaceContext;
        surfaces.push(auxiliary);
        const capture = controller.screenshotAsync(document);
        controller.selectSurface(auxiliary);
        await controller.screenshotAsync(document);
        controller.startRecording(document);
        expect(controller.surface).toBe(engine);
        expect(CaptureScreenshot).toHaveBeenCalledTimes(1);
        expect(recorder).toBeUndefined();
        deferred.resolve(Shot);
        await capture;
        expect(click).toHaveBeenCalledTimes(1);
    });

    it.each(["dispose", "surfaceRemoved"] as const)("suppresses stale downloads after %s during readback", async (action) => {
        const auxiliary = {} as SurfaceContext;
        surfaces.push(auxiliary);
        controller.selectSurface(auxiliary);
        const deferred = Deferred<Screenshot>();
        CaptureScreenshot.mockReturnValue(deferred.promise);
        const capture = controller.screenshotAsync(document);
        if (action === "dispose") {
            controller.dispose();
        } else {
            surfaces.pop();
            controller.refreshSurfaces();
            expect(controller.surface).toBe(engine);
        }
        deferred.resolve(Shot);
        await capture;
        expect(click).not.toHaveBeenCalled();
    });

    it("suppresses a download if disposal happens during PNG encoding", async () => {
        vi.mocked(HTMLCanvasElement.prototype.toBlob).mockImplementation((callback) => {
            encodingCallback = callback;
        });
        const capture = controller.screenshotAsync(document);
        await Promise.resolve();
        controller.dispose();
        encodingCallback(new Blob(["png"]));
        await capture;
        expect(click).not.toHaveBeenCalled();
    });

    it("releases a removed screenshot surface even before a manual topology refresh", async () => {
        const auxiliary = {} as SurfaceContext;
        surfaces.push(auxiliary);
        controller.selectSurface(auxiliary);
        const deferred = Deferred<Screenshot>();
        CaptureScreenshot.mockReturnValue(deferred.promise);
        const capture = controller.screenshotAsync(document);
        surfaces.pop();
        deferred.resolve(Shot);
        await capture;
        expect(controller.pending).toBe(false);
        expect(controller.surface).toBe(engine);
        expect(controller.error).toContain("surface was removed");
        expect(click).not.toHaveBeenCalled();
    });

    it("surfaces readback and encoding failures and allows retry", async () => {
        CaptureScreenshot.mockRejectedValueOnce(new Error("GPU readback failed"));
        await controller.screenshotAsync(document);
        expect(controller.error).toContain("GPU readback failed");
        expect(controller.pending).toBe(false);
        vi.mocked(HTMLCanvasElement.prototype.toBlob).mockImplementationOnce((callback) => callback(null));
        await controller.screenshotAsync(document);
        expect(controller.error).toContain("PNG encoding failed");
        await controller.screenshotAsync(document);
        expect(controller.error).toBeUndefined();
        expect(click).toHaveBeenCalledTimes(1);
    });

    it("records the selected canvas, finalizes a download, and releases all tracks", () => {
        expect(controller.canRecord).toBe(true);
        controller.startRecording(document);
        expect(controller.recording).toBe(true);
        expect(recorder?.start).toHaveBeenCalledTimes(1);
        controller.stopRecording();
        expect(controller.pending).toBe(true);
        expect(recorder?.stop).toHaveBeenCalledTimes(1);
        recorder?.finish();
        expect(click.mock.instances[0]).toHaveProperty("download", "recording.webm");
        expect(stopTrack).toHaveBeenCalledTimes(1);
        expect(controller.recording).toBe(false);
        expect(controller.pending).toBe(false);
    });

    it.each(["dispose", "surfaceRemoved"] as const)("cancels recording and releases tracks without downloading after %s", (action) => {
        if (action === "surfaceRemoved") {
            const auxiliary = { canvas: engine.canvas } as SurfaceContext;
            surfaces.push(auxiliary);
            controller.selectSurface(auxiliary);
        }
        controller.startRecording(document);
        const activeRecorder = recorder!;
        if (action === "dispose") {
            controller.dispose();
        } else {
            surfaces.pop();
            controller.refreshSurfaces();
        }
        activeRecorder.finish();
        expect(activeRecorder.stop).toHaveBeenCalledTimes(1);
        expect(stopTrack).toHaveBeenCalledTimes(1);
        expect(click).not.toHaveBeenCalled();
    });

    it("reports recorder errors and releases tracks when construction fails", () => {
        vi.stubGlobal(
            "MediaRecorder",
            class extends TestRecorder {
                public constructor() {
                    super();
                    throw new Error("Recorder construction failed");
                }
            }
        );
        controller.startRecording(document);
        expect(controller.error).toContain("Recorder construction failed");
        expect(stopTrack).toHaveBeenCalledTimes(1);
        expect(controller.recording).toBe(false);
    });

    it("releases removed recording surfaces on media completion without a manual topology refresh", () => {
        const auxiliary = { canvas: engine.canvas } as SurfaceContext;
        surfaces.push(auxiliary);
        controller.selectSurface(auxiliary);
        controller.startRecording(document);
        const activeRecorder = recorder!;
        surfaces.pop();
        activeRecorder.finish();
        expect(stopTrack).toHaveBeenCalledTimes(1);
        expect(controller.recording).toBe(false);
        expect(controller.pending).toBe(false);
        expect(controller.surface).toBe(engine);
        expect(controller.error).toContain("surface was removed");
        expect(click).not.toHaveBeenCalled();
    });

    it("reports asynchronous media errors without downloading a partial recording", () => {
        controller.startRecording(document);
        const activeRecorder = recorder!;
        activeRecorder.onerror?.();
        activeRecorder.finish();
        expect(controller.error).toContain("Video recording failed");
        expect(stopTrack).toHaveBeenCalledTimes(1);
        expect(click).not.toHaveBeenCalled();
    });

    it("reports empty recordings and unavailable offscreen video capture", () => {
        controller.startRecording(document);
        recorder?.onstop?.();
        expect(controller.error).toContain("no video data");
        const offscreen = { canvas: { width: 1, height: 1 } } as SurfaceContext;
        surfaces.push(offscreen);
        controller.selectSurface(offscreen);
        expect(controller.canRecord).toBe(false);
        controller.startRecording(document);
        expect(controller.error).toContain("does not support");
    });
});
