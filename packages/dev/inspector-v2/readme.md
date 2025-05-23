# Inspector V2

This document covers the high level aspects of the Inspector V2 architecture. Note that much of this may move to a shared tooling package as it is intended to be usable by other tools (Sandbox, Playground, NME, etc.) in the future if we find enough value in integrating the framework into those tools.

One of the goals of the Inspector V2 architecture is to allow new functionality to easily be added to the Inspector in one of two ways:
1. **Modularity**: In code, using `Inspector.Show`. For example, the Sandbox might want to include additional features in the Inspector that make sense in the context of the Sandbox.
2. **Extensibility**: By the end user opting into optional features by installing extensions from the Inspector UI. For example, we might have an extension for advanced skeleton diagnostics, which a user would only care about if they are heavily working with skeletal animations. In the future, we can open up extensibility to make it possible for the community to publish their own extensions to a community extension feed. This makes it possible to drastically extend the power of Inspector without overwhelming all users with every single potential capability of the Inspector.

## Modularity

Modularity is hierarchical. For example, Scene Explorer is an extension of the tool Shell (the basic top/bottom tool bar + left/right side panes + primary content layout), and Audio Engine Explorer is an extension of Scene Explorer. Since this creates a dependency graph of components, a "service" architecture is leveraged, where each service can consume other services, and produce services that can be consumed by other services.

The pieces that make all this possible are:

**Service Contracts** - these are types (typically interfaces) that some other service can consume (depend on). As an interface/type, it is a TypeScript compile time construct.

**Service Identity** - these are JavaScript `Symbol`s that represent a globally unique runtime identity for a service. They are needed to resolve dependencies (consume other services) at runtime.

From a typing standpoint (compile time), a Service Contract is associated with a Service Identity through the `IService` interface. For example:

```ts
export const MyServiceIdentity = Symbol("MyService");
export interface IMyService extends IService<MyServiceIdentity> {
    doSomethingAmazing(): void;
}
```

This allows for strong type checking at compile time to prevent mistakes where there are mismatches between service contracts (compile time) and service identities (runtime).

**Service Definitions** - these define a concrete service, which declares the services it consumes, the services it produces, and provides a factory function which takes the consumed services (interfaces) as inputs and returns an object instance that implements the produced services (interfaces).

For example:

```ts
export MyServiceDefinition: ServiceDefinition</*Produced Service Contracts*/ [IMyService], /*Consumed Service Contracts*/ [IOtherService]> = {
    // Helpful for debugging, and sometimes used in UI.
    friendlyName: "My Service",

    // This must be an array of unique symbols that match the unique symbol types extracted from the produced service contracts (if not there will be a compile time error to catch this mistake).
    produces: [MyServiceIdentity],

    // Same thing again, this list must match up with the consumed service contracts.
    consumes: [OtherServiceIdentity],

    // The factory function takes as inputs the consumed service contracts, and returns an object that implements the produced service contracts (if not there will be a compile time error to catch this mistake).
    factory: (otherService) => {
        otherService.doSomethingInteresting();
        return {
            doSomethingAmazing: () => console.log("Something amazing!"),
        };
    },
};
```

In the example above, the concrete service implementation is defined directly in the factory function. If you want to use a class, you can do so with the `ConstructorFactory` helper function:

```ts
class MyService implements IMyService {
    constructor(otherService: IOtherService) { ... }
    public doSomethingAmazing() {
        console.log("Something amazing!");
    }
}

export MyServiceDefinition: ServiceDefinition<[IMyService], [IOtherService]> = {
    friendlyName: "My Service",
    produces: [MyServiceIdentity],
    consumes: [OtherServiceIdentity],
    factory: ConstructorFactory(MyService),
};
```

**Service Catalog & Container** - service definitions are added to a service catalog. The service catalog creates service container instances, which in turn instantiate all the contained services in the right order, passing instantiated service instances along to other services that depend on those services. When a service container instance is disposed, the services are likewise all torn down in the correct order. When a service is "torn down," if it has a `dispose` function it will be called.

If service definitions are added to a service catalog and there are "active" service container instances, the new services will be instantiated within these active service containers. ***This is the basis for runtime extensibility.***

## Extensibility

**Extension Metadata** - provides high level information about an extension before the extension itself is downloaded and installed.

**Extension Module** - an actual JavaScript module that can be imported, but it must have a default export exposes the service definitions that make up the extension. For example, if the service described in the modularity section were being exposed as a runtime extension, the extension module would need the following export:

```ts
export default {
    serviceDefinitions: [MyServiceDefinition],
} as const;
```

**Extension Feed** - a source of extensions. Initially there would be a single feed that is officially supported by the Babylon team, and ideally in the future we will introduce a community feed that is governed by the Babylon community. A feed can query available extensions (their metadata), download extensions, and save/delete them from the client.

Currently there is only a `BuiltInsExtensionFeed`, which allows extensions that were compiled with the Inspector to be installed via a dynamic import. However, I've also prototyped a different extension feed that downloads bundled scripts from snippet server and dynamically loads them. The tricky thing with this is that these bundled scripts are built separate from the Inspector, but must share many of the same dependencies. This requires "externalizing" common dependencies, and will be more fully tackled when we introduce the community extension feed.

**Extension Manager** - aggregates extension feeds and manages the installing/uninstalling and enabling/disabling extensions. It is dynamically adds/removes service definitions (provided by an extension) to the service catalog.

**Extension List Service** - a specific service that interacts with the Extension Manager to provide a user interface for querying/installing/uninstalling/enabling/disabling extensions.

## Modular Tools

The modularity and extensibility described above is valuable for the Inspector, but it could equally be leveraged by other tools (Sandbox, Playground, etc.). This could provide value in the following ways:
- Unifying the "shell" of the tools and the inspector when they are used together. This would mean tabbed side panes and toolbars could be unified, and also a single Fluent provider could manage theming for both the tool in question and the Inspector.
- Interoperability and service sharing. For example, if the Inspector has a "notification service" that makes it easy to report info/warnings/errors to the user, this could be trivially re-used across tools and the inspector.
- Tool extensibility. The same infrastructure could be leveraged to allow for tool specific extensions, such as new NME node types for example.

Regardless of whether we choose to leverage the framework for other tools in the future, it was minimal effort and good separation of concerns to have a generic modular tool layer below the Inspector V2 itself. This is exposed through the `MakeModularTool` function, which includes the following:

- Management of a service catalog.
- A default set of services useful for all tools, such as a "shell" service that provides toolbars, side panes, and a main content area.
- Management of the extension manager and (optional) UI for browsing and managing extensions.
- The top level Fluent provider and (optional) UI for switching between light and dark theme.
- Managing and rendering the React root.

Options can be passed into `MakeModularTool` to control:

- The container element in which the tool is rendered.
- Additional service definitions composed with the common services for the unique tool.
- The extension feeds the tool should use for runtime extensibility.
- Whether or not dark/light mode toggle UI is exposed.
- Default and minimum left/right pane widths.
- Toolbar mode ("compact" means small toolbars at the top/bottom of the side panes, which is what Inspector V2 uses, and "full" means toolbars that span the full width of the "shell", which would be useful if other tools use `MakeModularTool`).