import type { IDisposable } from "core/scene";
import { type RawLottieAnimation } from "./types/rawLottie";

/**
 * Class responsible for parsing lottie data
 */
export class LottieParser implements IDisposable {
    private _lottieObject: object;

    /**
     * Creates an instance of LottieParser.
     * @param definitionData - The lottie definition data as a string.
     */
    public constructor(definitionData: string) {
        this._lottieObject = JSON.parse(definitionData);
        const object2 = this._lottieObject as RawLottieAnimation;
        // eslint-disable-next-line no-console
        console.log(definitionData);
        // eslint-disable-next-line no-console
        console.log(this._lottieObject);
        // eslint-disable-next-line no-console
        console.log(object2);
    }

    /**
     * Disposes of the resources used by the LottieParser
     */
    dispose(): void {
        throw new Error("Method not implemented.");
    }
}
