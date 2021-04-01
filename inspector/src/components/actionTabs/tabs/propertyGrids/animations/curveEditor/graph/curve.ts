import { Animation } from "babylonjs/Animations/animation";
import { Observable } from "babylonjs/Misc/observable";

export interface KeyEntry {
    frame: number;
    value: number;
    inTangent?: number;
    outTangent?: number;
}

export class Curve {
    public keys = new Array<KeyEntry>(); 
    public animation: Animation;   
    public color: string;
    public onDataUpdatedObservable = new Observable<void>();
    public property?: string;

    public constructor(color: string, animation: Animation, property?: string) {
        this.color = color;
        this.animation = animation;
        this.property = property;
    }

    public gePathData(convertX: (x: number) => number, convertY: (y: number) => number, ) {
        const keys = this.keys;
        if (keys.length < 2) {
            return "";
        }

        let pathData = `M${convertX(keys[0].frame)} ${convertY(keys[0].value)}`;

        for (var keyIndex = 1; keyIndex < keys.length; keyIndex++) {
            const outTangent = keys[keyIndex - 1].outTangent || 0;
            const inTangent = keys[keyIndex].inTangent || 0;

            const prevFrame = keys[keyIndex - 1].frame;
            const currentFrame = keys[keyIndex].frame;
            const prevValue = keys[keyIndex - 1].value;
            const currentValue = keys[keyIndex].value;

            const controlPoint0Frame = outTangent ? 2 * prevFrame / 3 + currentFrame / 3 : prevFrame;
            const controlPoint1Frame = inTangent ? prevFrame / 3 + 2 * currentFrame / 3 : currentFrame;

            const controlPoint0Value = prevValue + outTangent / 3;
            const controlPoint1Value = currentValue - inTangent / 3;

            pathData += ` C${convertX(controlPoint0Frame)} ${convertY(controlPoint0Value)}, ${convertX(controlPoint1Frame)} ${convertY(controlPoint1Value)}, ${convertX(currentFrame)} ${convertY(currentValue)}`;
        }

        return pathData;
    }

    public getInControlPoint(keyIndex: number) {
        if (keyIndex === 0) {
            return null;
        }

        const keys = this.keys;
        const inTangent = keys[keyIndex].inTangent;

        if (inTangent) {
            const prevFrame = keys[keyIndex - 1].frame;
            const currentFrame = keys[keyIndex].frame;
            const currentValue = keys[keyIndex].value;

            const frame = inTangent ? prevFrame / 3 + 2 * currentFrame / 3 : currentFrame;
            const value = currentValue - inTangent / 3;

            return {
                frame: frame,
                value: value
            }
        } else {
            const prevFrame = keys[keyIndex - 1].frame;                
            const prevValue = keys[keyIndex - 1].value;
            const currentFrame = keys[keyIndex].frame;
            const currentValue = keys[keyIndex].value;

            return {
                frame: prevFrame + (currentFrame - prevFrame) / 2,
                value: prevValue + (currentValue - prevValue) / 2
            }
        }
    }

    public getOutControlPoint(keyIndex: number) {
        const keys = this.keys;        
        if (keyIndex === keys.length - 1) {
            return null;
        }
        const outTangent = keys[keyIndex].outTangent;

        if (outTangent) {
            const prevFrame = keys[keyIndex].frame;        
            const prevValue = keys[keyIndex].value;
            const currentFrame = keys[keyIndex + 1].frame;

            const frame = outTangent ? 2 * prevFrame / 3 + currentFrame / 3 : prevFrame;
            const value = prevValue + outTangent / 3;

            return {
                frame: frame,
                value: value
            }
        } else {
            const prevFrame = keys[keyIndex].frame;                
            const prevValue = keys[keyIndex].value;
            const currentFrame = keys[keyIndex + 1].frame;
            const currentValue = keys[keyIndex + 1].value;

            return {
                frame: prevFrame + (currentFrame - prevFrame) / 2,
                value: prevValue + (currentValue - prevValue) / 2
            }
        }
    }

    public updateKeyFrame(keyId: number, frame: number) {
        this.keys[keyId].frame = frame;

        this.animation.getKeys()[keyId].frame = frame;

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