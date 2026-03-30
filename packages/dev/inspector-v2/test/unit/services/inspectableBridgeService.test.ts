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
        it("can register and unregister a command", async () => {
            const definition = MakeInspectableBridgeServiceDefinition({ port: 0, name: "test" });
            const registry = await definition.factory();

            const disposal = registry.addCommand({
                id: "test-cmd",
                description: "A test command",
                execute: async () => "ok",
            });

            expect(disposal).toBeDefined();
            expect(disposal.dispose).toBeInstanceOf(Function);

            disposal.dispose();
            registry.dispose?.();
        });

        it("throws when registering a duplicate command id", async () => {
            const definition = MakeInspectableBridgeServiceDefinition({ port: 0, name: "test" });
            const registry = await definition.factory();

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

            registry.dispose?.();
        });

        it("allows re-registration after disposal", async () => {
            const definition = MakeInspectableBridgeServiceDefinition({ port: 0, name: "test" });
            const registry = await definition.factory();

            const token = registry.addCommand({
                id: "reuse-cmd",
                description: "Reusable",
                execute: async () => "ok",
            });

            token.dispose();

            const token2 = registry.addCommand({
                id: "reuse-cmd",
                description: "Reusable again",
                execute: async () => "ok again",
            });

            expect(token2).toBeDefined();
            token2.dispose();
            registry.dispose?.();
        });
    });
});
