import * as GUI from "babylonjs-gui";
import { PROPERTIES } from "./properties";

/**
  * Function that add gui objects properties to the variable PROPERTIES
  */
export function loadGUIProperties() {
    let PROPERTIES_GUI = {
        'ValueAndUnit': {
            type: GUI.ValueAndUnit,
            properties: ['_value', 'unit'],
            format: (valueAndUnit: GUI.ValueAndUnit) => { return valueAndUnit }
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
            format: (control: GUI.Control) => { return control.name }
        },
        'Button': {
            type: GUI.Button,
            properties: new Array(),
            format: (button: GUI.Button) => { return button.name }
        },
        'ColorPicker': {
            type: GUI.ColorPicker,
            properties: ['_value'],
            format: (colorPicker: GUI.ColorPicker) => { return colorPicker.name }
        },
        'Checkbox': {
            type: GUI.Checkbox,
            properties: ['_isChecked', '_background'],
            format: (checkbox: GUI.Checkbox) => { return checkbox.name }
        },
        'Ellipse': {
            type: GUI.Ellipse,
            properties: ['_thickness'],
            format: (ellipse: GUI.Ellipse) => { return ellipse.name }
        },
        'Image': {
            type: GUI.Image,
            properties: [
                '_imageWidth',
                '_imageHeight',
                '_loaded',
                '_source',
            ],
            format: (image: GUI.Image) => { return image.name }
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
            format: (line: GUI.Line) => { return line.name }
        },
        'RadioButton': {
            type: GUI.RadioButton,
            properties: ['_isChecked', '_background'],
            format: (radioButton: GUI.RadioButton) => { return radioButton.name }
        },
        'Rectangle': {
            type: GUI.Rectangle,
            properties: ['_thickness', '_cornerRadius'],
            format: (rectangle: GUI.Rectangle) => { return rectangle.name }
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
            format: (slider: GUI.Slider) => { return slider.name }
        },
        'StackPanel': {
            type: GUI.StackPanel,
            properties: ['_isVertical'],
            format: (stackPanel: GUI.StackPanel) => { return stackPanel.name }
        },
        'TextBlock': {
            type: GUI.TextBlock,
            properties: ['_text', '_textWrapping'],
            format: (textBlock: GUI.TextBlock) => { return textBlock.name }
        },
        'Container': {
            type: GUI.Container,
            properties: ['_background'],
            format: (container: GUI.Container) => { return container.name }
        },
    }

    for (let prop in PROPERTIES_GUI) {
        (<any>PROPERTIES)[prop] = (<any>PROPERTIES_GUI)[prop];
    }
} 
