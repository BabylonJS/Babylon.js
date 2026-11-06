import * as React from "react";

import { Body1, Dropdown, Option, makeStyles, tokens } from "@fluentui/react-components";
import { Accordion, AccordionSection } from "shared-ui-components/fluent/primitives/accordion";
import { PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/propertyLine";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";
import { type IPropertyComponentProps } from "shared-ui-components/nodeGraphSystem/interfaces/propertyComponentProps";

import { type AbstractMesh } from "core/Meshes/abstractMesh";
import { type FlowGraphBlock } from "core/FlowGraph/flowGraphBlock";
import { type Observer } from "core/Misc/observable";

import { type GlobalState } from "../../globalState";
import { type SceneContext } from "../../sceneContext";
import { RenderConstructorVariablesSection, RenderGeneralSection, RenderGenericPropStoreSections } from "./genericNodePropertyComponent";

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

function GetMeshLabels(meshes: AbstractMesh[]): Map<AbstractMesh, string> {
    const nameCounts = new Map<string, number>();
    meshes.forEach((mesh) => nameCounts.set(mesh.name, (nameCounts.get(mesh.name) ?? 0) + 1));
    return new Map(
        meshes.map((mesh) => {
            const name = mesh.name || `(id ${mesh.uniqueId})`;
            return [mesh, mesh.name && (nameCounts.get(mesh.name) ?? 0) > 1 ? `${name} (id ${mesh.uniqueId})` : name];
        })
    );
}

export function GetTargetMeshPickerOptions(meshes: AbstractMesh[], selectedMeshes: AbstractMesh[]) {
    const labels = GetMeshLabels(meshes);
    const options = selectedMeshes.map((mesh, index) => {
        const liveMesh = meshes.find((candidate) => candidate === mesh);
        return {
            key: liveMesh ? `live:${mesh.uniqueId}` : `unresolved:${index}:${mesh.uniqueId}`,
            mesh,
            label: liveMesh ? labels.get(mesh)! : `${mesh.name || `(id ${mesh.uniqueId})`} (unavailable)`,
        };
    });
    for (const mesh of meshes) {
        if (!selectedMeshes.includes(mesh)) {
            options.push({ key: `live:${mesh.uniqueId}`, mesh, label: labels.get(mesh)! });
        }
    }
    return options;
}

export function GetSourceMeshPickerOptions(meshes: AbstractMesh[], selectedMesh: AbstractMesh | undefined) {
    const labels = GetMeshLabels(meshes);
    const options: Array<{ key: string; mesh?: AbstractMesh; label: string }> = [{ key: "none", label: "(none)" }];
    const liveMesh = meshes.find((candidate) => candidate === selectedMesh);
    if (selectedMesh && !liveMesh) {
        options.push({
            key: `unresolved:${selectedMesh.uniqueId}`,
            mesh: selectedMesh,
            label: `${selectedMesh.name || `(id ${selectedMesh.uniqueId})`} (unavailable)`,
        });
    }
    for (const mesh of meshes) {
        options.push({ key: `live:${mesh.uniqueId}`, mesh, label: labels.get(mesh)! });
    }
    return options;
}

const SourceMeshPicker: React.FunctionComponent<{
    meshes: AbstractMesh[];
    selectedMesh?: AbstractMesh;
    onChange: (mesh: AbstractMesh | undefined) => void;
}> = ({ meshes, selectedMesh, onChange }) => {
    const classes = useStyles();
    const options = GetSourceMeshPickerOptions(meshes, selectedMesh);
    const selectedKey = selectedMesh ? (meshes.includes(selectedMesh) ? `live:${selectedMesh.uniqueId}` : `unresolved:${selectedMesh.uniqueId}`) : "none";
    const selectedOption = options.find((option) => option.key === selectedKey);
    return (
        <PropertyLine label="Source mesh">
            <Dropdown
                aria-label="Source mesh"
                className={classes.dropdown}
                size="small"
                value={selectedOption?.label ?? "(none)"}
                selectedOptions={[selectedKey]}
                onOptionSelect={(_, data) => onChange(options.find((option) => option.key === data.optionValue)?.mesh)}
            >
                {options.map((option) => (
                    <Option key={option.key} value={option.key} text={option.label}>
                        {option.label}
                    </Option>
                ))}
            </Dropdown>
        </PropertyLine>
    );
};

const TargetMeshesPicker: React.FunctionComponent<{
    meshes: AbstractMesh[];
    selectedMeshes: AbstractMesh[];
    onChange: (meshes: AbstractMesh[]) => void;
}> = (props) => {
    const { meshes, selectedMeshes, onChange } = props;
    const classes = useStyles();
    const options = GetTargetMeshPickerOptions(meshes, selectedMeshes);
    const selectedOptions = options.slice(0, selectedMeshes.length).map((option) => option.key);
    const value = selectedMeshes.map((mesh) => mesh.name || `(id ${mesh.uniqueId})`).join(", ");

    // The shared dropdown wrapper does not expose Fluent's multiselect behavior.
    return (
        <PropertyLine label="Target meshes">
            <Dropdown
                aria-label="Target meshes"
                className={classes.dropdown}
                size="small"
                multiselect
                placeholder="Select target meshes"
                value={value}
                selectedOptions={selectedOptions}
                onOptionSelect={(_, data) => {
                    const selected = new Set(data.selectedOptions);
                    onChange(options.filter((option) => selected.has(option.key)).map((option) => option.mesh));
                }}
            >
                {options.map((option) => (
                    <Option key={option.key} value={option.key} text={option.label}>
                        {option.label}
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
    private _contextRefreshObserver: Observer<SceneContext> | null = null;

    public constructor(props: IPropertyComponentProps) {
        super(props);
        const globalState = props.stateManager.data as GlobalState;
        this.state = { sceneContext: globalState.sceneContext };
    }

    public override componentDidMount(): void {
        const globalState = this.props.stateManager.data as GlobalState;
        this._sceneContextObserver = globalState.onSceneContextChanged.add((sceneContext) => {
            this._contextRefreshObserver?.remove();
            this._contextRefreshObserver = sceneContext?.onContextRefreshed.add(() => this.forceUpdate()) ?? null;
            this.setState({ sceneContext });
        });
        this._contextRefreshObserver = globalState.sceneContext?.onContextRefreshed.add(() => this.forceUpdate()) ?? null;
    }

    public override componentWillUnmount(): void {
        this._sceneContextObserver?.remove();
        this._sceneContextObserver = null;
        this._contextRefreshObserver?.remove();
        this._contextRefreshObserver = null;
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
        const globalState = this.props.stateManager.data as GlobalState;
        globalState.setUnconnectedInputValue(input, value);
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

    private _getSavedMeshes(): { sourceMesh?: AbstractMesh; targetMeshes: AbstractMesh[] } {
        const sourceValue = this._getInputValue("sourceMesh") as AbstractMesh | undefined;
        const targetValue = this._getInputValue("targetMeshes");
        const targetValues = (Array.isArray(targetValue) ? targetValue : targetValue ? [targetValue] : []) as AbstractMesh[];
        return { sourceMesh: sourceValue, targetMeshes: targetValues };
    }

    public override render(): React.ReactNode {
        const { sceneContext } = this.state;
        const meshes = sceneContext?.meshes ?? [];
        const { sourceMesh, targetMeshes } = this._getSavedMeshes();

        return (
            <Accordion uniqueId="FlowGraphMeshIntersectionProperties" enablePinnedItems enableSearchItems>
                {RenderGeneralSection(this.props)}
                {RenderConstructorVariablesSection(this.props)}
                <AccordionSection title="Intersection Meshes" collapseByDefault={false}>
                    {sceneContext ? (
                        <>
                            <SourceMeshPicker meshes={meshes} selectedMesh={sourceMesh} onChange={(value) => this._setInputValue("sourceMesh", value)} />
                            <TargetMeshesPicker meshes={meshes} selectedMeshes={targetMeshes} onChange={(value) => this._setInputValue("targetMeshes", value)} />
                            <SwitchPropertyLine
                                label="Use precise intersection"
                                value={this._getInputValue("usePreciseIntersection") === true}
                                onChange={(value) => this._setInputValue("usePreciseIntersection", value)}
                            />
                        </>
                    ) : (
                        <NoSceneMessage />
                    )}
                </AccordionSection>
                {RenderGenericPropStoreSections(this.props)}
            </Accordion>
        );
    }
}
