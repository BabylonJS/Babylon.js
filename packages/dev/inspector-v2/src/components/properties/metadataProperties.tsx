import type { Nullable } from "core/types";
import type { FunctionComponent } from "react";

import { Observable } from "core/Misc/observable";
import { ButtonLine } from "shared-ui-components/fluent/hoc/buttonLine";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";
import { TextPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/textPropertyLine";
import { Textarea } from "shared-ui-components/fluent/primitives/textarea";
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
            this.settingsChangedObservable.notifyObservers(this);
        }
    }

    get entityType(): MetadataTypes {
        if (Object.prototype.hasOwnProperty.call(this.entity, "metadata")) {
            const meta = this.entity.metadata;
            if (IsString(meta)) {
                return MetadataTypes.STRING;
            }
            if (meta === null) {
                return MetadataTypes.NULL;
            }
            if (!ObjectCanSafelyStringify(meta)) {
                return MetadataTypes.OBJECT;
            }
            return MetadataTypes.JSON;
        }

        return MetadataTypes.NULL;
    }

    get hasGLTFExtras(): boolean {
        return this._editedMetadata && this.isParsable && JSON.parse(this._editedMetadata).gltf;
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

        if (metadata) {
            if (ObjectCanSafelyStringify(metadata)) {
                return JSON.stringify(metadata, undefined, this.prettyJSON ? PrettyJSONIndent : undefined);
            } else {
                return String(metadata);
            }
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

    /** Safely checks if valid JSON then appends necessary props without overwriting existing */
    populateGLTFExtras() {
        if (this._editedMetadata && !this.isParsable) {
            return;
        }

        try {
            let changed = false;

            if (!this._editedMetadata) {
                this._editedMetadata = "{}";
            }

            const parsedJson = JSON.parse(this._editedMetadata);
            if (parsedJson) {
                if (Object.prototype.hasOwnProperty.call(parsedJson, "gltf")) {
                    if (!Object.prototype.hasOwnProperty.call(parsedJson.gltf, "extras")) {
                        parsedJson.gltf.extras = {};
                        changed = true;
                    }
                } else {
                    parsedJson.gltf = { extras: {} };
                    changed = true;
                }
            }

            if (changed) {
                this._editedMetadata = JSON.stringify(parsedJson, undefined, this.prettyJSON ? PrettyJSONIndent : undefined);
                this.settingsChangedObservable.notifyObservers(this);
            }
        } catch (error) {}
    }

    save() {
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

    const isChanged = useObservableState(() => metadataUtils.isChanged, metadataUtils.settingsChangedObservable);
    const isReadonly = useObservableState(() => metadataUtils.isReadonly, metadataUtils.settingsChangedObservable);
    const editedMetadata = useObservableState(() => metadataUtils.editedMetadata, metadataUtils.settingsChangedObservable);

    return (
        <>
            <BoundProperty component={TextPropertyLine} label={"Property type"} target={metadataUtils} propertyKey={"entityType"} />
            <BoundProperty component={SwitchPropertyLine} label={"Prevent Object corruption"} target={metadataUtils} propertyKey={"preventObjectCorruption"} />
            <BoundProperty component={SwitchPropertyLine} label={"Pretty JSON"} target={metadataUtils} propertyKey={"prettyJSON"} />
            <Textarea disabled={isReadonly} value={editedMetadata} onChange={(val) => (metadataUtils.editedMetadata = val)} />
            <ButtonLine label={"Populate glTF extras"} disabled={metadataUtils.hasGLTFExtras} onClick={() => metadataUtils.populateGLTFExtras()} />
            <ButtonLine label={"Save"} disabled={!isChanged} onClick={() => metadataUtils.save()} />
        </>
    );
};
