import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { InspectableCommandRegistryIdentity } from "../../../src/services/cli/inspectableCommandRegistry";
import { CliConnectionStatusIdentity } from "../../../src/services/cli/cliConnectionStatus";
import { MakeInspectableBridgeServiceDefinition } from "../../../src/services/cli/inspectableBridgeService";

describe("InspectableBridgeService", () => {
    let originalWebSocket: typeof WebSocket;

    beforeEach(() => {
        originalWebSocket = globalThis.WebSocket;
        // Stub WebSocket to prevent real network I/O in tests.
        globalThis.WebSocket = vi.fn(() => ({
            onopen: null,
            onclose: null,
            onerror: null,
            onmessage: null,
            close: vi.fn(),
            send: vi.fn(),
        })) as unknown as typeof WebSocket;
    });

    afterEach(() => {
        globalThis.WebSocket = originalWebSocket;
    });
    describe("service definition", () => {
        it("produces InspectableCommandRegistryIdentity", () => {
            const definition = MakeInspectableBridgeServiceDefinition({ port: 4400, name: "test", autoStart: false });
            expect(definition.produces).toContain(InspectableCommandRegistryIdentity);
        });

        it("produces CliConnectionStatusIdentity", () => {
            const definition = MakeInspectableBridgeServiceDefinition({ port: 4400, name: "test", autoStart: false });
            expect(definition.produces).toContain(CliConnectionStatusIdentity);
        });

        it("has a friendly name", () => {
            const definition = MakeInspectableBridgeServiceDefinition({ port: 4400, name: "test", autoStart: false });
            expect(definition.friendlyName).toBe("Inspectable Bridge Service");
        });
    });

    describe("command registry", () => {
        it("can register and unregister a command", async () => {
            const definition = MakeInspectableBridgeServiceDefinition({ port: 0, name: "test", autoStart: false });
            const registry = await definition.factory();

            const disposal = registry.addCommand({
                id: "test-cmd",
                description: "A test command",
                executeAsync: async () => "ok",
            });

            expect(disposal).toBeDefined();
            expect(disposal.dispose).toBeInstanceOf(Function);

            disposal.dispose();
            registry.dispose?.();
        });

        it("throws when registering a duplicate command id", async () => {
            const definition = MakeInspectableBridgeServiceDefinition({ port: 0, name: "test", autoStart: false });
            const registry = await definition.factory();

            registry.addCommand({
                id: "dup-cmd",
                description: "First",
                executeAsync: async () => "first",
            });

            expect(() => {
                registry.addCommand({
                    id: "dup-cmd",
                    description: "Second",
                    executeAsync: async () => "second",
                });
            }).toThrow("Command 'dup-cmd' is already registered.");

            registry.dispose?.();
        });

        it("allows re-registration after disposal", async () => {
            const definition = MakeInspectableBridgeServiceDefinition({ port: 0, name: "test", autoStart: false });
            const registry = await definition.factory();

            const token = registry.addCommand({
                id: "reuse-cmd",
                description: "Reusable",
                executeAsync: async () => "ok",
            });

            token.dispose();

            const token2 = registry.addCommand({
                id: "reuse-cmd",
                description: "Reusable again",
                executeAsync: async () => "ok again",
            });

            expect(token2).toBeDefined();
            token2.dispose();
            registry.dispose?.();
        });
    });

    describe("connection status", () => {
        it("starts disabled and disconnected", async () => {
            const definition = MakeInspectableBridgeServiceDefinition({ port: 0, name: "test", autoStart: false });
            const registry = await definition.factory();

            expect(registry.isEnabled).toBe(false);
            expect(registry.isConnected).toBe(false);

            registry.dispose?.();
        });

        it("starts enabled when autoStart is true", async () => {
            const definition = MakeInspectableBridgeServiceDefinition({ port: 0, name: "test", autoStart: true });
            const registry = await definition.factory();

            expect(registry.isEnabled).toBe(true);

            registry.dispose?.();
        });

        it("exposes onConnectionStatusChanged observable", async () => {
            const definition = MakeInspectableBridgeServiceDefinition({ port: 0, name: "test", autoStart: false });
            const registry = await definition.factory();

            expect(registry.onConnectionStatusChanged).toBeDefined();
            expect(registry.onConnectionStatusChanged.add).toBeInstanceOf(Function);

            registry.dispose?.();
        });

        it("notifies when isEnabled changes", async () => {
            const definition = MakeInspectableBridgeServiceDefinition({ port: 0, name: "test", autoStart: false });
            const registry = await definition.factory();

            let notified = false;
            registry.onConnectionStatusChanged.add(() => {
                notified = true;
            });

            registry.isEnabled = true;
            expect(notified).toBe(true);

            registry.dispose?.();
        });
    });
});
