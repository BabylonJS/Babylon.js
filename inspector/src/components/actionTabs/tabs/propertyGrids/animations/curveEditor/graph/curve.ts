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
    public tangentBuilder?: () => any;

    public static readonly TangentLength = 50;

    public constructor(color: string, animation: Animation, property?: string, tangentBuilder?: () => any) {
        this.color = color;
        this.animation = animation;
        this.property = property;
        this.tangentBuilder = tangentBuilder;
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
            const frameDist = currentFrame - prevFrame;

            let controlPoint0Frame = prevFrame + frameDist / 2;
            let controlPoint1Frame = prevFrame + frameDist / 2;

            let controlPoint0Value: number;
            let controlPoint1Value: number;

            if (outTangent) {
                controlPoint0Frame = prevFrame + outTangent / 3;
                controlPoint0Value = prevValue + outTangent / 3;
            } else {
                const animEval = this.animation.evaluate(controlPoint0Frame);
                controlPoint0Value = this.property ? animEval[this.property] : animEval;
            }

            if (inTangent) {
                controlPoint1Frame = currentFrame - inTangent / 3;
                controlPoint1Value = currentValue - inTangent / 3;
            } else {
                const animEval = this.animation.evaluate(controlPoint1Frame);
                controlPoint1Value = this.property ? animEval[this.property] : animEval;
            }

            pathData += ` C${convertX(controlPoint0Frame)} ${convertY(controlPoint0Value)}, ${convertX(controlPoint1Frame)} ${convertY(controlPoint1Value)}, ${convertX(currentFrame)} ${convertY(currentValue)}`;
        }

        return pathData;
    }

    public getInControlPoint(keyIndex: number, length: number) {
        if (keyIndex === 0) {
            return 0;
        }

        const keys = this.keys;
        let inTangent = keys[keyIndex].inTangent;

        if (!inTangent) {
            const prevFrame = keys[keyIndex - 1].frame;                
            const currentFrame = keys[keyIndex].frame;
            const midFrame = prevFrame + (currentFrame - prevFrame) / 2;

            const evaluatedValueEntry = this.animation.evaluate(midFrame);
            let evaluatedValue = 0;

            if (this.property) {
                evaluatedValue = evaluatedValueEntry[this.property];
            }

            inTangent = (keys[keyIndex].value - evaluatedValue) / (currentFrame - midFrame);
        }

        return length * inTangent;
    }

    public getOutControlPoint(keyIndex: number, length: number) {
        const keys = this.keys;        
        if (keyIndex === keys.length - 1) {
            return 0;
        }

        let outTangent = keys[keyIndex].outTangent;

        if (!outTangent) {
            const prevFrame = keys[keyIndex].frame;                
            const currentFrame = keys[keyIndex + 1].frame;
            const midFrame = prevFrame + (currentFrame - prevFrame) / 2;

            const evaluatedValueEntry = this.animation.evaluate(midFrame);
            let evaluatedValue = 0;

            if (this.property) {
                evaluatedValue = evaluatedValueEntry[this.property];
            }

            outTangent = (evaluatedValue - keys[keyIndex].value) / (currentFrame - midFrame);
        }

        return length * outTangent;
    }

    public updateInTangentFromControlPoint(keyId: number, slope: number) {
        this.keys[keyId].inTangent = slope;

        if (this.property) {
            if (!this.animation.getKeys()[keyId].inTangent) {
                this.animation.getKeys()[keyId].inTangent = this.tangentBuilder!();
            }

            this.animation.getKeys()[keyId].inTangent[this.property] = this.keys[keyId].inTangent;
        } else {
            this.animation.getKeys()[keyId].inTangent = this.keys[keyId].inTangent;
        }

        this.onDataUpdatedObservable.notifyObservers();
    }

    public updateOutTangentFromControlPoint(keyId: number, slope: number) {
        this.keys[keyId].outTangent = slope;

        if (this.property) {
            if (!this.animation.getKeys()[keyId].outTangent) {
                this.animation.getKeys()[keyId].outTangent = this.tangentBuilder!();
            }

            this.animation.getKeys()[keyId].outTangent[this.property] = this.keys[keyId].outTangent;
        } else {
            this.animation.getKeys()[keyId].outTangent = this.keys[keyId].outTangent;
        }

        this.onDataUpdatedObservable.notifyObservers();
    }


    public updateKeyFrame(keyId: number, frame: number) {
        const currentFrame = this.keys[keyId].frame;
        const originalKey = this.animation.getKeys()[keyId];
        originalKey.frame = frame;

        if (keyId > 0) {
            const oldWidth = currentFrame - this.keys[keyId - 1].frame;
            const newWidth = frame - this.keys[keyId - 1].frame;
            const previousOriginalKey = this.animation.getKeys()[keyId - 1];

            if (this.keys[keyId].inTangent) {
                const newInTangent = (this.keys[keyId].inTangent! / oldWidth) * newWidth;
                this.keys[keyId].inTangent = newInTangent;
                if (this.property) {
                    originalKey.inTangent[this.property] = newInTangent;
                } else {
                    originalKey.inTangent = newInTangent;
                }
            }

            if (this.keys[keyId - 1].outTangent) {
                const newOutTangent = (this.keys[keyId - 1].outTangent! / oldWidth) * newWidth;
                this.keys[keyId - 1].outTangent = newOutTangent;
                if (this.property) {
                    previousOriginalKey.outTangent[this.property] = newOutTangent;
                } else {
                    previousOriginalKey.outTangent = newOutTangent;
                }
            }
        }

        if (keyId < this.keys.length - 1) {
            const oldWidth = this.keys[keyId + 1].frame - currentFrame;
            const newWidth = this.keys[keyId + 1].frame - frame;            
            const nextOriginalKey = this.animation.getKeys()[keyId + 1];

            if (this.keys[keyId].outTangent) {
                const newOutTangent = (this.keys[keyId].outTangent! / oldWidth) * newWidth;
                this.keys[keyId].outTangent = newOutTangent;
                if (this.property) {
                    originalKey.outTangent[this.property] = newOutTangent;
                } else {
                    originalKey.outTangent = newOutTangent;
                }
            }

            if (this.keys[keyId + 1].inTangent) {
                const newInTangent = (this.keys[keyId + 1].inTangent! / oldWidth) * newWidth;
                this.keys[keyId + 1].inTangent = newInTangent;
                if (this.property) {
                    nextOriginalKey.inTangent[this.property] = newInTangent;
                } else {
                    nextOriginalKey.inTangent = newInTangent;
                }
            }
        }

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