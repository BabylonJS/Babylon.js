// eslint-disable-next-line import/no-internal-modules
import type { IDisposable } from "core/index";

import type { IService, ServiceDefinition } from "./serviceDefinition";

import { SortGraph } from "../misc/graphUtils";

// Service definitions should strongly typed when they are defined to avoid programming errors. However, they are tracked internally
// in a weakly typed manner so they can be handled generically.
export type WeaklyTypedServiceDefinition = Omit<ServiceDefinition<IService<symbol>[] | [], IService<symbol>[] | []>, "factory"> & {
    /**
     * A factory function responsible for creating a service instance.
     */
    factory: (...args: any) => ReturnType<ServiceDefinition<IService<symbol>[] | [], IService<symbol>[] | []>["factory"]>;
};

// This sorts a set of service definitions based on their dependencies (e.g. a topological sort).
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
 * A service container manages the lifetimes of a set of services.
 * It takes care of instantiating the services in the correct order based on their dependencies,
 * passing dependencies through to services, and disposing of services when the container is disposed.
 */
export class ServiceContainer implements IDisposable {
    private _isDisposed = false;
    private readonly _serviceDefinitions = new Map<symbol, WeaklyTypedServiceDefinition>();
    private readonly _serviceDependents = new Map<WeaklyTypedServiceDefinition, Set<WeaklyTypedServiceDefinition>>();
    private readonly _serviceInstances = new Map<WeaklyTypedServiceDefinition, (IService<symbol> & Partial<IDisposable>) | void>();

    public constructor(private readonly _friendlyName: string) {}

    /**
     * Adds a set of service definitions in the service container.
     * The services are sorted based on their dependencies.
     * @param args The service definitions to register, and optionally an abort signal.
     * @returns A disposable that will remove the service definition from the service container.
     */
    public async addServicesAsync(
        ...args: WeaklyTypedServiceDefinition[] | [...serviceDefinitions: WeaklyTypedServiceDefinition[], abortSignal: AbortSignal]
    ): Promise<IDisposable> {
        if (this._isDisposed) {
            throw new Error("ServiceContainer is disposed.");
        }

        const abortSignal = args[args.length - 1] instanceof AbortSignal ? (args.pop() as AbortSignal) : undefined;
        const serviceDefinitions = args as WeaklyTypedServiceDefinition[];

        const sortedServiceDefinitions = SortServiceDefinitions(serviceDefinitions);

        const dispose = () => {
            for (const serviceDefinition of sortedServiceDefinitions.reverse()) {
                this._removeService(serviceDefinition);
            }
        };

        try {
            for (const serviceDefinition of sortedServiceDefinitions) {
                // We could possibly optimize this by allowing some parallel initialization of services, but this would be way more complex, so let's wait and see if it's needed.
                // eslint-disable-next-line no-await-in-loop
                await this._addServiceAsync(serviceDefinition, abortSignal);
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
     * Registers a service definition in the service container.
     * @param serviceDefinition The service definition to register.
     * @param abortSignal An optional abort signal.
     * @returns A disposable that will remove the service definition from the service container.
     */
    public async addServiceAsync<Produces extends IService<symbol>[] = [], Consumes extends IService<symbol>[] = []>(
        serviceDefinition: ServiceDefinition<Produces, Consumes>,
        abortSignal?: AbortSignal
    ): Promise<IDisposable> {
        if (abortSignal) {
            return await this.addServicesAsync(serviceDefinition, abortSignal);
        } else {
            return await this.addServicesAsync(serviceDefinition);
        }
    }

    private async _addServiceAsync(service: WeaklyTypedServiceDefinition, abortSignal?: AbortSignal) {
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

    private _removeService(service: WeaklyTypedServiceDefinition) {
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

    /**
     * Disposes the service container and all contained services.
     */
    public dispose() {
        Array.from(this._serviceInstances.keys()).reverse().forEach(this._removeService.bind(this));
        this._serviceInstances.clear();
        this._serviceDependents.clear();
        this._serviceDefinitions.clear();
        this._isDisposed = true;
    }
}
