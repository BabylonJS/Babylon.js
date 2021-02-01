# Babylon.js Sandbox

An extension to easily create a full page viewer (ala sandbox.babylonjs.com)

## Usage
### Online method
Call the method `Show` of the `BABYLON.Sandbox` class: 
```
BABYLON.Sandbox.Show({hostElement: document.getElementById("host")});
```

### Offline method
If you don't have access to internet, the node editor should be imported manually in your HTML page :
```
<script src="babylon.sandbox.js" />
``` 
