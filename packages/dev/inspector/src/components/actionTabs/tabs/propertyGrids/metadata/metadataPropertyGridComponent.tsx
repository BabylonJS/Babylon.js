import * as React from "react";
import type { GlobalState } from "inspector/components/globalState";
import { LineContainerComponent } from "shared-ui-components/lines/lineContainerComponent";
import { CheckBoxLineComponent } from "shared-ui-components/lines/checkBoxLineComponent";
import { ButtonLineComponent } from "shared-ui-components/lines/buttonLineComponent";
import { TextInputLineComponent } from "shared-ui-components/lines/textInputLineComponent";
import { TextLineComponent } from "shared-ui-components/lines/textLineComponent";
import copyIcon from "shared-ui-components/lines/copy.svg";

import "./metadataPropertyGrid.scss";
import { Logger } from "core/Misc/logger";

interface IMetadataComponentProps {
    globalState: GlobalState;
    entity: any;
}

enum MetadataTypes {
    UNDEFINED = "undefined",
    NULL = "null",
    STRING = "string",
    OBJECT = "Object",
    JSON = "JSON",
}

/** Metadata Grid Component */
export class MetadataGridComponent extends React.Component<
    IMetadataComponentProps,
    {
        selectedEntityMetadata: string;
        dirty: boolean;
        prettyJson: boolean;
        preventObjCorruption: boolean;
        metadataPropType: MetadataTypes;
        statusMessage: string | null;
        isValidJson: boolean;
    }
> {
    private readonly _textAreaHost: React.RefObject<HTMLDivElement>;
    /**
     * @param props - component props
     */
    constructor(props: IMetadataComponentProps) {
        super(props);
        this.state = {
            selectedEntityMetadata: "",
            dirty: false,
            prettyJson: false,
            preventObjCorruption: true,
            metadataPropType: MetadataTypes.UNDEFINED,
            statusMessage: "ready to pick",
            isValidJson: false,
        };
        this._textAreaHost = React.createRef();
        this.refreshSelected = this.refreshSelected.bind(this);
        this.populateGltfExtras = this.populateGltfExtras.bind(this);
    }

    /** @ignorenaming */
    componentDidMount() {
        if (this.props.globalState) {
            this.refreshSelected();
        }
    }

    /**
     * @param prevProps - previous component props
     */
    componentDidUpdate(prevProps: Readonly<IMetadataComponentProps>): void {
        if (this.props.entity) {
            if (!prevProps.entity || prevProps.entity.id !== this.props.entity.id) {
                this.refreshSelected();
            }
        }
    }

    /** on entity refresh */
    refreshSelected() {
        if (this.props.entity) {
            const validJson = this.parsableJson(this.props.entity.metadata);
            const metadataPropType = this.getEntityType(this.props.entity);
            this.setState({
                statusMessage: "", // loaded entity
                selectedEntityMetadata: this.parseMetaObject(validJson, this.props.entity.metadata),
                metadataPropType: metadataPropType,
                isValidJson: validJson,
            });
            this.setTextAreaDisabled(this.state.preventObjCorruption && metadataPropType === MetadataTypes.OBJECT);
        } else {
            this.setState({
                statusMessage: "could not find entity, please pick again",
                selectedEntityMetadata: "",
                metadataPropType: MetadataTypes.UNDEFINED,
                isValidJson: false,
            });
            this.setTextAreaDisabled(true);
        }
    }

    /**
     * @param disabled - is disabled
     */
    setTextAreaDisabled(disabled: boolean) {
        try {
            if (this._textAreaHost.current) {
                const textAreaElement = this._textAreaHost.current?.firstChild?.firstChild as HTMLTextAreaElement;
                textAreaElement.disabled = disabled;
            }
        } catch (error) {
            Logger.Error(error);
        }
    }

    /**
     * @returns class name
     */
    getClassName(): string {
        switch (this.state.metadataPropType) {
            case MetadataTypes.STRING:
                return "meta-string";
            case MetadataTypes.JSON:
                return "meta-json";
            case MetadataTypes.OBJECT:
                return this.state.preventObjCorruption ? "meta-object-protect" : "meta-object";
            default:
                return "";
        }
    }

    /**
     * Determines the Metadata type
     * @param entity Picked entity
     * @returns MetadataTypes
     */
    getEntityType(entity: any): MetadataTypes {
        if (Object.prototype.hasOwnProperty.call(entity, "metadata")) {
            const meta = entity.metadata;
            if (this.isString(meta)) return MetadataTypes.STRING;
            if (meta === null) return MetadataTypes.NULL;
            if (!this.objectCanSafelyStringify(meta)) return MetadataTypes.OBJECT;
            return MetadataTypes.JSON;
        }
        return MetadataTypes.UNDEFINED;
    }

    /**
     * @param input - any input
     * @returns is string
     */
    isString(input: any): boolean {
        return typeof input === "string" || input instanceof String;
    }

    /**
     * @param object - any object
     * @returns is parsable
     */
    parsableJson(object: Object): boolean {
        if (!object) return false;
        try {
            return !!JSON.parse(JSON.stringify(object));
        } catch (error) {
            return false;
        }
    }

    /**
     * @param string - any string
     * @returns parsable string
     */
    parsableString(string: string): JSON | null {
        try {
            this.setState({ statusMessage: null });
            return JSON.parse(string);
        } catch (error) {
            this.setState({ statusMessage: "invalid JSON: " + error.message });
            return null;
        }
    }

    /**
     * @param validJson - a valid json
     * @param metadata - any metadata
     * @returns parsed metadata
     */
    parseMetaObject(validJson: boolean, metadata: any) {
        if (validJson) return JSON.stringify(metadata, undefined, this.state.prettyJson ? 2 : undefined);
        if (this.isString(metadata)) return metadata;
        return String(metadata);
    }

    /**
     * Recurse through an object to check for any Functions, returns False if found at least one
     * @param o Any Object, String or number
     * @returns Boolean
     */
    objectCanSafelyStringify(o: Object | string | number): boolean {
        if (typeof o === "function") return false;
        if (o === null || o === true || o === false || typeof o === "number" || this.isString(o)) return true;

        if (typeof o === "object") {
            if (Object.values(o).length === 0) return true;
            return Object.values(o as Record<string, any>).every((value) => this.objectCanSafelyStringify(value));
        }

        if (Array.isArray(o)) {
            return o.every((value) => this.objectCanSafelyStringify(value));
        }

        return false;
    }

    /* TODO: Convert testObjectCanSafelyStringify() to Jest unit tests
    testObjectCanSafelyStringify() {
        const scene = this.props.entity._scene;
        console.log("/// test Truthy and Falsey ///");
        console.log("expect true", this.objectCanSafelyStringify(true));
        console.log("expect true", this.objectCanSafelyStringify(false));
        console.log("expect true", this.objectCanSafelyStringify(null as any));
        console.log("expect false", this.objectCanSafelyStringify(undefined as any));

        console.log("/// test Strings");
        console.log("expect true", this.objectCanSafelyStringify(""));
        console.log("expect true", this.objectCanSafelyStringify("hi"));
        console.log("expect true", this.objectCanSafelyStringify(String("hello")));

        console.log("/// test Number");
        console.log("expect true", this.objectCanSafelyStringify(2));
        console.log("expect true", this.objectCanSafelyStringify(2.456));
        console.log("expect true", this.objectCanSafelyStringify(Number(9)));

        console.log("/// test Array");
        console.log("expect true", this.objectCanSafelyStringify(String([])));
        console.log("expect true", this.objectCanSafelyStringify(String(["aaa"])));

        console.log("/// test Objects");
        console.log("expect true", this.objectCanSafelyStringify({}));
        console.log("expect true", this.objectCanSafelyStringify({ foo: "bar" }));
        console.log("expect false", this.objectCanSafelyStringify({ foo: "bar", funky: () => "this is funky!" }));
        console.log("expect true", this.objectCanSafelyStringify({ a: "babylon", b: [{ c: ["js", { d: "rules", e: 7 }] }] }));

        console.log("/// test Function");
        console.log(
            "expect false",
            this.objectCanSafelyStringify(() => {})
        );

        console.log("/// test Mesh");
        const mesh = new Mesh("a test mesh", scene);
        console.log("expect false", this.objectCanSafelyStringify(mesh));
        mesh.dispose();
        console.log("/// end tests ///");
    }
    */

    copyToClipboard() {
        try {
            const textAreaElement = this._textAreaHost.current?.firstChild?.firstChild as HTMLTextAreaElement;
            textAreaElement.select();
            textAreaElement.setSelectionRange(0, 99999); // For mobile devices
            navigator.clipboard.writeText(textAreaElement.value);
        } catch (error) {
            window.alert("Could not copy to clipboard, see log.");
            Logger.Error(error);
        }
    }

    /** Safely checks if valid JSON then appends necessary props without overwriting existing */
    populateGltfExtras() {
        if (this.state.isValidJson) {
            try {
                const parsedJson = this.parsableString(this.state.selectedEntityMetadata) as any;
                if (parsedJson) {
                    if (Object.prototype.hasOwnProperty.call(parsedJson, "gltf")) {
                        if (Object.prototype.hasOwnProperty.call(parsedJson.gltf, "extras")) {
                            this.setState({
                                statusMessage: "metadata.gltf.extras property already exists",
                            });
                        } else {
                            parsedJson.gltf.extras = {};
                            this.setState({
                                dirty: true,
                                prettyJson: false,
                                selectedEntityMetadata: this.parseMetaObject(this.state.isValidJson, parsedJson),
                                statusMessage: "metadata.gltf.extras property inserted, don't forget to Update!",
                            });
                        }
                    } else {
                        parsedJson.gltf = {
                            extras: {},
                        };
                        this.setState({
                            dirty: true,
                            prettyJson: false,
                            selectedEntityMetadata: this.parseMetaObject(this.state.isValidJson, parsedJson),
                            statusMessage: "metadata.gltf property inserted, don't forget to Update!",
                        });
                    }
                }
            } catch (error) {
                this.setState({
                    statusMessage: error.message,
                });
            }
        }
    }

    /** render
     * @returns the component
     */
    render() {
        const protectObj = this.state.preventObjCorruption && this.state.metadataPropType === MetadataTypes.OBJECT;
        return (
            <LineContainerComponent title="METADATA" closed={true} selection={this.props.globalState}>
                <TextLineComponent label="Property type" value={this.state.metadataPropType} />
                <CheckBoxLineComponent
                    label="Prevent Object corruption"
                    disabled={false}
                    isSelected={() => this.state.preventObjCorruption}
                    onSelect={(value) => {
                        this.setState({ preventObjCorruption: value });
                        this.setTextAreaDisabled(value && this.state.metadataPropType === MetadataTypes.OBJECT);
                    }}
                />
                <CheckBoxLineComponent
                    label="Pretty JSON"
                    disabled={false}
                    isSelected={() => this.state.prettyJson}
                    onSelect={(value) => {
                        this.setState({ prettyJson: value });
                        // Update textArea
                        if (this.props.entity && this.state.metadataPropType !== MetadataTypes.NULL && this.state.metadataPropType !== MetadataTypes.UNDEFINED) {
                            const parsable = this.parsableString(this.state.selectedEntityMetadata);
                            if (parsable && !this.isString(parsable)) {
                                this.setState({
                                    dirty: true,
                                    selectedEntityMetadata: JSON.stringify(parsable, undefined, value ? 2 : undefined),
                                });
                            }
                        }
                    }}
                />
                <div ref={this._textAreaHost} id="metadata-container" className={this.getClassName()}>
                    <TextInputLineComponent
                        multilines
                        value={this.state.selectedEntityMetadata}
                        onChange={(value) => {
                            if (value === this.state.selectedEntityMetadata) return;
                            this.setState({
                                dirty: true,
                                prettyJson: false,
                                selectedEntityMetadata: value,
                            });
                            if (value === "" || value === "undefined") {
                                this.setState({
                                    isValidJson: false,
                                    metadataPropType: MetadataTypes.UNDEFINED,
                                });
                                return;
                            }
                            if (value === "null") {
                                this.setState({
                                    isValidJson: false,
                                    metadataPropType: MetadataTypes.NULL,
                                });
                                return;
                            }
                            const parsedJson = !!this.parsableString(value);
                            this.setState({
                                isValidJson: parsedJson,
                                metadataPropType: parsedJson ? MetadataTypes.JSON : MetadataTypes.STRING,
                            });
                        }}
                    />
                </div>
                <div className="copy-root">
                    <div className="copy-container" onClick={() => this.copyToClipboard()} title="Copy to clipboard">
                        <img src={copyIcon} alt="Copy" />
                    </div>
                </div>
                <ButtonLineComponent label="Populate glTF extras" onClick={this.populateGltfExtras} isDisabled={!this.state.isValidJson || protectObj} />
                <ButtonLineComponent
                    label={`Update metadata${this.props.entity ? " as " + this.state.metadataPropType : ""}`}
                    onClick={() => {
                        if (this.props.entity) {
                            if (this.state.metadataPropType === MetadataTypes.NULL) {
                                this.props.entity.metadata = null;
                                this.setState({ statusMessage: "metadata set to null", dirty: false });
                                return;
                            }
                            if (this.state.metadataPropType === MetadataTypes.UNDEFINED) {
                                delete this.props.entity.metadata;
                                this.setState({ statusMessage: "metadata set to undefined", dirty: false });
                                return;
                            }
                            const parsedJson = this.parsableString(this.state.selectedEntityMetadata);
                            this.props.entity.metadata = parsedJson || this.state.selectedEntityMetadata;
                            this.setState({ statusMessage: "metadata updated", dirty: false });
                        }
                    }}
                    isDisabled={!this.state.dirty || protectObj}
                />
                <div className="type-status">{this.state.statusMessage}</div>
            </LineContainerComponent>
        );
    }
}
