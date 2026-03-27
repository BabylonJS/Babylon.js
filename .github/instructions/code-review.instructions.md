# Code Review Instructions

## Labels

When reviewing a PR, suggest zero or more labels based on these rules:

- Changes to documentation, instructions, build scripts, or anything that is not under packages/dev or packages/tools should use the "skip changelog" label.
- Accessibility improvements should use the "accessibility" label.
- Changes under packages/dev/inspector-v2/src/components/curveEditor should use the "ace" label.
- Changes under packages/dev/core related to animation should use the "animations" label.
- Changes under packages/dev/core related to audio should use the "audio" label.
- Changes under packages/dev/core related to bones or skeletal animation should use the "bones" label.
- Breaking changes to public APIs (except those prefixed with an underscore) should use the "breaking change" label.
- Bug fixes should use the "bug" label.
- Changes to build scripts or pipelines should use the "build" label.
- Changes to general documentation files or doc comments only should use the "documentation" label.
- Improvements to existing features should use the "enhancement" label.
- Changes under packages/dev/core/FrameGraph should use the "frame graph" label.
- Changes under packages/dev/core related to gaussian splats should use the "gaussian splats" label.
- Changes under packages/tools/guiEditor should use the "gui editor" label.
- Changes under packages/dev/inspector-v2 should use the "inspector" label.
- Changes under packages/dev/loaders should use the "loaders" label.
- Changes under packages/dev/materials should use the "materials" label.
- Changes to nativeEngine.ts or under packages/dev/core/src/Engines/Native should use the "native" label.
- New features should use the "new feature" label.
- Changes under packages/tools/nodeGeometryEditor should use the "nge" label.
- Changes under packages/tools/nodeEditor should use the "nme" label.
- Changes under packages/tools/nodeRenderGraphEditor should use the "nrge" label.
- Changes related to performance optimizations should use the "optimizations" label.
- Changes related to particles should use the "particles" label.
- Changes related to physics should use the "physics" label.
- Changes under packages/tools/playground should use the "playground" label.
- Changes under packages/tools/sandbox should use the "sandbox" label.
- Changes under packages/tools/viewer or packages/tools/viewer-configurator should use the "viewer" label.