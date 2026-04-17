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

        it("can add and dispose a service with no contracts", () => {
            const container = new ServiceContainer("test");
            const factory = vi.fn(() => ({}));
            const def: ServiceDefinition<[]> = { friendlyName: "svc", factory };
            const handle = container.addService(def);

            expect(factory).toHaveBeenCalledOnce();
            handle.dispose();
            container.dispose();
        });

        it("calls dispose on service instance when removed", () => {
            const container = new ServiceContainer("test");
            const disposeSpy = vi.fn();
            const def: ServiceDefinition<[IContractA]> = {
                friendlyName: "svc",
                produces: [ContractA],
                factory: () => ({ value: "a", dispose: disposeSpy }),
            };

            const handle = container.addService(def);
            handle.dispose();

            expect(disposeSpy).toHaveBeenCalledOnce();
            container.dispose();
        });

        it("handles service factory returning void", () => {
            const container = new ServiceContainer("test");
            const factory = vi.fn(() => {});
            const def: ServiceDefinition<[]> = { friendlyName: "svc", factory };

            const handle = container.addService(def);
            expect(factory).toHaveBeenCalledOnce();
            handle.dispose();
            container.dispose();
        });
    });

    // ---------------------------------------------------------------------------
    // Dependency resolution
    // ---------------------------------------------------------------------------

    describe("dependency resolution", () => {
        it("passes produced services as arguments to consuming factories", () => {
            const container = new ServiceContainer("test");
            const serviceA: IContractA & Partial<IDisposable> = { value: "hello" };

            const defA: ServiceDefinition<[IContractA]> = {
                friendlyName: "A",
                produces: [ContractA],
                factory: () => serviceA,
            };

            const consumerFactory = vi.fn(() => ({}));
            const defConsumer: ServiceDefinition<[], [IContractA]> = {
                friendlyName: "Consumer",
                consumes: [ContractA],
                factory: consumerFactory,
            };

            container.addServices(defA, defConsumer);
            expect(consumerFactory).toHaveBeenCalledWith(serviceA);

            container.dispose();
        });

        it("sorts services by dependency order regardless of registration order", () => {
            const container = new ServiceContainer("test");
            const order: string[] = [];

            const defA: ServiceDefinition<[IContractA]> = {
                friendlyName: "A",
                produces: [ContractA],
                factory: () => {
                    order.push("A");
                    return { value: "a" };
                },
            };

            const defB: ServiceDefinition<[], [IContractA]> = {
                friendlyName: "B",
                consumes: [ContractA],
                factory: () => {
                    order.push("B");
                },
            };

            // Register consumer before producer.
            container.addServices(defB, defA);
            expect(order).toEqual(["A", "B"]);

            container.dispose();
        });

        it("supports a chain of dependencies (A → B → C)", () => {
            const container = new ServiceContainer("test");
            const order: string[] = [];

            const defA: ServiceDefinition<[IContractA]> = {
                friendlyName: "A",
                produces: [ContractA],
                factory: () => {
                    order.push("A");
                    return { value: "a" };
                },
            };

            const defB: ServiceDefinition<[IContractB], [IContractA]> = {
                friendlyName: "B",
                produces: [ContractB],
                consumes: [ContractA],
                factory: () => {
                    order.push("B");
                    return { value: "b" };
                },
            };

            const defC: ServiceDefinition<[], [IContractB]> = {
                friendlyName: "C",
                consumes: [ContractB],
                factory: () => {
                    order.push("C");
                },
            };

            container.addServices(defC, defB, defA);
            expect(order).toEqual(["A", "B", "C"]);

            container.dispose();
        });
    });

    // ---------------------------------------------------------------------------
    // Duplicate contracts
    // ---------------------------------------------------------------------------

    describe("duplicate contracts", () => {
        it("throws when adding two services that produce the same contract", () => {
            const container = new ServiceContainer("test");
            const def1: ServiceDefinition<[IContractA]> = {
                friendlyName: "First",
                produces: [ContractA],
                factory: () => ({ value: "1" }),
            };

            container.addService(def1);

            const def2: ServiceDefinition<[IContractA]> = {
                friendlyName: "Second",
                produces: [ContractA],
                factory: () => ({ value: "2" }),
            };

            expect(() => container.addService(def2)).toThrow(/already been added/);
            container.dispose();
        });
    });

    // ---------------------------------------------------------------------------
    // Missing dependencies
    // ---------------------------------------------------------------------------

    describe("missing dependencies", () => {
        it("throws when a consumed contract is not registered", () => {
            const container = new ServiceContainer("test");
            const def: ServiceDefinition<[], [IContractA]> = {
                friendlyName: "Consumer",
                consumes: [ContractA],
                factory: () => {},
            };

            expect(() => container.addService(def)).toThrow(/has not been registered/);
            container.dispose();
        });
    });

    // ---------------------------------------------------------------------------
    // Removal and dependent checking
    // ---------------------------------------------------------------------------

    describe("service removal", () => {
        it("throws when removing a service that still has dependents", () => {
            const container = new ServiceContainer("test");

            const defA: ServiceDefinition<[IContractA]> = {
                friendlyName: "A",
                produces: [ContractA],
                factory: () => ({ value: "a" }),
            };

            const defConsumer: ServiceDefinition<[], [IContractA]> = {
                friendlyName: "Consumer",
                consumes: [ContractA],
                factory: () => {},
            };

            const handleA = container.addService(defA);
            container.addService(defConsumer);

            expect(() => handleA.dispose()).toThrow(/has dependents.*Consumer/);
            container.dispose();
        });

        it("allows removal after dependent is removed first", () => {
            const container = new ServiceContainer("test");

            const defA: ServiceDefinition<[IContractA]> = {
                friendlyName: "A",
                produces: [ContractA],
                factory: () => ({ value: "a" }),
            };

            const defConsumer: ServiceDefinition<[], [IContractA]> = {
                friendlyName: "Consumer",
                consumes: [ContractA],
                factory: () => {},
            };

            const handleA = container.addService(defA);
            const handleConsumer = container.addService(defConsumer);

            handleConsumer.dispose();
            expect(() => handleA.dispose()).not.toThrow();
            container.dispose();
        });

        it("disposes services in reverse order via addServices handle", () => {
            const container = new ServiceContainer("test");
            const order: string[] = [];

            const defA: ServiceDefinition<[IContractA]> = {
                friendlyName: "A",
                produces: [ContractA],
                factory: () => ({
                    value: "a",
                    dispose: () => order.push("A disposed"),
                }),
            };

            const defConsumer: ServiceDefinition<[], [IContractA]> = {
                friendlyName: "Consumer",
                consumes: [ContractA],
                factory: () => ({
                    dispose: () => order.push("Consumer disposed"),
                }),
            };

            const handle = container.addServices(defA, defConsumer);
            handle.dispose();

            expect(order).toEqual(["Consumer disposed", "A disposed"]);
            container.dispose();
        });
    });

    // ---------------------------------------------------------------------------
    // Disposed container
    // ---------------------------------------------------------------------------

    describe("disposed container", () => {
        it("throws when adding to a disposed container", () => {
            const container = new ServiceContainer("test");
            container.dispose();

            const def: ServiceDefinition<[]> = { friendlyName: "svc", factory: () => {} };
            expect(() => container.addService(def)).toThrow(/disposed/);
        });

        it("throws when adding services to a disposed container via addServices", () => {
            const container = new ServiceContainer("test");
            container.dispose();

            const def: ServiceDefinition<[]> = { friendlyName: "svc", factory: () => {} };
            expect(() => container.addServices(def)).toThrow(/disposed/);
        });
    });

    // ---------------------------------------------------------------------------
    // Factory error handling
    // ---------------------------------------------------------------------------

    describe("factory errors", () => {
        it("rolls back all services if a factory throws during addServices", () => {
            const container = new ServiceContainer("test");
            const disposeSpy = vi.fn();

            const defA: ServiceDefinition<[IContractA]> = {
                friendlyName: "A",
                produces: [ContractA],
                factory: () => ({ value: "a", dispose: disposeSpy }),
            };

            const defFailing: ServiceDefinition<[], [IContractA]> = {
                friendlyName: "Failing",
                consumes: [ContractA],
                factory: () => {
                    throw new Error("Factory failed");
                },
            };

            expect(() => container.addServices(defA, defFailing)).toThrow("Factory failed");

            // A should have been cleaned up.
            expect(disposeSpy).toHaveBeenCalledOnce();

            // Container should still be usable.
            const defB: ServiceDefinition<[IContractA]> = {
                friendlyName: "B",
                produces: [ContractA],
                factory: () => ({ value: "b" }),
            };
            const handle = container.addService(defB);
            handle.dispose();
            container.dispose();
        });
    });

    // ---------------------------------------------------------------------------
    // Parent-child containers
    // ---------------------------------------------------------------------------

    describe("parent-child containers", () => {
        it("resolves dependencies from parent container", () => {
            const parent = new ServiceContainer("parent");
            const serviceA: IContractA & Partial<IDisposable> = { value: "from parent" };

            parent.addService({
                friendlyName: "A",
                produces: [ContractA],
                factory: () => serviceA,
            });

            const child = new ServiceContainer("child", parent);
            const consumerFactory = vi.fn(() => {});
            child.addService<[], [IContractA]>({
                friendlyName: "Consumer",
                consumes: [ContractA],
                factory: consumerFactory,
            });

            expect(consumerFactory).toHaveBeenCalledWith(serviceA);

            child.dispose();
            parent.dispose();
        });

        it("prefers local services over parent services", () => {
            const parent = new ServiceContainer("parent");
            parent.addService({
                friendlyName: "ParentA",
                produces: [ContractA],
                factory: () => contractA("parent"),
            });

            const child = new ServiceContainer("child", parent);
            const childA: IContractA & Partial<IDisposable> = { value: "child" };
            child.addService({
                friendlyName: "ChildA",
                produces: [ContractA],
                factory: () => childA,
            });

            const consumerFactory = vi.fn(() => {});
            child.addService<[], [IContractA]>({
                friendlyName: "Consumer",
                consumes: [ContractA],
                factory: consumerFactory,
            });

            expect(consumerFactory).toHaveBeenCalledWith(childA);

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

        it("tracks parent dependency as dependent for removal checks", () => {
            const parent = new ServiceContainer("parent");
            const handleA = parent.addService({
                friendlyName: "A",
                produces: [ContractA],
                factory: () => contractA("a"),
            });

            const child = new ServiceContainer("child", parent);
            child.addService<[], [IContractA]>({
                friendlyName: "Consumer",
                consumes: [ContractA],
                factory: () => {},
            });

            expect(() => handleA.dispose()).toThrow(/has dependents/);

            child.dispose();
            expect(() => handleA.dispose()).not.toThrow();
            parent.dispose();
        });

        it("cleans up parent dependent tracking when child service is removed", () => {
            const parent = new ServiceContainer("parent");
            const handleA = parent.addService({
                friendlyName: "A",
                produces: [ContractA],
                factory: () => contractA("a"),
            });

            const child = new ServiceContainer("child", parent);
            const handleConsumer = child.addService<[], [IContractA]>({
                friendlyName: "Consumer",
                consumes: [ContractA],
                factory: () => {},
            });

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
        it("disposes all services in reverse order", () => {
            const container = new ServiceContainer("test");
            const order: string[] = [];

            container.addService({
                friendlyName: "First",
                produces: [ContractA],
                factory: () => ({ value: "a", dispose: () => order.push("First") }),
            });

            container.addService<[], [IContractA]>({
                friendlyName: "Second",
                consumes: [ContractA],
                factory: () => ({ dispose: () => order.push("Second") }),
            });

            container.dispose();
            expect(order).toEqual(["Second", "First"]);
        });

        it("clears all internal state on dispose", () => {
            const container = new ServiceContainer("test");

            container.addService({
                friendlyName: "A",
                produces: [ContractA],
                factory: () => contractA("a"),
            });

            container.dispose();

            const def: ServiceDefinition<[]> = { friendlyName: "B", factory: () => {} };
            expect(() => container.addService(def)).toThrow(/disposed/);
        });
    });

    // ---------------------------------------------------------------------------
    // Multiple contracts
    // ---------------------------------------------------------------------------

    describe("multiple contracts", () => {
        it("allows a single service to produce multiple contracts", () => {
            const container = new ServiceContainer("test");
            const multiService = contractAB("multi");

            container.addService({
                friendlyName: "Multi",
                produces: [ContractA, ContractB],
                factory: () => multiService,
            });

            const consumerFactory = vi.fn(() => {});
            container.addService<[], [IContractA]>({
                friendlyName: "ConsumerA",
                consumes: [ContractA],
                factory: consumerFactory,
            });

            expect(consumerFactory).toHaveBeenCalledWith(multiService);

            container.dispose();
        });

        it("tracks dependents per contract for multi-contract services", () => {
            const container = new ServiceContainer("test");
            const multiService = contractAB("multi");

            const handleMulti = container.addService({
                friendlyName: "Multi",
                produces: [ContractA, ContractB],
                factory: () => multiService,
            });

            const handleConsumer = container.addService<[], [IContractA]>({
                friendlyName: "Consumer",
                consumes: [ContractA],
                factory: () => {},
            });

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
        it("works with a synchronous factory function", () => {
            const container = new ServiceContainer("test");

            container.addService({
                friendlyName: "SyncService",
                produces: [ContractA],
                factory: () => contractA("sync"),
            });

            const consumerFactory = vi.fn(() => {});
            const handleConsumer = container.addService<[], [IContractA]>({
                friendlyName: "Consumer",
                consumes: [ContractA],
                factory: consumerFactory,
            });

            expect((consumerFactory.mock.calls[0] as unknown[])[0]).toHaveProperty("value", "sync");

            handleConsumer.dispose();
            container.dispose();
        });
    });

    // ---------------------------------------------------------------------------
    // Cross-container dependency resolution
    // ---------------------------------------------------------------------------

    describe("cross-container dependency resolution", () => {
        it("child resolves dependency from parent immediately", () => {
            const parent = new ServiceContainer("parent");
            const parentService = contractA("ready");

            parent.addServices({
                friendlyName: "ParentService",
                produces: [ContractA],
                factory: () => parentService,
            });

            const child = new ServiceContainer("child", parent);
            const consumerFactory = vi.fn(() => {});
            child.addServices({
                friendlyName: "ChildConsumer",
                consumes: [ContractA],
                factory: consumerFactory,
            });

            expect(consumerFactory).toHaveBeenCalledWith(parentService);

            child.dispose();
            parent.dispose();
        });

        it("multiple children resolve the same parent service", () => {
            const parent = new ServiceContainer("parent");
            const parentService = contractA("shared");

            parent.addServices({
                friendlyName: "ParentService",
                produces: [ContractA],
                factory: () => parentService,
            });

            const child1 = new ServiceContainer("child1", parent);
            const child2 = new ServiceContainer("child2", parent);

            const consumer1 = vi.fn(() => {});
            const consumer2 = vi.fn(() => {});

            child1.addServices({
                friendlyName: "Consumer1",
                consumes: [ContractA],
                factory: consumer1,
            });

            child2.addServices({
                friendlyName: "Consumer2",
                consumes: [ContractA],
                factory: consumer2,
            });

            expect(consumer1).toHaveBeenCalledWith(parentService);
            expect(consumer2).toHaveBeenCalledWith(parentService);

            child1.dispose();
            child2.dispose();
            parent.dispose();
        });
    });
});
