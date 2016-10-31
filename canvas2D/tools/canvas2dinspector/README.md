# Canvas2D Inspector

![](https://raw.githubusercontent.com/Temechon/canvas2d-inspector/master/screen.jpg)

[The main repo can be found here](https://github.com/Temechon/canvas2d-inspector)

An extension to easily debug your Canvas2D, made with HTML/CSS.

## Usage
Insert the lib in your project: 
```
<script src="c2dinspector.js"></script>
```

In your code, create a new Inspector by giving it the `BABYLON.Engine`:

```
new INSPECTOR.Canvas2DInspector(engine); 
```

A right panel will be created by listing all instances of Canvas2D created in your 
application.

## Contribute

```
npm install
grunt
```

## Create the lib from source

```
grunt dist
```
The library will be in the `dist` folder.


