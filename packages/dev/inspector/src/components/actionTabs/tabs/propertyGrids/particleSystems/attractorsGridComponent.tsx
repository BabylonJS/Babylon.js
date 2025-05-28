import * as React from "react";
import type { GlobalState } from "../../../../globalState";
import type { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";
import { LinkButtonComponent } from "shared-ui-components/lines/linkButtonComponent";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import type { ParticleSystem } from "core/Particles/particleSystem";
import { Attractor } from "core/Particles/attractor";
import { AttractorGridComponent } from "./attractorGridComponent";
import { SliderLineComponent } from "shared-ui-components/lines/sliderLineComponent";
import { Color3LineComponent } from "shared-ui-components/lines/color3LineComponent";
import { LineContainerComponent } from "shared-ui-components/lines/lineContainerComponent";
import { Color3, Color4 } from "core/Maths/math.color";
import { StandardMaterial } from "core/Materials/standardMaterial";
import { CreateSphere } from "core/Meshes/Builders/sphereBuilder";
import type { Nullable } from "core/types";
import { GizmoManager } from "core/Gizmos/gizmoManager";
import type { Observer } from "core/Misc/observable";
import type { Scene } from "core/scene";
import { FontAsset } from "addons/msdfText/fontAsset";
import { TextRenderer } from "addons/msdfText/textRenderer";
import { Matrix } from "core/Maths/math.vector";

interface IAttractorsGridComponent {
    globalState: GlobalState;
    lockObject: LockObject;
    docLink?: string;
    host: ParticleSystem;
}

export class AttractorsGridComponent extends React.Component<IAttractorsGridComponent, { impostorScale: number; color: Color3 }> {
    private _impostorMaterial: Nullable<StandardMaterial> = null;
    private _gizmoManager: Nullable<GizmoManager> = null;
    private _sceneOnAfterRenderObserver: Nullable<Observer<Scene>> = null;
    private _fontAsset: Nullable<FontAsset> = null;

    constructor(props: IAttractorsGridComponent) {
        super(props);

        this.state = { impostorScale: 1, color: new Color3(1, 1, 1) };
    }

    addNewAttractor() {
        const particleSystem = this.props.host;
        const newAttractor = new Attractor();
        particleSystem.addAttractor(newAttractor);

        this.forceUpdate();
    }

    updateImpostorScale(value: number) {
        const particleSystem = this.props.host;
        const attractors = particleSystem.attractors;
        for (let i = 0; i < attractors.length; i++) {
            const attractor = attractors[i];
            const impostor = (attractor as any)._impostor;
            if (impostor) {
                impostor.scaling.setAll(value);
            }
        }
    }

    removeImpostor(attractor: Attractor) {
        const impostor = (attractor as any)._impostor;
        if (impostor) {
            if (this._gizmoManager && this._gizmoManager.attachedMesh === impostor) {
                this._gizmoManager.attachToMesh(null);
            }

            impostor.dispose();
            (attractor as any)._impostor = null;

            const textRenderer = (attractor as any)._textRenderer;
            if (textRenderer) {
                textRenderer.dispose();
                (attractor as any)._textRenderer = null;
            }
        }

        const particleSystem = this.props.host;
        const attractors = particleSystem.attractors;
        for (let i = 0; i < attractors.length; i++) {
            if ((attractors[i] as any)._impostor) {
                return;
            }
        }

        if (this._impostorMaterial) {
            this._impostorMaterial.dispose();
            this._impostorMaterial = null;
        }
    }

    addImpostor(attractor: Attractor, index: number) {
        const scene = this.props.host.getScene();
        if (!scene) {
            return;
        }
        const untypedAttractor = attractor as any;
        untypedAttractor._impostor = CreateSphere("Attractor impostor #" + index, { diameter: 1 }, scene);
        untypedAttractor._impostor.reservedDataStore = { hidden: true };
        untypedAttractor._impostor.scaling.setAll(this.state.impostorScale);
        untypedAttractor._impostor.position.copyFrom(attractor.position);

        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        this.addLabelAsync(attractor, index);

        if (!this._impostorMaterial) {
            this._impostorMaterial = new StandardMaterial("Attractor impostor material", scene);
            this._impostorMaterial.emissiveColor = this.state.color;
            this._impostorMaterial.disableLighting = true;
        }

        untypedAttractor._impostor.material = this._impostorMaterial;

        if (!this._sceneOnAfterRenderObserver) {
            const particleSystem = this.props.host;
            this._sceneOnAfterRenderObserver = scene.onAfterRenderObservable.add(() => {
                const attractors = particleSystem.attractors;
                for (let i = 0; i < attractors.length; i++) {
                    const impostor = (attractors[i] as any)._impostor;
                    if (!impostor) {
                        continue;
                    }

                    attractors[i].position.copyFrom(impostor.position);

                    const localUntypedAttractor = attractors[i] as any;
                    if (localUntypedAttractor._textRenderer) {
                        localUntypedAttractor._textRenderer.color.r = this.state.color.r;
                        localUntypedAttractor._textRenderer.color.g = this.state.color.g;
                        localUntypedAttractor._textRenderer.color.b = this.state.color.b;
                        localUntypedAttractor._textRenderer.render(scene.getViewMatrix(), scene.getProjectionMatrix());
                    }
                }
            });
        }
    }

    async addLabelAsync(attractor: Attractor, index: number) {
        const scene = this.props.host.getScene();
        if (!scene) {
            return;
        }
        const engine = scene.getEngine();

        if (!this._fontAsset) {
            const sdfFontDefinition = await (await fetch("https://assets.babylonjs.com/fonts/roboto-regular.json")).text();
            this._fontAsset = new FontAsset(sdfFontDefinition, "https://assets.babylonjs.com/fonts/roboto-regular.png");
        }

        const textRenderer = await TextRenderer.CreateTextRendererAsync(this._fontAsset, engine);
        textRenderer.addParagraph("#" + index, {}, Matrix.Scaling(0.5, 0.5, 0.5).multiply(Matrix.Translation(0, 1, 0)));
        textRenderer.isBillboard = true;
        textRenderer.color = Color4.FromColor3(this.state.color, 1.0);

        const untypedAttractor = attractor as any;
        textRenderer.parent = untypedAttractor._impostor;

        untypedAttractor._textRenderer = textRenderer;
    }

    controlImpostor(attractor: Attractor, index: number) {
        const scene = this.props.host.getScene();
        if (!scene) {
            return;
        }

        const untypedAttractor = attractor as any;
        if (!untypedAttractor._impostor) {
            this.addImpostor(attractor, index);
        }

        if (!this._gizmoManager) {
            this._gizmoManager = new GizmoManager(scene);
            this._gizmoManager.positionGizmoEnabled = true;
            this._gizmoManager.attachableMeshes = [];
        }

        if (this._gizmoManager.attachedMesh === untypedAttractor._impostor) {
            this._gizmoManager.attachToMesh(null);
        } else {
            this._gizmoManager.attachToMesh(untypedAttractor._impostor);
        }

        this.forceUpdate();
    }
    override shouldComponentUpdate(nextProps: Readonly<IAttractorsGridComponent>, nextState: Readonly<{ impostorScale: number; color: Color3 }>, nextContext: any): boolean {
        if (this.props.host !== nextProps.host) {
            this.cleanup();
        }
        return true;
    }

    override componentWillUnmount() {
        this.cleanup();
    }

    cleanup() {
        if (this._gizmoManager) {
            this._gizmoManager.dispose();
            this._gizmoManager = null;
        }

        const particleSystem = this.props.host;
        const attractors = particleSystem.attractors;
        for (let i = 0; i < attractors.length; i++) {
            const attractor = attractors[i];
            this.removeImpostor(attractor);
        }

        if (this._sceneOnAfterRenderObserver) {
            this.props.host.getScene()?.onAfterRenderObservable.remove(this._sceneOnAfterRenderObserver);
            this._sceneOnAfterRenderObserver = null;
        }

        if (this._fontAsset) {
            this._fontAsset.dispose();
            this._fontAsset = null;
        }
    }

    override render() {
        const particleSystem = this.props.host;
        const attractors = particleSystem.attractors;

        return (
            <div>
                <div className="gradient-container">
                    <LinkButtonComponent
                        label=""
                        url={this.props.docLink}
                        icon={faTrash}
                        onIconClick={() => {
                            for (let i = 0; i < attractors.length; i++) {
                                particleSystem.removeAttractor(attractors[i]);
                            }
                            this.forceUpdate();
                        }}
                        buttonLabel="Add new attractor"
                        onClick={() => this.addNewAttractor()}
                    />
                    {attractors.map((a, i) => {
                        const codeRecorderPropertyName = `attractors[${i}]`;

                        return (
                            <AttractorGridComponent
                                globalState={this.props.globalState}
                                host={this.props.host}
                                codeRecorderPropertyName={codeRecorderPropertyName}
                                lockObject={this.props.lockObject}
                                key={"step-" + i}
                                lineIndex={i}
                                attractor={a}
                                isControlled={(a) => {
                                    if (!this._gizmoManager) {
                                        return false;
                                    }
                                    return this._gizmoManager.attachedMesh === (a as any)._impostor;
                                }}
                                addImpostor={(a, i) => this.addImpostor(a, i)}
                                removeImpostor={(a) => this.removeImpostor(a)}
                                onControl={(a, i) => this.controlImpostor(a, i)}
                                onDelete={(attractor) => {
                                    this.props.host.removeAttractor(attractor);
                                    this.forceUpdate();
                                }}
                            />
                        );
                    })}
                    <LineContainerComponent title="  IMPOSTORS" selection={this.props.globalState}>
                        <SliderLineComponent
                            lockObject={this.props.lockObject}
                            label="Size"
                            directValue={this.state.impostorScale}
                            minimum={0}
                            maximum={10}
                            step={0.1}
                            decimalCount={1}
                            onChange={(value) => {
                                this.updateImpostorScale(value);
                                this.setState({ impostorScale: value });
                            }}
                        />
                        <Color3LineComponent
                            lockObject={this.props.lockObject}
                            target={this.state}
                            label="Color"
                            propertyName="color"
                            onChange={() => {
                                if (this._impostorMaterial) {
                                    this._impostorMaterial.emissiveColor = this.state.color;
                                }
                                this.setState({ color: this.state.color });
                            }}
                        />
                    </LineContainerComponent>
                </div>
            </div>
        );
    }
}
