import type { FunctionComponent } from "react";
import type { MakePopoverTeachingMoment } from "../hooks/teachingMomentHooks";
import { makeStyles, TeachingPopover, TeachingPopoverBody, TeachingPopoverHeader, TeachingPopoverSurface } from "@fluentui/react-components";

const useStyles = makeStyles({
    extensionTeachingPopover: {
        maxWidth: "320px",
    },
});

type TeachingMomentState = ReturnType<ReturnType<typeof MakePopoverTeachingMoment>>;
type TeachingMomentProps = Pick<TeachingMomentState, "shouldDisplay" | "positioningRef" | "onOpenChange"> & {
    title: string;
    description: string;
};

/**
 * A component that displays a teaching moment popover.
 * @param props Props for the teaching moment popover.
 * @returns The teaching moment popover.
 */
export const TeachingMoment: FunctionComponent<TeachingMomentProps> = ({ shouldDisplay, positioningRef, onOpenChange, title, description }) => {
    const classes = useStyles();

    return (
        <TeachingPopover appearance="brand" open={shouldDisplay} positioning={{ positioningRef }} onOpenChange={onOpenChange}>
            <TeachingPopoverSurface className={classes.extensionTeachingPopover}>
                <TeachingPopoverHeader>{title}</TeachingPopoverHeader>
                <TeachingPopoverBody>{description}</TeachingPopoverBody>
            </TeachingPopoverSurface>
        </TeachingPopover>
    );
};
