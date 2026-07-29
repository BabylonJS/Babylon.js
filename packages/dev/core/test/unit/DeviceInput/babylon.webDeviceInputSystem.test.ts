/**
 * @vitest-environment jsdom
 */

import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from "vitest";

vi.mock("core/Misc/logger");

import { WebDeviceInputSystem } from "core/DeviceInput/webDeviceInputSystem";
import { NullEngine, NullEngineOptions } from "core/Engines/nullEngine";
import { Logger } from "core/Misc/logger";

const mockTraceWarn = Logger.Warn as Mock;

describe("WebDeviceInputSystem", () => {
    let engine: NullEngine;
    let wdis: WebDeviceInputSystem;
    let mockOnInputChanged: Mock;
    let mockOnDeviceConnected: Mock;
    let mockOnDeviceDisconnected: Mock;
    let renderElement: HTMLCanvasElement;
    let addEventListenerSpy: ReturnType<typeof vi.spyOn>;
    let raiseOnPointerDown: (evt: any) => {};
    let raiseOnPointerMove: (evt: any) => {};
    let raiseOnPointerUp: (evt: any) => {};

    beforeEach(() => {
        // So that GetPointerPrefix knows we are going to simulate pointer events
        window.PointerEvent = vi.fn() as any;

        renderElement = document.createElement("canvas");
        addEventListenerSpy = vi.spyOn(renderElement, "addEventListener");
        addEventListenerSpy.mockImplementation((type, listener) => {
            switch (type) {
                case "pointerdown":
                    raiseOnPointerDown = listener;
                    break;
                case "pointermove":
                    raiseOnPointerMove = listener;
                    break;
                case "pointerup":
                    raiseOnPointerUp = listener;
                    break;
            }
        });

        mockOnInputChanged = vi.fn();
        mockOnDeviceConnected = vi.fn();
        mockOnDeviceDisconnected = vi.fn();

        const nullEngineOptions = new NullEngineOptions();
        nullEngineOptions.renderingCanvas = renderElement;
        engine = new NullEngine(nullEngineOptions);
        wdis = new WebDeviceInputSystem(engine, mockOnDeviceConnected, mockOnDeviceDisconnected, mockOnInputChanged);
    });

    afterEach(() => {
        wdis.dispose();
        engine.dispose();
        window.PointerEvent = undefined as any;
    });

    describe("when pointerdown comes before pointermove", () => {
        describe("pointerdown", () => {
            it("should raise deviceConnected", () => {
                // Act
                raiseOnPointerDown({ pointerType: "touch", button: 0, pointerId: 1 });

                // Assert
                expect(mockOnDeviceConnected).toHaveBeenCalled();
                expect(mockTraceWarn).not.toHaveBeenCalled();
            });
        });
        describe("many pointerdown, pointermove, pointerup cycles", () => {
            it("should work and raise no warnings", () => {
                for (let pointerId = 0; pointerId < 25; pointerId++) {
                    // Arrange
                    mockOnInputChanged.mockClear();
                    mockOnDeviceConnected.mockClear();
                    mockOnDeviceDisconnected.mockClear();

                    // Act
                    raiseOnPointerDown({ pointerType: "touch", button: 0, pointerId });
                    raiseOnPointerMove({ pointerType: "touch", button: -1, buttons: 1, pointerId });
                    raiseOnPointerUp({ pointerType: "touch", button: 0, pointerId });

                    // Assert
                    expect(mockTraceWarn).not.toHaveBeenCalled();
                    expect(mockOnDeviceConnected).toHaveBeenCalled();
                    expect(mockOnInputChanged).toHaveBeenCalled();
                    expect(mockOnDeviceDisconnected).toHaveBeenCalled();
                }
            });
        });
    });

    describe("when pointermove comes before pointerdown", () => {
        describe("initial pointermove", () => {
            it("should raise deviceConnected", () => {
                // Act
                raiseOnPointerMove({ pointerType: "touch", button: -1, buttons: 1, pointerId: 1 });

                // Assert
                expect(mockOnDeviceConnected).toHaveBeenCalled();
                expect(mockTraceWarn).not.toHaveBeenCalled();
            });
        });
        describe("subsequent pointermove", () => {
            it("should not raise deviceConnected again", () => {
                // Arrange
                raiseOnPointerMove({ pointerType: "touch", button: -1, buttons: 1, pointerId: 1 });
                mockOnDeviceConnected.mockReset();

                // Act
                raiseOnPointerMove({ pointerType: "touch", button: -1, buttons: 1, pointerId: 1 });

                // Assert
                expect(mockOnDeviceConnected).not.toHaveBeenCalled();
                expect(mockTraceWarn).not.toHaveBeenCalled();
            });
        });
        describe("many pointermove, pointerdown, pointerup cycles", () => {
            it("should work and raise no warnings", () => {
                for (let pointerId = 0; pointerId < 25; pointerId++) {
                    // Arrange
                    mockOnInputChanged.mockClear();
                    mockOnDeviceConnected.mockClear();
                    mockOnDeviceDisconnected.mockClear();

                    // Act
                    raiseOnPointerMove({ pointerType: "touch", button: -1, buttons: 1, pointerId });
                    raiseOnPointerDown({ pointerType: "touch", button: 0, pointerId });
                    raiseOnPointerUp({ pointerType: "touch", button: 0, pointerId });

                    // Assert
                    expect(mockTraceWarn).not.toHaveBeenCalled();
                    expect(mockOnDeviceConnected).toHaveBeenCalled();
                    expect(mockOnInputChanged).toHaveBeenCalled();
                    expect(mockOnDeviceDisconnected).toHaveBeenCalled();
                }
            });
        });
    });

    describe("when a touch pointer hovers without contact", () => {
        it("should not exhaust the available touch slots", () => {
            // Act
            for (let pointerId = 0; pointerId < 25; pointerId++) {
                raiseOnPointerMove({ pointerType: "touch", button: -1, buttons: 0, pointerId });
            }
            raiseOnPointerDown({ pointerType: "touch", button: 0, pointerId: 25 });

            // Assert
            expect(mockOnDeviceConnected).toHaveBeenCalledTimes(1);
            expect(mockOnInputChanged).toHaveBeenCalledTimes(1);
            expect(mockTraceWarn).not.toHaveBeenCalled();
        });
    });
});
