# Inspector V2

This document covers the high level aspects of the Inspector V2 architecture. Note that much of this may move to a shared tooling package as it is intended to be usable by other tools (Sandbox, Playground, NME, etc.) in the future if we find enough value in integrating the framework into those tools.

## Babylon Lite Skeletons and Morph Targets

The Lite Explorer lists skeletons and their bone hierarchy. Skeleton properties show the bone count and links to meshes; bone properties show read-only Name, derived Index, Skeleton and Parent links. Mesh **Skinning** links back to the skeleton. Bone editing, reset, debug rendering and gizmos are not supported.

Skeleton discovery requires the application to call `enableBoneControl()` or `enableBoneControlForSkinnedAssets()` **before** loading its glTF. Inspector does not enable bone control itself. USD, authored and non-opt-in skins do not expose public skeletons. Cloned meshes share a skeleton.

Mesh **Morph Targets** provides one weight slider per target. The slider spans 0–1. The numeric field accepts any finite weight, including negative values and values above 1. Labels use glTF `extras.targetNames`, USD target names or authored morph names when supplied, with numbered fallbacks. Changes use Lite's morph setter and affect every mesh sharing the data. Playing morph animations overwrite the weights each frame.

## Babylon Lite Particle Systems

The Lite Explorer lists CPU systems registered through `registerNodeParticleSet`, in first-registration order, using the NPE SystemBlock name when available. Start/Stop is available on the item and in **Commands**. **General** shows Name, Capacity, Active Particles and Started; stopped systems can still contain draining particles. **Emission** edits Emit Rate, Update Speed and Target Stop Duration (0 means run until stopped). A particle graph may override Emit Rate.

Discovery is add-only until scene disposal. There is no particle removal, reset, lifetime/size/color editing, GPU particle support or particle editor.

These features require `@babylonjs/lite` 1.37.1 or later.

## Babylon Lite Physics

The Lite Explorer discovers worlds created after Inspector opens under **Physics › Physics World [N] › Bodies / Constraints**. Worlds expose body and live-constraint counts, a Scene link, editable Gravity, Timestep (seconds; 0 uses the frame delta), and Max Linear / Angular Velocity. A node's **Physics** section links every body on the node, including bodies in different worlds, or shows **No Physics Body**.

Body sections follow Inspector v2's order: **General** (Node, World, Motion Type, Prestep Type, Instances), **Shape** (Type, primitive parameters, Dynamic Friction, Static Friction, Restitution, Membership / Collide masks, Density, and container Child Count), **Damping** (Linear, Angular, Gravity Factor), **Velocity** (Linear and Angular), **Mass** (Mass, Center of Mass, Inertia, read-only Inertia Orientation), and live **Constraints** links. Quaternion displays use Euler degrees. Mass edits read current properties before writing to preserve unedited fields. Locked inertia axes read 0. Mass edits are rejected with an explanation if any instance has zero inertia: Lite's public readback does not expose the original pre-lock tensor, so writing the locked tensor back would corrupt later rotation unlocking. Unlock rotation in the application before editing mass properties.

Thin bodies show **Instance 0 of K**. Every editable control stays editable, with **Applies to all K instances**: reads use instance 0 and edits fan out to all instances. Mass edits are rejected with an explanation if instances have different unedited mass properties: Lite has no public per-instance mass setter, so those values cannot safely be preserved in a fan-out write. Only the base shape is inspected. Shared shapes remain editable with a **Shape shared by N bodies** warning; material and filter edits affect every user of that shape. The warning counts bodies in the current world only, not other worlds.

Constraints are labelled `Hinge (A ↔ B)` and expose Type, Body A / B links, editable Enabled, and read-only Collision, pivots, axes, perpendicular axes, Max Distance and Limits. Omitted pivots display zero. Constraints on thin bodies bind instance 0 only. Removing either endpoint hides the constraint from Explorer, properties and visualization, even if Lite still lists the constraint.

The Debug pane's independent **Physics Bodies** and **Physics Constraints** switches maintain separate viewers per world. Helpers, including constraint arrowheads, are non-pickable and excluded from Explorer and bounding boxes. Thin-instance body wireframes are omitted because Lite's viewer follows only the carrier node, not individual instance transforms. Container wireframes rebuild when children are added. Both switches are disabled when no worlds exist. Viewer reconciliation and property reads follow Inspector's watch mode; native errors are surfaced and failed helper switches roll back without disabling the other viewer.

For manual physics inspection, run `npm run serve -w @dev/inspector` and open `http://localhost:9001/?experience=lite`. The test app loads the Havok fixture by default (four bodies, including shared shapes and three thin instances, plus hinge and distance constraints). Open **Physics** in Explorer or enable the Debug pane's physics switches. Use `?experience=lite&physics=off` to start without physics; `await window.liteCreatePhysics()` then creates the fixture once, allowing late-discovery testing without reloading. `INSPECTOR_TEST_PORT` selects a different server port when needed.

Limitations: Lite has no physics-engine enable flag. Mesh, convex-hull, heightfield and container shape parameters are unavailable. Material combine modes, motors, sleep state, per-instance editing, pivot editing, creating/releasing physics objects, character controllers, raycasts and impulses are not exposed. Releasing a shape still attached to a live body violates Lite's lifetime contract and cannot be made safe by Inspector.

Physics inspection requires `@babylonjs/lite` 1.37.2 or later for the discovery/readback APIs (including constraint enable, density, child count, stable constraint debug data and constraint hide), matching the Inspector's optional `@babylonjs/lite` peer dependency (`^1.37.2`).

## Babylon Lite Picking

The Lite Inspector's **Enable Picking** toolbar toggle is available only while the engine has a registered scene context. It selects a mesh by tapping its scene canvas. Picks update the Explorer, Properties pane, and `debugNode` through the shared selection service. Camera drags and empty-space taps leave the selection unchanged. Press **Escape**, including from an undocked toolbar, or toggle picking off to exit; pending GPU results cannot change selection after exiting. Removing the last scene also exits picking and removes the toggle; registering another scene restores it with picking disabled.

Picking supports registered scenes on the engine's primary and auxiliary HTML canvases, including canvases created in same-origin iframes or popup windows and scenes added while picking is active. Non-scene rendering contexts, offscreen canvases, non-mesh pick contributors, and Inspector-owned gizmo utility scenes are not selected. Gizmo interactions do not trigger mesh selection. Selection visuals are not included.

For the Inspector v2 test app, run `npm run serve -w @dev/inspector` and open `http://localhost:9001/?experience=lite`. Set `INSPECTOR_TEST_PORT` to use a separate port when running multiple worktrees.

## Babylon Lite Transform Gizmos

Select a mesh or a mesh-hierarchy transform node in Explorer, then enable **Translate**, **Rotate**, **Scale**, or **Bounding Box** in the toolbar. Clicking the active mode again disables it. Translation and rotation support the **Local Coordinates** / **World Coordinates** toggle. Scale always follows the node's local axes because Lite applies scaling to local components; its coordinate toggle is hidden. Bounding-box handles follow the target's bounds and rotation. Gizmos edit the actual Lite node, so the Properties pane follows those changes in polling mode (or after an explicit refresh in manual mode).

Gizmos use Lite's public native utility-layer and pointer-drag APIs, without Babylon.js gizmo implementations or proxy nodes. They currently support registered scenes on the engine's primary HTML canvas only: Lite's utility-layer and gizmo factories target that canvas. Lite supports one gizmo utility layer per canvas, so Inspector controls should not be used simultaneously with application-owned gizmos on that canvas. Cameras, lights, non-node resources, offscreen canvases, and auxiliary-surface nodes have disabled transform controls. Gizmo utility scenes and their resources are hidden from Inspector discovery and picking. Selection changes reattach or dispose gizmos; mode changes, removed scenes/nodes, and Inspector disposal release their utility layers and pointer bindings. If Inspector is replaced during registration, its replacement waits for the previous layer to settle and retire before creating gizmos on the same canvas. Removing the last supported scene resets the mode.

One of the goals of the Inspector V2 architecture is to allow new functionality to easily be added to the Inspector in one of two ways:
1. **Modularity**: In code, using `Inspector.Show`. For example, the Sandbox might want to include additional features in the Inspector that make sense in the context of the Sandbox.
2. **Extensibility**: By the end user opting into optional features by installing extensions from the Inspector UI. For example, we might have an extension for advanced skeleton diagnostics, which a user would only care about if they are heavily working with skeletal animations. In the future, we can open up extensibility to make it possible for the community to publish their own extensions to a community extension feed. This makes it possible to drastically extend the power of Inspector without overwhelming all users with every single potential capability of the Inspector.

## Babylon Lite animations

The `@babylonjs/inspector/lite` entrypoint lists each registered scene's public
`animationGroups` in Explorer, including their targeted animations. Group properties
provide play/pause, stop, speed, looping, weight, frame scrubbing, clip information,
and metadata. Scrubbing applies the pose through Lite's `goToFrame` API and preserves
the group's playing/paused state. Values and hierarchy changes follow the preferred
polling or manual watch mode.

Target rows show the public path, target name, and node index, and link to the runtime
target when Lite exposes one. An entity's Animation section links to groups that
directly target it or its scene-node transform values, including groups added after
a non-node target is selected. Objects with no matching groups show "No Animations".
Name-only targets remain
inspectable without inventing a runtime target. Standalone animation managers are not
engine-discoverable; their groups must also be exposed in a registered scene's
`animationGroups` to appear here. Weight edits do not implicitly enable an optional
animation mixer.

Lite's public target descriptions do not expose editable keyframe curves, per-target
animation ranges, blending overrides, or additive state, so the Lite Inspector does
not load Babylon.js animation implementations or the native curve editor. The test
app's `?experience=lite` scene includes two property-animation groups for exercising
these controls.

The browser tests use the Inspector test app rather than the CDN scene-test harness.
Start the app with `npm run serve -w @dev/inspector`, then set
`INSPECTOR_TEST_PORT=9001` and run
`npx playwright test --config playwright.config.ts --project=integration -g "Lite Inspector"`.
These tests are skipped when `INSPECTOR_TEST_PORT` is unset so other integration suites
do not require an Inspector server. On a GPU-less machine, set
`CUSTOM_FLAGS=--use-webgpu-adapter=swiftshader` to use Chrome's software WebGPU adapter.
These tests explicitly select Chromium with the Chrome channel even when the
integration project's default browser is Firefox.

## Babylon Lite debug and capture

The Lite **Debug** pane offers a ground grid and mesh bounding boxes for any
registered scene, including scenes on auxiliary surfaces. Helpers are non-pickable
meshes named `Inspector Ground Grid` and `Inspector Bounds: <mesh name>` in Explorer.
Each scene retains its own helper settings across tab changes. Bounding boxes inherit
the mesh's live world transform, keeping animation synchronized every frame without
changing the application's node hierarchy. Geometry, visibility, and topology updates
follow Inspector's polling/manual watch mode; skeletal/morph deformations and individual thin instances are not
included. Removing a source mesh or unregistering a scene releases its helpers;
closing Inspector removes only the meshes it created. Cleanup detaches any
application nodes parented under helpers while preserving their world transforms.
Deleting a grid in Explorer disables it; deleting a bounding-box helper recreates
that box on the next Inspector refresh while Bounding Boxes remains enabled.
Bounds helpers cannot be dragged or used as parenting targets in Explorer, preventing
cycles through their source-dependent transforms. Failed helper creation leaves its
switch off and displays an error so it can be retried.

The **Tools** pane captures the primary or an auxiliary surface. **Capture Screenshot**
downloads a PNG of the final presented frame at the canvas's native resolution,
including canvas-rendered text, sprites, and post-processing but not HTML overlays.
It uses Lite's GPU readback API, works for offscreen surfaces, and requires an active
render loop. It does not resize or re-render the scene at a custom resolution.

**Record Video** records an HTML canvas using `captureStream` and `MediaRecorder`;
**Stop Recording** downloads WebM (or MP4 when that is the available format).
Recording continues when changing Inspector tabs or closing an undocked pane to
redock it. Screenshots and videos download through a live document rather than an
unloaded popup. Surface changes are disabled during capture; surface-list updates
follow Inspector's watch mode. Removing the surface or closing Inspector cancels
the operation, releases recording tracks, and prevents stale downloads. Capture
failures appear in the pane. Offscreen canvases and browsers without these media
APIs show video recording as unavailable.

Lite does not expose the full Inspector's global feature switches, physics/name
helpers, equirectangular capture, or scene replay APIs. These tools are not imported
from the full Babylon.js runtime. Physics visualization belongs to the physics
inspection milestone; custom-resolution rendering and GIF capture are not included
in this initial surface-capture implementation. The published Lite runtime also
does not expose GPU-error/device-loss subscriptions, so Inspector does not access
private GPU device fields to emulate those APIs.

## Babylon Lite statistics and performance

The Lite **Statistics** pane reports the runtime version, latest engine draw count,
registered surfaces and rendering contexts, and distinct scene meshes, lights,
source materials, reachable texture wrappers, animation groups, and shadow generators.
Standalone text and sprite layers are counted too. Counts span all registered
surfaces and deduplicate shared entities; scene texture counts are not a census of
every GPU allocation. Telemetry refreshes independently of Preferred Watch Mode.

**Profile GPU Tasks** explicitly enables Lite's lazy timestamp-query profiler.
The pane shows unsupported, disabled, pending, available, and error states, the
GPU task span, individual task durations, and dropped-task counts. Overlapping task
durations are not summed. Profiling and its bounded history survive tab switches;
closing Inspector stops only profiling Inspector enabled. Profiling enabled
by the application, including after Inspector opens, is read-only and remains enabled on close.
The profiling switch follows the actual profiler state after failed toggles, allowing
a one-click retry. Toggle failures and ownership changes detected at click time are
reported in the pane and logged without unhandled promise rejections.

The graph retains up to 120 distinct asynchronous GPU readbacks sampled at most
four times per second. **Export GPU Samples to CSV** exports that retained window,
not every rendered frame. The Fluent line chart plots GPU task span in milliseconds
in a fixed 30-second window: -30 is 30 seconds ago and 0 is now. It scrolls at up to
30 display updates per second independently of the GPU readback sampling cadence,
without hover markers, guide lines, or callouts. Collapsing Performance suspends chart
animation without stopping session sampling; reopening resumes from the profiling clock.
Both Y-axis bounds fit the visible
samples with 10% padding (at least 0.5 ms), with the lower bound clamped to zero.
Stopped histories stay frozen at
the last readback. Refreshing the app starts with profiling disabled; enable **Profile GPU
Tasks** again to collect a new history.
Its module and `@fluentui/react-charts` are loaded only when the
Statistics performance section is displayed. ES module consumers must install the
required `@fluentui/react-charts` peer dependency (for example,
`npm install @fluentui/react-charts@^9.3.27`), even if they never open Statistics:
bundlers resolve the lazy chart chunk at build time.
GPU frame indices refer to readbacks; draw counts refer to
the latest CPU-side render and may be from a different frame. System Info lists
timestamp-query support, precision settings, and each surface's live dimensions,
format, and MSAA sample count. The published Lite runtime has no public device-limit,
driver-information, engine FPS, or CPU frame-step instrumentation APIs,
so this pane does not substitute browser refresh rate or synthetic CPU durations.

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

## Patterns

### Service and Component Lifetimes

Services are long lived (basically the lifetime of the inspector itself). Services often add new React components to existing extensible UI. However, the components themselves may have much shorter lifetimes. For example, a component added to a side pane is mounted when the associated tab is selected, and unmounted when a different tab is selected. Given this, it's common for services to store the state, and each time a React component associated with the service is mounted it captures the service state and converts it to React state. `ObservableCollection`s are a common example of this:

```tsx
export const PropertiesServiceDefinition: ServiceDefinition<[IPropertiesService], [IShellService]> = {
    friendlyName: "Properties Editor",
    produces: [PropertiesServiceIdentity],
    consumes: [ShellServiceIdentity],
    factory: (shellService) => {
        // ObservableCollection is a helper class that is effectively an array + an observable.
        const sectionsCollection = new ObservableCollection<PropertiesServiceSection>();
        const sectionContentCollection = new ObservableCollection<PropertiesServiceSectionContent<unknown>>();

        const registration = shellService.addSidePane({
            ...
            // This is the React component, which has a shorter lifetime than the service itself (e.g. only while the tab is selected).
            content: () => {
                // This translates the ObservableCollection to React state (an array, plus a re-render when the array changes).
                const sections = useOrderedObservableCollection(sectionsCollection);
                const sectionContent = useObservableCollection(sectionContentCollection);

                return (
                    // Render all the sections in some way.
                    {sections.map((section) => {
                        return <>{section.identity.description}</>
                    })}
                );
            },
        });

        return {
            // These functions just forward to the ObservableCollections.
            addSection: (section) => sectionsCollection.add(section),
            addSectionContent: (content) => sectionContentCollection.add(content as PropertiesServiceSectionContent<unknown>),
            // The dispose does the typical teardown.
            dispose: () => registration.dispose(),
        };
    },
};
```

### Fluent

The new Inspector UI design is aligned with the broader tooling UI overhaul, which is adopting Fluent. You can find docs for Fluent components here: https://react.fluentui.dev/

### Common Components

There are many common UX patterns used across the Babylon tools. These common UX patterns are made available through a set of shared React components built on top of Fluent. These are currently available from the shared-ui-components package in the Fluent folder.

## Scenarios

Following are short guides for adding new types of features/extensions to the Inspector.

- [Side Panes](#side-panes)
- [Toolbar Items](#toolbar-items)
- [Scene Explorer](#scene-explorer)
- [Properties Pane](#properties-pane)
- [Static Services vs Dynamic Extensions](#static-services-vs-dynamic-extensions)

### Side Panes

Side panes appear on the left and right, and are tabbed (like scene explorer or the properties pane for example).

#### ⭐ I want to add a new tab to the left or right panes

Create a new `ServiceDefinition` that consumes the `IShellService` and calls `addSidePane`. For example:

```tsx
export const MySidePaneServiceDefinition: ServiceDefinition<[], [IShellService]> = {
    friendlyName: "My Side Pane",
    consumes: [ShellServiceIdentity],
    factory: (shellService) => {
        const registration = shellService.addSidePane({
            key: "My Side Pane",
            title: "My Side Pane",
            // This is a React component, but typically a Fluent icon component.
            icon: BugRegular,
            horizontalLocation: "right",
            // Order is optional, and relative to other pane tabs.
            order: 100,
            teachingMoment: false,
            // This is a React component (class or function).
            content: () => {
                return <>My Side Pane Content</>;
            },
        });

        return {
            dispose: () => registration.dispose(),
        };
    },
};
```

Then add this `ServiceDefinition` as either a [static service or dynamic extension](#static-services-vs-dynamic-extensions).

### Toolbar Items

Toolbar items appear at the top and bottom, and items can be anchored to the left or right (like the extensions button for example).

#### ⭐ I want to add a component (such as a button) to a toolbar

Create a new `ServiceDefinition` that consumes the `IShellService` and calls `addToolbarItem`. For example:

```tsx
export const MyToolBarItemServiceDefinition: ServiceDefinition<[], [IShellService]> = {
    friendlyName: "My Toolbar Item",
    consumes: [ShellServiceIdentity],
    factory: (shellService) => {
        const registration = shellService.addToolbarItem({
            key: "My Toolbar Item",
            horizontalLocation: "right",
            verticalLocation: "top",
            teachingMoment: false,
            // Order is optional, and relative to other toolbar items.
            order: 100,
            // This is a React component (class or function).
            component: () => {
                return <>My Toolbar Item</>;
            },
        });

        return {
            dispose: () => registration.dispose(),
        };
    },
};
```

Then add this `ServiceDefinition` as either a [static service or dynamic extension](#static-services-vs-dynamic-extensions).

### Scene Explorer

Scene explorer is a side pane extension, and itself is extensible in two ways: adding sections/groups, and adding commands to tree items.

#### ⭐ I want to add a new section/group to scene explorer

This would be similar to the Nodes or Materials section/group (along with all descendent nodes) in scene explorer.

Create a new `ServiceDefinition` that consumes the `ISceneExplorerService` and calls `addSection`. For example:

```tsx
export const MaterialListServiceDefinition: ServiceDefinition<[], [ISceneExplorerService]> = {
    friendlyName: "Material List",
    consumes: [SceneExplorerServiceIdentity],
    factory: (sceneExplorerService) => {
        const sectionRegistration = sceneExplorerService.addSection({
            displayName: "Materials",
            order: 2,
            getRootEntities: (scene) => scene.materials,
            getEntityDisplayName: (material) => material.name,
            // This is a React component, but typically a Fluent icon component.
            entityIcon: ({ entity: material }) => <PaintBrushRegular />,
            watch: (scene, onAdded, onRemoved) => {
                // Watch for scene changes and call onAdded and onRemoved whenever a material is added or removed.
                // Return a disposable that when disposed, does any necessary watch cleanup (such as removing observers).
            },
        });

        return {
            dispose: () => {
                sectionRegistration.dispose();
            },
        };
    },
};
```

Then add this `ServiceDefinition` as either a [static service or dynamic extension](#static-services-vs-dynamic-extensions).

#### ⭐ I want to add a new command to an entity in scene explorer

This would be similar to the show/hide button that is shown to the right of a mesh tree item in scene explorer.

Create a new `ServiceDefinition` that consumes the `ISceneExplorerService` and calls `addSection`. For example:

```tsx
export const MySceneExplorerCommandServiceDefinition: ServiceDefinition<[], [ISceneExplorerService]> = {
    friendlyName: "My Scene Explorer Command",
    consumes: [SceneExplorerServiceIdentity],
    factory: (sceneExplorerService) => {
        const visibilityCommandRegistration = sceneExplorerService.addEntityCommand({
            // Order is optional, and relative to other commands.
            order: 0,
            // The predicate determines whether the command applies to the given entity.
            predicate: (entity: unknown) => entity instanceof AbstractMesh,
            execute: (scene: Scene, mesh: AbstractMesh) => {
                // Do something amazing!
            },
            displayName: "Do something amazing",
            // This is a React component, but typically a Fluent icon component.
            icon: ({ entity: mesh }) => <EyeRegular />,
        });

        return {
            dispose: () => {
                visibilityCommandRegistration.dispose();
                sectionRegistration.dispose();
            },
        };
    },
};
```

Then add this `ServiceDefinition` as either a [static service or dynamic extension](#static-services-vs-dynamic-extensions).

### Properties Pane

The properties pane is a side pane extension, and itself is extensible in two ways: adding sections, or adding content to sections.

#### ⭐ I want to add a new section to the properties pane

This would be similar to the General or Transforms section in the properties pane.

Create a new `ServiceDefinition` that consumes the `IPropertiesService` and calls `addSection`. For example:

```tsx
export const MyPropertiesPropertiesSectionIdentity = Symbol("My Properties");
export const MyPropertiesSectionServiceDefinition: ServiceDefinition<[], [IPropertiesService]> = {
    friendlyName: "My Properties Section",
    consumes: [PropertiesServiceIdentity],
    factory: (propertiesService) => {
        const mySectionRegistration = propertiesService.addSection({
            // Order is optional, and relative to other sections.
            order: 100,
            identity: MyPropertiesPropertiesSectionIdentity,
        });

        return {
            dispose: () => {
                mySectionRegistration.dispose();
            },
        };
    },
};
```

Then add this `ServiceDefinition` as either a [static service or dynamic extension](#static-services-vs-dynamic-extensions).

#### ⭐ I want to add content to a properties pane section

This would be adding additional content to a section such as General or Transform. You can decide which types of objects (e.g. Node, Material, etc.) your content applies to.

Create a new `ServiceDefinition` that consumes the `IPropertiesService` and calls `addSectionContent`. For example:

```tsx
export const MyPropertiesContentServiceDefinition: ServiceDefinition<[], [IPropertiesService]> = {
    friendlyName: "My Properties Content",
    consumes: [PropertiesServiceIdentity],
    factory: (propertiesService) => {
        const contentRegistration = propertiesService.addSectionContent({
            key: "My Properties",
            // This predicate determines whether this content applies to the given entity.
            predicate: (entity: unknown) => entity instanceof AbstractMesh,
            // This is an array where each element represents a different section that we are adding content to.
            content: [
                // "GENERAL" section.
                {
                    section: GeneralPropertiesSectionIdentity,
                    // Order is optional, and relative to other content in this section.
                    order: 10,
                    // This is a React component (class or function).
                    component: ({entity: AbstractMesh}) => {
                        return <>Some content for the General section</>;
                    },
                },
                // "MY PROPERTIES" section.
                {
                    section: MyPropertiesPropertiesSectionIdentity,
                    // Order is optional, and relative to other content in this section.
                    order: 10,
                    // This is a React component (class or function).
                    component: ({entity: AbstractMesh}) => {
                        return <>Some content for the My Properties section</>;
                    },
                },
            ],
        });

        return {
            dispose: () => {
                contentRegistration.dispose();
            },
        };
    },
};
```

### Static Services vs Dynamic Extensions

#### ⭐ I want my new feature/extension to always be active

If you want your service to always be active (a new tab in a side pane that is always displayed, for example), then simply add your `ServiceDefinition` to the list passed into the `MakeModularTool` call inside [`inspector.tsx`](./src/inspector.tsx).

#### ⭐ I want my new feature/extension to be explicitly enabled by the user in the extensions dialog before it is active

If you want your service to be explicitly enabled by the user (a more niche feature that will not be as commonly used and would otherwise overwhelm the default UI, for example), then do the following:

1. Have a file somewhere with a default export that contains your `ServiceDefinition` (or multiple `ServiceDefinitions` that make up an "extension"). For example:
   ```ts
   export default {
     serviceDefinitions: [MyServiceDefinition1, MyServiceDefinition2],
   } as const;
   ```
2. Add an entry for your new extension in [`builtInsExtensionFeed.ts`](./src/extensibility/builtInsExtensionFeed.ts). This includes:

   - Define the metadata for the extension.
   - Add the metadata to the extensions array.
   - Add a block of code to `getExtensionModuleAsync` that dynamically imports your extension module (the file with the default export).
