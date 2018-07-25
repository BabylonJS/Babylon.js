interface HTMLCanvasElement {
    /** Track wether a record is in progress */
    recording: boolean;
    /** Capture Stream method defined by some browsers */
    captureStream(fps?: number): MediaStream;
}

interface MediaRecorder {
    /** Starts recording */
    start(timeSlice: number): void;
    /** Stops recording */
    stop(): void;

    onerror: (event: ErrorEvent) => void;
    onstop: (event:Event) => void;
    ondataavailable: (event: Event) => void;
}

interface MediaRecorderOptions {
    /** The mime type you want to use as the recording container for the new MediaRecorder */
    mimeType?: string,
    /** The chosen bitrate for the audio component of the media. */
    audioBitsPerSecond?: number,
    /** The chosen bitrate for the video component of the media. */
    videoBitsPerSecond?: number,
    /** The chosen bitrate for the audio and video components of the media. This can be specified instead of the above two properties. If this is specified along with one or the other of the above properties, this will be used for the one that isn't specified. */
    bitsPerSecond?: number,
}

interface MediaRecorderConstructor {
    /**
     * A reference to the prototype.
     */
    readonly prototype: MediaRecorder;

    /**
     * Creates a new MediaRecorder.
     * @param stream Defines the stream to record.
     * @param options Defines the options for the recorder available in the type MediaRecorderOptions.
     */
    new(stream: MediaStream, options?: MediaRecorderOptions): MediaRecorder;
}

declare var MediaRecorder: MediaRecorderConstructor;

module BABYLON {
    /**
     * This represents the different options avilable for the video capture.
     */
    export interface VideoRecorderOptions {
        /** Defines the mime type of the video */
        mimeType: string,
        /** Defines the video the video should be recorded at */
        fps: number,
        /** Defines the chunk size for the recording data */
        recordChunckSize: number
    }

    /** 
     * This can helps recording videos from BabylonJS.
     * This is based on the available WebRTC functionalities of the browser.
     * 
     * @see http://doc.babylonjs.com/...
     */
    export class VideoRecorder {
        private static readonly _defaultOptions = {
            mimeType: "video/webm",
            fps: 25,
            recordChunckSize: 3000
        };

        private readonly _canvas: HTMLCanvasElement;
        private readonly _options: VideoRecorderOptions;
        private readonly _mediaRecorder: MediaRecorder;

        private _recordedChunks: any[];
        private _fileName: Nullable<string>;
        private _resolve: Nullable<(blob: Blob) => void>;
        private _reject: Nullable<(error: any) => void>;

        /**
         * Create a new VideoCapture object which can help converting what you see in Babylon to
         * a video file.
         * @param engine Defines the BabylonJS Engine you wish to record
         * @param options Defines options that can be used to customized the capture
         */
        constructor(engine: Engine, options: Nullable<VideoRecorderOptions>) {
            const canvas = engine.getRenderingCanvas();
            if (!canvas) {
                throw "The babylon engine must have a canvas to be recorded";
            }

            this._canvas = canvas;
            this._canvas.recording = false;
            if (typeof this._canvas.captureStream !== "function") {
                throw "Your browser does not support recording so far.";
            }

            this._options = {
                ...VideoRecorder._defaultOptions,
                ...options
            }

            const stream = this._canvas.captureStream(this._options.fps);
            this._mediaRecorder = new MediaRecorder(stream, { mimeType: this._options.mimeType });
            this._mediaRecorder.ondataavailable = this._handleDataAvailable.bind(this);
            this._mediaRecorder.onerror = this._handleError.bind(this);
            this._mediaRecorder.onstop = this._handleStop.bind(this);
        }

        /**
         * Stops the current recording before the default capture timeout passed in the startRecording
         * functions.
         */
        public stopRecording(): void {
            if (!this._canvas.recording) {
                return;
            }

            this._canvas.recording = false;
            if (this._mediaRecorder) {
                this._mediaRecorder.stop();
            }
        }

        /**
         * Starts recording the canvas for a max duration specified in parameters.
         * @param fileName Defines the name of the file to be downloaded when the recording stop. If null no automatic download will start and you can rely on the promise to get the data back.
         * @param maxDuration Defines the maximum recording time in seconds. 
         * It default to 5 seconds. A value of zero will not stop automatically, you would need to call stopRecording manually.
         * @return a promise callback at the end of the recording with the video data in Blob.
         */
        public startRecording(fileName: Nullable<string> = "babylonjs.webm", maxDuration = 5): Promise<Blob> {
            if (this._canvas.recording) {
                throw "Recording already in progress";
            }

            if (maxDuration > 0) {
                setTimeout(() => {
                    this.stopRecording();
                }, maxDuration);
            }

            this._canvas.recording = true;
            this._fileName = fileName;
            this._recordedChunks = [];
            this._resolve = null;
            this._reject = null;

            this._mediaRecorder.start(this._options.recordChunckSize);

            return new Promise<Blob>((resolve, reject) => {
                this._resolve = resolve;
                this._reject = reject;
            });
        }

        private _handleDataAvailable(event: any): void {
            if (event.data.size > 0) {
                this._recordedChunks.push(event.data);
            }
        }

        private _handleError(event: ErrorEvent): void {
            this.stopRecording();

            if (this._reject) {
                this._reject(event.error);
            }
            else {
                throw new event.error;
            }
        }

        private _handleStop(): void {
            this.stopRecording();

            const superBuffer = new Blob(this._recordedChunks);
            if (this._resolve) {
                this._resolve(superBuffer);
            }

            window.URL.createObjectURL(superBuffer);

            if (this._fileName) {
                Tools.Download(superBuffer, this._fileName);
            }
        }
    }
} 
