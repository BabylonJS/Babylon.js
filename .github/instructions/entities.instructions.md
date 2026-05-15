---
applyTo: "packages/dev/**/*.ts"
---

"Entity" refers to top level scene constructs like Meshes, Cameras, Textures, Materials, etc. Generally they are exposed by array properties on the Scene.

# Inspector

When new entities are introduced, they should be exposed in Inspector's scene explorer, and properties should be exposed in the properties pane.

When new properties are added to entities, they should be exposed in Inspector's properties pane.

When reviewing code, check if new entities or properties are being introduced without Inspector support. If they are missing and the entities/properties are well suited for Inspector, flag missing support in the review comments.

# Babylon Serializer

The `SceneSerializer` (`packages/dev/core/src/Misc/sceneSerializer.ts`) iterates over every scene collection (lights, cameras, meshes, materials, particle systems, etc.) and calls each entity's `serialize()` method to produce a `.babylon` JSON file.

When adding a new serializable entity or property:

- **Decorate serializable properties** with `@serialize()`, `@serializeAsVector3()`, `@serializeAsColor3()`, etc. from `decorators.ts`. These decorators drive automatic round-trip serialization via `SerializationHelper`.
- **Implement a `serialize()` method** on the entity class. Call `SerializationHelper.Serialize(this)` to handle all decorated properties, then manually add any non-decorated data (parent references, exclusion lists, etc.). Call `SerializationHelper.AppendSerializedAnimations(this, serializationObject)` if the entity is animatable.
- **Update `SceneSerializer`** if the entity represents a new top-level collection. Add a loop that pushes each entity's `serialize()` result into the output object (e.g. `serializationObject.myNewSystems`). Respect the `doNotSerialize` flag.

See `Light.serialize()` in `packages/dev/core/src/Lights/light.ts` or `ParticleSystem.serialize()` in `packages/dev/core/src/Particles/particleSystem.ts` for representative examples.

# Babylon Loader

The `.babylon` file loader (`packages/dev/core/src/Loading/Plugins/babylonFileLoader.ts`) parses JSON and reconstructs entities using static `Parse()` methods and a parser registry in `packages/dev/core/src/Loading/Plugins/babylonFileParser.function.ts`.

When adding a new parseable entity or property:

- **Implement a static `Parse()` method** on the entity class. Use `SerializationHelper.Parse(() => new MyEntity(...), parsedData, scene, rootUrl)` to deserialize all `@serialize`-decorated properties automatically, then restore any custom state.
- **Register parsers** by calling `AddParser` and `AddIndividualParser` (from `babylonFileParser.function.ts`) in a dedicated scene-component file (e.g. `myEntityComponent.ts`). The general parser iterates the collection array from the JSON (e.g. `parsedData.myNewSystems`) and delegates each entry to the individual parser.
- **Add a constant** to `SceneComponentConstants` (in `packages/dev/core/src/sceneComponent.ts`) for the parser name.
- **Update `AssetContainer`** (`packages/dev/core/src/assetContainer.ts`) so the new entity type is included in `addAllToScene()` and `removeAllFromScene()`.

See `Light.Parse()` in `packages/dev/core/src/Lights/light.ts` and the particle-system parser registration in `packages/dev/core/src/Particles/particleSystemComponent.ts` for representative examples.
