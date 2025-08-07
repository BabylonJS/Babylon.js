import type { FunctionComponent } from "react";

import type { Nullable } from "core/types";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";
import { TextAreaPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/textAreaPropertyLine";
import { TextPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/textPropertyLine";
import { BoundProperty } from "./boundProperty";

enum MetadataTypes {
    NULL = "null",
    STRING = "string",
    OBJECT = "Object",
    JSON = "JSON",
}

/**
 * Checks if the input is a string.
 * @param input - any input to check
 * @returns boolean - true if the input is a string, false otherwise
 */
function IsString(input: any): boolean {
    return typeof input === "string" || input instanceof String;
}

/**
 * Parses a string and returns a JSON object if the string is valid JSON, otherwise returns null
 * @param string - any string
 * @returns JSON object or null if the string is not valid JSON
 */
// function ParseString(string: string): JSON | null {
//     try {
//         return JSON.parse(string);
//         // eslint-disable-next-line @typescript-eslint/no-unused-vars
//     } catch (error) {
//         return null;
//     }
// }

/**
 * Checks recursively for functions on an object and returns `false` if any are found.
 * @param o any object, string or number
 * @returns boolean
 */
function ObjectCanSafelyStringify(o: object | string | number | boolean): boolean {
    if (typeof o === "function") {
        return false;
    }
    if (o === null || o === true || o === false || typeof o === "number" || IsString(o)) {
        return true;
    }

    if (typeof o === "object") {
        if (Object.values(o).length === 0) {
            return true;
        }
        return Object.values(o as Record<string, any>).every((value) => ObjectCanSafelyStringify(value));
    }

    if (Array.isArray(o)) {
        return o.every((value) => ObjectCanSafelyStringify(value));
    }

    return false;
}

export interface IMetadataContainer {
    metadata: any;
}

class MetadataUtils {
    private _editedMetadata: Nullable<string> = null;

    static PrettyJSON = false;

    static PreventObjectCorruption = true;

    constructor(public readonly entity: IMetadataContainer) {}

    get editedMetadata(): string {
        if (!this._editedMetadata) {
            this._editedMetadata = this.parsedMetadata;
        }
        return this._editedMetadata;
    }

    set editedMetadata(value: string) {
        this._editedMetadata = value;
    }

    get entityType(): MetadataTypes {
        const metadata = this.entity.metadata;

        if (IsString(metadata)) {
            return MetadataTypes.STRING;
        }
        if (metadata === null) {
            return MetadataTypes.NULL;
        }
        if (!ObjectCanSafelyStringify(metadata)) {
            return MetadataTypes.OBJECT;
        }

        return MetadataTypes.JSON;
    }

    /**
     * @returns whether the entity's metadata can be parsed as JSON.
     */
    get isParsable(): boolean {
        if (!this.entity.metadata) {
            return false;
        }

        try {
            return !!JSON.parse(JSON.stringify(this.entity.metadata));
        } catch (error) {
            return false;
        }
    }

    get isReadonly(): boolean {
        return this.entityType === MetadataTypes.OBJECT && MetadataUtils.PreventObjectCorruption;
    }

    get parsedMetadata(): string {
        const metadata = this.entity.metadata;

        if (this.isParsable) {
            return JSON.stringify(metadata, undefined, MetadataUtils.PrettyJSON ? 2 : undefined);
        }

        if (IsString(metadata)) {
            return metadata;
        }

        return String(metadata);
    }
}

/**
 * Component to display metadata properties of an entity.
 * @param props - The properties for the component.
 * @returns A React component that displays metadata properties.
 */
export const MetadataProperties: FunctionComponent<{ entity: IMetadataContainer }> = (props) => {
    const { entity } = props;

    const metadataUtils = new MetadataUtils(entity);

    return (
        <>
            <BoundProperty component={TextPropertyLine} label={"Property type"} target={metadataUtils} propertyKey="entityType" />
            <BoundProperty component={SwitchPropertyLine} label={"Prevent Object corruption"} target={MetadataUtils} propertyKey="PreventObjectCorruption" />
            <BoundProperty component={SwitchPropertyLine} label={"Pretty JSON"} target={MetadataUtils} propertyKey="PrettyJSON" />
            <BoundProperty disabled={metadataUtils.isReadonly} component={TextAreaPropertyLine} label={"Data"} target={metadataUtils} propertyKey="editedMetadata" />
            {/* TODO: Update component when settings change. Toggling PrettyJSON and PreventObjectCorruption should update the text area, but they don't right now. */}
            {/* TODO: Add buttons. See metadataPropertyGridComponent.tsx for v1 implementation. */}
        </>
    );
};
