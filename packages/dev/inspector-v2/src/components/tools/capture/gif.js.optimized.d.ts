// See https://github.com/jnordberg/gif.js?tab=readme-ov-file#options
declare module "gif.js.optimized" {
    class GIF {
        constructor(options?: {
            // pixel sample interval, lower is better
            quality?: number;
            // number of web workers to spawn
            workers?: number;
            // url to load worker script from
            workerScript?: string;
        });
        addFrame(
            image: HTMLImageElement | HTMLCanvasElement | CanvasRenderingContext2D,
            options?: {
                // frame delay (ms)
                delay?: number;
                // copy the pixel data
                copy?: boolean;
            }
        ): void;
        on(event: "finished", callback: (blob: Blob) => void): void;
        render(): void;
    }

    export default GIF;
}
