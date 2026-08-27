/**
 * @vitest-environment jsdom
 */

import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { type IMinimalMotionControllerObject, type IWebXRControllerHapticActuator } from "core/XR/motionController/webXRAbstractMotionController";
import { WebXRGenericTriggerMotionController } from "core/XR/motionController/webXRGenericMotionController";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type LegacyHapticActuator = NonNullable<IMinimalMotionControllerObject["hapticActuators"]>[number];

function createAdvancedActuator(overrides: Partial<IWebXRControllerHapticActuator> = {}): IWebXRControllerHapticActuator {
    return {
        ...overrides,
    };
}

function createLegacyActuator(overrides: Partial<LegacyHapticActuator> = {}): LegacyHapticActuator {
    return {
        pulse: vi.fn(async () => true),
        ...overrides,
    };
}

function createGamepad(
    options: {
        hapticActuators?: LegacyHapticActuator[];
        vibrationActuator?: IWebXRControllerHapticActuator;
    } = {}
): IMinimalMotionControllerObject {
    return {
        axes: [],
        buttons: [{ value: 0, touched: false, pressed: false }],
        ...options,
    };
}

describe("WebXR motion controller haptics", () => {
    let engine: NullEngine;
    let scene: Scene;

    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    it("uses the browser vibration actuator for effect discovery", () => {
        const controller = new WebXRGenericTriggerMotionController(
            scene,
            createGamepad({
                hapticActuators: [createLegacyActuator()],
                vibrationActuator: createAdvancedActuator({ effects: ["dual-rumble"] }),
            }),
            "right"
        );

        expect(controller.getHapticEffects()).toEqual(["dual-rumble"]);
    });

    it("supports explicitly advanced haptic actuator array entries as a fallback", () => {
        const controller = new WebXRGenericTriggerMotionController(
            scene,
            createGamepad({
                hapticActuators: [
                    createLegacyActuator(),
                    createLegacyActuator({
                        effects: ["trigger-rumble"],
                    }),
                ],
                vibrationActuator: createAdvancedActuator({ effects: ["dual-rumble"] }),
            }),
            "right"
        );

        expect(controller.getHapticEffects()).toEqual(["dual-rumble"]);
        expect(controller.getHapticEffects(1)).toEqual(["trigger-rumble"]);
    });

    it("returns no effects when the actuator does not expose discovery", () => {
        const controller = new WebXRGenericTriggerMotionController(scene, createGamepad({ vibrationActuator: createAdvancedActuator() }), "right");

        expect(controller.getHapticEffects()).toEqual([]);
    });

    it("delegates dual-rumble and trigger-rumble effects with their parameters", async () => {
        const playEffect: NonNullable<IWebXRControllerHapticActuator["playEffect"]> = vi.fn(async () => "complete");
        const parameters = {
            duration: 120,
            startDelay: 5,
            strongMagnitude: 0.8,
            weakMagnitude: 0.4,
        };
        const triggerParameters = {
            duration: 80,
            leftTrigger: 0.6,
            rightTrigger: 0.3,
        };
        const controller = new WebXRGenericTriggerMotionController(
            scene,
            createGamepad({
                hapticActuators: [
                    createLegacyActuator(),
                    createLegacyActuator({
                        effects: ["trigger-rumble"],
                        playEffect,
                    }),
                ],
                vibrationActuator: createAdvancedActuator({
                    effects: ["dual-rumble"],
                    playEffect,
                }),
            }),
            "right"
        );

        await expect(controller.playHapticEffectAsync("dual-rumble", parameters)).resolves.toBe("complete");
        await expect(controller.playHapticEffectAsync("trigger-rumble", triggerParameters, 1)).resolves.toBe("complete");
        expect(playEffect).toHaveBeenNthCalledWith(1, "dual-rumble", parameters);
        expect(playEffect).toHaveBeenNthCalledWith(2, "trigger-rumble", triggerParameters);
    });

    it("resets the selected actuator and returns its native result", async () => {
        const firstReset: NonNullable<IWebXRControllerHapticActuator["reset"]> = vi.fn(async () => "complete");
        const secondReset: NonNullable<IWebXRControllerHapticActuator["reset"]> = vi.fn(async () => "preempted");
        const controller = new WebXRGenericTriggerMotionController(
            scene,
            createGamepad({
                hapticActuators: [createLegacyActuator(), createLegacyActuator({ reset: secondReset })],
                vibrationActuator: createAdvancedActuator({ reset: firstReset }),
            }),
            "left"
        );

        await expect(controller.resetHapticActuatorAsync()).resolves.toBe("complete");
        await expect(controller.resetHapticActuatorAsync(1)).resolves.toBe("preempted");
        expect(firstReset).toHaveBeenCalledOnce();
        expect(secondReset).toHaveBeenCalledOnce();
    });

    it("rejects advanced playback when required capabilities are unavailable", async () => {
        const playEffect: NonNullable<IWebXRControllerHapticActuator["playEffect"]> = vi.fn(async () => "complete");
        const withoutDiscovery = new WebXRGenericTriggerMotionController(scene, createGamepad({ vibrationActuator: createAdvancedActuator({ playEffect }) }), "right");
        const withoutPlayback = new WebXRGenericTriggerMotionController(scene, createGamepad({ vibrationActuator: createAdvancedActuator({ effects: ["dual-rumble"] }) }), "right");
        const withoutRequestedEffect = new WebXRGenericTriggerMotionController(
            scene,
            createGamepad({ vibrationActuator: createAdvancedActuator({ effects: ["dual-rumble"], playEffect }) }),
            "right"
        );

        await expect(withoutDiscovery.playHapticEffectAsync("dual-rumble")).rejects.toThrow("does not support effect discovery");
        await expect(withoutPlayback.playHapticEffectAsync("dual-rumble")).rejects.toThrow("does not support advanced effect playback");
        await expect(withoutRequestedEffect.playHapticEffectAsync("trigger-rumble")).rejects.toThrow('Haptic effect "trigger-rumble" is not supported');
    });

    it("rejects reset when the selected actuator does not expose it", async () => {
        const controller = new WebXRGenericTriggerMotionController(scene, createGamepad({ vibrationActuator: createAdvancedActuator() }), "right");

        await expect(controller.resetHapticActuatorAsync()).rejects.toThrow("does not support reset");
    });

    it("rejects invalid actuator indices deterministically", async () => {
        const controller = new WebXRGenericTriggerMotionController(scene, createGamepad({ vibrationActuator: createAdvancedActuator() }), "right");

        expect(() => controller.getHapticEffects(-1)).toThrow(RangeError);
        expect(() => controller.getHapticEffects(0.5)).toThrow(RangeError);
        await expect(controller.playHapticEffectAsync("dual-rumble", undefined, 1)).rejects.toThrow("Haptic actuator index 1 is out of range");
        await expect(controller.resetHapticActuatorAsync(1)).rejects.toThrow("Haptic actuator index 1 is out of range");
    });

    it("propagates native play and reset rejections", async () => {
        const playError = new Error("native play failure");
        const resetError = new Error("native reset failure");
        const controller = new WebXRGenericTriggerMotionController(
            scene,
            createGamepad({
                vibrationActuator: createAdvancedActuator({
                    effects: ["dual-rumble"],
                    playEffect: vi.fn(async () => {
                        throw playError;
                    }),
                    reset: vi.fn(async () => {
                        throw resetError;
                    }),
                }),
            }),
            "right"
        );

        await expect(controller.playHapticEffectAsync("dual-rumble")).rejects.toBe(playError);
        await expect(controller.resetHapticActuatorAsync()).rejects.toBe(resetError);
    });

    it("preserves legacy pulse behavior", async () => {
        const pulse = vi.fn(async () => true);
        const controller = new WebXRGenericTriggerMotionController(
            scene,
            createGamepad({
                hapticActuators: [createLegacyActuator(), createLegacyActuator({ pulse })],
                vibrationActuator: createAdvancedActuator({ effects: ["dual-rumble"] }),
            }),
            "right"
        );
        const unsupportedController = new WebXRGenericTriggerMotionController(scene, createGamepad(), "right");

        await expect(controller.pulse(0.7, 50, 1)).resolves.toBe(true);
        expect(pulse).toHaveBeenCalledWith(0.7, 50);
        await expect(controller.pulse(0.7, 50, 2)).resolves.toBe(false);
        await expect(unsupportedController.pulse(0.7, 50)).resolves.toBe(false);
    });
});
