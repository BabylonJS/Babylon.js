# Fluent!

We are embarking on an effort to replace our common controls with modernized fluent UX controls, used by the existing tools and the in-progress inspectorV2.

This work is split into several distinct chunks

1. **Fluent primitives**
   These are lightweight wrappers around existing fluent components, with some minor styling applied. Depending on the primitive at hand, the wrapper may do very little (ex: apply some minor styling) or more complex logic (ex: SyncedSlider.tsx coordinates changes between a slider component and an input component).
   These primitive can be used standalone or within a pre-styled component such as PropertyLine.tsx, see #2
2. **Fluent higher order components (hoc)**
   These are wrappers around the above primitives to handle styling for common UX patterns, ex: PropertyLine.tsx which renders a label, fluent primtive child component (to modify said propetry), and optional copy button. This is a common UX pattern used in the property pane of all of our tools.
3. **Render fluent components directly from inspectorV2**
   InspectorV2 will be using the new fluent components directly, rather than using any existing shared-ui-components.You can see examples of this in various files within packages\dev\inspector-v2 (ex: meshGeneralProperties.tsx, commonGeneralProperties.tsx, outlineOverlayProperties.tsx).
4. **Conditionally render fluent components within existing shared-ui-components**
   We are using a contextConsumer to read context.useFluent from within each shared component and conditionally render the fluent version of each shared component. This means that existing tools do not have to update every callsite of a shared component, instead the tool just needs to ensure the contextProvider is properly created at the tool root, see below
5. **Incrementally move each tool over to fluent**
   1 by 1 we will wrap each tool's root in a <FluentToolWrapper>, which both creates a fluent provider and ensures useFluent context is set to true (so shared components render their fluent versions). This will allow for modular testing of the new components within each tool before lighting it up. Note that we also check for a 'newUX' Query String Parameter in the URL so that we can check-in the new logic without default enabling it for all users (to enable, add ?newUX=true to the URL)
6. **Incrementally refactor existing tools**
   After each tool is fluentized, we can incrementally refactor the way the shared components are being initialized (ex: see PropertyTabComponent) to extract common tool paradigms into our shared tooling folder and reduce duplication of logic across our tools.
