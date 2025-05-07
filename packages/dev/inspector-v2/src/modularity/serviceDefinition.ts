// eslint-disable-next-line import/no-internal-modules
import type { IDisposable } from "core/index";

/**
 * A helper to create a service factory function from a class constructor.
 * @param constructor The class to create a factory function for.
 * @returns A factory function that creates an instance of the class.
 */
export function ConstructorFactory<Produces, Consumes extends IService<ContractIdentity>[], Class extends { new (...dependencies: Consumes): Produces }>(constructor: Class) {
    return (...dependencies: Consumes) => new constructor(...dependencies);
}

export type ContractIdentity = symbol;

// This allows us to map from a service contract back to a contract identity.
const Contract = Symbol();
/**
 * This interface must be implemented by all service contracts.
 */
export interface IService<ServiceContractIdentity extends ContractIdentity> {
    /**
     * @internal
     */
    readonly [Contract]?: ServiceContractIdentity;
}

type ExtractContractIdentity<ServiceContract extends IService<ContractIdentity>> = ServiceContract extends IService<infer ContractIdentity> ? ContractIdentity : never;

type ExtractContractIdentities<ServiceContracts extends IService<ContractIdentity>[]> = {
    [Index in keyof ServiceContracts]: ExtractContractIdentity<ServiceContracts[Index]>;
};

type UnionToIntersection<Union> = (Union extends any ? (k: Union) => void : never) extends (k: infer Intersection) => void ? Intersection : never;

type MaybePromise<T> = T | Promise<T>;

/**
 * A factory function responsible for creating a service instance.
 * Consumed services are passed as arguments to the factory function.
 * The returned value must implement all produced services.
 */
export type ServiceFactory<Produces extends IService<ContractIdentity>[], Consumes extends IService<ContractIdentity>[]> = (
    ...dependencies: [...Consumes, abortSignal?: AbortSignal]
) => MaybePromise<Produces extends [] ? Partial<IDisposable> | void : Partial<IDisposable> & UnionToIntersection<Produces[number]>>;

/**
 * Defines a service, which is a logical unit that consumes other services (dependencies), and optionally produces services that can be consumed by other services (dependents).
 */
export type ServiceDefinition<Produces extends IService<ContractIdentity>[] = [], Consumes extends IService<ContractIdentity>[] = []> = {
    /**
     * A human readable name for the service to help with debugging.
     */
    friendlyName: string;

    /**
     * A function that instantiates the service.
     */
    factory: ServiceFactory<Produces, Consumes>;
} & (Produces extends []
    ? {
          /**
           * An empty list or undefined, since the type specification has indicated no contracts are produced.
           */
          produces?: [];
      }
    : {
          /**
           * The list of contract identities that this service produces for consumption by other services.
           */
          produces: ExtractContractIdentities<Produces>;
      }) &
    (Consumes extends []
        ? {
              /**
               * An empty list or undefined, since the type specification has indicated that no other services are consumed.
               */
              consumes?: [];
          }
        : {
              /**
               * The list of contract identities of other services that this service consumes.
               */
              consumes: ExtractContractIdentities<Consumes>;
          });
