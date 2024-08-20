/* eslint-disable @typescript-eslint/naming-convention */
import { Logger } from "core/Misc/logger";
import type { DataCursor } from "./exrLoader.core";
import { ParseNullTerminatedString, ParseUint32, ParseValue } from "./exrLoader.core";
import type { IEXRHeader } from "./exrLoader.interfaces";

const EXR_MAGIC = 20000630;

/**
 * Gets the EXR header
 * @param dataView defines the data view to read from
 * @param offset defines the offset to start reading from
 * @returns the header
 */
export function GetExrHeader(dataView: DataView, offset: DataCursor): IEXRHeader {
    if (dataView.getUint32(0, true) != EXR_MAGIC) {
        throw new Error("Incorrect OpenEXR format");
    }

    const version = dataView.getUint8(4);

    const specData = dataView.getUint8(5); // fullMask
    const spec = {
        singleTile: !!(specData & 2),
        longName: !!(specData & 4),
        deepFormat: !!(specData & 8),
        multiPart: !!(specData & 16),
    };

    offset.value = 8;

    const headerData: any = {};

    let keepReading = true;

    while (keepReading) {
        const attributeName = ParseNullTerminatedString(dataView.buffer, offset);

        if (!attributeName) {
            keepReading = false;
        } else {
            const attributeType = ParseNullTerminatedString(dataView.buffer, offset);
            const attributeSize = ParseUint32(dataView, offset);
            const attributeValue = ParseValue(dataView, offset, attributeType, attributeSize);

            if (attributeValue === undefined) {
                Logger.Warn(`Unknown header attribute type ${attributeType}'.`);
            } else {
                headerData[attributeName] = attributeValue;
            }
        }
    }

    if ((specData & ~0x04) != 0) {
        throw new Error("Unsupported file format");
    }

    return { version: version, spec: spec, ...headerData };
}
