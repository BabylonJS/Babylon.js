import * as React from "react";
import * as ReactDOM from "react-dom";
import { Workbench } from "./workbench";
import { CreatePopup } from "shared-ui-components/popupHelper";

export interface IVSMOptions {
    hostElement?: HTMLElement;
}

/**
 * Class used to create a VSM
 */
export class VSM {
    private static _PopupWindow: Window | null = null;
    public static async Show(options: IVSMOptions) {
        let hostElement = options.hostElement;
        if (!hostElement) {
            if (this._PopupWindow) {
                this._PopupWindow.close();
            }
            hostElement = CreatePopup("BABYLON.JS VSM", {
                width: 1200,
                height: 800,
                onWindowCreateCallback: (w) => (this._PopupWindow = w),
            })!;
        }
        const vsm = React.createElement(Workbench);
        ReactDOM.render(vsm, hostElement);
    }
}
