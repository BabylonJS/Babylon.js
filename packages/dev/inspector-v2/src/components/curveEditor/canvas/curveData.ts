import { Animation } from "core/Animations/animation";
import { AnimationKeyInterpolation } from "core/Animations/animationKey";
import { Observable } from "core/Misc/observable";

// eslint-disable-next-line @typescript-eslint/naming-convention
export interface KeyEntry {
    frame: number;
    value: number;
    inTangent?: number;
    outTangent?: number;
    lockedTangent: boolean;
    interpolation?: AnimationKeyInterpolation;
}

export class CurveData {
    public static readonly SampleRate = 50;
    public keys: KeyEntry[] = [];
    public animation: Animation;
    public color: string;
    public onDataUpdatedObservable = new Observable<void>();
    public property?: string;
    public tangentBuilder?: () => any;
    public setDefaultInTangent?: (keyId: number) => any;
    public setDefaultOutTangent?: (keyId: number) => any;

    public static readonly TangentLength = 50;

    public constructor(
        color: string,
        animation: Animation,
        property?: string,
        tangentBuilder?: () => any,
        setDefaultInTangent?: (keyId: number) => any,
        setDefaultOutTangent?: (keyId: number) => any
    ) {
        this.color = color;
        this.animation = animation;
        this.property = property;
        this.tangentBuilder = tangentBuilder;
        this.setDefaultInTangent = setDefaultInTangent;
        this.setDefaultOutTangent = setDefaultOutTangent;
    }

    public getPathData(convertX: (x: number) => number, convertY: (y: number) => number) {
        const keys = this.keys;
        if (keys.length < 2) {
            return "";
        }
        let pathData = `M${convertX(keys[0].frame)} ${convertY(keys[0].value)}`;

        const dataType = this.animation.dataType;
        for (let keyIndex = 1; keyIndex < keys.length; keyIndex++) {
            const outTangent = keys[keyIndex - 1].outTangent;
            const inTangent = keys[keyIndex].inTangent;
            const currentFrame = keys[keyIndex].frame;
            const currentValue = keys[keyIndex].value;
            const prevFrame = keys[keyIndex - 1].frame;
            const prevValue = keys[keyIndex - 1].value;
            const frameDist = currentFrame - prevFrame;
            const prevInterpolation = keys[keyIndex - 1].interpolation;

            if (prevInterpolation === AnimationKeyInterpolation.STEP) {
                // Draw a stepped curve
                pathData += `L ${convertX(currentFrame)} ${convertY(prevValue)}`;
                pathData += `L ${convertX(currentFrame)} ${convertY(currentValue)}`;
                continue;
            }

            if (outTangent === undefined && inTangent === undefined && dataType !== Animation.ANIMATIONTYPE_QUATERNION) {
                // Draw a straight line
                pathData += ` L${convertX(currentFrame)} ${convertY(currentValue)}`;
                continue;
            }

            // Let's sample the curve else
            for (let frame = prevFrame; frame < currentFrame; frame += frameDist / CurveData.SampleRate) {
                const keyValue = this.animation.evaluate(frame);
                const value = this.property ? keyValue[this.property] : keyValue;
                pathData += ` L${convertX(frame)} ${convertY(value)}`;
            }
            pathData += ` L${convertX(currentFrame)} ${convertY(currentValue)}`;
        }

        return pathData;
    }

    public updateLockedTangentMode(keyIndex: number, enabled: boolean) {
        const keys = this.keys;
        keys[keyIndex].lockedTangent = enabled;

        const animationKeys = this.animation.getKeys();
        animationKeys[keyIndex].lockedTangent = enabled;
    }

    public updateInterpolationMode(keyIndex: number, interpolationMode: AnimationKeyInterpolation) {
        const keys = this.keys;
        keys[keyIndex].interpolation = interpolationMode;

        const animationKeys = this.animation.getKeys();
        animationKeys[keyIndex].interpolation = interpolationMode;

        this.onDataUpdatedObservable.notifyObservers();
    }

    public getInControlPoint(keyIndex: number) {
        if (keyIndex === 0) {
            return 0;
        }

        const keys = this.keys;
        let inTangent = keys[keyIndex].inTangent;

        if (inTangent === undefined && this.hasDefinedInTangent(keyIndex)) {
            inTangent = this.evaluateInTangent(keyIndex);
        }

        return inTangent;
    }

    public getOutControlPoint(keyIndex: number) {
        const keys = this.keys;
        if (keyIndex === keys.length - 1) {
            return 0;
        }

        let outTangent = keys[keyIndex].outTangent;

        if (outTangent === undefined && this.hasDefinedOutTangent(keyIndex)) {
            outTangent = this.evaluateOutTangent(keyIndex);
        }

        return outTangent;
    }

    public hasDefinedOutTangent(keyIndex: number) {
        const keys = this.keys;
        if (keyIndex === this.keys.length - 1) {
            return false;
        }
        const prevFrame = keys[keyIndex].frame;
        const currentFrame = keys[keyIndex + 1].frame;
        return prevFrame !== currentFrame;
    }

    public evaluateOutTangent(keyIndex: number) {
        const keys = this.keys;
        const prevFrame = keys[keyIndex].frame;
        const currentFrame = keys[keyIndex + 1].frame;
        return (keys[keyIndex + 1].value - keys[keyIndex].value) / (currentFrame - prevFrame);
    }

    public hasDefinedInTangent(keyIndex: number) {
        if (keyIndex === 0) {
            return false;
        }
        const keys = this.keys;
        const prevFrame = keys[keyIndex - 1].frame;
        const currentFrame = keys[keyIndex].frame;
        return prevFrame !== currentFrame;
    }

    public evaluateInTangent(keyIndex: number) {
        const keys = this.keys;
        const prevFrame = keys[keyIndex - 1].frame;
        const currentFrame = keys[keyIndex].frame;
        return (keys[keyIndex].value - keys[keyIndex - 1].value) / (currentFrame - prevFrame);
    }

    public storeDefaultInTangent(keyIndex: number) {
        const keys = this.keys;
        const animationKeys = this.animation.getKeys();
        if (this.hasDefinedInTangent(keyIndex)) {
            keys[keyIndex].inTangent = this.evaluateInTangent(keyIndex);
        }

        if (this.property) {
            if (!animationKeys[keyIndex].inTangent) {
                animationKeys[keyIndex].inTangent = this.tangentBuilder!();
                this.setDefaultInTangent!(keyIndex);
            }
            animationKeys[keyIndex].inTangent[this.property] = keys[keyIndex].inTangent;
        } else {
            animationKeys[keyIndex].inTangent = keys[keyIndex].inTangent;
        }
    }

    public storeDefaultOutTangent(keyIndex: number) {
        const keys = this.keys;
        const animationKeys = this.animation.getKeys();
        if (this.hasDefinedOutTangent(keyIndex)) {
            keys[keyIndex].outTangent = this.evaluateOutTangent(keyIndex);
        }

        if (this.property) {
            if (!animationKeys[keyIndex].outTangent) {
                animationKeys[keyIndex].outTangent = this.tangentBuilder!();
                this.setDefaultOutTangent!(keyIndex);
            }
            animationKeys[keyIndex].outTangent[this.property] = keys[keyIndex].outTangent;
        } else {
            animationKeys[keyIndex].outTangent = keys[keyIndex].outTangent;
        }
    }

    public updateInTangentFromControlPoint(keyId: number, slope: number) {
        const keys = this.keys;
        keys[keyId].inTangent = slope;

        const animationKeys = this.animation.getKeys();
        if (this.property) {
            if (!animationKeys[keyId].inTangent) {
                animationKeys[keyId].inTangent = this.tangentBuilder!();
                this.setDefaultInTangent!(keyId);
            }
            if (!animationKeys[keyId - 1].outTangent) {
                animationKeys[keyId - 1].outTangent = this.tangentBuilder!();
                this.setDefaultOutTangent!(keyId - 1);
            }

            animationKeys[keyId].inTangent[this.property] = keys[keyId].inTangent;
        } else {
            animationKeys[keyId].inTangent = keys[keyId].inTangent;

            if (animationKeys[keyId - 1].outTangent === undefined) {
                this.storeDefaultOutTangent(keyId - 1);
            }
        }

        this.onDataUpdatedObservable.notifyObservers();
    }

    public updateOutTangentFromControlPoint(keyId: number, slope: number) {
        const keys = this.keys;
        keys[keyId].outTangent = slope;

        const animationKeys = this.animation.getKeys();

        if (this.property) {
            if (!animationKeys[keyId + 1].inTangent) {
                animationKeys[keyId + 1].inTangent = this.tangentBuilder!();
                this.setDefaultInTangent!(keyId + 1);
            }
            if (!animationKeys[keyId].outTangent) {
                animationKeys[keyId].outTangent = this.tangentBuilder!();
                this.setDefaultOutTangent!(keyId);
            }

            animationKeys[keyId].outTangent[this.property] = keys[keyId].outTangent;
        } else {
            animationKeys[keyId].outTangent = keys[keyId].outTangent;
            if (animationKeys[keyId + 1].inTangent === undefined) {
                this.storeDefaultInTangent(keyId + 1);
            }
        }

        this.onDataUpdatedObservable.notifyObservers();
    }

    public updateKeyFrame(keyId: number, frame: number) {
        const originalKey = this.animation.getKeys()[keyId];
        originalKey.frame = frame;

        this.keys[keyId].frame = frame;

        this.onDataUpdatedObservable.notifyObservers();
    }

    public updateKeyValue(keyId: number, value: number) {
        this.keys[keyId].value = value;

        const sourceKey = this.animation.getKeys()[keyId];

        if (this.property) {
            sourceKey.value[this.property] = value;
        } else {
            sourceKey.value = value;
        }

        this.onDataUpdatedObservable.notifyObservers();
    }
}
