# Babylon Components Library
This is a library of React components which can be used throughout Babylon's tools.

`npm run storybook` serves the storybook locally, making it easy to browse through the components and test your changes.

There are a few goals for the library:
1. Components should bring in their own styling. The consuming tool should not have to write CSS to style the components. This way, we can maintain a consistent visual appearance across all tools.
2. Components should be as flexible and reusable as possible. One tool may have different needs from another.
3. Components should aim to follow modern React practices as much as possible. This means using functional components, hooks, and top-down data flow.

## Structure of the library
* **/src/components/**: This is the new components directory. Ultimately, every component should end up here. Each component should have a .tsx file for the logic and a corresponding .scss file for styling.
* **/src/stories/**: This holds the definitions for stories.
* **/src/imgs/**: Holds the .svg icons used across all Babylon tools.
* **/src/lines/, /src/tabs/, /src/colorPicker/**: old directories holding components which need to be migrated.

## Migration

For the last category, migration involves the following steps:
1. Copy the component into the /components directory
2. Create a story in the /stories directory for testing. 
3. Put any styling needed for the component in `[componentName.scss]`. We should default to the styles in the GUI editor, as that is the most up to date UI design. At this point, the component is ready to go and can be used anywhere you want. The following steps should be done on an as-needed basis.
4. (Optional) refactor the component to be functional and use hooks rather than class-based
5. Migrate over references from the old component to the new component.
6. When no references remain, delete the old component.