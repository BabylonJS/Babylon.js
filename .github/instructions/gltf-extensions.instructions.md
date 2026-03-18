---
applyTo: "packages/dev/loaders/src/glTF/2.0/Extensions/*.ts"
---

# Dynamic

When new glTF 2.0 extensions are added, they must be added to packages/dev/loaders/src/glTF/2.0/Extensions/dynamic.ts. When reviewing code, check if any new extensions have been added without being registered in dynamic.ts. If so, add a review comment with a suggested code change to add the missing extension.
