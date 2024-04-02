import { Button } from "gui/2D/controls/button";
import { Checkbox } from "gui/2D/controls/checkbox";
import { ColorPicker } from "gui/2D/controls/colorpicker";
import { Ellipse } from "gui/2D/controls/ellipse";
import { Line } from "gui/2D/controls/line";
import { Rectangle } from "gui/2D/controls/rectangle";
import { Slider } from "gui/2D/controls/sliders/slider";
import { TextBlock } from "gui/2D/controls/textBlock";
import { VirtualKeyboard } from "gui/2D/controls/virtualKeyboard";
import { Image } from "gui/2D/controls/image";
import { InputText } from "gui/2D/controls/inputText";
import { InputPassword } from "gui/2D/controls/inputPassword";
import { Grid } from "gui/2D/controls/grid";
import { DisplayGrid } from "gui/2D/controls/displayGrid";
import { StackPanel } from "gui/2D/controls/stackPanel";
import { ScrollViewer } from "gui/2D/controls/scrollViewers/scrollViewer";
import { RadioButton } from "gui/2D/controls/radioButton";
import { ImageBasedSlider } from "gui/2D/controls/sliders/imageBasedSlider";

export class GUINodeTools {
    public static ImageControlDefaultUrl = "https://assets.babylonjs.com/textures/Checker_albedo.png";

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
                element.color = "#000000";
                element.background = "#cccccc";
                element.isPointerBlocker = true;
                element.thickness = 1;
                return element;
            case "Rectangle":
                element = new Rectangle("Rectangle");
                element.color = "#000000";
                element.background = "#cccccc";
                element.isPointerBlocker = true;
                element.thickness = 1;
                return element;
            case "Line":
                element = new Line("Line");
                element.x1 = 0;
                element.y1 = 1024;
                element.y2 = 512;
                element.x2 = 512;
                element.lineWidth = 2;
                element.isPointerBlocker = true;
                element.isHitTestVisible = true;
                element.color = "#000000";
                return element;
            case "TextBlock":
                element = new TextBlock("Textblock");
                element.text = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam sed.";
                element.color = "#000000";
                element.fontSize = 20;
                element.resizeToFit = true;
                element.isPointerBlocker = true;
                return element;
            case "ImageButton":
                element = Button.CreateImageButton("Button", "Click Me", GUINodeTools.ImageControlDefaultUrl);
                element.background = "#333333";
                element.color = "#ffffff";
                element.isPointerBlocker = true;
                element.width = "120px";
                element.height = "40px";
                return element;
            case "VirtualKeyboard":
                element = VirtualKeyboard.CreateDefaultLayout("VirtualKeyboard");
                element.addKeysRow(["1", "2", "3", "\u2190"]);
                return element;
            case "Image":
                element = new Image("Image", GUINodeTools.ImageControlDefaultUrl);
                element.width = "512px";
                element.height = "512px";
                element.autoScale = true;
                element.color = "transparent";
                element.isPointerBlocker = true;
                return element;
            case "ButtonImage":
                element = new Image("Image", GUINodeTools.ImageControlDefaultUrl);
                element.width = "100%";
                element.height = "100%";
                element.color = "transparent";
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
                element.addColumnDefinition(1.0, false);
                element.addRowDefinition(1.0, false);
                element.isPointerBlocker = true;
                return element;
            case "DisplayGrid":
                element = new DisplayGrid("DisplayGrid");
                return element;
            case "StackPanel":
                element = new StackPanel("StackPanel");
                element.width = "100%";
                element.height = "100%";
                return element;
            case "ScrollViewer":
                element = new ScrollViewer("ScrollViewer");
                element.width = 0.4;
                element.height = 0.4;
                element.background = "#CCCCCC";
                return element;
            case "ImageBasedSlider":
                element = new ImageBasedSlider("ImageBasedSlider");
                element.isPointerBlocker = true;
                element.width = "120px";
                element.height = "30px";
                element.isThumbClamped = true;
                element.displayThumb = true;
                element.backgroundImage = new Image("Image", "https://playground.babylonjs.com/textures/gui/backgroundImage.png");
                element.valueBarImage = new Image("Image", "https://playground.babylonjs.com/textures/gui/valueImage.png");
                element.thumbImage = new Image("Image", "https://playground.babylonjs.com/textures/gui/thumb.png");
                return element;
            case "RadioButton":
                element = new RadioButton("RadioButton");
                element.isPointerBlocker = true;
                element.width = "20px";
                element.height = "20px";
                element.color = "#CCCCCC";
                element.background = "#333333";
                return element;
            case "Button":
                element = Button.CreateSimpleButton("Button", "Click Me");
                element.background = "#333333";
                element.color = "#ffffff";
                element.isPointerBlocker = true;
                element.width = "120px";
                element.height = "40px";
                return element;
            default:
                // eslint-disable-next-line no-throw-literal
                throw "Error: control type not recognized";
        }
    }
}
