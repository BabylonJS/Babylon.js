import type { FunctionComponent } from "react";
import { useState } from "react";
import logo from "../img/logo-fullscreen.svg";
import { LocalStorageHelper } from "../tools/localStorageHelper";

import "../scss/welcomeDialog.scss";

interface IWelcomeDialogProps {
    onInstall: () => void;
    onClose: () => void;
    canInstall: boolean;
}

/**
 * Welcome dialog for users coming from 3D Viewer
 *
 * @param props component properties
 * @returns welcome dialog component
 */
export const WelcomeDialog: FunctionComponent<IWelcomeDialogProps> = (props) => {
    const [doNotShowAgain, setDoNotShowAgain] = useState(false);

    const handleClose = () => {
        if (doNotShowAgain && !props.canInstall) {
            LocalStorageHelper.SetWelcomeDialogDismissed();
        }
        props.onClose();
    };

    return (
        <div className="welcome-dialog-overlay">
            <div className="welcome-dialog">
                <img src={logo} alt="Babylon.js Logo" className="welcome-logo" />
                <h1>Welcome to the Babylon.js Sandbox</h1>
                <p>
                    Welcome to the Babylon.js Sandbox, a powerful tool for viewing 3D models. Drag and drop your 3D object to view it, explore animations, change the lighting and
                    more!
                </p>
                {props.canInstall && (
                    <p>You can download this open-source application and automatically receive updates to ensure you always have the best 3D Viewing experience out there.</p>
                )}
                <div className="welcome-buttons">
                    {props.canInstall && (
                        <button className="welcome-button primary" onClick={props.onInstall}>
                            Install App
                        </button>
                    )}
                    <button className={`welcome-button ${props.canInstall ? "secondary" : "primary"}`} onClick={handleClose}>
                        {props.canInstall ? "Not now" : "Continue"}
                    </button>
                </div>
                {!props.canInstall && (
                    <label className="welcome-checkbox">
                        <input type="checkbox" checked={doNotShowAgain} onChange={(e) => setDoNotShowAgain(e.target.checked)} />
                        <span>Do not show this message again</span>
                    </label>
                )}
            </div>
        </div>
    );
};
