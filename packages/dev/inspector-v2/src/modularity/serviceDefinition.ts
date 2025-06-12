// eslint-disable-next-line import/no-internal-modules
import type { IDisposable } from "core/index";

/**
 * A helper to create a service factory function from a class constructor.
 * @param constructor The class to create a factory function for.
 * @returns A factory function that creates an instance of the class.
 */
export function ConstructorFactory<Class extends new (...args: any) => any>(constructor: Class): (...args: ConstructorParameters<Class>) => InstanceType<Class> {
    return (...args: ConstructorParameters<Class>) => new constructor(...args);
}

// This allows us to map from a service contract back to a contract identity.
const Contract = Symbol();
/**
 * This interface must be implemented by all service contracts.
 */
export interface IService<ContractIdentity extends symbol> {
    /**
     * @internal
     */
    readonly [Contract]?: ContractIdentity;
}

// This utility type extracts the service identity (unique symbol type) from a service contract. That is, it extracts T from IService<T>.
type ExtractContractIdentity<ServiceContract extends IService<symbol>> = ServiceContract extends IService<infer ContractIdentity> ? ContractIdentity : never;

// This utility type extracts the contract identities from an array of service contracts. That is, it extracts [T1, T2, ...] from [IService<T1>, IService<T2>, ...].
type ExtractContractIdentities<ServiceContracts extends IService<symbol>[]> = {
    [Index in keyof ServiceContracts]: ExtractContractIdentity<ServiceContracts[Index]>;
};

// This utility type converts a union of types into an intersection of types. That is, it converts T1 | T2 | ... into T1 & T2 & ...
// This is specifically used to determine the type that a service factory function returns when it produces multiple services.
type UnionToIntersection<Union> = (Union extends any ? (k: Union) => void : never) extends (k: infer Intersection) => void ? Intersection : never;

type MaybePromise<T> = T | Promise<T>;

/**
 * A factory function responsible for creating a service instance.
 * Consumed services are passed as arguments to the factory function.
 * The returned value must implement all produced services, and may IDisposable.
 * If not services are produced, the returned value may implement IDisposable, otherwise it may return void.
 */
export type ServiceFactory<Produces extends IService<symbol>[], Consumes extends IService<symbol>[]> = (
    ...dependencies: [...Consumes, abortSignal?: AbortSignal]
) => MaybePromise<Produces extends [] ? Partial<IDisposable> | void : Partial<IDisposable> & UnionToIntersection<Produces[number]>>;

/**
 * Defines a service, which is a logical unit that consumes other services (dependencies), and optionally produces services that can be consumed by other services (dependents).
 */
export type ServiceDefinition<Produces extends IService<symbol>[] = [], Consumes extends IService<symbol>[] = []> = {
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
