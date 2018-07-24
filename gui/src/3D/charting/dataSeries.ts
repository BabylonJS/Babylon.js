import { Color3 } from "babylonjs";

/** Class used to store data to display */
export class DataSeries {
    /** Gets or sets the label of the series */
    public label: string;

    /** Gets or sets the color associated with the series */
    public color: Color3;

    /** Gets or sets the list of dimensions (used to filter data) */
    public dimensions: Array<string>;

    /** Gets or sets the list of values (data to display) */
    public data: Array<any>;  

    public static CreateFakeData(): DataSeries {
        var series = new DataSeries();
        series.label = "Product #1";
        series.color = Color3.Red();

        series.dimensions = ["Year", "Country"];

        series.data = [
            {
                "Year": 2014,
                "Country": "France",
                "value": 10
            }, 
            {
                "Year": 2014,
                "Country": "USA",
                "value": 200
            }, 
            {
                "Year": 2014,
                "Country": "India",
                "value": 400
            }, 
            {
                "Year": 2014,
                "Country": "UK",
                "value": 180
            },
            {
                "Year": 2015,
                "Country": "France",
                "value": 12
            }, 
            {
                "Year": 2015,
                "Country": "USA",
                "value": 120
            }, 
            {
                "Year": 2015,
                "Country": "India",
                "value": 480
            }, 
            {
                "Year": 2015,
                "Country": "UK",
                "value": 10
            }
        ];
        
        return series;
    }
}