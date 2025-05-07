// eslint-disable-next-line import/no-internal-modules
import type { IDisposable } from "core/index";

import type { ContractIdentity, IService, ServiceDefinition } from "./serviceDefinition";

import { SortGraph } from "../misc/graphUtils";

export type WeaklyTypedServiceDefinition = Omit<ServiceDefinition<IService<ContractIdentity>[] | [], IService<ContractIdentity>[] | []>, "factory"> & {
    /**
     * A factory function responsible for creating a service instance.
     */
    factory: (...args: any) => ReturnType<ServiceDefinition<IService<ContractIdentity>[] | [], IService<ContractIdentity>[] | []>["factory"]>;
};

/**
 * A registry of all known services.
 */
export interface IServiceRegistry {
    registerServicesAsync(...args: WeaklyTypedServiceDefinition[] | [...serviceDefinitions: WeaklyTypedServiceDefinition[], abortSignal: AbortSignal]): Promise<IDisposable>;
}

function SortServiceDefinitions(serviceDefinitions: WeaklyTypedServiceDefinition[]) {
    const sortedServiceDefinitions: typeof serviceDefinitions = [];
    SortGraph(
        serviceDefinitions,
        function* (serviceDefinition) {
            // Check each dependency.
            for (const contractIdentity of serviceDefinition.consumes ?? []) {
                // If another service definition produces the dependency contract, return it as an adjacent node for the purpose of sorting.
                yield* serviceDefinitions.filter((otherServiceDefinition) => (otherServiceDefinition.produces ?? []).includes(contractIdentity));
            }
        },
        sortedServiceDefinitions.push.bind(sortedServiceDefinitions)
    );
    return sortedServiceDefinitions;
}

/**
 * The service catalog is used to register services and create service container instances.
 */
export class ServiceCatalog implements IServiceRegistry, IDisposable {
    private _isDisposed = false;
    private readonly _serviceDefinitions = new Set<WeaklyTypedServiceDefinition>();
    private readonly _serviceContainers = new Set<ServiceContainer>();

    /**
     * Registers a set of service definitions in the service catalog.
     * The services are sorted based on their dependencies.
     * @param args The service definitions to register, and optionally an abort signal.
     * @returns A disposable that will remove the service definition from the service catalog.
     */
    public async registerServicesAsync(
        ...args: WeaklyTypedServiceDefinition[] | [...serviceDefinitions: WeaklyTypedServiceDefinition[], abortSignal: AbortSignal]
    ): Promise<IDisposable> {
        if (this._isDisposed) {
            throw new Error("ServiceCatalog is disposed.");
        }

        const abortSignal = args[args.length - 1] instanceof AbortSignal ? (args.pop() as AbortSignal) : undefined;
        const serviceDefinitions = args as WeaklyTypedServiceDefinition[];

        const dispose = () => {
            // Remove the service instances from any active containers.
            const sortedServiceDefinitions = SortServiceDefinitions(serviceDefinitions);
            for (const serviceDefinition of sortedServiceDefinitions.reverse()) {
                for (const container of this._serviceContainers) {
                    container.removeService(serviceDefinition);
                }
            }

            // Remove the service definitions from the tag map.
            for (const serviceDefinition of serviceDefinitions) {
                this._serviceDefinitions.delete(serviceDefinition);
            }
        };

        // Add the service definitions to the tag map.
        for (const serviceDefinition of serviceDefinitions) {
            this._serviceDefinitions.add(serviceDefinition);
        }

        // Add a service instance to any active containers.
        try {
            const applicableServiceDefinitions = SortServiceDefinitions(serviceDefinitions);
            for (const container of this._serviceContainers) {
                for (const serviceDefinition of applicableServiceDefinitions) {
                    await container.addServiceAsync(serviceDefinition, abortSignal);
                    abortSignal?.throwIfAborted();
                }
            }
        } catch (error: unknown) {
            dispose();
            throw error;
        }

        return {
            dispose,
        };
    }

    /**
     * Registers a service definition in the service catalog.
     * @param serviceDefinition The service definition to register.
     * @param abortSignal An optional abort signal.
     * @returns A disposable that will remove the service definition from the service catalog.
     */
    public registerService<Produces extends IService<ContractIdentity>[] = [], Consumes extends IService<ContractIdentity>[] = []>(
        serviceDefinition: ServiceDefinition<Produces, Consumes>,
        abortSignal?: AbortSignal
    ): Promise<IDisposable> {
        if (abortSignal) {
            return this.registerServicesAsync(serviceDefinition, abortSignal);
        } else {
            return this.registerServicesAsync(serviceDefinition);
        }
    }

    /**
     * Creates a service container instance.
     * All registered services will be instantiated in topological order based on the dependency graph.
     * @param friendlyName A friendly name for the service container instance.
     * @param abortSignal An optional abort signal.
     * @returns A disposable that will tear down the service container instance.
     */
    public async createContainerAsync(friendlyName: string, abortSignal?: AbortSignal): Promise<IDisposable> {
        if (this._isDisposed) {
            throw new Error("ServiceCatalog is disposed.");
        }

        abortSignal?.throwIfAborted();

        const sortedServiceDefinitions = SortServiceDefinitions(Array.from(this._serviceDefinitions));

        const container = new ServiceContainer(friendlyName);
        try {
            for (const serviceDefinition of sortedServiceDefinitions) {
                await container.addServiceAsync(serviceDefinition, abortSignal);
                abortSignal?.throwIfAborted();
            }
        } catch (error: unknown) {
            container.dispose();
            throw error;
        }

        this._serviceContainers.add(container);

        return {
            dispose: () => {
                this._serviceContainers.delete(container);
                container.dispose();
            },
        };
    }

    /**
     * Disposes the service catalog and all container instances and all registered services.
     */
    public dispose() {
        for (const container of this._serviceContainers) {
            container.dispose();
        }
        this._serviceDefinitions.clear();
        this._serviceContainers.clear();
        this._isDisposed = true;
    }
}

class ServiceContainer implements IDisposable {
    private _isDisposed = false;
    private readonly _serviceDefinitions = new Map<ContractIdentity, WeaklyTypedServiceDefinition>();
    private readonly _serviceDependents = new Map<WeaklyTypedServiceDefinition, Set<WeaklyTypedServiceDefinition>>();
    private readonly _serviceInstances = new Map<WeaklyTypedServiceDefinition, (IService<symbol> & Partial<IDisposable>) | void>();

    public constructor(private readonly _friendlyName: string) {}

    /**
     * @internal
     */
    public async addServiceAsync(service: WeaklyTypedServiceDefinition, abortSignal?: AbortSignal) {
        if (this._isDisposed) {
            throw new Error(`'${this._friendlyName}' container is disposed.`);
        }

        service.produces?.forEach((contract) => {
            if (this._serviceDefinitions.has(contract)) {
                throw new Error(`A service producing the contract '${contract.toString()}' has already been added to this '${this._friendlyName}' container.`);
            }
        });

        service.produces?.forEach((contract) => {
            this._serviceDefinitions.set(contract, service);
        });

        const dependencies =
            service.consumes?.map((dependency) => {
                const dependencyDefinition = this._serviceDefinitions.get(dependency);
                if (!dependencyDefinition) {
                    throw new Error(`Service '${dependency.toString()}' has not been registered in the '${this._friendlyName}' container.`);
                }

                let dependentDefinitions = this._serviceDependents.get(dependencyDefinition);
                if (!dependentDefinitions) {
                    this._serviceDependents.set(dependencyDefinition, (dependentDefinitions = new Set()));
                }
                dependentDefinitions.add(service);

                const dependencyInstance = this._serviceInstances.get(dependencyDefinition);
                if (!dependencyInstance) {
                    throw new Error(`Service '${dependency.toString()}' has not been instantiated in the '${this._friendlyName}' container.`);
                }

                return dependencyInstance;
            }) ?? [];

        this._serviceInstances.set(service, await service.factory(...dependencies, abortSignal));
    }

    /**
     * @internal
     */
    public removeService(service: WeaklyTypedServiceDefinition) {
        if (this._isDisposed) {
            throw new Error(`'${this._friendlyName}' container is disposed.`);
        }

        const serviceDependents = this._serviceDependents.get(service);
        if (serviceDependents) {
            throw new Error(
                `Service '${service.friendlyName}' has dependents: ${Array.from(serviceDependents)
                    .map((dependent) => dependent.friendlyName)
                    .join(", ")}`
            );
        }

        // NOTE: The service instance could be undefined, as the service factory for a service that does not produce any contracts is not required to return an actual service instance.
        const serviceInstance = this._serviceInstances.get(service);
        this._serviceInstances.delete(service);
        serviceInstance?.dispose?.();

        service.produces?.forEach((contract) => {
            this._serviceDefinitions.delete(contract);
        });

        service.consumes?.forEach((dependency) => {
            const dependencyDefinition = this._serviceDefinitions.get(dependency);
            if (dependencyDefinition) {
                const dependentDefinitions = this._serviceDependents.get(dependencyDefinition);
                if (dependentDefinitions) {
                    dependentDefinitions.delete(service);
                    if (dependentDefinitions.size === 0) {
                        this._serviceDependents.delete(dependencyDefinition);
                    }
                }
            }
        });
    }

    public dispose() {
        Array.from(this._serviceInstances.keys()).reverse().forEach(this.removeService.bind(this));
        this._isDisposed = true;
    }
}
