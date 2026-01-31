import type { FunctionComponent, MouseEvent, MouseEventHandler } from "react";
import { useCallback, useState, useEffect } from "react";
import { Body1Strong, InfoLabel as FluentInfoLabel, makeStyles, mergeClasses, useFluent } from "@fluentui/react-components";

export type InfoLabelProps = {
    htmlFor: string; // required ID of the element whose label we are applying
    info?: JSX.Element;
    label: string;
    className?: string;
    /**
     * When true, applies flex layout styling to the label slot for proper truncation in flex containers
     */
    flexLabel?: boolean;
    /**
     * Handler for right-click context menu. Also triggers on Ctrl+click.
     */
    onContextMenu?: MouseEventHandler;
};
export type InfoLabelParentProps = Omit<InfoLabelProps, "htmlFor">;
const useInfoLabelStyles = makeStyles({
    infoPopup: {
        whiteSpace: "normal",
        wordBreak: "break-word",
    },
    labelSlot: {
        display: "flex",
        minWidth: 0,
    },
    labelText: {
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
    },
    copyable: {
        cursor: "copy",
    },
});
/**
 * Renders a label with an optional popup containing more info
 * @param props
 * @returns
 */
export const InfoLabel: FunctionComponent<InfoLabelProps> = (props) => {
    InfoLabel.displayName = "InfoLabel";
    const classes = useInfoLabelStyles();
    const { targetDocument } = useFluent();

    const [ctrlPressed, setCtrlPressed] = useState(false);

    useEffect(() => {
        const targetWindow = targetDocument?.defaultView ?? window;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey) {
                setCtrlPressed(true);
            }
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            if (!e.ctrlKey) {
                setCtrlPressed(false);
            }
        };
        const handleBlur = () => {
            setCtrlPressed(false);
        };

        targetWindow.addEventListener("keydown", handleKeyDown);
        targetWindow.addEventListener("keyup", handleKeyUp);
        targetWindow.addEventListener("blur", handleBlur);

        return () => {
            targetWindow.removeEventListener("keydown", handleKeyDown);
            targetWindow.removeEventListener("keyup", handleKeyUp);
            targetWindow.removeEventListener("blur", handleBlur);
        };
    }, [targetDocument]);

    const infoContent = props.info ? <div className={classes.infoPopup}>{props.info}</div> : undefined;

    const showCopyCursor = ctrlPressed && props.onContextMenu;

    // Handle Ctrl+click as context menu action
    const handleClick = useCallback(
        (e: MouseEvent) => {
            if (e.ctrlKey && props.onContextMenu) {
                props.onContextMenu(e);
            }
        },
        [props.onContextMenu]
    );

    return infoContent ? (
        <FluentInfoLabel
            htmlFor={props.htmlFor}
            info={infoContent}
            className={mergeClasses(props.className, showCopyCursor ? classes.copyable : undefined)}
            label={props.flexLabel ? { className: classes.labelSlot } : undefined}
            onContextMenu={props.onContextMenu}
            onClick={handleClick}
        >
            <Body1Strong className={classes.labelText}>{props.label}</Body1Strong>
        </FluentInfoLabel>
    ) : (
        <Body1Strong className={mergeClasses(props.className, showCopyCursor ? classes.copyable : undefined)} onContextMenu={props.onContextMenu} onClick={handleClick}>
            {props.label}
        </Body1Strong>
    );
};
