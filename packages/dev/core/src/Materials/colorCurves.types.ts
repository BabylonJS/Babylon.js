/* eslint-disable @typescript-eslint/naming-convention */
import { type ColorCurvesBind, type ColorCurvesParse } from "./colorCurves.pure";

type ColorCurvesBindType = typeof ColorCurvesBind;
type ColorCurvesParseType = typeof ColorCurvesParse;

declare module "./colorCurves.pure" {
    namespace ColorCurves {
        export let Bind: ColorCurvesBindType;
        export let Parse: ColorCurvesParseType;
    }
}
