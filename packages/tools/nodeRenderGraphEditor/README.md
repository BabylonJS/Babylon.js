# Babylon.js Node Render Graph Editor

An extension to easily create or update any NodeRenderGraph.

## Usage

### Online method

Call the method `Show` of the `BABYLON.NodeRenderGraphEditor` class:

```
BABYLON.NodeRenderGraphEditor.Show({hostElement: document.getElementById("host")});
```

This method will retrieve dynamically the library `babylon.nodeRenderGraphEditor.js`, download it and add
it to the html page.

### Offline method

If you don't have access to internet, the node render graph editor should be imported manually in your HTML page :

```
<script src="babylon.nodeRenderGraphEditor.js" />
```
