import * as React from "react";
import { ButtonLineComponent } from "../../../../../sharedUiComponents/lines/buttonLineComponent";
import { GlobalState } from "../../../../globalState";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { LinkButtonComponent } from "../../../../../sharedUiComponents/lines/linkButtonComponent";
import { Scene } from "babylonjs/scene";
import { AnimationGroup } from "babylonjs/Animations/animationGroup";
import { IAnimationKey } from "babylonjs/Animations/animationKey";
import { Animation } from "babylonjs/Animations/animation";
import { Context } from "../animations/curveEditor/context";
import { AnimationCurveEditorComponent } from "../animations/curveEditor/animationCurveEditorComponent";

interface IHermiteCurveComponent {
    globalState: GlobalState;
    label: string;
    scene: Scene;
    //I can't get this reference in IDE
    curve?: { keys: IAnimationKey[] };
    docLink?: string;
    onCreateRequire: () => void;
    onDeleteRequire: () => void;
    limitLastFrame?: boolean;
    limitLastValue?: boolean;


}
const frameScale = 60;
export class HermiteCurveComponent extends React.Component<IHermiteCurveComponent> {
    constructor(props: IHermiteCurveComponent) {
        super(props);

        //Contex
        this._animationCurveEditorContext = new Context();
        this._animationCurveEditorContext.scene = this.props.scene;
        this._animationCurveEditorContext.useTargetAnimations = true;
        this._animationCurveEditorContext.onActiveKeyDataChange.add((keyId) => {
            this.updateToCurve(keyId);
        })
        this._animationCurveEditorContext.onCreateOrUpdateKeyPointRequired.add(() => {
            setTimeout(() => {
                this.updateToCurve();
            });
        })
        this._animationCurveEditorContext.onDeleteKeyActiveKeyPoints.add(() => {
            setTimeout(() => {
                this.updateToCurve();
            });
        })
        this._animationCurveEditorContext.limitLastKeyFrame = this.props.limitLastFrame || false;
        this._animationCurveEditorContext.limitLastKeyValue = this.props.limitLastValue || false;

    }
    //When keys add
    private _animationGroup?: AnimationGroup;
    private _animationCurveEditorContext: Context;
    private _animation?: Animation;
    editorCurve(curve: { keys: IAnimationKey[] }) {
        const scene = this.props.scene;
        if (!curve || !scene) return;
        const keys: IAnimationKey[] = [];
        if (curve.keys.length > 1) {
            curve.keys.forEach(element => {
                keys.push({
                    inTangent: element.inTangent / frameScale,
                    outTangent: element.outTangent / frameScale,
                    frame: element.frame * frameScale,
                    value: element.value,
                })
            });
        }
        else {
            keys.push({ frame: 0, value: 0 }, { frame: frameScale, value: 1 })
        }

        if (!this._animationGroup) {
            this._animationGroup = new AnimationGroup("HermiteEditor", scene);
            this._animation = new Animation("anim", "editor", 60, Animation.ANIMATIONTYPE_FLOAT);
            this._animation.setKeys(keys);
            const param = {
                editor: 0
            }
            this._animationGroup.addTargetedAnimation(this._animation, param);
        }
        else {
            this._animation!.setKeys(keys);
        }
        this._animationCurveEditorContext.title = this._animationGroup.name || "";
        this._animationCurveEditorContext.animations = this._animationGroup.targetedAnimations;
        this._animationCurveEditorContext.rootAnimationGroup = this._animationGroup;
    }
    updateToCurve(keyId?: number) {
        const curveKeys = this.props.curve?.keys;
        const animKeys = this._animation?.getKeys();
        if (!(curveKeys && animKeys)) return;
        if (curveKeys.length === animKeys.length && keyId !== undefined) {
            const key = this.props.curve!.keys[keyId];
            const animKey = this._animation!.getKeys()[keyId];
            key.value = animKey.value;
            key.frame = animKey.frame / frameScale;
            key.inTangent = animKey.inTangent! * frameScale;
            key.outTangent = animKey.outTangent! * frameScale;
        }
        else {
            const newKeys: IAnimationKey[] = [];
            animKeys.forEach(key => {
                newKeys.push({
                    value: key.value,
                    frame: key.frame / frameScale,
                    inTangent: key.inTangent * frameScale,
                    outTangent: key.outTangent * frameScale
                })
            });
            this.props.curve!.keys = newKeys;
        }
    }
    componentWillUnmount() {
        if (this._animationGroup) {
            this._animationGroup.dispose();
        }
    }
    shouldComponentUpdate(next: IHermiteCurveComponent) {
        if (this.props.curve !== next.curve && next.curve) {
            this.editorCurve(next.curve);
        }
        return true;
    }
    render() {
        const curve = this.props.curve;
        return (
            <div>
                {curve !== undefined && (
                    <div>
                        <LinkButtonComponent
                            label={this.props.label}
                            url={this.props.docLink}
                            icon={faTrash}
                            onIconClick={() => {
                                this.props.onDeleteRequire();
                            }}
                            buttonLabel="Force Update"
                            onClick={() => this.updateToCurve()}
                        />
                        <AnimationCurveEditorComponent globalState={this.props.globalState} context={this._animationCurveEditorContext} />
                    </div>

                )}
                {curve === undefined && (
                    <ButtonLineComponent
                        label={"Use " + this.props.label}
                        onClick={() => {
                            this.props.onCreateRequire();
                        }}
                    />
                )}


            </div>
        )
        // let gradients = this.props.gradients as Nullable<Array<IValueGradient>>;

        // return (
        //     <div>
        //         {gradients && gradients.length > 0 && (
        //             <div className="gradient-container">
        //                 <LinkButtonComponent
        //                     label={this.props.label}
        //                     url={this.props.docLink}
        //                     icon={faTrash}
        //                     onIconClick={() => {
        //                         gradients!.length = 0;
        //                         this.updateAndSync();
        //                     }}
        //                     buttonLabel="Add new step"
        //                     onClick={() => this.addNewStep()}
        //                 />
        //                 {gradients.map((g, i) => {
        //                     let codeRecorderPropertyName = this.props.codeRecorderPropertyName + `[${i}]`;
        //                     switch (this.props.mode) {
        //                         case GradientGridMode.Factor:
        //                             return (
        //                                 <FactorGradientStepGridComponent
        //                                     globalState={this.props.globalState}
        //                                     lockObject={this.props.lockObject}
        //                                     onCheckForReOrder={() => this.checkForReOrder()}
        //                                     onUpdateGradient={() => this.updateAndSync()}
        //                                     host={this.props.host}
        //                                     codeRecorderPropertyName={codeRecorderPropertyName}
        //                                     key={"step-" + i}
        //                                     lineIndex={i}
        //                                     gradient={g as FactorGradient}
        //                                     onDelete={() => this.deleteStep(g)}
        //                                 />
        //                             );
        //                         case GradientGridMode.Color4:
        //                             return (
        //                                 <ColorGradientStepGridComponent
        //                                     globalState={this.props.globalState}
        //                                     host={this.props.host}
        //                                     codeRecorderPropertyName={codeRecorderPropertyName}
        //                                     lockObject={this.props.lockObject}
        //                                     isColor3={false}
        //                                     onCheckForReOrder={() => this.checkForReOrder()}
        //                                     onUpdateGradient={() => this.updateAndSync()}
        //                                     key={"step-" + i}
        //                                     lineIndex={i}
        //                                     gradient={g as ColorGradient}
        //                                     onDelete={() => this.deleteStep(g)}
        //                                 />
        //                             );
        //                         case GradientGridMode.Color3:
        //                             return (
        //                                 <ColorGradientStepGridComponent
        //                                     globalState={this.props.globalState}
        //                                     host={this.props.host}
        //                                     codeRecorderPropertyName={codeRecorderPropertyName}
        //                                     lockObject={this.props.lockObject}
        //                                     isColor3={true}
        //                                     onCheckForReOrder={() => this.checkForReOrder()}
        //                                     onUpdateGradient={() => this.updateAndSync()}
        //                                     key={"step-" + i}
        //                                     lineIndex={i}
        //                                     gradient={g as Color3Gradient}
        //                                     onDelete={() => this.deleteStep(g)}
        //                                 />
        //                             );
        //                     }
        //                 })}
        //             </div>
        //         )}
        //         {(!gradients || gradients.length === 0) && (
        //             <ButtonLineComponent
        //                 label={"Use " + this.props.label}
        //                 onClick={() => {
        //                     this.props.onCreateRequired();
        //                     this.forceUpdate();
        //                 }}
        //             />
        //         )}
        //     </div>
        // );
    }
}






