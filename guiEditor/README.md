# Babylon.js Gui Editor

An extension to easily create or update GUI.

## Usage
### Online method
Call the method `Show` of the `BABYLON.GuiEditor` class: 
```
BABYLON.GuiEditor.Show({hostElement: document.getElementById("host")});
```
This method will retrieve dynamically the library `babylon.guiEditor.js`, download it and add
it to the html page.

### Offline method
If you don't have access to internet, the gui editor should be imported manually in your HTML page :
```
<script src="babylon.guiEditor.js" />
``` 
