# Babylon.js Inspector

An extension to easily debug your Babylon.js application, made with HTML/CSS.
This extension replaces the old limited debug layer.

## Usage

### Online method

Call the method `show` of the scene debugLayer:

```javascript
scene.debugLayer.show();
```

This method will retrieve dynamically the library `babylon.inspector.bundle.js`, download it and add
it to the html page.

### Offline method

If you don't have access to internet, the inspector should be imported manually in your HTML page :

```html
<script src="babylon.inspector.bundle.js" />
```

Then, call the method `show` of the scene debugLayer:

```javascript
scene.debugLayer.show();
```

A right panel will be created containing the Babylon.js inspector.

## Docs

Full inspector documentation [available here](https://doc.babylonjs.com/toolsAndResources/inspector).

## Contribute

Please refer to the [contribution guide](https://doc.babylonjs.com/contribute/toBabylon/HowToContribute). After building, the [Playground task](https://doc.babylonjs.com/contribute/toBabylon/HowToContribute#run-the-playground) offers easy access to the Inspector.
