export class BlockTools {
    public static GetGuiFromString(data: string) {

        //TODO: Add more elements and moedfty default values for certain types.
        let element;
        switch (data) {
            case "Slider":
                element = new BABYLON.GUI.Slider("Slider");
                break;
            case "Checkbox":
                element = new BABYLON.GUI.Checkbox("Checkbox");
                break;
            case "ColorPicker":
                element = new BABYLON.GUI.ColorPicker("ColorPicker");
                break;
            case "Ellipse":
                element = new BABYLON.GUI.Ellipse("Ellipse");
                break;
            case "Rectangle":
                element = new BABYLON.GUI.Rectangle("Rectangle");
                break;
            case "Line":
                element = new BABYLON.GUI.Line();
                element.x1 = 10;
                element.y1 = 10;
                element.x2 = 100;
                element.y2 = 100;
                element.lineWidth = 5;
                element.dash = [50, 10];
                return element;
            case "Text":
                element = new BABYLON.GUI.TextBlock("Textblock");
                element.text = "My Text";
                return element;
            default:
                element = BABYLON.GUI.Button.CreateSimpleButton("Button", "Click Me");
                break;
            }
        
        element.width = "150px"
        element.height = "40px";
        element.color = "#FFFFFFFF";
        element.isPointerBlocker = true;
        return element;
    }
}