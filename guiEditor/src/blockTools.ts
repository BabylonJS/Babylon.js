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

        }

        return BABYLON.GUI.Button.CreateSimpleButton("Button", "Click Me");
    }
}