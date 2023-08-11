# Babylon.js Node Geometry Editor

An extension to easily create or update any NodeGeometry.

## Usage
### Online method
Call the method `Show` of the `BABYLON.NodeGeometryEditor` class: 
```
BABYLON.NodeGeometryEditor.Show({hostElement: document.getElementById("host")});
```
This method will retrieve dynamically the library `babylon.nodeGeometryEditor.js`, download it and add
it to the html page.

### Offline method
If you don't have access to internet, the node geometry editor should be imported manually in your HTML page :
```
<script src="babylon.nodeGeometryEditor.js" />
``` 
