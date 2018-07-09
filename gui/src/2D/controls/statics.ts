import { Control } from "./control";
import { StackPanel } from "./stackPanel";
import { TextBlock } from "./textBlock";

let name = "Statics";

export { name };

Control.AddHeader = function (control: Control, text: string, size: string | number, options: { isHorizontal: boolean, controlFirst: boolean }): StackPanel {
    let panel = new StackPanel("panel");
    let isHorizontal = options ? options.isHorizontal : true;
    let controlFirst = options ? options.controlFirst : true;

    panel.isVertical = !isHorizontal;

    let header = new TextBlock("header");
    header.text = text;
    header.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    if (isHorizontal) {
        header.width = size;
    } else {
        header.height = size;
    }

    if (controlFirst) {
        panel.addControl(control);
        panel.addControl(header);
        header.paddingLeft = "5px";
    } else {
        panel.addControl(header);
        panel.addControl(control);
        header.paddingRight = "5px";
    }

    header.shadowBlur = control.shadowBlur;
    header.shadowColor = control.shadowColor;
    header.shadowOffsetX = control.shadowOffsetX;
    header.shadowOffsetY = control.shadowOffsetY;

    return panel;
}