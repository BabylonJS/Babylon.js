# BabylonJS Viewer

This project is a 3d model viewer using babylonjs.

Please note that this is an *initial release*. The API and project structure could (and probably SHOULD) be changed, so please don't rely on this yet in a productive environment.

The viewer is using the latest Babylon from npm (3.1 alpha).

This documentation is also not full. I will slowly add more and more exmplanations.

## Basic usage

See `basicExample.html` in `/dist`.

Basically, all that is needed is an html tag, and the viewer.js, which includes everything needed to render a Scene:

```html
<babylon model="https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BoomBox/glTF/BoomBox.gltf" default-viewer="true"></babylon>
<script src="viewer.js"></script>
``` 

This will create a (default) viewer and will load the model in this URL using the gltf loader.

The `babylon` tag will be automatically initialized. 

## Configuration

Configuration can be provided using html attributes or a JSON (at the moment). A configuration Mapper can be registered to create new configuration readers. 

Before I finish a full documentation, take a look at `configuration.ts`

## Templating

The default templates are integrated in the viewer.js file. The current templates are located in `/assets/templates/default/` . Those templates can be extended and registered using the configuration file.

