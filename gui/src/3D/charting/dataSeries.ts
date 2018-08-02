import { Color3 } from "babylonjs";

/** 
 * Class used to store data to display 
 * @see http://doc.babylonjs.com/how_to/chart3d
 */
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

    /**
     * Get the different values of a dimension
     * @param key defines the dimension name
     * @returns An array of values
     */
    public getDimensionValues(key: string): Array<any> {
        var result = new Array<any>();

        this.data.forEach((entry) => {
            var value = entry[key];
            if (result.indexOf(value) === -1) {
                result.push(value);
            }
        });

        return result;
    }

    /**
     * Create a new DataSeries containing testing values
     * @returns the new DataSeries
     */
    public static CreateFakeData(): DataSeries {
        var series = new DataSeries();
        series.label = "Product #1";
        series.color = new Color3(1.0, 0, 0);

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

    /**
     * Create a new DataSeries containing testing spatial values
     * @returns the new DataSeries
     */
    public static CreateFakeSpatialData(): DataSeries {
        var series = new DataSeries();
        series.label = "Spatial Data";
        series.color = new Color3(0, 1.0, 0);

        series.dimensions = ["Year", "Country"];

        series.data = [
            {
                "Year": 2014,
                "Country": "France",
                "value": 10,
                "latitude": 46.63728,
                "longitude": 2.338262
            }, 
            {
                "Year": 2014,
                "Country": "USA",
                "value": 200,
                "latitude": 39.83333,
                "longitude": -98.58334
            }, 
            {
                "Year": 2014,
                "Country": "India",
                "value": 400,
                "latitude": 23.40601,
                "longitude": 79.45809
            },
            {
                "Year": 2014,
                "Country": "UK",
                "value": 180,
                "latitude": 54.56089,
                "longitude": -2.212512
            },
            {
                "Year": 2014,
                "Country": "Germany",
                "value": 400,
                "latitude": 51.20247,
                "longitude": 10.3822
            }, 
            {
                "Year": 2014,
                "Country": "Australia",
                "value": 24,
                "latitude": -25.58524,
                "longitude": 134.5041
            }, 
            {
                "Year": 2014,
                "Country": "China",
                "value": 540,
                "latitude": 36.55309,
                "longitude": 103.9754
            }, 
            {
                "Year": 2014,
                "Country": "Japan",
                "value": 150,
                "latitude": 36.28165,
                "longitude": 139.0773
            },
            {
                "Year": 2015,
                "Country": "France",
                "value": 12,
                "latitude": 46.63728,
                "longitude": 2.338262
            }, 
            {
                "Year": 2015,
                "Country": "USA",
                "value": 120,
                "latitude": 39.83333,
                "longitude": -98.58334
            }, 
            {
                "Year": 2015,
                "Country": "India",
                "value": 480,
                "latitude": 23.40601,
                "longitude": 79.45809
            }, 
            {
                "Year": 2015,
                "Country": "UK",
                "value": 10,
                "latitude": 54.56089,
                "longitude": -2.212512
            },
            {
                "Year": 2015,
                "Country": "Germany",
                "value": 80,
                "latitude": 51.20247,
                "longitude": 10.3822
            }, 
            {
                "Year": 2015,
                "Country": "Australia",
                "value": 230,
                "latitude": -25.58524,
                "longitude": 134.5041
            }, 
            {
                "Year": 2015,
                "Country": "China",
                "value": 490,
                "latitude": 36.55309,
                "longitude": 103.9754
            }, 
            {
                "Year": 2015,
                "Country": "Japan",
                "value": 120,
                "latitude": 36.28165,
                "longitude": 139.0773
            }
        ];
        
        return series;
    }
}