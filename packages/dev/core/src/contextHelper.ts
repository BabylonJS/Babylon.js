declare const require: any;

const ConversionTable: { [key: string]: string } = {
    vector2: "math.vector",
    vector3: "math.vector",
    vector4: "math.vector",
    matrix: "math.vector",
    color3: "math.color",
    color4: "math.color",
    valuecondition: "condition",
    predicatecondition: "condition",
    statecondition: "condition",
    setparentaction: "directaction",
    executecodeaction: "directaction",
    donothingaction: "directaction",
    stopanimationaction: "directaction",
    playanimationaction: "directaction",
    incrementvalueaction: "directaction",
    setvalueaction: "directaction",
    setstateaction: "directaction",
    switchbooleanaction: "directaction",
    combineaction: "directaction",
    playsoundaction: "directaudioaction",
    stopsoundaction: "directaudioaction",
    followcamera: "followcamera",
    arcfollowcamera: "followcamera",
    oppositeblock: "oneminusblock",
};

const RenameTable: { [key: string]: string } = {
    oppositeblock: "OneMinusBlock",
};

/** @internal */
// eslint-disable-next-line @typescript-eslint/naming-convention
let _DiscoveredTypes: { [key: string]: any };

function GetLastPartWithoutExtension(path: string) {
    const parts = path.split("/");
    const last = parts[parts.length - 1];

    return last.replace(/\.[^/.]+$/, "");
}

/**
 * Extract a class from the bundle context
 * @param name name of the class to extract
 * @returns the class or undefined if not found
 */
export function ExtractClass(name: string) {
    if (!_DiscoveredTypes) {
        _DiscoveredTypes = {};
        // Use require.context to import all modules
        const requireModule = require.context(
            "./", // The relative path to your classes directory
            true, // Whether to include subdirectories
            /\.ts$/ // Regular expression to match JavaScript files
        );

        // Build the modules mapping
        requireModule.keys().forEach((fileName: string) => {
            if (fileName.indexOf("LibDeclarations") !== -1) {
                return;
            }

            // Extract the class name from the file name
            const className = GetLastPartWithoutExtension(fileName);

            if (!className) {
                return;
            }
            // Import the module and assign it to the modules object
            _DiscoveredTypes[className.toLowerCase()] = requireModule(fileName);
        });
    }
    let key = name.toLowerCase();
    if (ConversionTable[key]) {
        key = ConversionTable[key];
    }

    if (!_DiscoveredTypes[key]) {
        return undefined;
    }

    let className = name;
    if (RenameTable[key]) {
        className = RenameTable[key];
    }
    return _DiscoveredTypes[key][className];
}
