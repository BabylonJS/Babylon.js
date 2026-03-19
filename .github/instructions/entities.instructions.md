---
applyTo: "packages/dev/**/*.ts"
---

"Entity" refers to top level scene constructs like Meshes, Cameras, Textures, Materials, etc. Generally they are exposed by array properties on the Scene.

# Inspector

When new entities are introduced, they should be exposed in Inspector's scene explorer, and properties should be exposed in the properties pane.

When new properties are added to entities, they should be exposed in Inspector's properties pane.

When reviewing code, check if new entities or properties are being introduced without Inspector support. If they are missing and the entities/properties are well suited for Inspector, flag missing support in the review comments.

# Babylon Serializer

# Babylon Loader
