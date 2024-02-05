/* eslint-disable @typescript-eslint/naming-convention */
import { useState, useEffect } from "react";
import * as React from "react";
import { ClassNames } from "./classNames";
import styles from "./MessageDialog.modules.scss";

export interface MessageDialogProps {
    message: string;
    isError: boolean;
    onClose?: () => void;
}

export const MessageDialog: React.FC<MessageDialogProps> = (props) => {
    const [message, setMessage] = useState(props.message);
    const [isError, setIsError] = useState(props.isError);

    useEffect(() => {
        setMessage(props.message);
        setIsError(props.isError);
    }, [props]);

    const onClick = () => {
        setMessage("");
        if (props.onClose) {
            props.onClose();
        }
    };

    if (!message) {
        return null;
    }

    return (
        <div className={styles["dialog-container"]}>
            <div className={styles["dialog"]}>
                <div className={styles["dialog-message"]}>{message}</div>
                <div className={styles["dialog-buttons"]}>
                    <div className={ClassNames({ "dialog-button-ok": true, error: isError }, styles)} onClick={onClick}>
                        OK
                    </div>
                </div>
            </div>
        </div>
    );
};
