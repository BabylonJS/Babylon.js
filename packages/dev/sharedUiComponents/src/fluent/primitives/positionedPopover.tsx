import { Popover, PopoverSurface, PopoverTrigger } from "@fluentui/react-components";
import type { OnOpenChangeData, OpenPopoverEvents } from "@fluentui/react-components";
import type { FunctionComponent, PropsWithChildren } from "react";
import { useState, useEffect } from "react";

type PositionedPopoverProps = {
    x: number;
    y: number;
    visible: boolean;
    hide: () => void;
};

/**
 * PositionedPopover component that shows a popover at specific coordinates
 * @param props - The component props
 * @returns The positioned popover component
 */
export const PositionedPopover: FunctionComponent<PropsWithChildren<PositionedPopoverProps>> = (props) => {
    PositionedPopover.displayName = "PositionedPopover";
    const [open, setOpen] = useState(false);

    useEffect(() => {
        setOpen(props.visible);
    }, [props.visible, props.x, props.y]);

    const handleOpenChange = (_: OpenPopoverEvents, data: OnOpenChangeData) => {
        setOpen(data.open);

        if (!data.open) {
            props.hide();
        }
    };

    return (
        <Popover
            open={open}
            onOpenChange={handleOpenChange}
            positioning={{
                position: "below", // Places the popover directly below the trigger element
                autoSize: "height-always", //Automatically adjusts the popover height to fit within the viewport
                fallbackPositions: ["above", "after", "before"], //If the primary position doesn't fit, automatically tries these positions in order
            }}
            withArrow={false} // Removes arrow that points to trigger element
        >
            <PopoverTrigger>
                {/* Use the invisible div as the trigger location*/}
                <div
                    style={{
                        position: "absolute",
                        left: `${props.x}px`,
                        top: `${props.y}px`,
                        visibility: "hidden",
                    }}
                />
            </PopoverTrigger>
            <PopoverSurface>{props.children}</PopoverSurface>
        </Popover>
    );
};
