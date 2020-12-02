export class BlockTools {
    public static GetGuiFromString(data: string) {
        switch (data) {
            case "Slider":
                return new BABYLON.GUI.Slider("Slider");
            case "Checkbox":
                return new BABYLON.GUI.Checkbox("Checkbox");
            case "ColorPicker":
                return new BABYLON.GUI.ColorPicker("ColorPicker");
            case "Ellipse":
                return new BABYLON.GUI.Ellipse("Ellipse");
            case "Rectangle":
                return new BABYLON.GUI.Rectangle("Rectangle");
            case "Line":
                var line = new BABYLON.GUI.Line();
                line.x1 = 10;
                line.y1 = 10;
                line.x2 = 100;
                line.y2 = 100;
                line.lineWidth = 5;
                line.dash = [50, 10];
                return line;

        }

        return BABYLON.GUI.Button.CreateSimpleButton("Button", "Click Me");
    }
}