// eslint-disable-next-line import/no-internal-modules
import type { IDisposable } from "core/index";
import type { ContractIdentity, Service, ServiceDefinition } from "./serviceDefinition";

import { SortGraph } from "../misc/graphUtils";

export type WeaklyTypedServiceDefinition = Omit<ServiceDefinition<Service<ContractIdentity>[] | [], Service<ContractIdentity>[] | []>, "factory"> & {
    /**
     * A factory function responsible for creating a service instance.
     */
    factory: (...args: any) => ReturnType<ServiceDefinition<Service<ContractIdentity>[] | [], Service<ContractIdentity>[] | []>["factory"]>;
};

type AspectIdentity = symbol;

export type AspectDefinition<Identity extends AspectIdentity> = {
    /**
     * The aspects unique identity.
     */
    readonly identity: Identity;

    /**
     * A human readable name for the aspect that be displayed to users.
     */
    readonly friendlyName: string;

    /**
     * A list of tags that are associated with this aspect.
     * This is used to determine which services are applicable to this aspect.
     */
    readonly tags: readonly [string, ...string[]];
};

export type WeaklyTypedAspectDefinition = AspectDefinition<AspectIdentity>;

type ExtractAspectIdentity<Aspect extends AspectDefinition<AspectIdentity>> = Aspect extends AspectDefinition<infer AspectIdentity> ? AspectIdentity : never;

type ExtractAspectIdentities<Aspects extends readonly AspectDefinition<AspectIdentity>[]> = {
    [Index in keyof Aspects]: ExtractAspectIdentity<Aspects[Index]>;
};

/**
 * A registry of all known aspects.
 */
export interface AspectRegistry {
    registerAspect(aspect: WeaklyTypedAspectDefinition): IDisposable;
}

/**
 * A registray of all known services.
 */
export interface ServiceRegistry {
    registerServices(...args: WeaklyTypedServiceDefinition[] | [...serviceDefinitions: WeaklyTypedServiceDefinition[], abortSignal: AbortSignal]): Promise<IDisposable>;
}

function sortServiceDefinitions(serviceDefinitions: WeaklyTypedServiceDefinition[]) {
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
export class ServiceCatalog<Aspects extends readonly AspectDefinition<AspectIdentity>[] = readonly WeaklyTypedAspectDefinition[]> implements ServiceRegistry, IDisposable {
    private _isDisposed = false;
    private readonly _aspectDefinitions = new Map<AspectIdentity, AspectDefinition<AspectIdentity>>();
    private readonly _serviceDefinitions = new Map<string, Set<WeaklyTypedServiceDefinition>>();
    private readonly _serviceContainers = new Map<AspectDefinition<AspectIdentity>, Set<ServiceContainer>>();

    /**
     * Creates a static service catalog with the specified aspects.
     * A static service catalog is very type safe, but does not allow registering new aspects after it has been created.
     * @param aspects The aspects to register in the service catalog.
     * @returns A service catalog with the specified aspects.
     */
    public static CreateStatic<Aspects extends readonly AspectDefinition<AspectIdentity>[]>(aspects: Aspects) {
        return new ServiceCatalog(aspects);
    }

    /**
     * Creates a dynamic service catalog.
     * A dynamic service catalog is slightly less type safe, but allows registering new aspects after it has been created.
     * @returns A service catalog that can have aspects registered at runtime.
     */
    public static CreateDynamic(): ServiceCatalog & AspectRegistry {
        const serviceCatalog = new ServiceCatalog<readonly AspectDefinition<AspectIdentity>[]>([]);
        return Object.assign(serviceCatalog, {
            registerAspect(aspect: AspectDefinition<AspectIdentity>) {
                serviceCatalog._aspectDefinitions.set(aspect.identity, aspect);

                return {
                    dispose() {
                        serviceCatalog._serviceContainers.get(aspect)?.forEach((container) => container.dispose());
                        serviceCatalog._serviceContainers.delete(aspect);
                        serviceCatalog._aspectDefinitions.delete(aspect.identity);
                    },
                };
            },
        });
    }

    private constructor(aspects: Aspects) {
        for (const aspect of aspects) {
            this._aspectDefinitions.set(aspect.identity, aspect);
        }
    }

    /**
     * Registers a set of service definitions in the service catalog.
     * The services are sorted based on their dependencies.
     * @param args The service definitions to register, and optionally an abort signal.
     * @returns A disposable that will remove the service definition from the service catalog.
     */
    public async registerServices(
        ...args: WeaklyTypedServiceDefinition[] | [...serviceDefinitions: WeaklyTypedServiceDefinition[], abortSignal: AbortSignal]
    ): Promise<IDisposable> {
        if (this._isDisposed) {
            throw new Error("ServiceCatalog is disposed.");
        }

        const abortSignal = args[args.length - 1] instanceof AbortSignal ? (args.pop() as AbortSignal) : undefined;
        const serviceDefinitions = args as WeaklyTypedServiceDefinition[];

        const dispose = () => {
            // Remove the service instances from any active applicable containers.
            for (const [aspectDefinition, containers] of this._serviceContainers) {
                const applicableServiceDefinitions = sortServiceDefinitions(
                    serviceDefinitions.filter((serviceDefinition) => !serviceDefinition.tags || serviceDefinition.tags.some((tag) => aspectDefinition.tags.includes(tag)))
                );
                for (const serviceDefinition of applicableServiceDefinitions.reverse()) {
                    for (const container of containers) {
                        container.removeService(serviceDefinition);
                    }
                }
            }

            // Remove the service definitions from the tag map.
            for (const serviceDefinition of serviceDefinitions) {
                for (const tag of serviceDefinition.tags ?? [""]) {
                    const serviceDefinitionsForTag = this._serviceDefinitions.get(tag);
                    if (serviceDefinitionsForTag) {
                        serviceDefinitionsForTag.delete(serviceDefinition);
                        if (serviceDefinitionsForTag.size === 0) {
                            this._serviceDefinitions.delete(tag);
                        }
                    }
                }
            }
        };

        // Add the service definitions to the tag map.
        for (const serviceDefinition of serviceDefinitions) {
            for (const tag of serviceDefinition.tags ?? [""]) {
                let serviceDefinitionsForTag = this._serviceDefinitions.get(tag);
                if (!serviceDefinitionsForTag) {
                    serviceDefinitionsForTag = new Set();
                    this._serviceDefinitions.set(tag, serviceDefinitionsForTag);
                }
                serviceDefinitionsForTag.add(serviceDefinition);
            }
        }

        // Add a service instance to any active applicable containers.
        try {
            for (const [aspectDefinition, containers] of this._serviceContainers) {
                const applicableServiceDefinitions = sortServiceDefinitions(
                    serviceDefinitions.filter((serviceDefinition) => !serviceDefinition.tags || serviceDefinition.tags.some((tag) => aspectDefinition.tags.includes(tag)))
                );
                for (const container of containers) {
                    for (const serviceDefinition of applicableServiceDefinitions) {
                        await container.addService(serviceDefinition, abortSignal);
                        abortSignal?.throwIfAborted();
                    }
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
    public registerService<Produces extends Service<ContractIdentity>[] = [], Consumes extends Service<ContractIdentity>[] = []>(
        serviceDefinition: ServiceDefinition<Produces, Consumes>,
        abortSignal?: AbortSignal
    ): Promise<IDisposable> {
        if (abortSignal) {
            return this.registerServices(serviceDefinition, abortSignal);
        } else {
            return this.registerServices(serviceDefinition);
        }
    }

    /**
     * Creates a service container instance for the specified aspect.
     * All registered services that target a tag associated with the aspect will be instantiated.
     * @param aspect The aspect for which to create a service container.
     * @param abortSignal An optional abort signal.
     * @returns A disposable that will tear down the service container instance.
     */
    public async createContainer(aspect: ExtractAspectIdentities<Aspects>[number], abortSignal?: AbortSignal): Promise<IDisposable> {
        if (this._isDisposed) {
            throw new Error("ServiceCatalog is disposed.");
        }

        abortSignal?.throwIfAborted();

        const aspectDefinition = this._aspectDefinitions.get(aspect);
        if (!aspectDefinition) {
            throw new Error(`Aspect '${aspect.toString()}' has not been registered.`);
        }

        const applicableServiceDefinitions = sortServiceDefinitions(
            Array.from(new Set([...aspectDefinition.tags, ""].flatMap((tag) => Array.from(this._serviceDefinitions.get(tag) ?? []))))
        );

        const container = new ServiceContainer(aspectDefinition.friendlyName);
        try {
            for (const serviceDefinition of applicableServiceDefinitions) {
                await container.addService(serviceDefinition, abortSignal);
                abortSignal?.throwIfAborted();
            }
        } catch (error: unknown) {
            container.dispose();
            throw error;
        }

        let serviceContainers = this._serviceContainers.get(aspectDefinition);
        if (!serviceContainers) {
            this._serviceContainers.set(aspectDefinition, (serviceContainers = new Set()));
        }
        serviceContainers.add(container);

        return {
            dispose: () => {
                serviceContainers.delete(container);
                if (serviceContainers.size === 0) {
                    this._serviceContainers.delete(aspectDefinition);
                }
                container.dispose();
            },
        };
    }

    /**
     * Disposes the service catalog and all container instances and all registered services.
     */
    public dispose() {
        for (const containers of this._serviceContainers.values()) {
            for (const container of containers) {
                container.dispose();
            }
        }
        this._aspectDefinitions.clear();
        this._serviceDefinitions.clear();
        this._serviceContainers.clear();
        this._isDisposed = true;
    }
}

class ServiceContainer implements IDisposable {
    private _isDisposed = false;
    private readonly _serviceDefinitions = new Map<ContractIdentity, WeaklyTypedServiceDefinition>();
    private readonly _serviceDependents = new Map<WeaklyTypedServiceDefinition, Set<WeaklyTypedServiceDefinition>>();
    private readonly _serviceInstances = new Map<WeaklyTypedServiceDefinition, (Service<symbol> & Partial<IDisposable>) | void>();

    public constructor(private readonly _friendlyName: string) {}

    /**
     * @internal
     */
    public async addService(service: WeaklyTypedServiceDefinition, abortSignal?: AbortSignal) {
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
