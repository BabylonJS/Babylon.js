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

    /**
     * Apply a list of filters to the data and return a list
     * @param filters defines the filters to apply
     * @returns an array containing the filtered data
     */
    public getFilteredData(filters: {[key: string]: string}): Array<any> {
        let filteredData = new Array<any>();

        this.data.forEach(element => {
            let isValid = false;
            for (var filter in filters) {
                if (!filters.hasOwnProperty(filter)) {
                    continue;
                }

                var filterValue = filters[filter];
                isValid = (element[filter] === filterValue);

                if (!isValid) {
                    break;
                }
            }

            if (isValid) {
                filteredData.push(element);
            }
        });

        return filteredData;
    }

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
                "Year": 2014,
                "Country": "Germany",
                "value": 400
            }, 
            {
                "Year": 2014,
                "Country": "Australia",
                "value": 24
            }, 
            {
                "Year": 2014,
                "Country": "China",
                "value": 540
            }, 
            {
                "Year": 2014,
                "Country": "Japan",
                "value": 150
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
            },
            {
                "Year": 2015,
                "Country": "Germany",
                "value": 80
            }, 
            {
                "Year": 2015,
                "Country": "Australia",
                "value": 230
            }, 
            {
                "Year": 2015,
                "Country": "China",
                "value": 490
            }, 
            {
                "Year": 2015,
                "Country": "Japan",
                "value": 120
            }
        ];
        
        return series;
    }
}