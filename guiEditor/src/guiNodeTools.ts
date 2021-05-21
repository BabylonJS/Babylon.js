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
                element.isPointerBlocker = true;
                element.width = "120px";
                element.height = "30px";
                return element;
            case "Checkbox":
                element = new Checkbox("Checkbox");
                element.width = "20px";
                element.height = "20px";
                element.color = "#cccccc";
                return element;
            case "ColorPicker":
                element = new ColorPicker("ColorPicker");
                element.isPointerBlocker = true;
                element.width = "10%";
                element.height = "10%";
                return element;
            case "Ellipse":
                element = new Ellipse("Ellipse");
                element.color = "#cccccc";
                element.isPointerBlocker = true;
                element.thickness = 1;
                return element;
            case "Rectangle":
                element = new Rectangle("Rectangle");
                element.color = "#cccccc";
                element.isPointerBlocker = true;
                element.thickness = 1;
                return element;
            case "Line":
                element = new Line();
                element.x1 = 0;
                element.y1 = 1024;
                element.y2 = 512;
                element.x2 = 512;
                element.lineWidth = 2;
                element.isPointerBlocker = true;
                element.isHitTestVisible = true;
                element.color = "#000000";
                return element;
            case "Text":
                element = new TextBlock("Textblock");
                element.text = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam sed.";
                element.color = "#000000";
                element.fontSize = 20;
                element.resizeToFit = true;
                element.isPointerBlocker = true;
                return element;
            case "ImageButton":
                element = Button.CreateImageButton("Button", "Click Me", "https://playground.babylonjs.com/textures/grass.png");
                element.background = "#333333";
                element.color = "#ffffff";
                element.isPointerBlocker = true;
                element.width = "120px";
                element.height = "40px";
                return element;
            case "VirtualKeyboard":
                element = VirtualKeyboard.CreateDefaultLayout();
                element.addKeysRow(["1", "2", "3", "\u2190"]);
                return element;
            case "Image":
                element = new Image("Image", "https://playground.babylonjs.com/textures/grass.png");
                element.width = "512px";
                element.height = "512px";
                element.autoScale = true;
                element.isPointerBlocker = true;
                return element;
            case "InputText":
                element = new InputText("InputText");
                element.maxWidth = 0.6;
                element.text = "Input Text";
                element.background = "#333333";
                element.color = "#ffffff";
                element.isPointerBlocker = true;
                element.width = "160px";
                element.height = "40px";
                return element;
            case "InputPassword":
                element = new InputPassword("InputPassword");
                element.maxWidth = 0.6;
                element.text = "Password";
                element.background = "#333333";
                element.color = "#ffffff";
                element.isPointerBlocker = true;
                element.width = "160px";
                element.height = "40px";
                return element;
            case "Grid":
                element = new Grid("Grid");
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
                element.isPointerBlocker = true;
                element.width = "120px";
                element.height = "40px";
                return element;
        }
    }
}
