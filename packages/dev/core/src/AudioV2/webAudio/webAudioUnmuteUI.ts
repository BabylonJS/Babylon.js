import type { Nullable } from "../../types";
import { EngineStore } from "../../Engines/engineStore";
import type { _WebAudioEngine } from "./webAudioEngine";

/**
 * Adds a UI button that starts the audio engine's underlying audio context when the user presses it.
 * @internal
 */
export class _WebAudioUnmuteUI {
    private _button: Nullable<HTMLButtonElement> = null;
    private _enabled: boolean = true;
    private _engine: _WebAudioEngine;
    private _style: Nullable<HTMLStyleElement> = null;

    /** @internal */
    public constructor(engine: _WebAudioEngine, parentElement?: HTMLElement) {
        this._engine = engine;
        const parent = parentElement || EngineStore.LastCreatedEngine?.getInputElement()?.parentElement || document.body;
        const top = (parent?.offsetTop || 0) + 20;

        this._style = document.createElement("style");
        this._style.appendChild(
            document.createTextNode(
                `.babylonUnmute{position:absolute;top:${top}px;margin-left:20px;height:40px;width:60px;background-color:rgba(51,51,51,0.7);background-image:url("data:image/svg+xml;charset=UTF-8,%3Csvg%20version%3D%221.1%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2239%22%20height%3D%2232%22%20viewBox%3D%220%200%2039%2032%22%3E%3Cpath%20fill%3D%22white%22%20d%3D%22M9.625%2018.938l-0.031%200.016h-4.953q-0.016%200-0.031-0.016v-12.453q0-0.016%200.031-0.016h4.953q0.031%200%200.031%200.016v12.453zM12.125%207.688l8.719-8.703v27.453l-8.719-8.719-0.016-0.047v-9.938zM23.359%207.875l1.406-1.406%204.219%204.203%204.203-4.203%201.422%201.406-4.219%204.219%204.219%204.203-1.484%201.359-4.141-4.156-4.219%204.219-1.406-1.422%204.219-4.203z%22%3E%3C%2Fpath%3E%3C%2Fsvg%3E");background-size:80%;background-repeat:no-repeat;background-position:center;background-position-y:4px;border:none;outline:none;transition:transform 0.125s ease-out;cursor:pointer;z-index:9999;}.babylonUnmute:hover{transform:scale(1.05)}`
            )
        );
        document.head.appendChild(this._style);

        this._button = document.createElement("button");
        this._button.className = "babylonUnmute";
        this._button.id = "babylonUnmuteButton";

        this._button.addEventListener("click", () => {
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            this._engine.unlockAsync();
        });

        parent.appendChild(this._button);

        this._engine.stateChangedObservable.add(this._onStateChanged);
    }

    /** @internal */
    public dispose(): void {
        this._button?.remove();
        this._button = null;

        this._style?.remove();
        this._style = null;

        this._engine.stateChangedObservable.removeCallback(this._onStateChanged);
    }

    /** @internal */
    public get enabled(): boolean {
        return this._enabled;
    }

    public set enabled(value: boolean) {
        this._enabled = value;
        if (value) {
            if (this._engine.state !== "running") {
                this._show();
            }
        } else {
            this._hide();
        }
    }

    private _show(): void {
        if (!this._button) {
            return;
        }

        this._button.style.display = "block";
    }

    private _hide(): void {
        if (!this._button) {
            return;
        }

        this._button.style.display = "none";
    }

    private _onStateChanged = () => {
        if (!this._button) {
            return;
        }

        if (this._engine.state === "running") {
            this._hide();
        } else {
            this._show();
        }
    };
}
