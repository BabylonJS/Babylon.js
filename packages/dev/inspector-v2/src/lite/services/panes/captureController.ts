import { captureScreenshot, type EngineContext, type SurfaceContext } from "@babylonjs/lite";

import { Observable } from "core/Misc/observable";

/**
 * Owns capture operations for one Lite Inspector, independently of mounted panes.
 * @internal
 */
export class CaptureController {
    /** Notifies mounted panes when capture state changes. */
    public readonly onChanged = new Observable<void>();
    /** The registered surface selected for capture. */
    public surface: SurfaceContext;
    /** Whether screenshot encoding or recording finalization is in progress. */
    public pending = false;
    /** Whether a recording is active, including its finalization. */
    public recording = false;
    /** The most recent capture failure, displayed by the pane. */
    public error: string | undefined;

    private _disposed = false;
    private _generation = 0;
    private _recorder: MediaRecorder | undefined;
    private _stream: MediaStream | undefined;

    public constructor(private readonly _engine: EngineContext) {
        this.surface = _engine;
    }

    /** Whether the selected surface's owning window supports canvas recording. */
    public get canRecord(): boolean {
        const canvas = this.surface.canvas;
        return "ownerDocument" in canvas && typeof canvas.captureStream === "function" && typeof canvas.ownerDocument.defaultView?.MediaRecorder === "function";
    }

    /**
     * Changes the target only when no capture is active.
     * @param surface A surface registered with this engine.
     */
    public selectSurface(surface: SurfaceContext): void {
        if (this.pending || this.recording || !this._engine.surfaces.includes(surface)) {
            return;
        }
        this.surface = surface;
        this.error = undefined;
        this.onChanged.notifyObservers();
    }

    /** Cancels stale operations when the selected surface is removed. */
    public refreshSurfaces(): void {
        if (!this._engine.surfaces.includes(this.surface)) {
            this._generation++;
            this._cancelRecording();
            this.pending = false;
            this.surface = this._engine;
            this.error = "The capture surface was removed.";
        }
        this.onChanged.notifyObservers();
    }

    /**
     * Downloads the next presented frame as a native-resolution PNG.
     * @param document The mounted pane's document, used for encoding and downloading.
     */
    public async screenshotAsync(document: Document): Promise<void> {
        if (this._disposed || this.pending || this.recording) {
            return;
        }
        const surface = this.surface;
        const generation = ++this._generation;
        this.pending = true;
        this.error = undefined;
        this.onChanged.notifyObservers();
        try {
            const screenshot = await captureScreenshot(surface);
            if (!this._isCurrent(generation, surface)) {
                return;
            }
            const canvas = document.createElement("canvas");
            canvas.width = screenshot.width;
            canvas.height = screenshot.height;
            const context = canvas.getContext("2d");
            if (!context) {
                throw new Error("A 2D canvas is required to encode the screenshot.");
            }
            const image = context.createImageData(screenshot.width, screenshot.height);
            image.data.set(screenshot.data);
            context.putImageData(image, 0, 0);
            const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) => (value ? resolve(value) : reject(new Error("PNG encoding failed."))), "image/png"));
            if (this._isCurrent(generation, surface)) {
                Download(blob, "screenshot.png", document);
            }
        } catch (error) {
            if (this._isCurrent(generation, surface)) {
                this.error = `Screenshot failed: ${error instanceof Error ? error.message : String(error)}`;
            }
        } finally {
            this._cancelRemovedSurface(generation);
            if (this._isCurrent(generation, surface)) {
                this.pending = false;
                this.onChanged.notifyObservers();
            }
        }
    }

    /**
     * Starts recording independently of the pane's mounted lifetime.
     * @param document The mounted pane's document, used for downloading.
     */
    public startRecording(document: Document): void {
        if (this._disposed || this.pending || this.recording) {
            return;
        }
        this.error = undefined;
        const surface = this.surface;
        const generation = ++this._generation;
        try {
            const canvas = surface.canvas;
            if (!("ownerDocument" in canvas) || !this.canRecord) {
                throw new Error("This surface or browser does not support canvas video recording.");
            }
            const recorderType = canvas.ownerDocument.defaultView!.MediaRecorder;
            const mimeType = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm", "video/mp4"].find((type) => recorderType.isTypeSupported(type));
            if (!mimeType) {
                throw new Error("No supported video recording format was found.");
            }
            const stream = canvas.captureStream(30);
            this._stream = stream;
            const recorder = new recorderType(stream, { mimeType });
            this._recorder = recorder;
            const chunks: Blob[] = [];
            recorder.ondataavailable = (event) => {
                this._cancelRemovedSurface(generation);
                if (this._isCurrent(generation, surface) && event.data.size) {
                    chunks.push(event.data);
                }
            };
            recorder.onerror = () => {
                this._cancelRemovedSurface(generation);
                if (this._isCurrent(generation, surface)) {
                    this._generation++;
                    this._cancelRecording();
                    this.pending = false;
                    this.error = "Video recording failed.";
                    this.onChanged.notifyObservers();
                }
            };
            recorder.onstop = () => {
                this._cancelRemovedSurface(generation);
                if (!this._isCurrent(generation, surface)) {
                    return;
                }
                this._releaseStream();
                this._recorder = undefined;
                this.recording = false;
                this.pending = false;
                try {
                    if (!chunks.length) {
                        throw new Error("The recorder produced no video data.");
                    }
                    Download(new Blob(chunks, { type: recorder.mimeType }), mimeType.startsWith("video/mp4") ? "recording.mp4" : "recording.webm", document);
                } catch (error) {
                    this.error = `Video capture failed: ${error instanceof Error ? error.message : String(error)}`;
                }
                this.onChanged.notifyObservers();
            };
            recorder.start();
            this.recording = true;
        } catch (error) {
            this._cancelRecording();
            this.error = `Video recording failed: ${error instanceof Error ? error.message : String(error)}`;
        }
        this.onChanged.notifyObservers();
    }

    /** Requests final recorder data before downloading and releasing its tracks. */
    public stopRecording(): void {
        if (this._recorder?.state === "recording") {
            this.pending = true;
            this._recorder.stop();
            this.onChanged.notifyObservers();
        }
    }

    /** Cancels captures and releases tracks without downloading partial results. */
    public dispose(): void {
        this._disposed = true;
        this._generation++;
        this._cancelRecording();
        this.onChanged.clear();
    }

    private _isCurrent(generation: number, surface: SurfaceContext): boolean {
        return !this._disposed && generation === this._generation && this._engine.surfaces.includes(surface);
    }

    private _cancelRemovedSurface(generation: number): void {
        if (!this._disposed && generation === this._generation && !this._engine.surfaces.includes(this.surface)) {
            this.refreshSurfaces();
        }
    }

    private _releaseStream(): void {
        this._stream?.getTracks().forEach((track) => track.stop());
        this._stream = undefined;
    }

    private _cancelRecording(): void {
        if (this._recorder) {
            this._recorder.ondataavailable = null;
            this._recorder.onerror = null;
            this._recorder.onstop = null;
            if (this._recorder.state !== "inactive") {
                this._recorder.stop();
            }
            this._recorder = undefined;
        }
        this.recording = false;
        this._releaseStream();
    }
}

function Download(blob: Blob, filename: string, document: Document): void {
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
