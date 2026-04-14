import { describe, it, expect, vi } from "vitest";
import { ServiceContainer } from "../../../src/modularTool/modularity/serviceContainer";
import { type ServiceDefinition, type IService } from "../../../src/modularTool/modularity/serviceDefinition";
import { type IDisposable } from "core/scene";

// ---------------------------------------------------------------------------
// Helpers — contract symbols and typed service definitions
// ---------------------------------------------------------------------------

const ContractA = Symbol("ContractA");
type ContractAId = typeof ContractA;

interface IContractA extends IService<ContractAId> {
    value: string;
}

const ContractB = Symbol("ContractB");
type ContractBId = typeof ContractB;

interface IContractB extends IService<ContractBId> {
    value: string;
}

function contractA(value: string, extra?: Partial<IDisposable>): IContractA & Partial<IDisposable> {
    return { value, ...extra };
}

function contractAB(value: string, extra?: Partial<IDisposable>): IContractA & IContractB & Partial<IDisposable> {
    return { value, ...extra };
}

// ---------------------------------------------------------------------------
// Basic lifecycle
// ---------------------------------------------------------------------------

describe("ServiceContainer", () => {
    describe("basic lifecycle", () => {
        it("can be created with a friendly name", () => {
            const container = new ServiceContainer("test");
            expect(container).toBeDefined();
            container.dispose();
        });

        it("can add and dispose a service with no contracts", async () => {
            const container = new ServiceContainer("test");
            const factory = vi.fn(async () => ({}));
            const def: ServiceDefinition<[]> = { friendlyName: "svc", factory };
            const handle = await container.addServiceAsync(def);

            expect(factory).toHaveBeenCalledOnce();
            handle.dispose();
            container.dispose();
        });

        it("calls dispose on service instance when removed", async () => {
            const container = new ServiceContainer("test");
            const disposeSpy = vi.fn();
            const def: ServiceDefinition<[IContractA]> = {
                friendlyName: "svc",
                produces: [ContractA],
                factory: async () => ({ value: "a", dispose: disposeSpy }),
            };

            const handle = await container.addServiceAsync(def);
            handle.dispose();

            expect(disposeSpy).toHaveBeenCalledOnce();
            container.dispose();
        });

        it("handles service factory returning void", async () => {
            const container = new ServiceContainer("test");
            const factory = vi.fn(async () => {});
            const def: ServiceDefinition<[]> = { friendlyName: "svc", factory };

            const handle = await container.addServiceAsync(def);
            expect(factory).toHaveBeenCalledOnce();
            handle.dispose();
            container.dispose();
        });
    });

    // ---------------------------------------------------------------------------
    // Dependency resolution
    // ---------------------------------------------------------------------------

    describe("dependency resolution", () => {
        it("passes produced services as arguments to consuming factories", async () => {
            const container = new ServiceContainer("test");
            const serviceA: IContractA & Partial<IDisposable> = { value: "hello" };

            const defA: ServiceDefinition<[IContractA]> = {
                friendlyName: "A",
                produces: [ContractA],
                factory: async () => serviceA,
            };

            const consumerFactory = vi.fn(async () => ({}));
            const defConsumer: ServiceDefinition<[], [IContractA]> = {
                friendlyName: "Consumer",
                consumes: [ContractA],
                factory: consumerFactory,
            };

            await container.addServicesAsync(defA, defConsumer);
            expect(consumerFactory).toHaveBeenCalledWith(serviceA, undefined);

            container.dispose();
        });

        it("sorts services by dependency order regardless of registration order", async () => {
            const container = new ServiceContainer("test");
            const order: string[] = [];

            const defA: ServiceDefinition<[IContractA]> = {
                friendlyName: "A",
                produces: [ContractA],
                factory: async () => {
                    order.push("A");
                    return { value: "a" };
                },
            };

            const defB: ServiceDefinition<[], [IContractA]> = {
                friendlyName: "B",
                consumes: [ContractA],
                factory: async () => {
                    order.push("B");
                },
            };

            // Register consumer before producer.
            await container.addServicesAsync(defB, defA);
            expect(order).toEqual(["A", "B"]);

            container.dispose();
        });

        it("supports a chain of dependencies (A → B → C)", async () => {
            const container = new ServiceContainer("test");
            const order: string[] = [];

            const defA: ServiceDefinition<[IContractA]> = {
                friendlyName: "A",
                produces: [ContractA],
                factory: async () => {
                    order.push("A");
                    return { value: "a" };
                },
            };

            const defB: ServiceDefinition<[IContractB], [IContractA]> = {
                friendlyName: "B",
                produces: [ContractB],
                consumes: [ContractA],
                factory: async () => {
                    order.push("B");
                    return { value: "b" };
                },
            };

            const defC: ServiceDefinition<[], [IContractB]> = {
                friendlyName: "C",
                consumes: [ContractB],
                factory: async () => {
                    order.push("C");
                },
            };

            await container.addServicesAsync(defC, defB, defA);
            expect(order).toEqual(["A", "B", "C"]);

            container.dispose();
        });
    });

    // ---------------------------------------------------------------------------
    // Duplicate contracts
    // ---------------------------------------------------------------------------

    describe("duplicate contracts", () => {
        it("throws when adding two services that produce the same contract", async () => {
            const container = new ServiceContainer("test");
            const def1: ServiceDefinition<[IContractA]> = {
                friendlyName: "First",
                produces: [ContractA],
                factory: async () => ({ value: "1" }),
            };

            await container.addServiceAsync(def1);

            const def2: ServiceDefinition<[IContractA]> = {
                friendlyName: "Second",
                produces: [ContractA],
                factory: async () => ({ value: "2" }),
            };

            await expect(container.addServiceAsync(def2)).rejects.toThrow(/already been added/);
            container.dispose();
        });
    });

    // ---------------------------------------------------------------------------
    // Missing dependencies
    // ---------------------------------------------------------------------------

    describe("missing dependencies", () => {
        it("throws when a consumed contract is not registered", async () => {
            const container = new ServiceContainer("test");
            const def: ServiceDefinition<[], [IContractA]> = {
                friendlyName: "Consumer",
                consumes: [ContractA],
                factory: async () => {},
            };

            await expect(container.addServiceAsync(def)).rejects.toThrow(/has not been registered/);
            container.dispose();
        });
    });

    // ---------------------------------------------------------------------------
    // Removal and dependent checking
    // ---------------------------------------------------------------------------

    describe("service removal", () => {
        it("throws when removing a service that still has dependents", async () => {
            const container = new ServiceContainer("test");

            const defA: ServiceDefinition<[IContractA]> = {
                friendlyName: "A",
                produces: [ContractA],
                factory: async () => ({ value: "a" }),
            };

            const defConsumer: ServiceDefinition<[], [IContractA]> = {
                friendlyName: "Consumer",
                consumes: [ContractA],
                factory: async () => {},
            };

            const handleA = await container.addServiceAsync(defA);
            await container.addServiceAsync(defConsumer);

            expect(() => handleA.dispose()).toThrow(/has dependents.*Consumer/);
            container.dispose();
        });

        it("allows removal after dependent is removed first", async () => {
            const container = new ServiceContainer("test");

            const defA: ServiceDefinition<[IContractA]> = {
                friendlyName: "A",
                produces: [ContractA],
                factory: async () => ({ value: "a" }),
            };

            const defConsumer: ServiceDefinition<[], [IContractA]> = {
                friendlyName: "Consumer",
                consumes: [ContractA],
                factory: async () => {},
            };

            const handleA = await container.addServiceAsync(defA);
            const handleConsumer = await container.addServiceAsync(defConsumer);

            handleConsumer.dispose();
            expect(() => handleA.dispose()).not.toThrow();
            container.dispose();
        });

        it("disposes services in reverse order via addServicesAsync handle", async () => {
            const container = new ServiceContainer("test");
            const order: string[] = [];

            const defA: ServiceDefinition<[IContractA]> = {
                friendlyName: "A",
                produces: [ContractA],
                factory: async () => ({
                    value: "a",
                    dispose: () => order.push("A disposed"),
                }),
            };

            const defConsumer: ServiceDefinition<[], [IContractA]> = {
                friendlyName: "Consumer",
                consumes: [ContractA],
                factory: async () => ({
                    dispose: () => order.push("Consumer disposed"),
                }),
            };

            const handle = await container.addServicesAsync(defA, defConsumer);
            handle.dispose();

            expect(order).toEqual(["Consumer disposed", "A disposed"]);
            container.dispose();
        });
    });

    // ---------------------------------------------------------------------------
    // Disposed container
    // ---------------------------------------------------------------------------

    describe("disposed container", () => {
        it("throws when adding to a disposed container", async () => {
            const container = new ServiceContainer("test");
            container.dispose();

            const def: ServiceDefinition<[]> = { friendlyName: "svc", factory: async () => {} };
            await expect(container.addServiceAsync(def)).rejects.toThrow(/disposed/);
        });

        it("throws when adding services to a disposed container via addServicesAsync", async () => {
            const container = new ServiceContainer("test");
            container.dispose();

            const def: ServiceDefinition<[]> = { friendlyName: "svc", factory: async () => {} };
            await expect(container.addServicesAsync(def)).rejects.toThrow(/disposed/);
        });
    });

    // ---------------------------------------------------------------------------
    // Abort signal
    // ---------------------------------------------------------------------------

    describe("abort signal", () => {
        it("passes abort signal to service factory", async () => {
            const container = new ServiceContainer("test");
            const factory = vi.fn(async () => {});
            const controller = new AbortController();

            await container.addServiceAsync({ friendlyName: "svc", factory }, controller.signal);
            expect(factory).toHaveBeenCalledWith(controller.signal);

            container.dispose();
        });

        it("passes abort signal as last arg after dependencies", async () => {
            const container = new ServiceContainer("test");
            const serviceA: IContractA & Partial<IDisposable> = { value: "hello" };

            const defA: ServiceDefinition<[IContractA]> = {
                friendlyName: "A",
                produces: [ContractA],
                factory: async () => serviceA,
            };

            const consumerFactory = vi.fn(async () => {});
            const defConsumer: ServiceDefinition<[], [IContractA]> = {
                friendlyName: "Consumer",
                consumes: [ContractA],
                factory: consumerFactory,
            };

            const controller = new AbortController();
            await container.addServicesAsync(defA, defConsumer, controller.signal);
            expect(consumerFactory).toHaveBeenCalledWith(serviceA, controller.signal);

            container.dispose();
        });
    });

    // ---------------------------------------------------------------------------
    // Factory error handling
    // ---------------------------------------------------------------------------

    describe("factory errors", () => {
        it("rolls back all services if a factory throws during addServicesAsync", async () => {
            const container = new ServiceContainer("test");
            const disposeSpy = vi.fn();

            const defA: ServiceDefinition<[IContractA]> = {
                friendlyName: "A",
                produces: [ContractA],
                factory: async () => ({ value: "a", dispose: disposeSpy }),
            };

            const defFailing: ServiceDefinition<[], [IContractA]> = {
                friendlyName: "Failing",
                consumes: [ContractA],
                factory: async () => {
                    throw new Error("Factory failed");
                },
            };

            await expect(container.addServicesAsync(defA, defFailing)).rejects.toThrow("Factory failed");

            // A should have been cleaned up.
            expect(disposeSpy).toHaveBeenCalledOnce();

            // Container should still be usable.
            const defB: ServiceDefinition<[IContractA]> = {
                friendlyName: "B",
                produces: [ContractA],
                factory: async () => ({ value: "b" }),
            };
            const handle = await container.addServiceAsync(defB);
            handle.dispose();
            container.dispose();
        });
    });

    // ---------------------------------------------------------------------------
    // Parent-child containers
    // ---------------------------------------------------------------------------

    describe("parent-child containers", () => {
        it("resolves dependencies from parent container", async () => {
            const parent = new ServiceContainer("parent");
            const serviceA: IContractA & Partial<IDisposable> = { value: "from parent" };

            await parent.addServiceAsync({
                friendlyName: "A",
                produces: [ContractA],
                factory: async () => serviceA,
            } satisfies ServiceDefinition<[IContractA]>);

            const child = new ServiceContainer("child", parent);
            const consumerFactory = vi.fn(async () => {});
            await child.addServiceAsync({
                friendlyName: "Consumer",
                consumes: [ContractA],
                factory: consumerFactory,
            } satisfies ServiceDefinition<[], [IContractA]>);

            expect(consumerFactory).toHaveBeenCalledWith(serviceA, undefined);

            child.dispose();
            parent.dispose();
        });

        it("prefers local services over parent services", async () => {
            const parent = new ServiceContainer("parent");
            await parent.addServiceAsync({
                friendlyName: "ParentA",
                produces: [ContractA],
                factory: async () => contractA("parent"),
            } satisfies ServiceDefinition<[IContractA]>);

            const child = new ServiceContainer("child", parent);
            const childA: IContractA & Partial<IDisposable> = { value: "child" };
            await child.addServiceAsync({
                friendlyName: "ChildA",
                produces: [ContractA],
                factory: async () => childA,
            } satisfies ServiceDefinition<[IContractA]>);

            const consumerFactory = vi.fn(async () => {});
            await child.addServiceAsync({
                friendlyName: "Consumer",
                consumes: [ContractA],
                factory: consumerFactory,
            } satisfies ServiceDefinition<[], [IContractA]>);

            expect(consumerFactory).toHaveBeenCalledWith(childA, undefined);

            child.dispose();
            parent.dispose();
        });

        it("throws when disposing parent with active children", () => {
            const parent = new ServiceContainer("parent");
            const _child = new ServiceContainer("child", parent);

            expect(() => parent.dispose()).toThrow(/active child container/);

            _child.dispose();
            parent.dispose();
        });

        it("removes child from parent on dispose", () => {
            const parent = new ServiceContainer("parent");
            const child = new ServiceContainer("child", parent);

            child.dispose();
            expect(() => parent.dispose()).not.toThrow();
        });

        it("tracks parent dependency as dependent for removal checks", async () => {
            const parent = new ServiceContainer("parent");
            const handleA = await parent.addServiceAsync({
                friendlyName: "A",
                produces: [ContractA],
                factory: async () => contractA("a"),
            } satisfies ServiceDefinition<[IContractA]>);

            const child = new ServiceContainer("child", parent);
            await child.addServiceAsync({
                friendlyName: "Consumer",
                consumes: [ContractA],
                factory: async () => {},
            } satisfies ServiceDefinition<[], [IContractA]>);

            expect(() => handleA.dispose()).toThrow(/has dependents/);

            child.dispose();
            expect(() => handleA.dispose()).not.toThrow();
            parent.dispose();
        });

        it("cleans up parent dependent tracking when child service is removed", async () => {
            const parent = new ServiceContainer("parent");
            const handleA = await parent.addServiceAsync({
                friendlyName: "A",
                produces: [ContractA],
                factory: async () => contractA("a"),
            } satisfies ServiceDefinition<[IContractA]>);

            const child = new ServiceContainer("child", parent);
            const handleConsumer = await child.addServiceAsync({
                friendlyName: "Consumer",
                consumes: [ContractA],
                factory: async () => {},
            } satisfies ServiceDefinition<[], [IContractA]>);

            handleConsumer.dispose();
            expect(() => handleA.dispose()).not.toThrow();

            child.dispose();
            parent.dispose();
        });
    });

    // ---------------------------------------------------------------------------
    // dispose() behavior
    // ---------------------------------------------------------------------------

    describe("dispose", () => {
        it("disposes all services in reverse order", async () => {
            const container = new ServiceContainer("test");
            const order: string[] = [];

            await container.addServiceAsync({
                friendlyName: "First",
                produces: [ContractA],
                factory: async () => ({ value: "a", dispose: () => order.push("First") }),
            } satisfies ServiceDefinition<[IContractA]>);

            await container.addServiceAsync({
                friendlyName: "Second",
                consumes: [ContractA],
                factory: async () => ({ dispose: () => order.push("Second") }),
            } satisfies ServiceDefinition<[], [IContractA]>);

            container.dispose();
            expect(order).toEqual(["Second", "First"]);
        });

        it("clears all internal state on dispose", async () => {
            const container = new ServiceContainer("test");

            await container.addServiceAsync({
                friendlyName: "A",
                produces: [ContractA],
                factory: async () => contractA("a"),
            } satisfies ServiceDefinition<[IContractA]>);

            container.dispose();

            const def: ServiceDefinition<[]> = { friendlyName: "B", factory: async () => {} };
            await expect(container.addServiceAsync(def)).rejects.toThrow(/disposed/);
        });
    });

    // ---------------------------------------------------------------------------
    // Multiple contracts
    // ---------------------------------------------------------------------------

    describe("multiple contracts", () => {
        it("allows a single service to produce multiple contracts", async () => {
            const container = new ServiceContainer("test");
            const multiService = contractAB("multi");

            await container.addServiceAsync({
                friendlyName: "Multi",
                produces: [ContractA, ContractB],
                factory: async () => multiService,
            } satisfies ServiceDefinition<[IContractA, IContractB]>);

            const consumerFactory = vi.fn(async () => {});
            await container.addServiceAsync({
                friendlyName: "ConsumerA",
                consumes: [ContractA],
                factory: consumerFactory,
            } satisfies ServiceDefinition<[], [IContractA]>);

            expect(consumerFactory).toHaveBeenCalledWith(multiService, undefined);

            container.dispose();
        });

        it("tracks dependents per contract for multi-contract services", async () => {
            const container = new ServiceContainer("test");
            const multiService = contractAB("multi");

            const handleMulti = await container.addServiceAsync({
                friendlyName: "Multi",
                produces: [ContractA, ContractB],
                factory: async () => multiService,
            } satisfies ServiceDefinition<[IContractA, IContractB]>);

            const handleConsumer = await container.addServiceAsync({
                friendlyName: "Consumer",
                consumes: [ContractA],
                factory: async () => {},
            } satisfies ServiceDefinition<[], [IContractA]>);

            expect(() => handleMulti.dispose()).toThrow(/has dependents/);

            handleConsumer.dispose();
            expect(() => handleMulti.dispose()).not.toThrow();

            container.dispose();
        });
    });

    // ---------------------------------------------------------------------------
    // Synchronous factory
    // ---------------------------------------------------------------------------

    describe("synchronous factory", () => {
        it("works with a synchronous factory function", async () => {
            const container = new ServiceContainer("test");

            await container.addServiceAsync({
                friendlyName: "SyncService",
                produces: [ContractA],
                factory: () => contractA("sync"),
            } satisfies ServiceDefinition<[IContractA]>);

            const consumerFactory = vi.fn(async () => {});
            const handleConsumer = await container.addServiceAsync({
                friendlyName: "Consumer",
                consumes: [ContractA],
                factory: consumerFactory,
            } satisfies ServiceDefinition<[], [IContractA]>);

            expect((consumerFactory.mock.calls[0] as unknown[])[0]).toHaveProperty("value", "sync");

            handleConsumer.dispose();
            container.dispose();
        });
    });
});
