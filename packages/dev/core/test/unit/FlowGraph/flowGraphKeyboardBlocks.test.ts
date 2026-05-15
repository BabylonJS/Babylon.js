import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { type Engine, NullEngine } from "core/Engines";
import { KeyboardEventTypes, KeyboardInfo } from "core/Events/keyboardEvents";
import { type IKeyboardEvent } from "core/Events/deviceInputEvents";
import { FlowGraphCoordinator, FlowGraphConsoleLogBlock } from "core/FlowGraph";
import { type FlowGraph, type FlowGraphContext } from "core/FlowGraph";
import { FlowGraphKeyDownEventBlock } from "core/FlowGraph/Blocks/Event/flowGraphKeyDownEventBlock";
import { FlowGraphKeyUpEventBlock } from "core/FlowGraph/Blocks/Event/flowGraphKeyUpEventBlock";
import { FlowGraphIsKeyPressedBlock } from "core/FlowGraph/Blocks/Data/flowGraphIsKeyPressedBlock";
import { Logger } from "core/Misc/logger";
import { Scene } from "core/scene";

/**
 * Helper to create a minimal IKeyboardEvent for testing.
 */
function makeKeyEvent(overrides: Partial<IKeyboardEvent> & { code: string; key: string }): IKeyboardEvent {
    return {
        altKey: false,
        ctrlKey: false,
        metaKey: false,
        shiftKey: false,
        code: overrides.code,
        key: overrides.key,
        keyCode: 0,
        preventDefault: () => {},
        type: "keydown",
        inputIndex: 0,
        currentTarget: null as any,
        ...overrides,
    };
}

/**
 * Helper to simulate a keydown event on the scene.
 */
function simulateKeyDown(scene: Scene, evt: IKeyboardEvent): void {
    scene.onKeyboardObservable.notifyObservers(new KeyboardInfo(KeyboardEventTypes.KEYDOWN, evt), KeyboardEventTypes.KEYDOWN);
}

/**
 * Helper to simulate a keyup event on the scene.
 */
function simulateKeyUp(scene: Scene, evt: IKeyboardEvent): void {
    scene.onKeyboardObservable.notifyObservers(new KeyboardInfo(KeyboardEventTypes.KEYUP, evt), KeyboardEventTypes.KEYUP);
}

describe("Flow Graph Keyboard Blocks", () => {
    let engine: Engine;
    let scene: Scene;
    let flowGraphCoordinator: FlowGraphCoordinator;
    let flowGraph: FlowGraph;
    let flowGraphContext: FlowGraphContext;

    beforeEach(() => {
        engine = new NullEngine({
            renderHeight: 256,
            renderWidth: 256,
            textureSize: 256,
            deterministicLockstep: false,
            lockstepMaxSteps: 1,
        });
        Logger.Log = vi.fn();
        scene = new Scene(engine);
        flowGraphCoordinator = new FlowGraphCoordinator({ scene });
        flowGraph = flowGraphCoordinator.createGraph();
        flowGraphContext = flowGraph.createContext();
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    describe("FlowGraphKeyDownEventBlock", () => {
        it("fires on any keydown when no key filter is set", () => {
            const keyDown = new FlowGraphKeyDownEventBlock();
            flowGraph.addEventBlock(keyDown);

            const log = new FlowGraphConsoleLogBlock({ name: "Log" });
            keyDown.done.connectTo(log.in);
            keyDown.keyCode.connectTo(log.message);

            flowGraph.start();

            simulateKeyDown(scene, makeKeyEvent({ code: "KeyA", key: "a" }));
            expect(Logger.Log).toHaveBeenCalledWith("KeyA");

            simulateKeyDown(scene, makeKeyEvent({ code: "Space", key: " " }));
            expect(Logger.Log).toHaveBeenCalledWith("Space");
        });

        it("filters by key code when key input is set", () => {
            const keyDown = new FlowGraphKeyDownEventBlock();
            flowGraph.addEventBlock(keyDown);
            keyDown.key.setValue("KeyA", flowGraphContext);

            const log = new FlowGraphConsoleLogBlock({ name: "Log" });
            keyDown.done.connectTo(log.in);
            keyDown.keyValue.connectTo(log.message);

            flowGraph.start();

            // Should NOT fire for KeyB
            simulateKeyDown(scene, makeKeyEvent({ code: "KeyB", key: "b" }));
            expect(Logger.Log).not.toHaveBeenCalled();

            // Should fire for KeyA
            simulateKeyDown(scene, makeKeyEvent({ code: "KeyA", key: "a" }));
            expect(Logger.Log).toHaveBeenCalledWith("a");
        });

        it("exposes modifier key outputs", () => {
            const keyDown = new FlowGraphKeyDownEventBlock();
            flowGraph.addEventBlock(keyDown);

            const log = new FlowGraphConsoleLogBlock({ name: "Log" });
            keyDown.done.connectTo(log.in);
            log.message.setValue("fired", flowGraphContext);

            flowGraph.start();

            simulateKeyDown(
                scene,
                makeKeyEvent({
                    code: "KeyA",
                    key: "a",
                    shiftKey: true,
                    ctrlKey: false,
                    altKey: true,
                    metaKey: false,
                })
            );

            expect(Logger.Log).toHaveBeenCalled();
            expect(keyDown.shiftKey.getValue(flowGraphContext)).toBe(true);
            expect(keyDown.ctrlKey.getValue(flowGraphContext)).toBe(false);
            expect(keyDown.altKey.getValue(flowGraphContext)).toBe(true);
            expect(keyDown.metaKey.getValue(flowGraphContext)).toBe(false);
        });

        it("sets isRepeat output before downstream blocks execute", () => {
            const keyDown = new FlowGraphKeyDownEventBlock();
            flowGraph.addEventBlock(keyDown);

            // Capture isRepeat during the execution chain
            let capturedRepeat: boolean | undefined;
            const log = new FlowGraphConsoleLogBlock({ name: "Log" });
            keyDown.done.connectTo(log.in);
            log.message.setValue("fired", flowGraphContext);
            // Spy on Logger.Log to capture isRepeat at the moment of execution
            (Logger.Log as ReturnType<typeof vi.fn>).mockImplementation(() => {
                capturedRepeat = keyDown.isRepeat.getValue(flowGraphContext);
            });

            flowGraph.start();

            // First press — not a repeat
            simulateKeyDown(scene, makeKeyEvent({ code: "KeyA", key: "a", repeat: false }));
            expect(capturedRepeat).toBe(false);

            // Repeat press
            simulateKeyDown(scene, makeKeyEvent({ code: "KeyA", key: "a", repeat: true }));
            expect(capturedRepeat).toBe(true);
        });

        it("ignores auto-repeat events when ignoreRepeat is set", () => {
            const keyDown = new FlowGraphKeyDownEventBlock({ ignoreRepeat: true });
            flowGraph.addEventBlock(keyDown);

            const log = new FlowGraphConsoleLogBlock({ name: "Log" });
            keyDown.done.connectTo(log.in);
            log.message.setValue("fired", flowGraphContext);

            flowGraph.start();

            // Initial press — should fire
            simulateKeyDown(scene, makeKeyEvent({ code: "KeyA", key: "a", repeat: false }));
            expect(Logger.Log).toHaveBeenCalledTimes(1);

            // Repeat — should be ignored
            simulateKeyDown(scene, makeKeyEvent({ code: "KeyA", key: "a", repeat: true }));
            expect(Logger.Log).toHaveBeenCalledTimes(1);

            // Another initial press — should fire
            simulateKeyDown(scene, makeKeyEvent({ code: "KeyB", key: "b", repeat: false }));
            expect(Logger.Log).toHaveBeenCalledTimes(2);
        });

        it("allows auto-repeat events by default", () => {
            const keyDown = new FlowGraphKeyDownEventBlock();
            flowGraph.addEventBlock(keyDown);

            const log = new FlowGraphConsoleLogBlock({ name: "Log" });
            keyDown.done.connectTo(log.in);
            log.message.setValue("fired", flowGraphContext);

            flowGraph.start();

            simulateKeyDown(scene, makeKeyEvent({ code: "KeyA", key: "a", repeat: false }));
            simulateKeyDown(scene, makeKeyEvent({ code: "KeyA", key: "a", repeat: true }));
            simulateKeyDown(scene, makeKeyEvent({ code: "KeyA", key: "a", repeat: true }));
            expect(Logger.Log).toHaveBeenCalledTimes(3);
        });

        it("respects stopPropagation config", () => {
            // Create two keydown blocks; the first stops propagation
            const keyDown1 = new FlowGraphKeyDownEventBlock({ stopPropagation: true });
            flowGraph.addEventBlock(keyDown1);

            const keyDown2 = new FlowGraphKeyDownEventBlock();
            flowGraph.addEventBlock(keyDown2);

            const log1 = new FlowGraphConsoleLogBlock({ name: "Log1" });
            keyDown1.done.connectTo(log1.in);
            log1.message.setValue("block1", flowGraphContext);

            const log2 = new FlowGraphConsoleLogBlock({ name: "Log2" });
            keyDown2.done.connectTo(log2.in);
            log2.message.setValue("block2", flowGraphContext);

            flowGraph.start();

            simulateKeyDown(scene, makeKeyEvent({ code: "KeyA", key: "a" }));

            // Block 1 fires and returns false (stopPropagation),
            // which breaks the event dispatch loop — block 2 does NOT fire.
            expect(Logger.Log).toHaveBeenCalledWith("block1");
            expect(Logger.Log).not.toHaveBeenCalledWith("block2");
            expect(Logger.Log).toHaveBeenCalledTimes(1);
        });
    });

    describe("FlowGraphKeyUpEventBlock", () => {
        it("fires on keyup events", () => {
            const keyUp = new FlowGraphKeyUpEventBlock();
            flowGraph.addEventBlock(keyUp);

            const log = new FlowGraphConsoleLogBlock({ name: "Log" });
            keyUp.done.connectTo(log.in);
            keyUp.keyCode.connectTo(log.message);

            flowGraph.start();

            // Should NOT fire on keydown
            simulateKeyDown(scene, makeKeyEvent({ code: "KeyA", key: "a" }));
            expect(Logger.Log).not.toHaveBeenCalled();

            // Should fire on keyup
            simulateKeyUp(scene, makeKeyEvent({ code: "KeyA", key: "a" }));
            expect(Logger.Log).toHaveBeenCalledWith("KeyA");
        });

        it("filters by key code", () => {
            const keyUp = new FlowGraphKeyUpEventBlock();
            flowGraph.addEventBlock(keyUp);
            keyUp.key.setValue("Space", flowGraphContext);

            const log = new FlowGraphConsoleLogBlock({ name: "Log" });
            keyUp.done.connectTo(log.in);
            log.message.setValue("fired", flowGraphContext);

            flowGraph.start();

            simulateKeyUp(scene, makeKeyEvent({ code: "KeyA", key: "a" }));
            expect(Logger.Log).not.toHaveBeenCalled();

            simulateKeyUp(scene, makeKeyEvent({ code: "Space", key: " " }));
            expect(Logger.Log).toHaveBeenCalledTimes(1);
        });

        it("exposes modifier outputs on keyup", () => {
            const keyUp = new FlowGraphKeyUpEventBlock();
            flowGraph.addEventBlock(keyUp);

            const log = new FlowGraphConsoleLogBlock({ name: "Log" });
            keyUp.done.connectTo(log.in);
            log.message.setValue("fired", flowGraphContext);

            flowGraph.start();

            simulateKeyUp(
                scene,
                makeKeyEvent({
                    code: "KeyA",
                    key: "a",
                    shiftKey: false,
                    ctrlKey: true,
                    altKey: false,
                    metaKey: true,
                })
            );

            expect(keyUp.shiftKey.getValue(flowGraphContext)).toBe(false);
            expect(keyUp.ctrlKey.getValue(flowGraphContext)).toBe(true);
            expect(keyUp.altKey.getValue(flowGraphContext)).toBe(false);
            expect(keyUp.metaKey.getValue(flowGraphContext)).toBe(true);
        });
    });

    describe("FlowGraphIsKeyPressedBlock", () => {
        it("reports a key as pressed after keydown and not pressed after keyup", () => {
            const isPressed = new FlowGraphIsKeyPressedBlock();
            flowGraph.addBlock(isPressed);
            isPressed.key.setValue("KeyA", flowGraphContext);

            flowGraph.start();

            // Before any event
            isPressed._updateOutputs(flowGraphContext);
            expect(isPressed.isPressed.getValue(flowGraphContext)).toBe(false);

            // After keydown
            simulateKeyDown(scene, makeKeyEvent({ code: "KeyA", key: "a" }));
            isPressed._updateOutputs(flowGraphContext);
            expect(isPressed.isPressed.getValue(flowGraphContext)).toBe(true);

            // After keyup
            simulateKeyUp(scene, makeKeyEvent({ code: "KeyA", key: "a" }));
            isPressed._updateOutputs(flowGraphContext);
            expect(isPressed.isPressed.getValue(flowGraphContext)).toBe(false);
        });

        it("checks modifier keys with withShift", () => {
            const isPressed = new FlowGraphIsKeyPressedBlock();
            flowGraph.addBlock(isPressed);
            isPressed.key.setValue("KeyA", flowGraphContext);
            isPressed.withShift.setValue(true, flowGraphContext);

            flowGraph.start();

            // Key A down without Shift
            simulateKeyDown(scene, makeKeyEvent({ code: "KeyA", key: "a" }));
            isPressed._updateOutputs(flowGraphContext);
            expect(isPressed.isPressed.getValue(flowGraphContext)).toBe(false);

            // Now hold Shift
            simulateKeyDown(scene, makeKeyEvent({ code: "ShiftLeft", key: "Shift" }));
            isPressed._updateOutputs(flowGraphContext);
            expect(isPressed.isPressed.getValue(flowGraphContext)).toBe(true);

            // Release Shift
            simulateKeyUp(scene, makeKeyEvent({ code: "ShiftLeft", key: "Shift" }));
            isPressed._updateOutputs(flowGraphContext);
            expect(isPressed.isPressed.getValue(flowGraphContext)).toBe(false);
        });

        it("checks modifier keys with withCtrl", () => {
            const isPressed = new FlowGraphIsKeyPressedBlock();
            flowGraph.addBlock(isPressed);
            isPressed.key.setValue("KeyC", flowGraphContext);
            isPressed.withCtrl.setValue(true, flowGraphContext);

            flowGraph.start();

            // Key C down without Ctrl
            simulateKeyDown(scene, makeKeyEvent({ code: "KeyC", key: "c" }));
            isPressed._updateOutputs(flowGraphContext);
            expect(isPressed.isPressed.getValue(flowGraphContext)).toBe(false);

            // Hold ControlLeft
            simulateKeyDown(scene, makeKeyEvent({ code: "ControlLeft", key: "Control" }));
            isPressed._updateOutputs(flowGraphContext);
            expect(isPressed.isPressed.getValue(flowGraphContext)).toBe(true);

            // ControlRight also works
            simulateKeyUp(scene, makeKeyEvent({ code: "ControlLeft", key: "Control" }));
            simulateKeyDown(scene, makeKeyEvent({ code: "ControlRight", key: "Control" }));
            isPressed._updateOutputs(flowGraphContext);
            expect(isPressed.isPressed.getValue(flowGraphContext)).toBe(true);
        });

        it("checks withCommandOrCtrl (virtual key)", () => {
            const isPressed = new FlowGraphIsKeyPressedBlock();
            flowGraph.addBlock(isPressed);
            isPressed.key.setValue("KeyA", flowGraphContext);
            isPressed.withCommandOrCtrl.setValue(true, flowGraphContext);

            flowGraph.start();

            // Key A down
            simulateKeyDown(scene, makeKeyEvent({ code: "KeyA", key: "a" }));
            isPressed._updateOutputs(flowGraphContext);
            expect(isPressed.isPressed.getValue(flowGraphContext)).toBe(false);

            // Hold the platform-appropriate CommandOrControl key.
            // On macOS (including Node.js on Mac), _IsMacPlatform is true,
            // so CommandOrControl maps to MetaLeft/MetaRight. On other
            // platforms it maps to ControlLeft/ControlRight.
            const isMac = /(Mac|iPhone|iPod|iPad)/i.test(typeof navigator !== "undefined" ? navigator.platform : "");
            const cmdCtrlCode = isMac ? "MetaLeft" : "ControlLeft";
            const cmdCtrlKey = isMac ? "Meta" : "Control";
            simulateKeyDown(scene, makeKeyEvent({ code: cmdCtrlCode, key: cmdCtrlKey }));
            isPressed._updateOutputs(flowGraphContext);
            expect(isPressed.isPressed.getValue(flowGraphContext)).toBe(true);
        });

        it("returns false when no sceneEventCoordinator is provided", () => {
            // Manually create a context without sceneEventCoordinator
            const graph = flowGraphCoordinator.createGraph();
            const context = graph.createContext();

            const isPressed = new FlowGraphIsKeyPressedBlock();
            graph.addBlock(isPressed);
            isPressed.key.setValue("KeyA", context);

            graph.start();

            // Should not throw, just return false
            isPressed._updateOutputs(context);
            expect(isPressed.isPressed.getValue(context)).toBe(false);
        });

        it("clears pressed keys on blur", () => {
            const isPressed = new FlowGraphIsKeyPressedBlock();
            flowGraph.addBlock(isPressed);
            isPressed.key.setValue("KeyA", flowGraphContext);

            flowGraph.start();

            // Press a key
            simulateKeyDown(scene, makeKeyEvent({ code: "KeyA", key: "a" }));
            isPressed._updateOutputs(flowGraphContext);
            expect(isPressed.isPressed.getValue(flowGraphContext)).toBe(true);

            // Simulate blur — the coordinator clears pressedKeys
            flowGraph.sceneEventCoordinator.pressedKeys.clear();
            isPressed._updateOutputs(flowGraphContext);
            expect(isPressed.isPressed.getValue(flowGraphContext)).toBe(false);
        });
    });
});
