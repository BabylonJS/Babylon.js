import * as React from "react";

import { Body1, Dropdown, Option, makeStyles, tokens } from "@fluentui/react-components";
import { Accordion, AccordionSection } from "shared-ui-components/fluent/primitives/accordion";
import { NumberDropdownPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/dropdownPropertyLine";
import { PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/propertyLine";
import { type DropdownOption } from "shared-ui-components/fluent/primitives/dropdown";
import { type IPropertyComponentProps } from "shared-ui-components/nodeGraphSystem/interfaces/propertyComponentProps";

import { type AbstractMesh } from "core/Meshes/abstractMesh";
import { type FlowGraphBlock } from "core/FlowGraph/flowGraphBlock";
import { type Observer } from "core/Misc/observable";

import { type GlobalState } from "../../globalState";
import { type SceneContext } from "../../sceneContext";
import { RenderConstructorVariablesSection, RenderDataConnectionsSection, RenderGeneralSection, RenderGenericPropStoreSections } from "./genericNodePropertyComponent";

interface IMeshIntersectionPropertyState {
    sceneContext: SceneContext | null;
}

const useStyles = makeStyles({
    help: {
        color: tokens.colorNeutralForeground3,
        padding: tokens.spacingVerticalXS,
    },
    dropdown: {
        minWidth: 0,
        width: "100%",
    },
});

const TargetMeshesPicker: React.FunctionComponent<{
    meshes: AbstractMesh[];
    selectedMeshes: AbstractMesh[];
    onChange: (meshes: AbstractMesh[]) => void;
}> = (props) => {
    const { meshes, selectedMeshes, onChange } = props;
    const classes = useStyles();
    const selectedOptions = selectedMeshes.map((mesh) => String(mesh.uniqueId));
    const value = selectedMeshes.map((mesh) => mesh.name || `(id ${mesh.uniqueId})`).join(", ");

    // The shared dropdown wrapper does not expose Fluent's multiselect behavior.
    return (
        <PropertyLine label="Target meshes">
            <Dropdown
                className={classes.dropdown}
                size="small"
                multiselect
                placeholder="Select target meshes"
                value={value}
                selectedOptions={selectedOptions}
                onOptionSelect={(_, data) => {
                    const selected = new Set(data.selectedOptions);
                    onChange(meshes.filter((mesh) => selected.has(String(mesh.uniqueId))));
                }}
            >
                {meshes.map((mesh) => (
                    <Option key={mesh.uniqueId} value={String(mesh.uniqueId)} text={mesh.name || `(id ${mesh.uniqueId})`}>
                        {mesh.name || `(id ${mesh.uniqueId})`}
                    </Option>
                ))}
            </Dropdown>
        </PropertyLine>
    );
};

const NoSceneMessage: React.FunctionComponent = () => {
    const classes = useStyles();
    return <Body1 className={classes.help}>Load a scene in the Preview panel to select meshes.</Body1>;
};

/**
 * Property panel for mesh intersection event inputs.
 */
export class MeshIntersectionPropertyComponent extends React.Component<IPropertyComponentProps, IMeshIntersectionPropertyState> {
    private _sceneContextObserver: Observer<SceneContext | null> | null = null;

    public constructor(props: IPropertyComponentProps) {
        super(props);
        const globalState = props.stateManager.data as GlobalState;
        this.state = { sceneContext: globalState.sceneContext };
    }

    public override componentDidMount(): void {
        const globalState = this.props.stateManager.data as GlobalState;
        this._sceneContextObserver = globalState.onSceneContextChanged.add((sceneContext) => this.setState({ sceneContext }));
    }

    public override componentWillUnmount(): void {
        this._sceneContextObserver?.remove();
        this._sceneContextObserver = null;
    }

    private _getBlock(): FlowGraphBlock {
        return this.props.nodeData.data as FlowGraphBlock;
    }

    private _getInputValue(name: string): any {
        return (this._getBlock().getDataInput(name) as any)?._defaultValue;
    }

    private _setInputValue(name: string, value: any): void {
        const block = this._getBlock();
        const input = block.getDataInput(name);
        if (!input) {
            return;
        }
        (input as any)._defaultValue = value;
        if (!block.config) {
            (block as any).config = {};
        }
        if (name === "sourceMesh") {
            (block.config as any)._sourceMeshName = value?.name;
        } else if (name === "targetMeshes") {
            (block.config as any)._targetMeshNames = (value as AbstractMesh[]).map((mesh) => mesh.name);
        }
        this.props.stateManager.onUpdateRequiredObservable.notifyObservers(block);
        this.forceUpdate();
    }

    private _resolveMeshes(meshes: AbstractMesh[]): { sourceMesh?: AbstractMesh; targetMeshes: AbstractMesh[] } {
        const block = this._getBlock();
        const sourceValue = this._getInputValue("sourceMesh") as AbstractMesh | undefined;
        const targetValue = this._getInputValue("targetMeshes");
        const targetValues = (Array.isArray(targetValue) ? targetValue : targetValue ? [targetValue] : []) as AbstractMesh[];
        const sourceName = (block.config as any)?._sourceMeshName ?? sourceValue?.name;
        const targetNames: string[] = (block.config as any)?._targetMeshNames ?? targetValues.map((mesh) => mesh.name);
        const sourceMesh = sourceValue && meshes.some((mesh) => mesh.uniqueId === sourceValue.uniqueId) ? sourceValue : meshes.find((mesh) => mesh.name === sourceName);
        const targetsAreCurrent = targetValues.every((target) => meshes.some((mesh) => mesh.uniqueId === target.uniqueId));
        const targetMeshes = targetsAreCurrent ? targetValues : targetNames.map((name) => meshes.find((mesh) => mesh.name === name)).filter((mesh): mesh is AbstractMesh => !!mesh);

        const sourceInput = block.getDataInput("sourceMesh");
        const targetInput = block.getDataInput("targetMeshes");
        if (sourceInput && sourceMesh !== sourceValue) {
            (sourceInput as any)._defaultValue = sourceMesh;
        }
        if (targetInput && !targetsAreCurrent) {
            (targetInput as any)._defaultValue = targetMeshes;
        }
        return { sourceMesh, targetMeshes };
    }

    public override render(): React.ReactNode {
        const { sceneContext } = this.state;
        const meshes = sceneContext?.meshes ?? [];
        const { sourceMesh, targetMeshes } = this._resolveMeshes(meshes);
        const sourceOptions: DropdownOption<number>[] = [
            { label: "(none)", value: -1 },
            ...meshes.map((mesh) => ({ label: mesh.name || `(id ${mesh.uniqueId})`, value: mesh.uniqueId })),
        ];

        return (
            <Accordion uniqueId="FlowGraphMeshIntersectionProperties" enablePinnedItems enableSearchItems>
                {RenderGeneralSection(this.props)}
                {RenderConstructorVariablesSection(this.props)}
                <AccordionSection title="Intersection Meshes" collapseByDefault={false}>
                    {sceneContext ? (
                        <>
                            <NumberDropdownPropertyLine
                                label="Source mesh"
                                options={sourceOptions}
                                value={sourceMesh?.uniqueId ?? -1}
                                onChange={(uniqueId: number) =>
                                    this._setInputValue(
                                        "sourceMesh",
                                        meshes.find((mesh) => mesh.uniqueId === uniqueId)
                                    )
                                }
                            />
                            <TargetMeshesPicker meshes={meshes} selectedMeshes={targetMeshes} onChange={(value) => this._setInputValue("targetMeshes", value)} />
                        </>
                    ) : (
                        <NoSceneMessage />
                    )}
                </AccordionSection>
                {RenderDataConnectionsSection(this.props)}
                {RenderGenericPropStoreSections(this.props)}
            </Accordion>
        );
    }
}
