import * as React from "react";
import type { GlobalState } from "../../../../globalState";
import type { IValueGradient } from "core/Misc/gradients";
import { FactorGradient, ColorGradient, Color3Gradient } from "core/Misc/gradients";
import type { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";
import { ButtonLineComponent } from "shared-ui-components/lines/buttonLineComponent";
import { FactorGradientStepGridComponent } from "./factorGradientStepGridComponent";
import type { Nullable } from "core/types";
import { ColorGradientStepGridComponent } from "./colorGradientStepGridComponent";
import { Color4, Color3 } from "core/Maths/math.color";
import { LinkButtonComponent } from "shared-ui-components/lines/linkButtonComponent";
import type { IParticleSystem } from "core/Particles/IParticleSystem";
import { faTrash } from "@fortawesome/free-solid-svg-icons";

export enum GradientGridMode {
    Factor,
    Color3,
    Color4,
}

interface IValueGradientGridComponent {
    globalState: GlobalState;
    label: string;
    gradients: Nullable<Array<IValueGradient>>;
    lockObject: LockObject;
    docLink?: string;
    mode: GradientGridMode;
    host: IParticleSystem;
    codeRecorderPropertyName: string;
    onCreateRequired: () => void;
}

export class ValueGradientGridComponent extends React.Component<IValueGradientGridComponent> {
    constructor(props: IValueGradientGridComponent) {
        super(props);
    }

    deleteStep(step: IValueGradient) {
        const gradients = this.props.gradients as Array<IValueGradient>;

        const index = gradients.indexOf(step);

        if (index > -1) {
            gradients.splice(index, 1);
            this.updateAndSync();
        }
    }

    addNewStep() {
        const gradients = this.props.gradients as Array<IValueGradient>;

        switch (this.props.mode) {
            case GradientGridMode.Factor: {
                const newStep = new FactorGradient(1, 1, 1);
                gradients.push(newStep);
                break;
            }
            case GradientGridMode.Color4: {
                const newStepColor = new ColorGradient(1, new Color4(1, 1, 1, 1), new Color4(1, 1, 1, 1));
                gradients.push(newStepColor);
                break;
            }
            case GradientGridMode.Color3: {
                const newStepColor3 = new Color3Gradient(1, Color3.White());
                gradients.push(newStepColor3);
                break;
            }
        }

        this.props.host.forceRefreshGradients();

        this.forceUpdate();
    }

    checkForReOrder() {
        const gradients = this.props.gradients as Array<IValueGradient>;
        gradients.sort((a, b) => {
            if (a.gradient === b.gradient) {
                return 0;
            }

            if (a.gradient > b.gradient) {
                return 1;
            }

            return -1;
        });

        this.forceUpdate();
    }

    updateAndSync() {
        this.props.host.forceRefreshGradients();

        this.forceUpdate();
    }

    render() {
        const gradients = this.props.gradients as Nullable<Array<IValueGradient>>;

        return (
            <div>
                {gradients && gradients.length > 0 && (
                    <div className="gradient-container">
                        <LinkButtonComponent
                            label={this.props.label}
                            url={this.props.docLink}
                            icon={faTrash}
                            onIconClick={() => {
                                gradients!.length = 0;
                                this.updateAndSync();
                            }}
                            buttonLabel="Add new step"
                            onClick={() => this.addNewStep()}
                        />
                        {gradients.map((g, i) => {
                            const codeRecorderPropertyName = this.props.codeRecorderPropertyName + `[${i}]`;
                            switch (this.props.mode) {
                                case GradientGridMode.Factor:
                                    return (
                                        <FactorGradientStepGridComponent
                                            globalState={this.props.globalState}
                                            lockObject={this.props.lockObject}
                                            onCheckForReOrder={() => this.checkForReOrder()}
                                            onUpdateGradient={() => this.updateAndSync()}
                                            host={this.props.host}
                                            codeRecorderPropertyName={codeRecorderPropertyName}
                                            key={"step-" + i}
                                            lineIndex={i}
                                            gradient={g as FactorGradient}
                                            onDelete={() => this.deleteStep(g)}
                                        />
                                    );
                                case GradientGridMode.Color4:
                                    return (
                                        <ColorGradientStepGridComponent
                                            globalState={this.props.globalState}
                                            host={this.props.host}
                                            codeRecorderPropertyName={codeRecorderPropertyName}
                                            lockObject={this.props.lockObject}
                                            isColor3={false}
                                            onCheckForReOrder={() => this.checkForReOrder()}
                                            onUpdateGradient={() => this.updateAndSync()}
                                            key={"step-" + i}
                                            lineIndex={i}
                                            gradient={g as ColorGradient}
                                            onDelete={() => this.deleteStep(g)}
                                        />
                                    );
                                case GradientGridMode.Color3:
                                    return (
                                        <ColorGradientStepGridComponent
                                            globalState={this.props.globalState}
                                            host={this.props.host}
                                            codeRecorderPropertyName={codeRecorderPropertyName}
                                            lockObject={this.props.lockObject}
                                            isColor3={true}
                                            onCheckForReOrder={() => this.checkForReOrder()}
                                            onUpdateGradient={() => this.updateAndSync()}
                                            key={"step-" + i}
                                            lineIndex={i}
                                            gradient={g as Color3Gradient}
                                            onDelete={() => this.deleteStep(g)}
                                        />
                                    );
                            }
                        })}
                    </div>
                )}
                {(!gradients || gradients.length === 0) && (
                    <ButtonLineComponent
                        label={"Use " + this.props.label}
                        onClick={() => {
                            this.props.onCreateRequired();
                            this.forceUpdate();
                        }}
                    />
                )}
            </div>
        );
    }
}
