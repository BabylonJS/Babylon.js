import { Lerp } from "core/Maths/math.scalar.functions";

interface IIESData {
    version: string;
    tilt?: {};
    numberOfLights?: number;
    lumensPerLamp?: number;
    candelaMultiplier?: number;
    numberOfVerticalAngles: number;
    numberOfHorizontalAngles: number;
    horizontalAngles: number[];
    verticalAngles: number[];
    photometricType?: number;
    unitsType?: number;
    width?: number;
    length?: number;
    height?: number;
    ballastFactor?: number;
    fileGenerationType?: number;
    inputWatts?: number;
    candelaValues: number[][];
}

interface IDataPointer {
    lines: string[];
    index: number;
}

function lineToArray(line: string): number[] {
    return line
        .split(" ")
        .filter((x) => x !== "")
        .map((x) => parseFloat(x));
}

function readArray(dataPointer: IDataPointer, count: number, targetArray: number[]) {
    while (targetArray.length !== count) {
        const line = lineToArray(dataPointer.lines[dataPointer.index++]);
        targetArray.push(...line);
    }
}

function interpolateCandelaValues(data: IIESData, phi: number, theta: number): number {
    let phiIndex = 0;
    let thetaIndex = 0;
    let startTheta = 0;
    let endTheta = 0;
    let startPhi = 0;
    let endPhi = 0;

    // Check if the angle is outside the range
    for (let index = 0; index < data.numberOfHorizontalAngles - 1; index++) {
        if (theta < data.horizontalAngles[index + 1] || index === data.numberOfHorizontalAngles - 2) {
            thetaIndex = index;
            startTheta = data.horizontalAngles[index];
            endTheta = data.horizontalAngles[index + 1];

            break;
        }
    }

    for (let index = 0; index < data.numberOfVerticalAngles - 1; index++) {
        if (phi < data.verticalAngles[index + 1] || index === data.numberOfVerticalAngles - 2) {
            phiIndex = index;
            startPhi = data.verticalAngles[index];
            endPhi = data.verticalAngles[index + 1];

            break;
        }
    }

    const deltaTheta = endTheta - startTheta;
    const deltaPhi = endPhi - startPhi;

    if (deltaPhi === 0) {
        return 0;
    }

    // Interpolate
    const t1 = deltaTheta === 0 ? 0 : (theta - startTheta) / deltaTheta;
    const t2 = (phi - startPhi) / deltaPhi;

    const nextThetaIndex = deltaTheta === 0 ? thetaIndex : thetaIndex + 1;

    const v1 = Lerp(data.candelaValues[thetaIndex][phiIndex], data.candelaValues[nextThetaIndex][phiIndex], t1);
    const v2 = Lerp(data.candelaValues[thetaIndex][phiIndex + 1], data.candelaValues[nextThetaIndex][phiIndex + 1], t1);
    const v = Lerp(v1, v2, t2);

    return v;
}
/**
 * Interface for IES texture data.
 */
export interface IIESTextureData {
    /** The width of the texture */
    width: number;
    /** The height of the texture */
    height: number;
    /** The data of the texture */
    data: Float32Array;
}

/**
 * Generates IES data buffer from a string representing the IES data.
 * @param uint8Array defines the IES data
 * @returns the IES data buffer
 * @see https://ieslibrary.com/browse
 * @see https://playground.babylonjs.com/#UQGPDT#1
 */
export function LoadIESData(uint8Array: Uint8Array): IIESTextureData {
    const decoder = new TextDecoder("utf-8");
    const source = decoder.decode(uint8Array);

    // Read data
    const dataPointer: IDataPointer = {
        lines: source.split("\n"),
        index: 0,
    };
    const data: IIESData = { version: dataPointer.lines[0], candelaValues: [], horizontalAngles: [], verticalAngles: [], numberOfHorizontalAngles: 0, numberOfVerticalAngles: 0 };

    // Skip metadata
    dataPointer.index = 1;
    while (dataPointer.lines.length > 0 && !dataPointer.lines[dataPointer.index].includes("TILT=")) {
        dataPointer.index++;
    }

    // Process tilt data?
    if (dataPointer.lines[dataPointer.index].includes("INCLUDE")) {
        // Not supported yet as I did not manage to find an example :)
    }
    dataPointer.index++;

    // Header
    const header = lineToArray(dataPointer.lines[dataPointer.index++]);
    data.numberOfLights = header[0];
    data.lumensPerLamp = header[1];
    data.candelaMultiplier = header[2];
    data.numberOfVerticalAngles = header[3];
    data.numberOfHorizontalAngles = header[4];
    data.photometricType = header[5]; // We ignore cylindrical type for now. Will add support later if needed
    data.unitsType = header[6];
    data.width = header[7];
    data.length = header[8];
    data.height = header[9];

    // Additional data
    const additionalData = lineToArray(dataPointer.lines[dataPointer.index++]);
    data.ballastFactor = additionalData[0];
    data.fileGenerationType = additionalData[1];
    data.inputWatts = additionalData[2];

    // Prepare arrays
    for (let index = 0; index < data.numberOfHorizontalAngles; index++) {
        data.candelaValues[index] = [];
    }

    // Vertical angles
    readArray(dataPointer, data.numberOfVerticalAngles, data.verticalAngles);

    // Horizontal angles
    readArray(dataPointer, data.numberOfHorizontalAngles, data.horizontalAngles);

    // Candela values
    for (let index = 0; index < data.numberOfHorizontalAngles; index++) {
        readArray(dataPointer, data.numberOfVerticalAngles, data.candelaValues[index]);
    }

    // Evaluate candela values
    let maxCandela = -1;
    for (let index = 0; index < data.numberOfHorizontalAngles; index++) {
        for (let subIndex = 0; subIndex < data.numberOfVerticalAngles; subIndex++) {
            data.candelaValues[index][subIndex] *= data.candelaValues[index][subIndex] * data.candelaMultiplier * data.ballastFactor * data.fileGenerationType;
            maxCandela = Math.max(maxCandela, data.candelaValues[index][subIndex]);
        }
    }

    // Normalize candela values
    if (maxCandela > 0) {
        for (let index = 0; index < data.numberOfHorizontalAngles; index++) {
            for (let subIndex = 0; subIndex < data.numberOfVerticalAngles; subIndex++) {
                data.candelaValues[index][subIndex] /= maxCandela;
            }
        }
    }

    // Create the cylindrical texture
    const height = 180;
    const width = height * 2;
    const size = width * height;
    const arrayBuffer = new Float32Array(width * height);

    // Fill the texture
    const startTheta = data.horizontalAngles[0];
    const endTheta = data.horizontalAngles[data.numberOfHorizontalAngles - 1];
    for (let index = 0; index < size; index++) {
        let theta = index % width;
        const phi = Math.floor(index / width);

        // Symmetry
        if (endTheta - startTheta !== 0 && (theta < startTheta || theta >= endTheta)) {
            theta %= endTheta * 2;
            if (theta > endTheta) {
                theta = endTheta * 2 - theta;
            }
        }

        arrayBuffer[phi + theta * height] = interpolateCandelaValues(data, phi, theta);
    }

    // So far we only need the first half of the first row of the texture as we only support IES for spot light. We can add support for other types later.
    return {
        width: width / 2,
        height: 1,
        data: arrayBuffer,
    };
}
