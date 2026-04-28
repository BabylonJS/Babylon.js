/* eslint-disable @typescript-eslint/naming-convention */
import * as React from "react";
import { LineContainerComponent } from "../../sharedComponents/lineContainerComponent";
import { type IPropertyComponentProps } from "shared-ui-components/nodeGraphSystem/interfaces/propertyComponentProps";
import { OptionsLine } from "shared-ui-components/lines/optionsLineComponent";
import { FloatLineComponent } from "shared-ui-components/lines/floatLineComponent";
import { CheckBoxLineComponent } from "../../sharedComponents/checkBoxLineComponent";
import { TextInputLineComponent } from "shared-ui-components/lines/textInputLineComponent";
import { Vector2LineComponent } from "shared-ui-components/lines/vector2LineComponent";
import { Vector3LineComponent } from "shared-ui-components/lines/vector3LineComponent";
import { Color3LineComponent } from "shared-ui-components/lines/color3LineComponent";
import { Color4LineComponent } from "shared-ui-components/lines/color4LineComponent";
import { MatrixLineComponent } from "shared-ui-components/lines/matrixLineComponent";
import { GeneralPropertyTabComponent } from "./genericNodePropertyComponent";
import { type FlowGraphConstantBlock } from "core/FlowGraph/Blocks/Data/flowGraphConstantBlock";
import { getRichTypeFromValue, RichTypeAny } from "core/FlowGraph/flowGraphRichTypes";
import { FlowGraphInteger } from "core/FlowGraph/CustomTypes/flowGraphInteger";
import { Vector2, Vector3, Vector4, Quaternion, Matrix } from "core/Maths/math.vector";
import { Color3, Color4 } from "core/Maths/math.color";
import { type GlobalState } from "../../globalState";
import { type SceneContext, SceneContextCategory } from "../../sceneContext";
import { type Observer } from "core/Misc/observable";

const ValueTypeOptions = [
    { label: "Number", value: "number" },
    { label: "Integer", value: "FlowGraphInteger" },
    { label: "Boolean", value: "boolean" },
    { label: "String", value: "string" },
    { label: "Vector2", value: "Vector2" },
    { label: "Vector3", value: "Vector3" },
    { label: "Vector4", value: "Vector4" },
    { label: "Quaternion", value: "Quaternion" },
    { label: "Color3", value: "Color3" },
    { label: "Color4", value: "Color4" },
    { label: "Matrix", value: "Matrix" },
    { label: "Mesh", value: "Mesh" },
    { label: "Light", value: "Light" },
    { label: "Camera", value: "Camera" },
    { label: "Material", value: "Material" },
    { label: "Animation Group", value: "AnimationGroup" },
    { label: "Animation", value: "Animation" },
];

/** Scene object type names that require a scene picker instead of an inline editor. */
const SceneObjectTypes = new Set(["Mesh", "Light", "Camera", "Material", "AnimationGroup", "Animation"]);

/** Maps a scene object type name to the SceneContextCategory used to query the SceneContext. */
const SceneObjectCategoryMap: Record<string, SceneContextCategory> = {
    Mesh: SceneContextCategory.Mesh,
    Light: SceneContextCategory.Light,
    Camera: SceneContextCategory.Camera,
    Material: SceneContextCategory.Material,
    AnimationGroup: SceneContextCategory.AnimationGroup,
    Animation: SceneContextCategory.Animation,
};

function DetectValueType(value: any, config?: any): string {
    // If the config has a stored type hint (for scene objects or null values), use it.
    if (config?._valueTypeName && SceneObjectTypes.has(config._valueTypeName)) {
        return config._valueTypeName;
    }
    if (value instanceof FlowGraphInteger) {
        return "FlowGraphInteger";
    }
    if (typeof value === "number") {
        return "number";
    }
    if (typeof value === "boolean") {
        return "boolean";
    }
    if (typeof value === "string") {
        return "string";
    }
    if (value instanceof Color4) {
        return "Color4";
    } // check before Color3 since Color4 extends Color3
    if (value instanceof Color3) {
        return "Color3";
    }
    if (value instanceof Quaternion) {
        return "Quaternion";
    } // check before Vector4
    if (value instanceof Vector4) {
        return "Vector4";
    }
    if (value instanceof Vector3) {
        return "Vector3";
    }
    if (value instanceof Vector2) {
        return "Vector2";
    }
    if (value instanceof Matrix) {
        return "Matrix";
    }
    // Scene objects: check for uniqueId + name (common to all Babylon.js Node/Asset types)
    if (value != null && typeof value === "object" && typeof value.getClassName === "function" && "uniqueId" in value) {
        const className: string = value.getClassName();
        if (className === "AnimationGroup") {
            return "AnimationGroup";
        }
        if (className === "Animation") {
            return "Animation";
        }
        // Mesh subtypes: Mesh, InstancedMesh, GroundMesh, etc.
        if ("geometry" in value || className.includes("Mesh")) {
            return "Mesh";
        }
        if (className.includes("Light")) {
            return "Light";
        }
        if (className.includes("Camera")) {
            return "Camera";
        }
        if (className.includes("Material")) {
            return "Material";
        }
    }
    // Fall back to stored type hint if available
    if (config?._valueTypeName) {
        return config._valueTypeName;
    }
    return "number";
}

function CreateDefaultValue(typeName: string): any {
    switch (typeName) {
        case "number":
            return 0;
        case "FlowGraphInteger":
            return new FlowGraphInteger(0);
        case "boolean":
            return false;
        case "string":
            return "";
        case "Vector2":
            return Vector2.Zero();
        case "Vector3":
            return Vector3.Zero();
        case "Vector4":
            return Vector4.Zero();
        case "Quaternion":
            return Quaternion.Identity();
        case "Color3":
            return Color3.Black();
        case "Color4":
            return new Color4(0, 0, 0, 1);
        case "Matrix":
            return Matrix.Identity();
        case "Mesh":
        case "Light":
        case "Camera":
        case "Material":
        case "AnimationGroup":
        case "Animation":
            return null;
        default:
            return 0;
    }
}

/**
 * Property panel for FlowGraphConstantBlock.
 * Shows a type selector and a value editor that adapts to the current type.
 */
export class ConstantBlockPropertyComponent extends React.Component<IPropertyComponentProps, { sceneContext: SceneContext | null }> {
    private _sceneContextObserver: Observer<SceneContext | null> | null = null;
    private _contextRefreshObserver: Observer<SceneContext> | null = null;

    constructor(props: IPropertyComponentProps) {
        super(props);
        const globalState = props.stateManager.data as GlobalState;
        this.state = { sceneContext: globalState.sceneContext };
    }

    override componentDidMount() {
        const globalState = this.props.stateManager.data as GlobalState;
        this._sceneContextObserver = globalState.onSceneContextChanged.add((ctx) => {
            this._contextRefreshObserver?.remove();
            this._contextRefreshObserver = ctx?.onContextRefreshed.add(() => this.forceUpdate()) ?? null;
            this.setState({ sceneContext: ctx });
        });
        if (globalState.sceneContext) {
            this._contextRefreshObserver = globalState.sceneContext.onContextRefreshed.add(() => this.forceUpdate());
        }
    }

    override componentWillUnmount() {
        const globalState = this.props.stateManager.data as GlobalState;
        if (this._sceneContextObserver) {
            globalState.onSceneContextChanged.remove(this._sceneContextObserver);
            this._sceneContextObserver = null;
        }
        this._contextRefreshObserver?.remove();
        this._contextRefreshObserver = null;
    }

    private _getBlock(): FlowGraphConstantBlock<any> {
        return this.props.nodeData.data as FlowGraphConstantBlock<any>;
    }

    private _updateValue(newValue: any) {
        const block = this._getBlock();
        block.config.value = newValue;
        this.props.stateManager.onUpdateRequiredObservable.notifyObservers(block);
        this.forceUpdate();
    }

    private _changeType(newTypeName: string) {
        const block = this._getBlock();
        const newValue = CreateDefaultValue(newTypeName);
        block.config.value = newValue;

        // Store the type hint so we can detect the type even when value is null.
        (block.config as any)._valueTypeName = newTypeName;

        // Update the output port's rich type so downstream connections see the new type.
        const output = block.getDataOutput("output");
        if (output) {
            const richType = newValue != null ? getRichTypeFromValue(newValue) : RichTypeAny;
            (output as any).richType = richType;
        }

        this.props.stateManager.onRebuildRequiredObservable.notifyObservers();
        this.props.stateManager.onUpdateRequiredObservable.notifyObservers(block);
        this.forceUpdate();
    }

    private _renderValueEditor(value: any): JSX.Element | null {
        const lock = this.props.stateManager.lockObject;
        const block = this._getBlock();
        const notify = () => this.props.stateManager.onUpdateRequiredObservable.notifyObservers(block);

        if (typeof value === "boolean") {
            return <CheckBoxLineComponent label="Value" isSelected={() => block.config.value === true} onSelect={(v) => this._updateValue(v)} />;
        }

        if (value instanceof FlowGraphInteger) {
            const proxy = { v: value.value };
            return (
                <FloatLineComponent
                    label="Value"
                    lockObject={lock}
                    digits={0}
                    step={"1"}
                    isInteger={true}
                    target={proxy}
                    propertyName="v"
                    onChange={(v) => this._updateValue(new FlowGraphInteger(v))}
                />
            );
        }

        if (typeof value === "number") {
            const proxy = { v: value };
            return <FloatLineComponent label="Value" lockObject={lock} target={proxy} propertyName="v" onChange={(v) => this._updateValue(v)} />;
        }

        if (typeof value === "string") {
            const proxy = { v: value };
            return (
                <TextInputLineComponent
                    label="Value"
                    lockObject={lock}
                    target={proxy}
                    propertyName="v"
                    throttlePropertyChangedNotification={true}
                    onChange={(v) => this._updateValue(v)}
                />
            );
        }

        if (value instanceof Vector2) {
            return <Vector2LineComponent label="Value" lockObject={lock} target={block.config} propertyName="value" onChange={notify} />;
        }

        if (value instanceof Vector3 && !(value instanceof Vector4) && !(value instanceof Quaternion)) {
            return <Vector3LineComponent label="Value" lockObject={lock} target={block.config} propertyName="value" onChange={notify} />;
        }

        // Color3 before Vector3 subclasses since Color3/4 have dedicated editors
        if (value instanceof Color4) {
            return <Color4LineComponent label="Value" lockObject={lock} target={block.config} propertyName="value" onChange={notify} />;
        }

        if (value instanceof Color3) {
            return <Color3LineComponent label="Value" lockObject={lock} target={block.config} propertyName="value" onChange={notify} />;
        }

        if (value instanceof Matrix) {
            return <MatrixLineComponent label="Value" lockObject={lock} target={block.config} propertyName="value" onChange={notify} />;
        }

        // Fallback: show the type name for uneditable types (Vector4, Quaternion)
        return <div style={{ padding: "4px 8px", color: "#aaa", fontSize: "11px" }}>Cannot edit {DetectValueType(value, block.config)} inline.</div>;
    }

    private _renderSceneObjectPicker(typeName: string): JSX.Element {
        const block = this._getBlock();
        const { sceneContext } = this.state;
        const category = SceneObjectCategoryMap[typeName];

        if (!sceneContext || !category) {
            return <div style={{ padding: "4px 8px", color: "#888", fontSize: "11px" }}>Load a scene in the Preview panel to pick {typeName.toLowerCase()}s.</div>;
        }

        const entries = sceneContext.getByCategory(category);
        const currentValue = block.config.value;
        const currentId = currentValue != null && typeof currentValue === "object" && "uniqueId" in currentValue ? (currentValue as any).uniqueId : -1;

        return (
            <>
                <OptionsLine
                    key={`asset-${block.uniqueId}-${sceneContext.scene?.uid ?? "no-scene"}`}
                    label={typeName}
                    options={[{ label: "(none)", value: -1 }, ...entries.map((e) => ({ label: e.name || `(id ${e.uniqueId})`, value: e.uniqueId }))]}
                    target={{}}
                    propertyName="_unused"
                    noDirectUpdate={true}
                    extractValue={() => currentId}
                    onSelect={(value) => {
                        const uid = value as number;
                        if (uid === -1) {
                            this._updateValue(null);
                        } else {
                            const entry = entries.find((e) => e.uniqueId === uid);
                            if (entry) {
                                this._updateValue(entry.object);
                            }
                        }
                    }}
                />
                {entries.length === 0 && <div style={{ padding: "4px 8px", color: "#aaa", fontSize: "11px" }}>No {typeName.toLowerCase()}s found in the scene.</div>}
            </>
        );
    }

    override render() {
        const { stateManager, nodeData } = this.props;
        const block = this._getBlock();
        const value = block.config.value;
        const currentType = DetectValueType(value, block.config);
        const isSceneObject = SceneObjectTypes.has(currentType);

        return (
            <>
                <GeneralPropertyTabComponent stateManager={stateManager} nodeData={nodeData} />

                <LineContainerComponent title="CONSTANT VALUE">
                    <OptionsLine
                        key={`type-${block.uniqueId}`}
                        label="Type"
                        options={ValueTypeOptions}
                        target={{}}
                        propertyName="_unused"
                        valuesAreStrings={true}
                        noDirectUpdate={true}
                        extractValue={() => currentType}
                        onSelect={(v) => this._changeType(v as string)}
                    />
                    {isSceneObject ? this._renderSceneObjectPicker(currentType) : this._renderValueEditor(value)}
                </LineContainerComponent>
            </>
        );
    }
}
