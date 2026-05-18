/** This file must only contain pure code and pure imports */

import { IsWindowObjectExist } from "../../Misc/domManagement";
import { type ILoadingScreen } from "../../Loading/loadingScreen.pure";
import { AbstractEngine } from "../abstractEngine.pure";

let _Registered = false;
/**
 * Register side effects for abstractEngineLoadingScreen.
 * Safe to call multiple times; only the first call has an effect.
 */
export function RegisterAbstractEngineLoadingScreen(): void {
    if (_Registered) {
        return;
    }
    _Registered = true;

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
}
