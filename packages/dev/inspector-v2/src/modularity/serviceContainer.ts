import { type IDisposable } from "core/index";

import { type IService, type ServiceDefinition } from "./serviceDefinition";

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
    private readonly _children = new Set<ServiceContainer>();

    /**
     * Creates a new ServiceContainer.
     * @param _friendlyName A human-readable name for debugging.
     * @param _parent An optional parent container. Dependencies not found locally will be resolved from the parent.
     */
    public constructor(
        private readonly _friendlyName: string,
        private readonly _parent?: ServiceContainer
    ) {
        _parent?._children.add(this);
    }

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

        const dependencies = service.consumes?.map((contract) => this._resolveDependency(contract, service)) ?? [];

        this._serviceInstances.set(service, await service.factory(...dependencies, abortSignal));
    }

    /**
     * Resolves a dependency by contract identity for a consuming service.
     * Checks local services first, then walks up the parent chain.
     * Registers the consumer as a dependent in whichever container owns the dependency.
     * @param contract The contract identity to resolve.
     * @param consumer The service definition that consumes this dependency.
     * @returns The resolved service instance.
     */
    private _resolveDependency(contract: symbol, consumer: WeaklyTypedServiceDefinition): IService<symbol> & Partial<IDisposable> {
        const definition = this._serviceDefinitions.get(contract);
        if (definition) {
            let dependentDefinitions = this._serviceDependents.get(definition);
            if (!dependentDefinitions) {
                this._serviceDependents.set(definition, (dependentDefinitions = new Set()));
            }
            dependentDefinitions.add(consumer);

            const instance = this._serviceInstances.get(definition);
            if (!instance) {
                throw new Error(`Service '${contract.toString()}' has not been instantiated in the '${this._friendlyName}' container.`);
            }
            return instance;
        }

        if (this._parent) {
            return this._parent._resolveDependency(contract, consumer);
        }

        throw new Error(`Service '${contract.toString()}' has not been registered in the '${this._friendlyName}' container.`);
    }

    /**
     * Removes a consumer from the dependent set for a given contract, checking locally first then the parent chain.
     * @param contract The contract identity.
     * @param consumer The service definition to remove as a dependent.
     */
    private _removeDependentFromChain(contract: symbol, consumer: WeaklyTypedServiceDefinition): void {
        const definition = this._serviceDefinitions.get(contract);
        if (definition) {
            const dependentDefinitions = this._serviceDependents.get(definition);
            if (dependentDefinitions) {
                dependentDefinitions.delete(consumer);
                if (dependentDefinitions.size === 0) {
                    this._serviceDependents.delete(definition);
                }
            }
            return;
        }

        this._parent?._removeDependentFromChain(contract, consumer);
    }

    private _removeService(service: WeaklyTypedServiceDefinition) {
        if (this._isDisposed) {
            throw new Error(`'${this._friendlyName}' container is disposed.`);
        }

        const serviceDependents = this._serviceDependents.get(service);
        if (serviceDependents && serviceDependents.size > 0) {
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

        // Remove this service as a dependent from each of its consumed dependencies (local or in parent chain).
        service.consumes?.forEach((contract) => {
            this._removeDependentFromChain(contract, service);
        });
    }

    /**
     * Disposes the service container and all contained services.
     * Throws if this container is still a parent of any live child containers.
     */
    public dispose() {
        if (this._children.size > 0) {
            throw new Error(`'${this._friendlyName}' container cannot be disposed because it has ${this._children.size} active child container(s).`);
        }

        Array.from(this._serviceInstances.keys()).reverse().forEach(this._removeService.bind(this));
        this._serviceInstances.clear();
        this._serviceDependents.clear();
        this._serviceDefinitions.clear();
        this._parent?._children.delete(this);
        this._isDisposed = true;
    }
}
