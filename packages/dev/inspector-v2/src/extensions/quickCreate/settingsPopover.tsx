import type { FunctionComponent, PropsWithChildren } from "react";
import { useState } from "react";
import { Popover, PopoverTrigger, PopoverSurface } from "@fluentui/react-components";
import { Settings20Regular } from "@fluentui/react-icons";

/**
 * Settings popover component, can be updated to use shared popover once it exists
 * @param props
 * @returns
 */
export const SettingsPopover: FunctionComponent<PropsWithChildren<{}>> = (props) => {
    const { children } = props;
    const [popoverOpen, setPopoverOpen] = useState(false);

    return (
        <Popover open={popoverOpen} onOpenChange={(_, data) => setPopoverOpen(data.open)} positioning="below-start" trapFocus>
            <PopoverTrigger disableButtonEnhancement>
                <button
                    type="button"
                    onClick={() => setPopoverOpen(true)}
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        padding: "5px 8px",
                        borderRadius: "4px",
                    }}
                >
                    <Settings20Regular />
                </button>
            </PopoverTrigger>
            <PopoverSurface>
                <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: 16, minWidth: 300, maxWidth: 400 }}>{children}</div>
            </PopoverSurface>
        </Popover>
    );
};
