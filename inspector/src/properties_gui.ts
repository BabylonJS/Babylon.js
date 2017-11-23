/// <reference path="../../dist/preview release/gui/babylon.gui.d.ts"/>

module INSPECTOR {
    /**
     * Function that add gui objects properties to the variable PROPERTIES
     */
    export function loadGUIProperties(){
        let PROPERTIES_GUI = {
            'ValueAndUnit': {
                type: BABYLON.GUI.ValueAndUnit,
                properties: ['_value', 'unit'],
                format: (valueAndUnit: BABYLON.GUI.ValueAndUnit) => 
                    { return valueAndUnit }
            },
            'Control': {
                type: BABYLON.GUI.Control,
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
                format: (control: BABYLON.GUI.Control) => { return control.name }
            },
            'Button': {
                type: BABYLON.GUI.Button,
                properties: new Array(),
                format: (button: BABYLON.GUI.Button) => { return button.name }
            },
            'ColorPicker': {
                type: BABYLON.GUI.ColorPicker,
                properties: ['_value'],
                format: (colorPicker: BABYLON.GUI.ColorPicker) => { return colorPicker.name }
            },
            'Checkbox': {
                type: BABYLON.GUI.Checkbox,
                properties: ['_isChecked', '_background'],
                format: (checkbox: BABYLON.GUI.Checkbox) => { return checkbox.name }
            },
            'Ellipse': {
                type: BABYLON.GUI.Ellipse,
                properties: ['_thickness'],
                format: (ellipse: BABYLON.GUI.Ellipse) => { return ellipse.name }
            },
            'Image': {
                type: BABYLON.GUI.Image,
                properties: [
                    '_imageWidth', 
                    '_imageHeight',
                    '_loaded',
                    '_source',
                ],
                format: (image: BABYLON.GUI.Image) => { return image.name }
            },
            'Line': {
                type: BABYLON.GUI.Line,
                properties: ['_lineWidth',
                    '_background',
                    '_x1',
                    '_y1',
                    '_x2',
                    '_y2',
                ],
                format: (line: BABYLON.GUI.Line) => { return line.name }
            },
            'RadioButton': {
                type: BABYLON.GUI.RadioButton,
                properties: ['_isChecked', '_background'],
                format: (radioButton: BABYLON.GUI.RadioButton) => { return radioButton.name }
            },
            'Rectangle': {
                type: BABYLON.GUI.Rectangle,
                properties: ['_thickness', '_cornerRadius'],
                format: (rectangle: BABYLON.GUI.Rectangle) => { return rectangle.name }
            },
            'Slider': {
                type: BABYLON.GUI.Slider,
                properties: [
                    '_minimum',
                    '_maximum',
                    '_value',
                    '_background',
                    '_borderColor',
                ],
                format: (slider: BABYLON.GUI.Slider) => { return slider.name }
            },
            'StackPanel': {
                type: BABYLON.GUI.StackPanel,
                properties: ['_isVertical'],
                format: (stackPanel: BABYLON.GUI.StackPanel) => { return stackPanel.name }
            },
            'TextBlock': {
                type: BABYLON.GUI.TextBlock,
                properties: ['_text', '_textWrapping'],
                format: (textBlock: BABYLON.GUI.TextBlock) => { return textBlock.name }
            },
            'Container': {
                type: BABYLON.GUI.Container,
                properties: ['_background'],
                format: (container: BABYLON.GUI.Container) => { return container.name }
            },
        }

        for (let prop in PROPERTIES_GUI) {
            (<any>PROPERTIES)[prop] = (<any>PROPERTIES_GUI)[prop];
        }
    } 
}