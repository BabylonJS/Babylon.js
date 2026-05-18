/* eslint-disable @typescript-eslint/naming-convention */
import { type TransformNodeParse } from "./transformNode.pure";

type TransformNodeParseType = typeof TransformNodeParse;

declare module "./transformNode.pure" {
    namespace TransformNode {
        export let Parse: TransformNodeParseType;
    }
}
