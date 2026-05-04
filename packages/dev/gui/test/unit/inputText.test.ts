import { describe, it, expect, vi } from "vitest";
import { InputText } from "../../src/2D/controls/inputText";
import { type IKeyboardEvent } from "@babylonjs/core/Events/deviceInputEvents";

function createKeyEvent(key: string, keyCode: number, overrides?: Partial<IKeyboardEvent>): IKeyboardEvent {
    return {
        key,
        keyCode,
        code: "",
        altKey: false,
        ctrlKey: false,
        metaKey: false,
        shiftKey: false,
        type: "keydown",
        target: null,
        inputIndex: 0,
        preventDefault: vi.fn(),
        ...overrides,
    };
}

describe("InputText processKey", () => {
    it("calls preventDefault for printable character keys", () => {
        const input = new InputText("test");

        const evt = createKeyEvent("5", 53); // '5' key
        input.processKey(evt.keyCode, evt.key, evt);

        expect(evt.preventDefault).toHaveBeenCalled();
    });

    it("calls preventDefault for letter keys", () => {
        const input = new InputText("test");

        const evt = createKeyEvent("a", 65);
        input.processKey(evt.keyCode, evt.key, evt);

        expect(evt.preventDefault).toHaveBeenCalled();
    });

    it("does not call preventDefault for dead keys", () => {
        const input = new InputText("test");

        // keyCode 192 (backtick/tilde) falls within the printable range (159-193),
        // so this enters the printable character block and exercises the _deadKey guard.
        const evt = createKeyEvent("Dead", 192);
        input.processKey(evt.keyCode, evt.key, evt);

        expect(evt.preventDefault).not.toHaveBeenCalled();
    });

    it("does not call preventDefault when addKey is set to false", () => {
        const input = new InputText("test");
        input.onBeforeKeyAddObservable.add(() => {
            input.addKey = false;
        });

        const evt = createKeyEvent("a", 65);
        input.processKey(evt.keyCode, evt.key, evt);

        expect(evt.preventDefault).not.toHaveBeenCalled();
    });
});
