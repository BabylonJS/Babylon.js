import * as React from "react";
import { Body1, Dropdown, Option, makeStyles, tokens } from "@fluentui/react-components";
import { Accordion, AccordionSection } from "shared-ui-components/fluent/primitives/accordion";
import { PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/propertyLine";
import { type IPropertyComponentProps } from "shared-ui-components/nodeGraphSystem/interfaces/propertyComponentProps";

import { type FlowGraphBlock } from "core/FlowGraph/flowGraphBlock";
import { type AbstractMesh } from "core/Meshes/abstractMesh";
import { type Observer } from "core/Misc/observable";

import { type GlobalState } from "../../globalState";
import { type SceneContext } from "../../sceneContext";
import { RenderGeneralSection, RenderConstructorVariablesSection, RenderDataConnectionsSection, RenderGenericPropStoreSections } from "./genericNodePropertyComponent";
import { GetSourceMeshPickerOptions } from "./meshIntersectionPropertyComponent";

interface IPointerEventPropertyState {
    sceneContext: SceneContext | null;
}

const useStyles = makeStyles({
    helpText: {
        padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalS}`,
        color: tokens.colorNeutralForeground3,
        fontStyle: "italic",
    },
    dropdown: {
        minWidth: 0,
        width: "100%",
    },
});

const TargetMeshContent: React.FunctionComponent<{
    sceneContext: SceneContext | null;
    currentMesh?: AbstractMesh;
    onMeshChange: (mesh: AbstractMesh | undefined) => void;
}> = ({ sceneContext, currentMesh, onMeshChange }) => {
    const classes = useStyles();
    const meshes = sceneContext?.meshes ?? [];
    const options = GetSourceMeshPickerOptions(meshes, currentMesh);
    const selectedKey = currentMesh ? (meshes.includes(currentMesh) ? `live:${currentMesh.uniqueId}` : `unresolved:${currentMesh.uniqueId}`) : "none";
    const selectedOption = options.find((option) => option.key === selectedKey);
    return sceneContext ? (
        <>
            <PropertyLine label="Mesh">
                <Dropdown
                    aria-label="Mesh"
                    className={classes.dropdown}
                    size="small"
                    value={selectedOption?.label ?? "(none)"}
                    selectedOptions={[selectedKey]}
                    onOptionSelect={(_, data) => onMeshChange(options.find((option) => option.key === data.optionValue)?.mesh)}
                >
                    {options.map((option) => (
                        <Option key={option.key} value={option.key} text={option.label}>
                            {option.label}
                        </Option>
                    ))}
                </Dropdown>
            </PropertyLine>
            {meshes.length === 0 && <Body1 className={classes.helpText}>No meshes found in the scene.</Body1>}
        </>
    ) : (
        <Body1 className={classes.helpText}>Load a scene snippet in the Preview panel to pick meshes by name.</Body1>
    );
};

/**
 * Property panel for pointer event blocks (PointerDown/Up/Move/Over/Out) and MeshPickEventBlock.
 * Adds a mesh picker for the `targetMesh` config field alongside the standard generic sections.
 */
export class PointerEventPropertyComponent extends React.Component<IPropertyComponentProps, IPointerEventPropertyState> {
    private _sceneContextObserver: Observer<SceneContext | null> | null = null;

    constructor(props: IPropertyComponentProps) {
        super(props);
        const globalState = props.stateManager.data as GlobalState;
        this.state = { sceneContext: globalState.sceneContext };
    }

    override componentDidMount() {
        const globalState = this.props.stateManager.data as GlobalState;
        this._sceneContextObserver = globalState.onSceneContextChanged.add((ctx) => {
            this.setState({ sceneContext: ctx });
        });
    }

    override componentWillUnmount() {
        const globalState = this.props.stateManager.data as GlobalState;
        if (this._sceneContextObserver) {
            globalState.onSceneContextChanged.remove(this._sceneContextObserver);
            this._sceneContextObserver = null;
        }
    }

    private _getBlock(): FlowGraphBlock {
        return this.props.nodeData.data as FlowGraphBlock;
    }

    private _getTargetMeshInput() {
        const block = this._getBlock();
        return block.getDataInput("targetMesh") ?? block.getDataInput("asset");
    }

    private _onMeshChange(mesh: AbstractMesh | undefined) {
        const block = this._getBlock();
        const meshInput = this._getTargetMeshInput();
        if (!meshInput) {
            return;
        }
        if (!block.config) {
            (block as any).config = {};
        }
        (block.config as any).targetMesh = mesh;
        (block.config as any)._meshName = mesh?.name;
        const globalState = this.props.stateManager.data as GlobalState;
        globalState.setUnconnectedInputValue(meshInput, mesh);
        this.props.stateManager.onUpdateRequiredObservable.notifyObservers(block);
        this.forceUpdate();
    }

    override render() {
        const { sceneContext } = this.state;
        const meshInput = this._getTargetMeshInput();
        const currentMesh = meshInput ? ((meshInput as any)._defaultValue as AbstractMesh | undefined) : undefined;

        return (
            <Accordion uniqueId="FlowGraphPointerEventProperties" enablePinnedItems enableSearchItems>
                {RenderGeneralSection(this.props)}
                {RenderConstructorVariablesSection(this.props)}

                <AccordionSection title="Target Mesh" collapseByDefault={false}>
                    <TargetMeshContent sceneContext={sceneContext} currentMesh={currentMesh} onMeshChange={(mesh) => this._onMeshChange(mesh)} />
                </AccordionSection>

                {RenderDataConnectionsSection(this.props)}
                {RenderGenericPropStoreSections(this.props)}
            </Accordion>
        );
    }
}
