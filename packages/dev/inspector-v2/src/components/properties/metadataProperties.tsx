import type { FunctionComponent } from "react";

import { Body1, Button, makeStyles, tokens, Tooltip } from "@fluentui/react-components";
import { ArrowUndoRegular, BracesDismiss16Regular, BracesRegular, SaveRegular } from "@fluentui/react-icons";
import { useContext, useMemo, useState } from "react";

import { ButtonLine } from "shared-ui-components/fluent/hoc/buttonLine";
import { ToolContext } from "shared-ui-components/fluent/hoc/fluentToolWrapper";
import { LineContainer } from "shared-ui-components/fluent/hoc/propertyLines/propertyLine";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";
import { TextPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/textPropertyLine";
import { Collapse } from "shared-ui-components/fluent/primitives/collapse";
import { Textarea } from "shared-ui-components/fluent/primitives/textarea";
import { useProperty } from "../../hooks/compoundPropertyHooks";

type MetadataTypes = "null" | "string" | "object" | "JSON";

const PrettyJSONIndent = 2;

function IsParsable(metadata: unknown): metadata is string {
    try {
        const parsed = JSON.parse(metadata as string);
        return !!parsed && !IsString(parsed);
    } catch {
        return false;
    }
}

/**
 * Checks if the input is a string.
 * @param input - any input to check
 * @returns boolean - true if the input is a string, false otherwise
 */
function IsString(input: unknown): input is string {
    return typeof input === "string" || input instanceof String;
}

/**
 * Checks recursively for functions on an object and returns `false` if any are found.
 * @param o any object, string or number
 * @returns boolean
 */
function ObjectCanSafelyStringify(o: unknown): boolean {
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
        return Object.values(o as Record<string, unknown>).every((value) => ObjectCanSafelyStringify(value));
    }

    if (Array.isArray(o)) {
        return o.every((value) => ObjectCanSafelyStringify(value));
    }

    return false;
}

function GetMetadataEntityType(metadata: unknown): MetadataTypes {
    if (metadata == null) {
        return "null";
    } else if (IsString(metadata)) {
        return "string";
    } else if (!ObjectCanSafelyStringify(metadata)) {
        return "object";
    } else {
        return "JSON";
    }
}

function HasGltfExtras(metadata: string) {
    return IsParsable(metadata) && !!JSON.parse(metadata).gltf;
}

function StringifyMetadata(metadata: unknown, format: boolean) {
    if (IsString(metadata)) {
        return metadata;
    }

    if (metadata) {
        if (ObjectCanSafelyStringify(metadata)) {
            return JSON.stringify(metadata, undefined, format ? PrettyJSONIndent : undefined);
        } else {
            return String(metadata);
        }
    }

    return null;
}

function Restringify(value: string, format: boolean) {
    return IsParsable(value) ? JSON.stringify(JSON.parse(value), undefined, format ? PrettyJSONIndent : undefined) : value;
}

function PopulateGLTFExtras(metadata: string) {
    if (!metadata) {
        metadata = "{}";
    }

    if (!IsParsable(metadata)) {
        return metadata;
    }

    try {
        const parsedJson = JSON.parse(metadata);
        if (parsedJson) {
            if (Reflect.has(parsedJson, "gltf")) {
                if (!Reflect.has(parsedJson.gltf, "extras")) {
                    parsedJson.gltf.extras = {};
                }
            } else {
                parsedJson.gltf = { extras: {} };
            }
        }

        return JSON.stringify(parsedJson);
    } catch {
        return metadata;
    }
}

function SaveMetadata(entity: IMetadataContainer, metadata: string) {
    if (IsParsable(metadata)) {
        entity.metadata = JSON.parse(metadata);
    } else {
        entity.metadata = metadata;
    }
}

export interface IMetadataContainer {
    metadata: unknown;
}

const useStyles = makeStyles({
    mainDiv: {
        display: "flex",
        flexDirection: "column",
        gap: tokens.spacingVerticalXS,
    },
    buttonDiv: {
        display: "grid",
        gridAutoFlow: "column",
        gridTemplateColumns: "1fr auto auto auto",
        gap: tokens.spacingHorizontalXS,
    },
});

/**
 * Component to display metadata properties of an entity.
 * @param props - The properties for the component.
 * @returns A React component that displays metadata properties.
 */
export const MetadataProperties: FunctionComponent<{ entity: IMetadataContainer }> = (props) => {
    const { entity } = props;

    const classes = useStyles();

    const { size } = useContext(ToolContext);

    const metadata = useProperty(entity, "metadata");
    const stringifiedMetadata = useMemo(() => StringifyMetadata(metadata, false) ?? "", [metadata]);
    const metadataType = useMemo(() => GetMetadataEntityType(metadata), [metadata]);
    const canPreventObjectCorruption = metadataType === "object";

    const [preventObjectCorruption, setPreventObjectCorruption] = useState(false);
    const isReadonly = canPreventObjectCorruption && preventObjectCorruption;

    const [editedMetadata, setEditedMetadata] = useState(stringifiedMetadata);
    const isEditedMetadataJSON = useMemo(() => IsParsable(editedMetadata), [editedMetadata]);
    const unformattedEditedMetadata = useMemo(() => Restringify(editedMetadata, false), [editedMetadata]);

    return (
        <>
            <TextPropertyLine label="Property Type" value={metadataType} />
            <Collapse visible={canPreventObjectCorruption}>
                <SwitchPropertyLine label="Prevent Object Corruption" value={isReadonly} onChange={setPreventObjectCorruption} />
            </Collapse>
            <LineContainer uniqueId="MetadataTextarea">
                <Textarea disabled={isReadonly} value={editedMetadata} onChange={setEditedMetadata} />
            </LineContainer>
            <ButtonLine
                label="Populate glTF extras"
                disabled={!!editedMetadata && (!IsParsable(editedMetadata) || HasGltfExtras(editedMetadata))}
                onClick={() => {
                    const isFormatted = Restringify(editedMetadata, true) === editedMetadata;
                    let withGLTFExtras = PopulateGLTFExtras(editedMetadata);
                    if (isFormatted) {
                        withGLTFExtras = Restringify(withGLTFExtras, true);
                    }
                    setEditedMetadata(withGLTFExtras);
                }}
            />
            <LineContainer uniqueId="MetadataButtonDiv">
                <div className={classes.buttonDiv}>
                    {/* TODO: gehalper - need to update our Button primitive to accommodate these scenarios. */}
                    <Button size={size} icon={<SaveRegular />} disabled={stringifiedMetadata === unformattedEditedMetadata} onClick={() => SaveMetadata(entity, editedMetadata)}>
                        <Body1>Save</Body1>
                    </Button>
                    <Tooltip content="Undo Changes" relationship="label">
                        <Button
                            size={size}
                            icon={<ArrowUndoRegular />}
                            disabled={stringifiedMetadata === unformattedEditedMetadata}
                            onClick={() => setEditedMetadata(stringifiedMetadata)}
                        />
                    </Tooltip>
                    <Tooltip content="Format (Pretty Print)" relationship="label">
                        <Button size={size} icon={<BracesRegular />} disabled={!isEditedMetadataJSON} onClick={() => setEditedMetadata(Restringify(editedMetadata, true))}></Button>
                    </Tooltip>
                    <Tooltip content="Clear Formatting (Undo Pretty Print)" relationship="label">
                        <Button
                            size={size}
                            icon={<BracesDismiss16Regular />}
                            disabled={!isEditedMetadataJSON}
                            onClick={() => setEditedMetadata(Restringify(editedMetadata, false))}
                        />
                    </Tooltip>
                </div>
            </LineContainer>
        </>
    );
};
