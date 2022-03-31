import { Observable } from "core/Misc/observable";

type Key = "control" | "shift" | "alt" | "space" | "meta";

export class KeyboardManager {
    private _hostElement: HTMLElement | HTMLDocument;
    private _kdListener = (evt: Event) => this._keyEvent(evt as KeyboardEvent, true);
    private _kuListener = (evt: Event) => this._keyEvent(evt as KeyboardEvent, false);
    private _moveListener = (evt: Event) => this._updateModifierKeys(evt as MouseEvent);
    private _focusOutListener = () => this._clearKeys();
    private _keys = new Set<Key>();
    public onKeyPressedObservable: Observable<Key>;
    constructor(hostElement: HTMLElement | HTMLDocument) {
        this._hostElement = hostElement;
        hostElement.addEventListener("keydown", this._kdListener);
        hostElement.addEventListener("keypress", this._kdListener);
        hostElement.addEventListener("keyup", this._kuListener);
        hostElement.addEventListener("mousemove", this._moveListener);
        hostElement.addEventListener("focusout", this._focusOutListener);
        this.onKeyPressedObservable = new Observable<Key>();
    }

    private _keyEvent(event: KeyboardEvent, isDown: boolean) {
        this._updateModifierKeys(event);
        switch (event.key) {
            case " ":
                this._setKeyDown("space", isDown);
                break;
        }
    }

    private _updateModifierKeys(event: KeyboardEvent | MouseEvent) {
        this._setKeyDown("control", event.ctrlKey);
        this._setKeyDown("alt", event.altKey);
        this._setKeyDown("shift", event.shiftKey);
        this._setKeyDown("meta", event.metaKey);
    }

    private _setKeyDown(key: Key, down: boolean) {
        const isDown = this._keys.has(key);
        if (isDown !== down) {
            if (!down) {
                this._keys.delete(key);
            } else {
                this._keys.add(key);
            }
            this.onKeyPressedObservable.notifyObservers(key);
        }
    }

    private _clearKeys() {
        for (const key of this._keys) {
            this._keys.delete(key);
            this.onKeyPressedObservable.notifyObservers(key);
        }
    }

    public isKeyDown(key: Key) {
        return this._keys.has(key);
    }

    public dispose() {
        this._hostElement.removeEventListener("keydown", this._kdListener);
        this._hostElement.removeEventListener("keypress", this._kdListener);
        this._hostElement.removeEventListener("keyup", this._kuListener);
        this._hostElement.removeEventListener("mousemove", this._moveListener);
        this._hostElement.removeEventListener("focusout", this._focusOutListener);
    }
}
