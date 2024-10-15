import { AbstractMainAudioBus } from "../abstractMainAudioBus";
import type { WebAudioEngine } from "./webAudioEngine";

export class WebAudioMainBus extends AbstractMainAudioBus {
    public constructor(name: string, engine: WebAudioEngine) {
        super(name, engine);
    }
}
