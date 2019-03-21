# Babylon.js Node Editor

An extension to easily create or update any NodeMaterial.

## Usage
### Online method
Call the method `Create` of the `BABYLON.NoteMaterial` class: 
```
BABYLON.NoteMaterial.Create();
```
This method will retrieve dynamically the library `nodeEditor.js`, download it and add
it to the html page.

### Offline method
If you don't have access to internet, the node editor should be imported manually in your HTML page :
```
<script src="babylon.nodeEditor.js" />
``` 
