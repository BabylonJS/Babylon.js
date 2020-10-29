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

    constructor(props: IColorPickerProps) {
        super(props);
    }

    public render() {
        return (
            <div />
        );
    }
}

