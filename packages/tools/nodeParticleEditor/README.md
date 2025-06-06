# Babylon.js Node Particle Editor

An extension to easily create or update any NodeParticleSet.

## Usage

### Online method

Call the method `Show` of the `BABYLON.NodeParticleEditor` class:

```
BABYLON.NodeParticleEditor.Show({hostElement: document.getElementById("host")});
```

This method will retrieve dynamically the library `babylon.nodeParticleEditor.js`, download it and add
it to the html page.

### Offline method

If you don't have access to internet, the node particle editor should be imported manually in your HTML page :

```
<script src="babylon.nodeParticleEditor.js" />
```
