import { Vector2 } from "babylonjs/Maths/math.vector";
import { Animation } from "babylonjs/Animations/animation";
import { Nullable } from "babylonjs/types";
import { Observable } from "babylonjs/Misc/observable";

export class AnimationCurveEditorCurve {
    public keys = new Array<Vector2>(); 
    public animation: Animation;   
    public color: string;
    public onDataUpdatedObservable = new Observable<void>();
    public property?: string;
    public siblings: Nullable<Array<AnimationCurveEditorCurve>>;

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

        let pathData = `M${convertX(keys[0].x)} ${convertY(keys[0].y)}`;

        for (var keyIndex = 1; keyIndex < keys.length; keyIndex++) {
            pathData += ` L${convertX(keys[keyIndex].x)} ${convertY(keys[keyIndex].y)}`;
        }

        return pathData;
    }

    public updateKeyFrame(keyId: number, frame: number) {
        this.keys[keyId].x = frame;

        this.animation.getKeys()[keyId].frame = frame;

        this.onDataUpdatedObservable.notifyObservers();
    }

    public updateKeyValue(keyId: number, value: number) {
        this.keys[keyId].y = value;

        let sourceKey = this.animation.getKeys()[keyId];

        if (this.property) {
            sourceKey.value[this.property] = value;
        } else {
            sourceKey.value = value;
        }

        this.onDataUpdatedObservable.notifyObservers();
    }
}