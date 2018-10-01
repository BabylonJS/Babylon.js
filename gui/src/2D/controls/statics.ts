import { Control } from "./control";
import { StackPanel } from "./stackPanel";
import { TextBlock } from "./textBlock";

/**
 * Forcing an export so that this code will execute
 * @hidden
 */
const name = "Statics";

export { name };

/**
 * Creates a stack panel that can be used to render headers
 * @param control defines the control to associate with the header
 * @param text defines the text of the header
 * @param size defines the size of the header
 * @param options defines options used to configure the header
 * @returns a new StackPanel
 */
Control.AddHeader = function(control: Control, text: string, size: string | number, options: { isHorizontal: boolean, controlFirst: boolean }): StackPanel {
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
};