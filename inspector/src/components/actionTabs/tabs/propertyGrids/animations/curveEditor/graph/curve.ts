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
        let keys = this.keys;
        if (keys.length < 2) {
            return "";
        }

        let pathData = `M${convertX(keys[0].frame)} ${convertY(keys[0].value)}`;

        for (var keyIndex = 1; keyIndex < keys.length; keyIndex++) {
            const outTangent = keys[keyIndex - 1].outTangent || 0;
            const inTangent = keys[keyIndex].inTangent || 0;

            //if (inTangent && outTangent) {
                const prevFrame = keys[keyIndex - 1].frame;
                const currentFrame = keys[keyIndex].frame;
                const prevValue = keys[keyIndex - 1].value;
                const currentValue = keys[keyIndex].value;

                const controlPoint0Frame = outTangent ? 2 * prevFrame / 3 + currentFrame / 3 : prevFrame;
                const controlPoint1Frame = inTangent ? prevFrame / 3 + 2 * currentFrame / 3 : currentFrame;

                const controlPoint0Value = prevValue + outTangent / 3;
                const controlPoint1Value = currentValue - inTangent / 3;

                pathData += ` C${convertX(controlPoint0Frame)} ${convertY(controlPoint0Value)}, ${convertX(controlPoint1Frame)} ${convertY(controlPoint1Value)}, ${convertX(currentFrame)} ${convertY(currentValue)}`;
            //} else {
                //pathData += ` L${convertX(keys[keyIndex].frame)} ${convertY(keys[keyIndex].value)}`;
           // }
        }

        return pathData;
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