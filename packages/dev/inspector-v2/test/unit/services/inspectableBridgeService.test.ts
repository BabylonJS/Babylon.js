import { describe, it, expect } from "vitest";
import { InspectableCommandRegistryIdentity } from "../../../src/services/cli/inspectableCommandRegistry";
import { MakeInspectableBridgeServiceDefinition } from "../../../src/services/cli/inspectableBridgeService";

describe("InspectableBridgeService", () => {
    describe("service definition", () => {
        it("produces InspectableCommandRegistryIdentity", () => {
            const definition = MakeInspectableBridgeServiceDefinition({ port: 4400, name: "test" });
            expect(definition.produces).toContain(InspectableCommandRegistryIdentity);
        });

        it("has a friendly name", () => {
            const definition = MakeInspectableBridgeServiceDefinition({ port: 4400, name: "test" });
            expect(definition.friendlyName).toBe("Inspectable Bridge Service");
        });
    });

    describe("command registry", () => {
        it("can register and unregister a command", () => {
            const definition = MakeInspectableBridgeServiceDefinition({ port: 0, name: "test" });
            // Call factory to get the registry (it will try to connect but that's fine — it won't crash on failure).
            const registry = definition.factory() as ReturnType<typeof definition.factory> & { dispose: () => void };

            const disposal = registry.addCommand({
                id: "test-cmd",
                description: "A test command",
                execute: async () => "ok",
            });

            expect(disposal).toBeDefined();
            expect(disposal.dispose).toBeInstanceOf(Function);

            // Should not throw.
            disposal.dispose();

            // Clean up.
            registry.dispose();
        });

        it("throws when registering a duplicate command id", () => {
            const definition = MakeInspectableBridgeServiceDefinition({ port: 0, name: "test" });
            const registry = definition.factory() as ReturnType<typeof definition.factory> & { dispose: () => void };

            registry.addCommand({
                id: "dup-cmd",
                description: "First",
                execute: async () => "first",
            });

            expect(() => {
                registry.addCommand({
                    id: "dup-cmd",
                    description: "Second",
                    execute: async () => "second",
                });
            }).toThrow("Command 'dup-cmd' is already registered.");

            registry.dispose();
        });

        it("allows re-registration after disposal", () => {
            const definition = MakeInspectableBridgeServiceDefinition({ port: 0, name: "test" });
            const registry = definition.factory() as ReturnType<typeof definition.factory> & { dispose: () => void };

            const token = registry.addCommand({
                id: "reuse-cmd",
                description: "Reusable",
                execute: async () => "ok",
            });

            token.dispose();

            // Should not throw since we disposed the first registration.
            const token2 = registry.addCommand({
                id: "reuse-cmd",
                description: "Reusable again",
                execute: async () => "ok again",
            });

            expect(token2).toBeDefined();
            token2.dispose();
            registry.dispose();
        });
    });
});
