# Extending Babylon Native

There are several different ways to create a program that uses Babylon Native but also 
includes features that Babylon Native does not provide out-of-the-box. An extremely 
straightforward example might be to create an application that uses Babylon Native to 
render a 3D scene and uses a completely seperate library such as 
[ImGUI](https://github.com/ocornut/imgui) to render a user interface. This kind of 
"extension" is not the focus of this document. This document's focus is on extending
Babylon Native by adding features within the framework of Babylon Native itself.

Babylon Native's component-based architecture (discussed in detail in the 
[Babylon Native build system](BuildSystem.md) documentation) is designed for extensibility. 
In fact, the entire purpose of using modular components is to allow capabilities to be
added/replaced/removed without requiring the components themselves to be modified. The
following sections describe 
[how components are integrated](#how-components-are-integrated),
discuss [how components can be added and removed](#adding-and-removing-components-from-projects),
and recommend a development process for 
[creating entirely new components](#creating-new-babylon-native-components).

## How Components are Integrated

The mechanism by which components are integrated into a Babylon Native program is designed
to have a very small code footprint in both CMake and C++. (There should usually be no
integration footprint in JavaScript because the implementation details of the integration
should not be exposed there.) To illustrate this, let's consider the integration surface
of the `NativeEngine` component as it appeared on 4/7/2020.

`NativeEngine` was chosen for this example because it is by far the most complex of the
provided components, yet its integration surface is nevertheless reasonably constrained.
The integration surface of any component has three layers: its 
[dependencies](#dependencies), its 
[integration using CMake](#cmake-integration), and its [Native API](#native-api).

### Dependencies

Dependencies are, unfortunately, the most labor-intensive part of the component 
integration story. Babylon Native's lateral dependency management strategy dictates that
dependencies should be supplied by the consuming build system and that components 
should not "bring their own," but there is no mechanism in place to streamline this 
process. No mechanism is currently planned for this purpose, either; as designed, the 
consuming build system "just has to know" what dependencies to supply. The potential for 
frustration with this expectation can likely be mitigated by having a disciplined 
convention for component dependency documentation: i.e., all components should maintain an 
up-to-date list of what they depend on and how those dependencies can be provided.

`NativeEngine`, due to its complexity, has an unusually large number of dependencies:
`Arcana`, the `bgfx` technology family, `glslang`, `SPIRV-Cross`, and multiple other
Babylon Native components. Nevertheless, the integration story for these dependencies
remains relatively simple: all that is necessary is that they be made available in the
project (canonically as submodules, but simple sibling folders or even external 
integrations can work) and that all dependencies be processed by CMake before 
`NativeEngine` is processed. For components designed to work with lateral dependency 
management, integration of dependencies can be as simple as 
[one line of CMake code](https://github.com/BabylonJS/BabylonNative/blob/e2a39405185933fd9a7e211b59734d65059c7c07/Core/CMakeLists.txt#L2);
for external libraries, it may require
[a bit more than one line](https://github.com/BabylonJS/BabylonNative/blob/e2a39405185933fd9a7e211b59734d65059c7c07/Dependencies/CMakeLists.txt#L23-L51).
Ultimately, it is simply required that the CMake targets for all dependencies be defined
[by the time `NativeEngine` defines its links to them](https://github.com/BabylonJS/BabylonNative/blob/e2a39405185933fd9a7e211b59734d65059c7c07/Plugins/NativeEngine/CMakeLists.txt#L37-L65).

Build system topics, including lateral dependency management, are discussed in more 
detail on the [Babylon Native build system](BuildSystem.md) documentation page.

### CMake Integration

Distinct from dependencies, which are what a component requires *from* the consuming build
system, a component's CMake integration surface is what it exposes *to* the consuming
build system. Canonically, this should be extremely small and simple: under typical 
circumstances, integrating a Babylon Native component using CMake should be as 
[calling `add_subdirectory()` on the component's root folder](https://github.com/BabylonJS/BabylonNative/blob/e2a39405185933fd9a7e211b59734d65059c7c07/Plugins/CMakeLists.txt#L7).
Components must also expose
[at least one CMake library target](https://github.com/BabylonJS/BabylonNative/blob/e2a39405185933fd9a7e211b59734d65059c7c07/Plugins/NativeEngine/CMakeLists.txt#L33) for 
other components and consuming apps to link to in order to depend on the component.

`NativeEngine` follows the described paradigm exactly, as illustrated by the links in the
paragraph above. As a consequence, the surface area of the `NativeEngine` CMake 
integration outside of the plugin itself is only two lines per consuming project: the one 
line linked to above that calls `add_subdirectory()` on the `NativeEngine` plugin's main folder, and another line 
[linking to the plugin from the consuming project](https://github.com/BabylonJS/BabylonNative/blob/e2a39405185933fd9a7e211b59734d65059c7c07/Apps/Playground/CMakeLists.txt#L105).

### Native API

The final integration layer for a Babylon Native component is the C++ API it exposes which
allows the library to actually be used. Differing functionality will necessitate 
differences among the APIs of various components; however, as a rule, these APIs should 
strive to be as minimalistic and self-explanatory as possible. This is particularly true
of plugins and polyfills, which are primarily intended to expose functionality to the 
JavaScript and thus, when possible, should avoid being directly manipulated by native 
code.

As just such a plugin, `NativeEngine`'s C++ API is extremely minimal (though it is still
a work in progress and subject to change). For most platforms, integrating the 
`NativeEngine` plugin only requires 
[calling two initialization functions](https://github.com/BabylonJS/BabylonNative/blob/e2a39405185933fd9a7e211b59734d65059c7c07/Apps/Playground/Win32/App.cpp#L111-L112)
to make the plugin's functionality available in JavaScript. (There is a 
[third function](https://github.com/BabylonJS/BabylonNative/blob/e2a39405185933fd9a7e211b59734d65059c7c07/Apps/Playground/Android/app/src/main/cpp/BabylonNativeJNI.cpp#L136)
as well, but it is only needed for Android.) Keeping integration code minimal makes it
easy to add and remove components from projects.

## Adding and Removing Components from Projects

As shown above, components should be designed to be as small and easy to integrate as
possible. Adding a new component to a project is as simple as fulfilling the requirements
outlined in the sections above, and removing a component simply requires reversing those 
operations. For example, removing the `NativeEngine` plugin from the Win32 `Playground`
project would require the deletion of only three lines of C++ code and two lines of CMake 
code. With this resolved, the only variable that has not been discussed yet is where, with 
respect to the Babylon Native repository, an added component might be placed.

There are, at present, two ways to build Babylon Native such that you can extend its 
functionality. The first and more straightforward of these approaches is to simply fork
the Babylon Native repository and modify it. This will allow you to add new components 
right alongside the provided ones. For example, a new `ComputeShaders` plugin could be
placed in the `Plugins` folder, following the same pattern as `NativeEngine`. That 
`ComputeShaders` plugin could even be housed in a separate Git repository; that repository
could then be added as a submodule in the `Plugins` folder, making it possible to easily
reuse and share components across many different Babylon Native projects. This practice
touches on the "components as submodules" concept discussed more deeply in the 
[Babylon Native build system](BuildSystem.md) documentation.

The second way to extend Babylon Native's capabilities does not require modifying the
Babylon Native repository itself. Instead, an external project can be created which 
consumes the entire Babylon Native repository as a submodule; new components can then be
added as subfolders/submodules of that outermost repository. The folder structure for 
such a repository might resemble the following:

```
ConsumingProject
 -> BabylonNative (submodule)
 -> Extensions
     -> NewComponent1 (folder)
     -> NewComponent2 (submodule)
 -> Apps
     -> ConsumingApplication (folder)
```

The integration logic of the root-level `CMakeLists.txt` for such a repository might be as 
follows:

```
add_subdirectory(BabylonNative)

# NOTE: To match Babylon Native patterns, the following technically should be 
# done from by CMakeLists.txt files in folders, i.e. Extensions/CMakeLists.txt
add_subdirectory(Extensions/NewComponent1)
add_subdirectory(Extensions/NewComponent2)

add_subdirectory(Apps/ConsumingApplication)
```

Both of these approaches have advantages and disadvantages: the first is simpler and 
faster to get started, while the second might be more sustainable and easy to 
[integrate into other technologies like `ReactNative`](https://github.com/BabylonJS/BabylonReactNative). 
Which is the correct approach for any particular project will depend on the scenario.

## Creating New Babylon Native Components

There are many possible approaches to creating a new component to be used in Babylon
Native. If the component you have in mind is intended for use in a specific app -- for
example, if you are creating a `CustomPlugin` plugin because you are actively working
on an app that needs it -- it may be prudent to create that component simply as a 
subfolder within the repository of your application project, moving that folder to its
own repository and including it as a submodule later when the component is ready to share.

However, if your intent is to create a new component and you do not already have an
app to consume it (either because you simply intend to make functionality available or
because your intended consuming app isn't under development yet), then we recommend 
adopting the first of the two approaches outlined in the section above: build your
component in its own repository from the start, incorporating it into a modified Babylon
Native fork where you can use the Playground app to easily test it cross-platform.
The following steps show an example of how to quickly get started developing in this way.

1. Fork and clone https://github.com/BabylonJS/BabylonNative
2. Create an empty repository for your new component. Throughout the rest of this section,
this component will be called `ComponentName`.
3. Decide where your component should be placed within the Babylon Native repository.
Depending on what it is, it might make sense to place it in the `Plugins` or `Polyfills`
folders. For the purposes of these notes, however, we will assume you decide to create
a new folder called `Extensions` and to add your `ComponentName` repo as a submodule
located at `Extensions/ComponentName`.
4. Add a `Source` folder inside your `ComponentName` submodule. Add a placeholder C++ file
with a dummy function to this folder; `HelloWorld.cpp` is always a fashionable choice.
5. Add an `Include` folder to your submodule.
6. Add a `CMakeLists.txt` file to your submodule. The contents of this file could be 
something like the following:
```
set(SOURCES
    "Source/HelloWorld.cpp")

add_library(ComponentName ${SOURCES})

target_include_directories(ComponentName
    PUBLIC "Include")
```
7. Using a Git bash or equivalent, `cd` into your submodule, add your changes, commit, 
and push them up to your `ComponentName` repository.
8. Outside your submodule, in the new `Extensions` folder, add a `CMakeLists.txt` 
containing only the following line: **`add_subdirectory(ComponentName)`**. Note that,
if you placed your submodule in an existing folder like `Plugins` or `Polyfills`, you will
simply add this line to the existing `CMakeLists.txt` in the correct folder.
9. In your Babylon Native fork's root-level `CMakeLists.txt`, add a line to call 
**`add_subdirectory(Extensions)`** at the appropriate point. Where this should be done
will vary based on the dependencies of `ComponentName`. Most likely, processing your new
folder should be the last thing that happens before the `Apps` folder is processed, so 
your new line should appear as the last of the `add_subdirectory(...)` calls before
`add_subdirectory(Apps)`. Note that if you placed your submodule in an existing folder
like `Plugins` or `Polyfills`, modifying the root-level `CMakeLists.txt` is not necessary.
10. In `Apps/Playground/CMakeLists.txt`, modify the `target_link_to_dependencies(...)` 
call to include a link to `ComponentName`.
```
target_link_to_dependencies(Playground
    ...
    PRIVATE ComponentName
    ...) 
```
11. If your plugin will depend on additional external libraries, add these as submodules
to the **Babylon Native fork's** `Dependencies` folder. Follow the patterns used for 
existing dependencies to make these new submodules available for `ComponentName` to link
against.
12. Commit the changes you've made to your Babylon Native fork.
13. You should now have everything you need to begin active development on your 
`ComponentName` component, replacing `HelloWorld.cpp` with real code, exposing C++ APIs
for your component, and modifying the C++ and JavaScript of the Playground app as needed
to test your new functionality.
