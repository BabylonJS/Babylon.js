import { Button } from "babylonjs-gui/2D/controls/button";
import { Checkbox } from "babylonjs-gui/2D/controls/checkbox";
import { ColorPicker } from "babylonjs-gui/2D/controls/colorpicker";
import { Ellipse } from "babylonjs-gui/2D/controls/ellipse";
import { Line } from "babylonjs-gui/2D/controls/line";
import { Rectangle } from "babylonjs-gui/2D/controls/rectangle";
import { Slider } from "babylonjs-gui/2D/controls/sliders/slider";
import { TextBlock } from "babylonjs-gui/2D/controls/textBlock";
import { VirtualKeyboard } from "babylonjs-gui/2D/controls/virtualKeyboard";
import { Image } from "babylonjs-gui/2D/controls/image"
import { InputText } from "babylonjs-gui/2D/controls/inputText";
import { InputPassword } from "babylonjs-gui/2D/controls/inputPassword";
import { Grid } from "babylonjs-gui/2D/controls/grid";
import { DisplayGrid } from "babylonjs-gui/2D/controls/displayGrid";
import { StackPanel } from "babylonjs-gui/2D/controls/stackPanel";

export class GUINodeTools {
    public static CreateControlFromString(data: string) {
        let element;
        switch (data) {
            case "Slider":
                element = new Slider("Slider");
                break;
            case "Checkbox":
                element = new Checkbox("Checkbox");
                element.width = "5%";
                element.height = "5%";
                element.color = "#cccccc";
                element.isPointerBlocker = true;
                return element;
            case "ColorPicker":
                element = new ColorPicker("ColorPicker");
                break;
            case "Ellipse":
                element = new Ellipse("Ellipse");
                element.color = "#cccccc";
                break;
            case "Rectangle":
                element = new Rectangle("Rectangle");
                element.color = "#cccccc";
                break;
            case "Line":
                element = new Line();
                element.x1 = 0;
                element.y1 = 0;
                element.y2 = 100;
                element.x2 = 100;
                element.lineWidth = 5;
                element.dash = [50, 10];
                element.isPointerBlocker = true;
                element.isHitTestVisible = true;
                element.color = "#0";
                return element;
            case "Text":
                element = new TextBlock("Textblock");
                element.text = "My Text";
                element.color = "#0";
                element.fontSize = 20;
                element.resizeToFit = true;
                element.isPointerBlocker = true;
                return element;
            case "ImageButton":
                element = Button.CreateImageButton("Button", "Click Me", "https://playground.babylonjs.com/textures/grass.png");
                break;
            case "VirtualKeyboard":
                element = new VirtualKeyboard();
                element.addKeysRow(["1", "2", "3", "\u2190"]);
                break;
            case "Image":
                element = new Image("Image", "https://playground.babylonjs.com/textures/grass.png");
                element.autoScale = true;
                element.isPointerBlocker = true;
                return element;
            case "InputText":
                element = new InputText("InputText");
                element.maxWidth = 0.6;
                element.text = "Input Text";
                element.background = "#333333";
                element.color = "#ffffff";
                break;
            case "InputPassword":
                element = new InputPassword("InputPassword");
                element.maxWidth = 0.6;
                element.text = "Input Text";
                element.background = "#333333";
                element.color = "#ffffff";
                break;
            case "Grid":
                element = new Grid("Grid");
                element.addColumnDefinition(50, false);
                element.addColumnDefinition(0.5);
                element.addColumnDefinition(0.5);
                element.addColumnDefinition(50, false);
                element.addRowDefinition(0.5);
                element.addRowDefinition(0.5);
                element.isHighlighted = true;
                element.isPointerBlocker = true;
                return element;
            case "DisplayGrid":
                element = new DisplayGrid("DisplayGrid");
                return element;
            case "StackPanel":
                element = new StackPanel("StackPanel");
                element.isHighlighted = true;
                return element;
            default:
                element = Button.CreateSimpleButton("Button", "Click Me");
                element.background = "#333333";
                element.color = "#ffffff";
                break;
        }
        element.width = "15%";
        element.height = "5%";
        element.isPointerBlocker = true;
        return element;
    }
}
