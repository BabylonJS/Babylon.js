import { Button } from "babylonjs-gui/2D/controls/button";
import { Checkbox } from "babylonjs-gui/2D/controls/checkbox";
import { ColorPicker } from "babylonjs-gui/2D/controls/colorpicker";
import { Ellipse } from "babylonjs-gui/2D/controls/ellipse";
import { Line } from "babylonjs-gui/2D/controls/line";
import { Rectangle } from "babylonjs-gui/2D/controls/rectangle";
import { Slider } from "babylonjs-gui/2D/controls/sliders/slider";
import { TextBlock } from "babylonjs-gui/2D/controls/textBlock";

export class GuiNodeTools {
    public static GetGuiFromString(data: string) {

        //TODO: Add more elements and create default values for certain types.
        let element;
        switch (data) {
            case "Slider":
                element = new Slider("Slider");
                break;
            case "Checkbox":
                element = new Checkbox("Checkbox");
                break;
            case "ColorPicker":
                element = new ColorPicker("ColorPicker");
                break;
            case "Ellipse":
                element = new Ellipse("Ellipse");
                break;
            case "Rectangle":
                element = new Rectangle("Rectangle");
                break;
            case "Line":
                element = new Line();
                element.x1 = 10;
                element.y1 = 10;
                element.x2 = 100;
                element.y2 = 100;
                element.lineWidth = 5;
                element.dash = [50, 10];
                return element;
            case "Text":
                element = new TextBlock("Textblock");
                element.text = "My Text";
                return element;
            default:
                element = Button.CreateSimpleButton("Button", "Click Me");
                break;
            }
        
        element.width = "150px"
        element.height = "40px";
        element.color = "#FFFFFFFF";
        element.isPointerBlocker = true;
        return element;
    }
}