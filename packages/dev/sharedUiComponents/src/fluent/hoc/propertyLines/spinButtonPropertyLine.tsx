import { PropertyLine } from "./propertyLine";
import type { PropertyLineProps } from "./propertyLine";
import type { FunctionComponent } from "react";
import { SpinButton } from "../../primitives/spinButton";
import type { SpinButtonProps } from "../../primitives/spinButton";

export const SpinButtonPropertyLine: FunctionComponent<PropertyLineProps<number> & SpinButtonProps> = (props) => (
    <PropertyLine {...props}>
        <SpinButton {...props} />
    </PropertyLine>
);
