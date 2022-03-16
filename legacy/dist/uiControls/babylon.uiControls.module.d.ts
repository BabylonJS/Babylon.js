/// <reference types="react" />
declare module "babylonjs-ui-controls/colorPicker" {
    import * as React from "react";
    /**
     * Interface used to specify creation options for color picker
     */
    export interface IColorPickerProps {
    }
    /**
     * Class used to create a color picker
     */
    export class ColorPicker extends React.Component<IColorPickerProps> {
        constructor(props: IColorPickerProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-ui-controls/index" {
    export * from "babylonjs-ui-controls/colorPicker";
}
declare module "babylonjs-ui-controls/legacy/legacy" {
    export * from "babylonjs-ui-controls/index";
}
declare module "babylonjs-ui-controls" {
    export * from "babylonjs-ui-controls/legacy/legacy";
}
/// <reference types="react" />
declare module UICONTROLS {
    /**
     * Interface used to specify creation options for color picker
     */
    export interface IColorPickerProps {
    }
    /**
     * Class used to create a color picker
     */
    export class ColorPicker extends React.Component<IColorPickerProps> {
        constructor(props: IColorPickerProps);
        render(): JSX.Element;
    }
}