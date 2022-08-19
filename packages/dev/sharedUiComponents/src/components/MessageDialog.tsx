import { useState, useEffect } from "react";
import * as React from "react";
import { ClassNames } from "./classNames";
import styles from "./MessageDialog.modules.scss";

export interface MessageDialogProps {
    message: string;
    isError: boolean;
}

export const MessageDialog: React.FC<MessageDialogProps> = (props) => {
    const [message, setMessage] = useState(props.message);
    const [isError, setIsError] = useState(props.isError);

    useEffect(() => {
        setMessage(props.message);
        setIsError(props.isError);
    }, [props]);

    if (!message) {
        return null;
    }

    return (
        <div className={ClassNames({ "dialog-container": true }, styles)}>
            <div className={ClassNames({ dialog: true }, styles)}>
                <div className={ClassNames({ "dialog-message": true }, styles)}>{message}</div>
                <div className={ClassNames({ "dialog-buttons": true }, styles)}>
                    <div className={ClassNames({ "dialog-button-ok": true, error: isError }, styles)} onClick={() => setMessage("")}>
                        OK
                    </div>
                </div>
            </div>
        </div>
    );
};
