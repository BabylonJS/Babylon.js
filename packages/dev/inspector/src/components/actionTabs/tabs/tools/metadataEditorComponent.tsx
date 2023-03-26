import * as React from "react";
import { useState } from "react";
import type { GlobalState } from "inspector/components/globalState";
import { Inspector } from "inspector/inspector";
import type { Scene } from "core/scene";
import type { Nullable, Observable, Observer } from "@dev/core";
import { ButtonLineComponent } from "shared-ui-components/lines/buttonLineComponent";
import { TextInputLineComponent } from "shared-ui-components/lines/textInputLineComponent";
import { CheckBoxLineComponent } from "shared-ui-components/lines/checkBoxLineComponent";

import "./metadataEditor.scss";

let currentEntity: any;
const initialWindowSize = { width: 512, height: 512 };
interface IMetadataEditorComponentProps {
    scene: Scene;
    globalState: GlobalState;
}
export const MetadataEditorComponent: React.FC<IMetadataEditorComponentProps> = (props: IMetadataEditorComponentProps) => {
    const selectionUpdated = (entity: any) => {
        currentEntity = entity;
    };

    const observableSelection: Observable<any> = props.globalState.onSelectionChangedObservable;
    const observerMetaPopup: Nullable<Observer<any>> = observableSelection.add(selectionUpdated, -1, false, null, false);

    const startMetadataEditorPopup = (): void => {
        Inspector._CreatePersistentPopup(
            {
                props: {
                    id: "metadata-editor",
                    title: "Metadata Editor",
                    onClose: () => observableSelection.remove(observerMetaPopup),
                    size: initialWindowSize,
                },
                children: <MetadataEditorPopupComponent />,
            },
            document.body
        );
    };
    return <ButtonLineComponent label="Open Metadata Editor" onClick={() => startMetadataEditorPopup()} />;
};

enum MetaDataTypes {
    UNDEFINED = "undefined",
    NULL = "null",
    STRING = "string",
    JSON = "JSON",
}
const MetadataEditorPopupComponent: React.FC = () => {
    const [currentEntityUniqueId, setCurrentEntityUniqueId] = useState<string | null>(null);
    const [currentEntityId, setCurrentEntityId] = useState("");
    const [currentEntityName, setCurrentEntityName] = useState("");
    const [currentEntityMetadata, setCurrentEntityMetadata] = useState<string>("");
    const [metadataPropType, setMetadataPropType] = useState<string>(MetaDataTypes.UNDEFINED);
    const [isValidJson, setIsValidJson] = useState(false);
    const [prettyJson, setPrettyJson] = useState(true);
    const [statusMessage, setStatusMessage] = useState<string | null>("ready to pick");

    const stringifyEntityType = () => {
        if (Object.prototype.hasOwnProperty.call(currentEntity, "metadata")) {
            const meta = currentEntity.metadata;
            if (isString(meta)) return MetaDataTypes.STRING;
            return meta === null ? MetaDataTypes.NULL : MetaDataTypes.JSON;
        }
        return MetaDataTypes.UNDEFINED;
    };

    const isString = (input: any): boolean => {
        return typeof input === "string" || input instanceof String;
    };
    const parsableJson = (object: Object): boolean => {
        if (!object) return false;
        try {
            return !!JSON.parse(JSON.stringify(object));
        } catch (error) {
            return false;
        }
    };

    const parsableString = (string: string): JSON | null => {
        try {
            setStatusMessage(null);
            return JSON.parse(string);
        } catch (error) {
            setStatusMessage("invalid JSON: " + error.message);
            return null;
        }
    };

    const parseMetaObject = (validJson: boolean, metadata: any) => {
        if (validJson) return JSON.stringify(metadata, undefined, prettyJson ? 2 : undefined);
        if (isString(metadata)) return metadata;
        return String(metadata);
    };

    const refreshSelected = () => {
        if (currentEntity) {
            setStatusMessage("loaded entity");
            const validJson = parsableJson(currentEntity.metadata);
            setCurrentEntityUniqueId(currentEntity.uniqueId);
            setCurrentEntityId(currentEntity.id);
            setCurrentEntityName(currentEntity.name);
            setCurrentEntityMetadata(parseMetaObject(validJson, currentEntity.metadata));
            setMetadataPropType(stringifyEntityType());
            setIsValidJson(validJson);
        } else {
            setStatusMessage("could not find entity, please pick again");
            setCurrentEntityUniqueId(null);
            setCurrentEntityId("");
            setCurrentEntityName("");
            setCurrentEntityMetadata("");
            setMetadataPropType(MetaDataTypes.UNDEFINED);
            setIsValidJson(false);
        }
    };

    const populateGltfExtras = () => {
        if (isValidJson) {
            try {
                const parsedJson = parsableString(currentEntityMetadata) as any;
                if (parsedJson) {
                    if (Object.prototype.hasOwnProperty.call(parsedJson, "gltf")) {
                        setStatusMessage("metadata.gltf property already exists");
                    } else {
                        parsedJson["gltf"] = {
                            extras: {},
                        };
                        setCurrentEntityMetadata(parseMetaObject(isValidJson, parsedJson));
                    }
                }
            } catch (error) {
                setStatusMessage(error.message);
            }
        }
    };

    const getClassName = (): string => {
        switch (metadataPropType) {
            case MetaDataTypes.STRING:
                return "meta-string";
            case MetaDataTypes.JSON:
                return "meta-json";
            default:
                return "";
        }
    };

    return (
        <div id="metadata-editor" className={getClassName()}>
            <div className="pane">
                <div>
                    <span>Unique ID: {currentEntityUniqueId}</span>
                </div>
                <div>
                    <span>ID: {currentEntityId}</span>
                </div>
                <div>
                    <span>Name: {currentEntityName}</span>
                </div>
                <div id="main-controls">
                    <CheckBoxLineComponent
                        label="Pretty JSON"
                        isSelected={() => prettyJson}
                        disabled={!isValidJson}
                        onSelect={(value) => {
                            setPrettyJson(value);
                            /* Update textArea */
                            if (currentEntityUniqueId && metadataPropType !== MetaDataTypes.NULL && metadataPropType !== MetaDataTypes.UNDEFINED) {
                                const parsable = parsableString(currentEntityMetadata);
                                if (parsable && !isString(parsable)) {
                                    setCurrentEntityMetadata(JSON.stringify(parsable, undefined, value ? 2 : undefined));
                                }
                            }
                        }}
                    />
                    <ButtonLineComponent label="Refresh from Picked Node" onClick={refreshSelected} />
                    <ButtonLineComponent label="Populate glTF extras" onClick={populateGltfExtras} isDisabled={!isValidJson} />
                </div>
            </div>
            <TextInputLineComponent
                multilines
                label="entity.metadata:"
                value={currentEntityMetadata}
                onChange={(value) => {
                    setPrettyJson(false);
                    if (value === "" || value === "undefined") {
                        setCurrentEntityMetadata("");
                        setIsValidJson(false);
                        setMetadataPropType(MetaDataTypes.UNDEFINED);
                        return;
                    }
                    if (value === "null") {
                        setCurrentEntityMetadata("");
                        setIsValidJson(false);
                        setMetadataPropType(MetaDataTypes.NULL);
                        return;
                    }
                    setCurrentEntityMetadata(value);
                    const parsedJson = !!parsableString(value);
                    setIsValidJson(parsedJson);
                    setMetadataPropType(parsedJson ? MetaDataTypes.JSON : MetaDataTypes.STRING);
                }}
            />
            <div className="type-label">{metadataPropType}</div>
            <div className="type-status">{statusMessage}</div>
            <div id="footer">
                <ButtonLineComponent
                    label={`Update metadata${currentEntityUniqueId ? " as " + metadataPropType : ""}`}
                    onClick={() => {
                        if (currentEntity) {
                            if (metadataPropType === MetaDataTypes.NULL) {
                                currentEntity.metadata = null;
                                setStatusMessage("metadata set to null");
                                return;
                            }
                            if (metadataPropType === MetaDataTypes.UNDEFINED) {
                                delete currentEntity.metadata;
                                setStatusMessage("metadata set to undefined");
                                return;
                            }
                            const parsedJson = parsableString(currentEntityMetadata);
                            currentEntity.metadata = parsedJson || currentEntityMetadata;
                            setStatusMessage("metadata updated");
                        }
                    }}
                    isDisabled={!currentEntityUniqueId}
                />
            </div>
        </div>
    );
};
