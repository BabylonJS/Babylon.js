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