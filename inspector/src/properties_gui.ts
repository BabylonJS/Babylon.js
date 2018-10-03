
import { PROPERTIES } from "./properties";

export type GUITyping = any;

export let guiLoaded: boolean = false;
/**
  * Function that add gui objects properties to the variable PROPERTIES
  */
export function loadGUIProperties(GUI: GUITyping) {

    guiLoaded = !!GUI;

    if (guiLoaded) {

        let PROPERTIES_GUI = {
            'ValueAndUnit': {
                type: GUI.ValueAndUnit,
                properties: ['_value', 'unit'],
                format: (valueAndUnit: import("babylonjs-gui").ValueAndUnit) => { return valueAndUnit; }
            },
            'Control': {
                type: GUI.Control,
                properties: [
                    '_alpha',
                    '_fontFamily',
                    '_color',
                    '_scaleX',
                    '_scaleY',
                    '_rotation',
                    '_currentMeasure',
                    '_width',
                    '_height',
                    '_left',
                    '_top',
                    '_linkedMesh',
                    'isHitTestVisible',
                    'isPointerBlocker',
                ],
                format: (control: import("babylonjs-gui").Control) => { return control.name; }
            },
            'Button': {
                type: GUI.Button,
                properties: new Array(),
                format: (button: import("babylonjs-gui").Button) => { return button.name; }
            },
            'ColorPicker': {
                type: GUI.ColorPicker,
                properties: ['_value'],
                format: (colorPicker: import("babylonjs-gui").ColorPicker) => { return colorPicker.name; }
            },
            'Checkbox': {
                type: GUI.Checkbox,
                properties: ['_isChecked', '_background'],
                format: (checkbox: import("babylonjs-gui").Checkbox) => { return checkbox.name; }
            },
            'Ellipse': {
                type: GUI.Ellipse,
                properties: ['_thickness'],
                format: (ellipse: import("babylonjs-gui").Ellipse) => { return ellipse.name; }
            },
            'Image': {
                type: GUI.Image,
                properties: [
                    '_imageWidth',
                    '_imageHeight',
                    '_loaded',
                    '_source',
                ],
                format: (image: import("babylonjs-gui").Image) => { return image.name; }
            },
            'Line': {
                type: GUI.Line,
                properties: ['_lineWidth',
                    '_background',
                    '_x1',
                    '_y1',
                    '_x2',
                    '_y2',
                ],
                format: (line: import("babylonjs-gui").Line) => { return line.name; }
            },
            'RadioButton': {
                type: GUI.RadioButton,
                properties: ['_isChecked', '_background'],
                format: (radioButton: import("babylonjs-gui").RadioButton) => { return radioButton.name; }
            },
            'Rectangle': {
                type: GUI.Rectangle,
                properties: ['_thickness', '_cornerRadius'],
                format: (rectangle: import("babylonjs-gui").Rectangle) => { return rectangle.name; }
            },
            'Slider': {
                type: GUI.Slider,
                properties: [
                    '_minimum',
                    '_maximum',
                    '_value',
                    '_background',
                    '_borderColor',
                ],
                format: (slider: import("babylonjs-gui").Slider) => { return slider.name; }
            },
            'StackPanel': {
                type: GUI.StackPanel,
                properties: ['_isVertical'],
                format: (stackPanel: import("babylonjs-gui").StackPanel) => { return stackPanel.name; }
            },
            'TextBlock': {
                type: GUI.TextBlock,
                properties: ['_text', '_textWrapping'],
                format: (textBlock: import("babylonjs-gui").TextBlock) => { return textBlock.name; }
            },
            'Container': {
                type: GUI.Container,
                properties: ['_background'],
                format: (container: import("babylonjs-gui").Container) => { return container.name; }
            },
        };

        for (let prop in PROPERTIES_GUI) {
            (<any>PROPERTIES)[prop] = (<any>PROPERTIES_GUI)[prop];
        }
    }
}
