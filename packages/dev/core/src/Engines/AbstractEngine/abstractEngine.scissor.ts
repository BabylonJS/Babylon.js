export {};

/** This file must only contain pure code and pure imports */

declare module "../abstractEngine.pure" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface AbstractEngine {
        /**
         * Enable scissor test on a specific rectangle (ie. render will only be executed on a specific portion of the screen)
         * @param x defines the x-coordinate of the bottom left corner of the scissor rectangle
         * @param y defines the y-coordinate of the bottom left corner of the scissor rectangle
         * @param width defines the width of the scissor rectangle
         * @param height defines the height of the scissor rectangle
         */
        enableScissor(x: number, y: number, width: number, height: number): void;

        /**
         * Disable previously set scissor test rectangle
         */
        disableScissor(): void;
    }
}
