import * as React from "react";
import type { Observable } from "core/Misc/observable";
import type { DirectionalLight } from "core/Lights/directionalLight";
import type { PropertyChangedEvent } from "../../../../propertyChangedEvent";
import { CommonLightPropertyGridComponent } from "./commonLightPropertyGridComponent";
import { LineContainerComponent } from "shared-ui-components/lines/lineContainerComponent";
import { Color3LineComponent } from "shared-ui-components/lines/color3LineComponent";
import { Vector3LineComponent } from "shared-ui-components/lines/vector3LineComponent";
import { CommonShadowLightPropertyGridComponent } from "./commonShadowLightPropertyGridComponent";
import type { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";
import type { GlobalState } from "../../../../globalState";
import { CheckBoxLineComponent } from "shared-ui-components/lines/checkBoxLineComponent";
import type { ShadowGenerator } from "core/Lights/Shadows/shadowGenerator";
import { CascadedShadowGenerator } from "core/Lights/Shadows/cascadedShadowGenerator";
import { DirectionalLightFrustumViewer } from "core/Debug/directionalLightFrustumViewer";

interface IDirectionalLightPropertyGridComponentProps {
    globalState: GlobalState;
    light: DirectionalLight;
    lockObject: LockObject;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
}

export class DirectionalLightPropertyGridComponent extends React.Component<IDirectionalLightPropertyGridComponentProps> {
    constructor(props: IDirectionalLightPropertyGridComponentProps) {
        super(props);
    }

    displayFrustum() {
        const light = this.props.light;
        const camera = light.getScene().activeCamera;

        const displayFrustum = ((light as any)._displayFrustum = !(light as any)._displayFrustum);

        if ((light as any)._displayFrustumObservable) {
            light.getScene().onAfterRenderObservable.remove((light as any)._displayFrustumObservable);
            (light as any)._displayFrustumDLH.dispose();
        }

        if (displayFrustum && camera) {
            const dlh = ((light as any)._displayFrustumDLH = new DirectionalLightFrustumViewer(light, camera));
            (light as any)._displayFrustumObservable = light.getScene().onAfterRenderObservable.add(() => {
                dlh.update();
            });
        }
    }

    render() {
        const light = this.props.light;

        const generator = (light.getShadowGenerator() as ShadowGenerator | CascadedShadowGenerator) || null;

        const hideAutoCalcShadowZBounds = generator instanceof CascadedShadowGenerator;
        const displayFrustum = (light as any)._displayFrustum ?? false;

        return (
            <div className="pane">
                <CommonLightPropertyGridComponent
                    globalState={this.props.globalState}
                    lockObject={this.props.lockObject}
                    light={light}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
                <LineContainerComponent title="SETUP" selection={this.props.globalState}>
                    <Color3LineComponent
                        lockObject={this.props.lockObject}
                        label="Diffuse"
                        target={light}
                        propertyName="diffuse"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <Color3LineComponent
                        lockObject={this.props.lockObject}
                        label="Specular"
                        target={light}
                        propertyName="specular"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <Vector3LineComponent
                        lockObject={this.props.lockObject}
                        label="Position"
                        target={light}
                        propertyName="position"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <Vector3LineComponent
                        lockObject={this.props.lockObject}
                        label="Direction"
                        target={light}
                        propertyName="direction"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    {!hideAutoCalcShadowZBounds && (
                        <CheckBoxLineComponent
                            label="Auto Calc Shadow ZBounds"
                            target={light}
                            propertyName="autoCalcShadowZBounds"
                            onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        />
                    )}
                </LineContainerComponent>
                <CommonShadowLightPropertyGridComponent
                    globalState={this.props.globalState}
                    lockObject={this.props.lockObject}
                    light={light}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
                <LineContainerComponent title="DEBUG" closed={true} selection={this.props.globalState}>
                    <CheckBoxLineComponent label="Display frustum" isSelected={() => displayFrustum} onSelect={() => this.displayFrustum()} />
                </LineContainerComponent>
            </div>
        );
    }
}
