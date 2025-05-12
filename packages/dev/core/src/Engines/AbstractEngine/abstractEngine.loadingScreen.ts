import { IsWindowObjectExist } from "../../Misc/domManagement";
import type { ILoadingScreen } from "../../Loading/loadingScreen";
import { AbstractEngine } from "../abstractEngine";

declare module "../../Engines/abstractEngine" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface AbstractEngine {
        /**
         * Display the loading screen
         * @see https://doc.babylonjs.com/features/featuresDeepDive/scene/customLoadingScreen
         */
        displayLoadingUI(): void;

        /**
         * Hide the loading screen
         * @see https://doc.babylonjs.com/features/featuresDeepDive/scene/customLoadingScreen
         */
        hideLoadingUI(): void;

        /**
         * Gets or sets the current loading screen object
         * @see https://doc.babylonjs.com/features/featuresDeepDive/scene/customLoadingScreen
         */
        loadingScreen: ILoadingScreen;

        /**
         * Sets the current loading screen text
         * @see https://doc.babylonjs.com/features/featuresDeepDive/scene/customLoadingScreen
         */
        loadingUIText: string;

        /**
         * Sets the current loading screen background color
         * @see https://doc.babylonjs.com/features/featuresDeepDive/scene/customLoadingScreen
         */
        loadingUIBackgroundColor: string;
    }
}

AbstractEngine.prototype.displayLoadingUI = function (): void {
    if (!IsWindowObjectExist()) {
        return;
    }
    const loadingScreen = this.loadingScreen;
    if (loadingScreen) {
        loadingScreen.displayLoadingUI();
    }
};

AbstractEngine.prototype.hideLoadingUI = function (): void {
    if (!IsWindowObjectExist()) {
        return;
    }
    const loadingScreen = this._loadingScreen;
    if (loadingScreen) {
        loadingScreen.hideLoadingUI();
    }
};

Object.defineProperty(AbstractEngine.prototype, "loadingScreen", {
    get: function (this: AbstractEngine) {
        if (!this._loadingScreen && this._renderingCanvas) {
            this._loadingScreen = AbstractEngine.DefaultLoadingScreenFactory(this._renderingCanvas);
        }
        return this._loadingScreen;
    },
    set: function (this: AbstractEngine, value: ILoadingScreen) {
        this._loadingScreen = value;
    },
    enumerable: true,
    configurable: true,
});

Object.defineProperty(AbstractEngine.prototype, "loadingUIText", {
    set: function (this: AbstractEngine, value: string) {
        this.loadingScreen.loadingUIText = value;
    },
    enumerable: true,
    configurable: true,
});

Object.defineProperty(AbstractEngine.prototype, "loadingUIBackgroundColor", {
    set: function (this: AbstractEngine, value: string) {
        this.loadingScreen.loadingUIBackgroundColor = value;
    },
    enumerable: true,
    configurable: true,
});
