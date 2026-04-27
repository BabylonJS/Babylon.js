import { PropertyLine, type PropertyLineProps } from "./propertyLine";
import { type FunctionComponent } from "react";
import { SpinButton, type SpinButtonProps } from "../../primitives/spinButton";
import { makeStyles, mergeClasses } from "@fluentui/react-components";
import { UniformWidthStyling } from "../../primitives/utils";

const useStyles = makeStyles({
    uniformWidth: {
        ...UniformWidthStyling,
    },
});

export const SpinButtonPropertyLine: FunctionComponent<PropertyLineProps<number> & SpinButtonProps> = (props) => {
    SpinButtonPropertyLine.displayName = "SpinButtonPropertyLine";
    const classes = useStyles();
    return (
        <PropertyLine {...props}>
            <SpinButton {...props} className={mergeClasses(classes.uniformWidth, props.className)} />
        </PropertyLine>
    );
};
