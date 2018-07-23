import { Color3 } from "babylonjs";

export class DataSeries {
    /** Gets or sets the label of the series */
    public label: string;

    /** Gets or sets the color associated with the series*/
    public color: Color3;

    /** Gets or sets the list of dimensions (used to filter data) */
    public dimensions: Array<string>;

    /**
     * Gets or sets the list of values (data to display)
     */
    public values: Array<string>;
}