import { Animation } from "babylonjs/Animations/animation";
import { Observable } from "babylonjs/Misc/observable";

export interface KeyEntry {
    frame: number;
    value: number;
    inTangent?: number;
    outTangent?: number;
    lockedTangent: boolean;
}

export class Curve {
    public static readonly SampleRate = 50;
    public keys = new Array<KeyEntry>(); 
    public animation: Animation;   
    public color: string;
    public onDataUpdatedObservable = new Observable<void>();
    public property?: string;
    public tangentBuilder?: () => any;
    public setDefaultInTangent?: (keyId: number) => any;
    public setDefaultOutTangent?: (keyId: number) => any;

    public static readonly TangentLength = 50;

    public constructor(color: string, animation: Animation, property?: string, tangentBuilder?: () => any, setDefaultInTangent?: (keyId: number) => any, setDefaultOutTangent?: (keyId: number) => any) {
        this.color = color;
        this.animation = animation;
        this.property = property;
        this.tangentBuilder = tangentBuilder;
        this.setDefaultInTangent = setDefaultInTangent;
        this.setDefaultOutTangent = setDefaultOutTangent;
    }

    public gePathData(convertX: (x: number) => number, convertY: (y: number) => number, ) {
        const keys = this.keys;
        if (keys.length < 2) {
            return "";
        }

        let pathData = `M${convertX(keys[0].frame)} ${convertY(keys[0].value)}`;

        for (var keyIndex = 1; keyIndex < keys.length; keyIndex++) {
            const outTangent = keys[keyIndex - 1].outTangent;
            const inTangent = keys[keyIndex].inTangent;
            const currentFrame = keys[keyIndex].frame;
            const currentValue = keys[keyIndex].value;
            const prevFrame = keys[keyIndex - 1].frame;
            const frameDist = currentFrame - prevFrame;

            if (outTangent === undefined && inTangent === undefined) { // Draw a straight line
                pathData += ` L${convertX(currentFrame)} ${convertY(currentValue)}`;
                continue;
            }

            // Let's sample the curve else
            for (var frame = prevFrame; frame < currentFrame; frame += frameDist / Curve.SampleRate) {
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

    public getInControlPoint(keyIndex: number) {
        if (keyIndex === 0) {
            return 0;
        }

        const keys = this.keys;
        let inTangent = keys[keyIndex].inTangent;

        if (inTangent === undefined) {
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

        if (outTangent === undefined) {
            outTangent = this.evaluateOutTangent(keyIndex);
        }

        return outTangent;
    }

    public evaluateOutTangent(keyIndex: number) {
        const keys = this.keys; 
        const prevFrame = keys[keyIndex].frame;                
        const currentFrame = keys[keyIndex + 1].frame;
        return (keys[keyIndex + 1].value - keys[keyIndex].value) / (currentFrame - prevFrame);
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
        keys[keyIndex].inTangent = this.evaluateInTangent(keyIndex);

        if (this.property) {
            animationKeys[keyIndex].inTangent[this.property] = keys[keyIndex].inTangent;
        } else {
            animationKeys[keyIndex].inTangent = keys[keyIndex].inTangent;
        }
    }

    public storeDefaultOutTangent(keyIndex: number) {
        const keys = this.keys;
        const animationKeys = this.animation.getKeys();
        keys[keyIndex].outTangent = this.evaluateOutTangent(keyIndex);

        if (this.property) {
            animationKeys[keyIndex].outTangent[this.property] = keys[keyIndex].outTangent;
        } else {
            animationKeys[keyIndex].outTangent = keys[keyIndex].outTangent;
        }
    }

    public updateInTangentFromControlPoint(keyId: number, slope: number) {
        const keys = this.keys;
        keys[keyId].inTangent = slope;

        if (this.property) {
            if (!this.animation.getKeys()[keyId].inTangent) {
                this.animation.getKeys()[keyId].inTangent = this.tangentBuilder!();
                this.setDefaultInTangent!(keyId);
            }
            if (!this.animation.getKeys()[keyId - 1].outTangent) {
                this.animation.getKeys()[keyId - 1].outTangent = this.tangentBuilder!();
                this.setDefaultOutTangent!(keyId - 1);
            }

            this.animation.getKeys()[keyId].inTangent[this.property] = keys[keyId].inTangent;
        } else {
            this.animation.getKeys()[keyId].inTangent = keys[keyId].inTangent;

            if (this.animation.getKeys()[keyId - 1].outTangent === undefined) {
                this.storeDefaultOutTangent(keyId - 1);
            }
        }

        this.onDataUpdatedObservable.notifyObservers();
    }

    public updateOutTangentFromControlPoint(keyId: number, slope: number) {
        const keys = this.keys;
        keys[keyId].outTangent = slope;

        if (this.property) {
            if (!this.animation.getKeys()[keyId + 1].inTangent) {
                this.animation.getKeys()[keyId + 1].inTangent = this.tangentBuilder!();
                this.setDefaultInTangent!(keyId + 1);
            }
            if (!this.animation.getKeys()[keyId].outTangent) {
                this.animation.getKeys()[keyId].outTangent = this.tangentBuilder!();
                this.setDefaultOutTangent!(keyId);
            }

            this.animation.getKeys()[keyId].outTangent[this.property] = keys[keyId].outTangent;
        } else {            
            this.animation.getKeys()[keyId].outTangent = keys[keyId].outTangent;
            if (this.animation.getKeys()[keyId + 1].inTangent === undefined) {
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

        let sourceKey = this.animation.getKeys()[keyId];

        if (this.property) {
            sourceKey.value[this.property] = value;
        } else {
            sourceKey.value = value;
        }

        this.onDataUpdatedObservable.notifyObservers();
    }
}