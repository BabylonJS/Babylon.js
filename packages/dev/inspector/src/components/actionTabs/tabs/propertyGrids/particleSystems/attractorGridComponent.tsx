import * as React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowsAlt, faEye, faTrash } from "@fortawesome/free-solid-svg-icons";
import type { GlobalState } from "../../../../globalState";
import type { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";
import type { IParticleSystem } from "core/Particles/IParticleSystem";
import type { Attractor } from "core/Particles/attractor";

interface IAttractorGridComponent {
    globalState: GlobalState;
    attractor: Attractor;
    lockObject: LockObject;
    lineIndex: number;
    host: IParticleSystem;
    codeRecorderPropertyName: string;
    onDelete: (attractor: Attractor) => void;
    removeImpostor: (attractor: Attractor) => void;
    addImpostor: (attractor: Attractor, index: number) => void;
    onControl: (attractor: Attractor, index: number) => void;
    isControlled: (attractor: Attractor) => boolean;
}

export class AttractorGridComponent extends React.Component<IAttractorGridComponent, { strength: number }> {
    constructor(props: IAttractorGridComponent) {
        super(props);

        this.state = { strength: props.attractor.strength };
    }

    lock() {
        if (this.props.lockObject) {
            this.props.lockObject.lock = true;
        }
    }

    unlock() {
        if (this.props.lockObject) {
            this.props.lockObject.lock = false;
        }
    }

    updateStrength(strength: number) {
        this.props.attractor.strength = strength;

        this.setState({ strength: strength });
    }

    onView() {
        const scene = this.props.host.getScene();

        if (!scene) {
            return;
        }

        if ((this.props.attractor as any)._impostor) {
            this.props.removeImpostor(this.props.attractor);
            this.forceUpdate();
            return;
        }

        this.props.addImpostor(this.props.attractor, this.props.lineIndex);
        this.forceUpdate();
    }

    onControl() {
        this.props.onControl(this.props.attractor, this.props.lineIndex);
    }

    override render() {
        const attractor = this.props.attractor;
        const untypedAttractor = attractor as any;

        return (
            <div className="attractor-step">
                <div className="index">{`#${this.props.lineIndex}`}</div>
                <div className="strength-value">{attractor.strength.toFixed(2)}</div>
                <div className="strength-slider">
                    <input
                        className="range"
                        type="range"
                        step={0.01}
                        min={-10.0}
                        max={10.0}
                        value={attractor.strength}
                        onChange={(evt) => this.updateStrength(parseFloat(evt.target.value))}
                    />
                </div>
                <div className={"attractor-control hoverIcon icon" + (this.props.isControlled(attractor) ? " active" : "")} onClick={() => this.onControl()}>
                    <FontAwesomeIcon icon={faArrowsAlt} />
                </div>
                <div className={"attractor-view hoverIcon icon" + (untypedAttractor._impostor ? " active" : "")} onClick={() => this.onView()}>
                    <FontAwesomeIcon icon={faEye} />
                </div>
                <div className="attractor-delete hoverIcon icon" onClick={() => this.props.onDelete(attractor)}>
                    <FontAwesomeIcon icon={faTrash} />
                </div>
            </div>
        );
    }
}
