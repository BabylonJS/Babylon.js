import * as React from "react";

import { Nullable } from "babylonjs/types";
import { Observable, Observer } from "babylonjs/Misc/observable";
import { BaseTexture } from "babylonjs/Materials/Textures/baseTexture";
import { Material } from "babylonjs/Materials/material";
import { StandardMaterial } from "babylonjs/Materials/standardMaterial";

import { TextLineComponent } from "./textLineComponent";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWrench, faTrash } from '@fortawesome/free-solid-svg-icons';
import { Texture } from 'babylonjs/Materials/Textures/texture';
import { FileButtonLineComponent } from './fileButtonLineComponent';
import { Tools } from 'babylonjs/Misc/tools';

export interface ITextureLinkLineComponentProps {
    label: string;
    texture: Nullable<BaseTexture>;
    material?: Material;
    onSelectionChangedObservable?: Observable<any>;
    onDebugSelectionChangeObservable?: Observable<TextureLinkLineComponent>;
    propertyName?: string;
    onTextureCreated?: (texture: BaseTexture) => void;
    customDebugAction?: (state: boolean) => void
    onTextureRemoved?: () => void;
}

export class TextureLinkLineComponent extends React.Component<ITextureLinkLineComponentProps, { isDebugSelected: boolean }> {
    private _onDebugSelectionChangeObserver: Nullable<Observer<TextureLinkLineComponent>>;

    constructor(props: ITextureLinkLineComponentProps) {
        super(props);

        const material = this.props.material;
        const texture = this.props.texture;

        this.state = { isDebugSelected: material && material.reservedDataStore && material.reservedDataStore.debugTexture === texture };
    }

    componentDidMount() {
        if (!this.props.onDebugSelectionChangeObservable) {
            return;
        }
        this._onDebugSelectionChangeObserver = this.props.onDebugSelectionChangeObservable.add((line) => {
            if (line !== this) {
                this.setState({ isDebugSelected: false });
            }
        });
    }

    componentWillUnmount() {
        if (this.props.onDebugSelectionChangeObservable && this._onDebugSelectionChangeObserver) {
            this.props.onDebugSelectionChangeObservable.remove(this._onDebugSelectionChangeObserver);
        }
    }

    debugTexture() {
        if (this.props.customDebugAction) {
            let newState = !this.state.isDebugSelected;
            this.props.customDebugAction(newState);
            this.setState({ isDebugSelected: newState });
            
            if (this.props.onDebugSelectionChangeObservable) {
                this.props.onDebugSelectionChangeObservable.notifyObservers(this);
            }

            return;
        }

        const texture = this.props.texture;

        const material = this.props.material;

        if (!material || !texture) {
            return;
        }
        const scene = material.getScene();

        if (material.reservedDataStore && material.reservedDataStore.debugTexture === texture) {
            const debugMaterial = material.reservedDataStore.debugMaterial;
            texture.level = material.reservedDataStore.level;
            for (var mesh of scene.meshes) {
                if (mesh.material === debugMaterial) {
                    mesh.material = material;
                }
            }
            debugMaterial.dispose();
            material.reservedDataStore.debugTexture = null;
            material.reservedDataStore.debugMaterial = null;

            this.setState({ isDebugSelected: false });
            return;
        }

        let checkMaterial = material;
        let needToDisposeCheckMaterial = false;
        if (material.reservedDataStore && material.reservedDataStore.debugTexture) {
            checkMaterial = material.reservedDataStore.debugMaterial;
            needToDisposeCheckMaterial = true;
        }

        var debugMaterial = new StandardMaterial("debugMaterial", scene);
        debugMaterial.disableLighting = true;
        debugMaterial.sideOrientation = material.sideOrientation;
        debugMaterial.emissiveTexture = texture;
        debugMaterial.forceDepthWrite = true;
        debugMaterial.reservedDataStore = { hidden: true };

        for (var mesh of scene.meshes) {
            if (mesh.material === checkMaterial) {
                mesh.material = debugMaterial;
            }
        }

        if (!material.reservedDataStore) {
            material.reservedDataStore = {};
        }

        material.reservedDataStore.debugTexture = texture;
        material.reservedDataStore.debugMaterial = debugMaterial;
        material.reservedDataStore.level = texture.level;
        texture.level = 1.0;

        if (this.props.onDebugSelectionChangeObservable) {
            this.props.onDebugSelectionChangeObservable.notifyObservers(this);
        }

        if (needToDisposeCheckMaterial) {
            checkMaterial.dispose();
        }

        this.setState({ isDebugSelected: true });
    }

    onLink() {
        if (!this.props.onSelectionChangedObservable) {
            return;
        }

        const texture = this.props.texture;
        this.props.onSelectionChangedObservable.notifyObservers(texture!);
    }

    updateTexture(file: File) {
        let material = this.props.material!;
        Tools.ReadFile(file, (data) => {
            var blob = new Blob([data], { type: "octet/stream" });
            var url = URL.createObjectURL(blob);

            let texture = new Texture(url, material.getScene(), false, false);

            if (this.props.propertyName) {
                (material as any)[this.props.propertyName!] = texture;
            } else if (this.props.onTextureCreated) {
                this.props.onTextureCreated(texture);
            }

            this.forceUpdate();

        }, undefined, true);
    }

    removeTexture() {
        let material = this.props.material!;
        if (this.props.propertyName) {
            (material as any)[this.props.propertyName!] = null;
        } else if (this.props.onTextureRemoved) {
            this.props.onTextureRemoved();
        }

        this.forceUpdate();
}

    render() {
        const texture = this.props.texture;

        if (!texture) {
            if (this.props.propertyName || this.props.onTextureCreated) {
                return (
                    <FileButtonLineComponent label={`Add ${this.props.label} texture`} onClick={(file) => this.updateTexture(file)} accept=".jpg, .png, .tga, .dds, .env" />
                )
            }
            return null;
        }
        return (
            <div className="textureLinkLine">
                {
                    !texture.isCube && this.props.material &&
                    <>
                        <div className={this.state.isDebugSelected ? "debug selected" : "debug"}>
                            <span className="actionIcon" onClick={() => this.debugTexture()} title="Render as main texture">
                                <FontAwesomeIcon icon={faWrench} />
                            </span>
                            <span className="actionIcon" onClick={() => this.removeTexture()} title="Remove texture">
                                <FontAwesomeIcon icon={faTrash} />
                            </span>
                        </div>
                    </>
                }
                <TextLineComponent label={this.props.label} value={texture.name} onLink={() => this.onLink()} />
            </div>
        );
    }
}
