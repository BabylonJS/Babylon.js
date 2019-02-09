import * as React from "react";

import { Nullable } from "babylonjs/types";
import { Observable, Observer } from "babylonjs/Misc/observable";
import { BaseTexture } from "babylonjs/Materials/Textures/baseTexture";
import { Material } from "babylonjs/Materials/material";
import { StandardMaterial } from "babylonjs/Materials/standardMaterial";

import { TextLineComponent } from "./textLineComponent";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWrench } from '@fortawesome/free-solid-svg-icons';

export interface ITextureLinkLineComponentProps {
    label: string;
    texture: Nullable<BaseTexture>;
    material?: Material;
    onSelectionChangedObservable?: Observable<any>;
    onDebugSelectionChangeObservable?: Observable<BaseTexture>;
}

export class TextureLinkLineComponent extends React.Component<ITextureLinkLineComponentProps, { isDebugSelected: boolean }> {
    private _onDebugSelectionChangeObserver: Nullable<Observer<BaseTexture>>;

    constructor(props: ITextureLinkLineComponentProps) {
        super(props);

        const material = this.props.material;
        const texture = this.props.texture;

        this.state = { isDebugSelected: material && material.reservedDataStore && material.reservedDataStore.debugTexture === texture };
    }

    componentWillMount() {
        if (!this.props.onDebugSelectionChangeObservable) {
            return;
        }
        this._onDebugSelectionChangeObserver = this.props.onDebugSelectionChangeObservable.add((texture) => {
            if (this.props.texture !== texture) {
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
            this.props.onDebugSelectionChangeObservable.notifyObservers(texture!);
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

    render() {
        const texture = this.props.texture;

        if (!texture) {
            return null;
        }
        return (
            <div className="textureLinkLine">
                {
                    !texture.isCube && this.props.material &&
                    <div className={this.state.isDebugSelected ? "debug selected" : "debug"} onClick={() => this.debugTexture()} title="Render as main texture">
                        <FontAwesomeIcon icon={faWrench} />
                    </div>
                }
                <TextLineComponent label={this.props.label} value={texture.name} onLink={() => this.onLink()} />
            </div>
        );
    }
}
