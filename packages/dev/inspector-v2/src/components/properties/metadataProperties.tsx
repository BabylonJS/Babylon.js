import type { Nullable } from "core/types";
import type { FunctionComponent } from "react";

import { Observable } from "core/Misc/observable";
import { ButtonLine } from "shared-ui-components/fluent/hoc/buttonLine";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";
import { TextAreaPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/textAreaPropertyLine";
import { TextPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/textPropertyLine";
import { useObservableState } from "../../hooks/observableHooks";
import { BoundProperty } from "./boundProperty";

enum MetadataTypes {
    NULL = "null",
    STRING = "string",
    OBJECT = "Object",
    JSON = "JSON",
}

const PrettyJSONIndent = 2;

function IsParsable(input: any): boolean {
    try {
        const parsed = JSON.parse(input);
        return !!parsed && !IsString(parsed);
    } catch (error) {
        return false;
    }
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

    public readonly settingsChangedObservable = new Observable<MetadataUtils>();

    constructor(public readonly entity: IMetadataContainer) {}

    get editedMetadata(): string {
        if (this._editedMetadata === null || this._editedMetadata === undefined) {
            this._editedMetadata = this.parsedMetadata;
        }

        if (this._editedMetadata && this.prettyJSON && this.isParsable) {
            return JSON.stringify(JSON.parse(this._editedMetadata), undefined, PrettyJSONIndent);
        }

        return this._editedMetadata ?? "";
    }

    set editedMetadata(value: string) {
        if (this._editedMetadata !== value) {
            this._editedMetadata = value;
            console.log(`MetadataUtils.editedMetadata set to: ${value}`);
            this.settingsChangedObservable.notifyObservers(this);
        }
    }

    get entityType(): MetadataTypes {
        const metadata = this._editedMetadata;

        if (this.isParsable) {
            return MetadataTypes.JSON;
        }

        if (IsString(metadata)) {
            return MetadataTypes.STRING;
        }

        if (metadata === null) {
            return MetadataTypes.NULL;
        }

        if (!ObjectCanSafelyStringify(metadata)) {
            return MetadataTypes.OBJECT;
        }

        return MetadataTypes.NULL;
    }

    get isChanged(): boolean {
        const changed = this._editedMetadata !== this.parsedMetadata;
        return changed;
    }

    /**
     * @returns whether the entity's metadata can be parsed as JSON.
     */
    get isParsable(): boolean {
        return IsParsable(this._editedMetadata);
    }

    get isReadonly(): boolean {
        return this.entityType === MetadataTypes.OBJECT && MetadataUtils._PreventObjectCorruption;
    }

    get parsedMetadata(): Nullable<string> {
        const metadata = this.entity.metadata;

        if (IsString(metadata)) {
            return metadata;
        }

        if (this.isParsable) {
            return JSON.stringify(metadata, undefined, this.prettyJSON ? PrettyJSONIndent : undefined);
        }

        if (metadata) {
            return String(metadata);
        }

        return null;
    }

    get prettyJSON(): boolean {
        return MetadataUtils._PrettyJSON;
    }

    set prettyJSON(value: boolean) {
        if (MetadataUtils._PrettyJSON !== value) {
            MetadataUtils._PrettyJSON = value;
            this.settingsChangedObservable.notifyObservers(this);
        }
    }

    get preventObjectCorruption(): boolean {
        return MetadataUtils._PreventObjectCorruption;
    }

    set preventObjectCorruption(value: boolean) {
        if (MetadataUtils._PreventObjectCorruption !== value) {
            MetadataUtils._PreventObjectCorruption = value;
            this.settingsChangedObservable.notifyObservers(this);
        }
    }

    applyChanges() {
        if (this._editedMetadata) {
            if (this.isParsable) {
                const parsed = JSON.parse(this._editedMetadata);
                if (!IsString(parsed)) {
                    this._setMetadata(parsed);
                    return;
                }
            }

            if (this.entityType === MetadataTypes.STRING) {
                if (this._editedMetadata !== "") {
                    this._setMetadata(this._editedMetadata);
                    return;
                }
            }

            // Object type or unparseable JSON. Leave as string.
            this._setMetadata(this._editedMetadata);
            return;
        }

        this._setMetadata(null);
    }

    private _setMetadata(value: any) {
        if (this.entity.metadata !== value) {
            this.entity.metadata = value;

            this._editedMetadata = this.parsedMetadata;

            this.settingsChangedObservable.notifyObservers(this);
        }
    }

    private static _Instance: Nullable<MetadataUtils> = null;
    private static _PrettyJSON = false;
    private static _PreventObjectCorruption = true;

    public static get Instance(): MetadataUtils {
        if (!MetadataUtils._Instance) {
            throw new Error("MetadataUtils not initialized.");
        }
        return MetadataUtils._Instance;
    }

    public static set Entity(entity: IMetadataContainer) {
        if (!MetadataUtils._Instance || MetadataUtils._Instance.entity !== entity) {
            MetadataUtils._Instance = new MetadataUtils(entity);
        }
    }
}

/**
 * Component to display metadata properties of an entity.
 * @param props - The properties for the component.
 * @returns A React component that displays metadata properties.
 */
export const MetadataProperties: FunctionComponent<{ entity: IMetadataContainer }> = (props) => {
    const { entity } = props;

    MetadataUtils.Entity = entity;
    const metadataUtils = MetadataUtils.Instance;

    const observableMetadataUtils = {
        isChanged: useObservableState(() => metadataUtils.isChanged, metadataUtils.settingsChangedObservable),
        isReadonly: useObservableState(() => metadataUtils.isReadonly, metadataUtils.settingsChangedObservable),
        editedMetadata: useObservableState(() => metadataUtils.editedMetadata, metadataUtils.settingsChangedObservable),
        prettyJSON: useObservableState(() => metadataUtils.prettyJSON, metadataUtils.settingsChangedObservable),
        preventObjectCorruption: useObservableState(() => metadataUtils.preventObjectCorruption, metadataUtils.settingsChangedObservable),
    };

    return (
        <>
            <BoundProperty component={TextPropertyLine} label={"Property type"} target={metadataUtils} propertyKey="entityType" />
            <SwitchPropertyLine
                label={"Prevent Object corruption"}
                value={observableMetadataUtils.preventObjectCorruption}
                onChange={(value) => (metadataUtils.preventObjectCorruption = value)}
            />
            <SwitchPropertyLine label={"Pretty JSON"} value={observableMetadataUtils.prettyJSON} onChange={(value) => (metadataUtils.prettyJSON = value)} />
            <TextAreaPropertyLine
                label={"Data"}
                disabled={observableMetadataUtils.isReadonly}
                value={observableMetadataUtils.editedMetadata}
                onChange={(val) => (metadataUtils.editedMetadata = val)}
            />
            <ButtonLine
                label={`${metadataUtils.editedMetadata ? "Update metadata as " + metadataUtils.entityType : "Clear metadata"}`}
                disabled={!observableMetadataUtils.isChanged}
                onClick={() => metadataUtils.applyChanges()}
            />
        </>
    );
};
