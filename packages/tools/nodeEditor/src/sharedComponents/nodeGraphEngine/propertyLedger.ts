import { ComponentClass } from "react";
import { IPropertyComponentProps } from "./propertyComponentProps";

export class PropertyLedger {
    public static RegisteredControls: { [key: string]: ComponentClass<IPropertyComponentProps> } = {};
}
