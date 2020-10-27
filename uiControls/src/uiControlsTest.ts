import * as React from "react";
import * as ReactDOM from "react-dom";
import { ColorPicker } from './colorPicker/colorPicker';
import { Color4 } from "babylonjs/Maths/math.color";

/**
 * Class used to test the creation of ui controls
 */
export class UIControlsTest {
    /**
     * Test a given control
     * @param options defines the options to use to configure the node editor
     */
    public static Test(host: HTMLElement, controlName: string): JSX.Element {

        let control: JSX.Element
        
        switch (controlName) {
            case "ColorPicker":
            default:
            {
                control = React.createElement(ColorPicker, {
                    color: new Color4(1,1,0, 1),
                    debugMode: false,
                    onColorChanged: (color) => console.log(color.toString())
                });

            }
        }

        ReactDOM.render(control, host);

        return control;
    }
}

