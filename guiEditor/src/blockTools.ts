export class BlockTools {
    public static GetGuiFromString(data: string) {
        switch (data) {
            case "Slider":
                return new BABYLON.GUI.Slider("Slider");
        }

        return BABYLON.GUI.Button.CreateSimpleButton("Button", "Click Me");
    }
}