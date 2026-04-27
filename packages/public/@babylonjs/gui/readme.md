# Babylon.js GUI Module

For usage documentation please visit the [GUI documentation](https://doc.babylonjs.com/features/featuresDeepDive/gui/).

## Installation

To install using npm:

```bash
npm install @babylonjs/core @babylonjs/gui
```

## Usage

Import and use in your project:

```javascript
import { AdvancedDynamicTexture } from "@babylonjs/gui/2D";
import { TextBlock } from "@babylonjs/gui/2D/controls/textBlock";

// Create a fullscreen UI
const ui = AdvancedDynamicTexture.CreateFullscreenUI("ui");

// Add a text block
const text = new TextBlock();
text.text = "Hello Babylon.js!";
text.color = "white";
text.fontSize = 24;
ui.addControl(text);
```

For more information, see the [ES6 support documentation](https://doc.babylonjs.com/setup/frameworkPackages/es6Support/).
