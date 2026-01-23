import * as React from "react";
import logo from "../img/logo-fullscreen.svg";

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
export const WelcomeDialog: React.FC<IWelcomeDialogProps> = (props) => {
    return (
        <div className="welcome-dialog-overlay">
            <div className="welcome-dialog">
                <img src={logo} alt="Babylon.js Logo" className="welcome-logo" />
                <h1>Welcome to the Babylon.js Sandbox</h1>
                <p>The Babylon.js Sandbox is a powerful tool for viewing and inspecting 3D models. You can drag and drop files, explore animations, and debug your scenes.</p>
                {props.canInstall && <p>Install the app for the best experience with offline support and file associations.</p>}
                <div className="welcome-buttons">
                    {props.canInstall && (
                        <button className="welcome-button primary" onClick={props.onInstall}>
                            Install App
                        </button>
                    )}
                    <button className="welcome-button secondary" onClick={props.onClose}>
                        {props.canInstall ? "Not now" : "Continue"}
                    </button>
                </div>
            </div>
        </div>
    );
};
