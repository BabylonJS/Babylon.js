import * as React from "react";
import * as ReactDOM from "react-dom";
import { Popup } from "shared-ui-components/lines/popup";
import { Workbench } from "./workbench";

export interface IVSMOptions {
    hostElement?: HTMLElement;
}

/**
 * Class used to create a VSM
 */
export class VSM {
    public static async Show(options: IVSMOptions) {
        let hostElement = options.hostElement;
        if (!hostElement) {
            const popupWindow = (Popup as any)["vsm"];
            if (popupWindow) {
                popupWindow.close();
            }
            hostElement = Popup.CreatePopup("BABYLON.JS VSM", "vsm", 1200, 800)!;
        }
        const vsm = React.createElement(Workbench);
        ReactDOM.render(vsm, hostElement);
    }
}
