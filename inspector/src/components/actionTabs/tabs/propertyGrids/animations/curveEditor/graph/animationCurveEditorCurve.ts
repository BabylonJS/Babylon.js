import { Vector2 } from "babylonjs/Maths/math.vector";
import { Animation } from "babylonjs/Animations/animation";

export class AnimationCurveEditorCurve {
    public keys = new Array<Vector2>(); 
    public animation: Animation;   
    public color: string;

    public constructor(color: string, animation: Animation) {
        this.color = color;
        this.animation = animation;
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
}