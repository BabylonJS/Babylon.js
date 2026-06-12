/* eslint-disable @typescript-eslint/naming-convention */
import * as React from "react";
import { type IPropertyComponentProps } from "shared-ui-components/nodeGraphSystem/interfaces/propertyComponentProps";
import { Accordion, AccordionSection } from "shared-ui-components/fluent/primitives/accordion";
import { PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/propertyLine";
import { TextInputPropertyLine, NumberInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";
import { StringDropdownPropertyLine, NumberDropdownPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/dropdownPropertyLine";
import { Color3PropertyLine, Color4PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/colorPropertyLine";
import { Vector2PropertyLine, Vector3PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/vectorPropertyLine";
import { type DropdownOption } from "shared-ui-components/fluent/primitives/dropdown";
import { Body1, makeStyles, tokens } from "@fluentui/react-components";

import { RenderGeneralSection, MatrixEditor } from "./genericNodePropertyComponent";
import { type FlowGraphConstantBlock } from "core/FlowGraph/Blocks/Data/flowGraphConstantBlock";
import { getRichTypeFromValue, RichTypeAny } from "core/FlowGraph/flowGraphRichTypes";
import { FlowGraphInteger } from "core/FlowGraph/CustomTypes/flowGraphInteger";
import { Vector2, Vector3, Vector4, Quaternion, Matrix } from "core/Maths/math.vector";
import { Color3, Color4 } from "core/Maths/math.color";
import { type GlobalState } from "../../globalState";
import { type SceneContext, SceneContextCategory } from "../../sceneContext";
import { type Observer } from "core/Misc/observable";

const ValueTypeOptions: DropdownOption<string>[] = [
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

const useStyles = makeStyles({
    helpText: {
        padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalS}`,
        color: tokens.colorNeutralForeground3,
        fontStyle: "italic",
    },
});

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
        const block = this._getBlock();

        if (typeof value === "boolean") {
            return <SwitchPropertyLine label="Value" value={block.config.value === true} onChange={(v) => this._updateValue(v)} />;
        }

        if (value instanceof FlowGraphInteger) {
            return <NumberInputPropertyLine label="Value" value={value.value} step={1} onChange={(v) => this._updateValue(new FlowGraphInteger(Math.trunc(v)))} />;
        }

        if (typeof value === "number") {
            return <NumberInputPropertyLine label="Value" value={value} onChange={(v) => this._updateValue(v)} />;
        }

        if (typeof value === "string") {
            return <TextInputPropertyLine label="Value" value={value} onChange={(v) => this._updateValue(v)} />;
        }

        if (value instanceof Vector2) {
            return <Vector2PropertyLine label="Value" value={value} onChange={(v) => this._updateValue(v.clone())} />;
        }

        // Color3 before Vector3 subclasses since Color3/4 have dedicated editors
        if (value instanceof Color4) {
            return <Color4PropertyLine label="Value" value={value} onChange={(v) => this._updateValue(v.clone())} />;
        }

        if (value instanceof Color3) {
            return <Color3PropertyLine label="Value" value={value} onChange={(v) => this._updateValue(v.clone())} />;
        }

        if (value instanceof Vector3 && !(value instanceof Vector4) && !(value instanceof Quaternion)) {
            return <Vector3PropertyLine label="Value" value={value} onChange={(v) => this._updateValue(v.clone())} />;
        }

        if (value instanceof Matrix) {
            return (
                <PropertyLine label="Value">
                    <MatrixEditor value={value} onChange={(v) => this._updateValue(v)} />
                </PropertyLine>
            );
        }

        // Fallback: show the type name for uneditable types (Vector4, Quaternion)
        return <HelpText>Cannot edit {DetectValueType(value, block.config)} inline.</HelpText>;
    }

    private _renderSceneObjectPicker(typeName: string): JSX.Element {
        const block = this._getBlock();
        const { sceneContext } = this.state;
        const category = SceneObjectCategoryMap[typeName];

        if (!sceneContext || !category) {
            return <HelpText>Load a scene in the Preview panel to pick {typeName.toLowerCase()}s.</HelpText>;
        }

        const entries = sceneContext.getByCategory(category);
        const currentValue = block.config.value;
        const currentId = currentValue != null && typeof currentValue === "object" && "uniqueId" in currentValue ? (currentValue as any).uniqueId : -1;

        return (
            <>
                <NumberDropdownPropertyLine
                    key={`asset-${block.uniqueId}-${sceneContext.scene?.uid ?? "no-scene"}`}
                    label={typeName}
                    options={[{ label: "(none)", value: -1 }, ...entries.map((e) => ({ label: e.name || `(id ${e.uniqueId})`, value: e.uniqueId }))] as DropdownOption<number>[]}
                    value={currentId}
                    onChange={(uid) => {
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
                {entries.length === 0 && <HelpText>No {typeName.toLowerCase()}s found in the scene.</HelpText>}
            </>
        );
    }

    override render() {
        const block = this._getBlock();
        const value = block.config.value;
        const currentType = DetectValueType(value, block.config);
        const isSceneObject = SceneObjectTypes.has(currentType);

        return (
            <Accordion uniqueId="FlowGraphConstantProperties" enablePinnedItems enableSearchItems>
                {RenderGeneralSection(this.props)}

                <AccordionSection title="Constant Value" collapseByDefault={false}>
                    <StringDropdownPropertyLine key={`type-${block.uniqueId}`} label="Type" options={ValueTypeOptions} value={currentType} onChange={(v) => this._changeType(v)} />
                    {isSceneObject ? this._renderSceneObjectPicker(currentType) : this._renderValueEditor(value)}
                </AccordionSection>
            </Accordion>
        );
    }
}

const HelpText: React.FunctionComponent<{ children: React.ReactNode }> = ({ children }) => {
    const classes = useStyles();
    return <Body1 className={classes.helpText}>{children}</Body1>;
};
