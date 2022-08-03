import { useState, useEffect } from "react";
import * as React from "react";
import { ClassNames } from "./classNames";
import styles from "./MessageDialog.scss";

interface IMessageDialogComponentProps {
    message: string;
    isError: boolean;
}

export const MessageDialogComponent: React.FC<IMessageDialogComponentProps> = (props) => {
    const [message, setMessage] = useState(props.message);

    useEffect(() => {
        setMessage(props.message);
    }, [props]);

    if (!message) {
        return null;
    }

    return (
        <div className={ClassNames({ "dialog-container": true }, styles)}>
            <div className="dialog">
                <div className="dialog-message">{message}</div>
                <div className="dialog-buttons">
                    <div className={"dialog-button-ok" + (props.isError ? " error" : "")} onClick={() => setMessage("")}>
                        OK
                    </div>
                </div>
            </div>
        </div>
    );
};
