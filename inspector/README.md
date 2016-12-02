# Babylon.js Inspector

An extension to easily debug your Babylon.js application, made with HTML/CSS.
This extension replaces the old limited debug layer.

## Usage
### Online method
Call the method `show` of the scene debugLayer: 
```
scene.debugLayer.show();
```
This method will retrieve dynamically the library `inspector.js`, download it and add
it to the html page.

### Offline method
If you don't have access to internet, the inspector should be imported manually in your HTML page :
```
<script src="inspector.js" />
``` 
Then, call the method `show` of the scene debugLayer: 
```
scene.debugLayer.show();
```

A right panel will be created containing the Babylon.js inspector.

## Features

### Tools
![](../screens.jpg)

Several tools are available (from left to right) : 
* Refresh

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


