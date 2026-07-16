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

function createPasteEvent(data: string): ClipboardEvent {
    return {
        clipboardData: {
            types: ["text/plain"],
            getData: () => data,
        },
    } as unknown as ClipboardEvent;
}

describe("InputText _onPasteText", () => {
    it("replaces the highlighted selection with the pasted text", () => {
        const input = new InputText("test", "123456");
        // Highlight "56" (indices 4..6).
        const internal = input as any;
        internal._isTextHighlightOn = true;
        internal._startHighlightIndex = 4;
        internal._endHighlightIndex = 6;

        internal._onPasteText(createPasteEvent("23"));

        expect(input.text).toBe("123423");
        expect(input.isTextHighlightOn).toBe(false);
    });

    it("inserts the pasted text at the cursor when nothing is highlighted", () => {
        const input = new InputText("test", "123456");
        const internal = input as any;
        // Cursor at the end (offset 0) means append.
        internal._cursorOffset = 0;

        internal._onPasteText(createPasteEvent("78"));

        expect(input.text).toBe("12345678");
    });
});
