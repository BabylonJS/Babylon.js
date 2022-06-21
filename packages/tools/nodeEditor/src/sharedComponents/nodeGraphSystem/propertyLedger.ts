import { ComponentClass } from "react";
import { IPropertyComponentProps } from "./interfaces/propertyComponentProps";

export class PropertyLedger {
    public static RegisteredControls: { [key: string]: ComponentClass<IPropertyComponentProps> } = {};
}
