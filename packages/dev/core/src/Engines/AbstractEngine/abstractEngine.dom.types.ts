import { type Nullable } from "../../types";
import { type IViewportOwnerLike } from "./abstractEngine.dom.pure";
declare module "../../Engines/abstractEngine.pure" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface AbstractEngine {
        /**
         * Gets the HTML element used to attach event listeners
         * @returns a HTML element
         */
        getInputElement(): Nullable<HTMLElement>;

        /**
         * Gets the client rect of the HTML canvas attached with the current webGL context
         * @returns a client rectangle
         */
        getRenderingCanvasClientRect(): Nullable<ClientRect>;

        /**
         * Gets the client rect of the HTML element used for events
         * @returns a client rectangle
         */
        getInputElementClientRect(): Nullable<ClientRect>;

        /**
         * Gets current aspect ratio
         * @param viewportOwner defines the camera to use to get the aspect ratio
         * @param useScreen defines if screen size must be used (or the current render target if any)
         * @returns a number defining the aspect ratio
         */
        getAspectRatio(viewportOwner: IViewportOwnerLike, useScreen?: boolean): number;

        /**
         * Gets current screen aspect ratio
         * @returns a number defining the aspect ratio
         */
        getScreenAspectRatio(): number;

        /**
         * Toggle full screen mode
         * @param requestPointerLock defines if a pointer lock should be requested from the user
         */
        switchFullscreen(requestPointerLock: boolean): void;

        /**
         * Enters full screen mode
         * @param requestPointerLock defines if a pointer lock should be requested from the user
         */
        enterFullscreen(requestPointerLock: boolean): void;

        /**
         * Exits full screen mode
         */
        exitFullscreen(): void;

        /** @internal */
        _onPointerLockChange: () => void;

        /** @internal */
        _verifyPointerLock(): void;
    }
}
