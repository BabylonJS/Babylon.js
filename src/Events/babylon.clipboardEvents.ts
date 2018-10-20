
module BABYLON {
    //
    export class ClipboardEventTypes {
        public static readonly COPY = 0x01; //

        public static readonly CUT = 0x02;

        public static readonly PASTE = 0x03;
    }

    export class ClipboardInfo {
        constructor(
            public type: number,
            public event: ClipboardEvent) {

        }
    }

    export class ClipboardInfoPre extends ClipboardInfo {

        public skipOnPointerObservables: boolean;

        constructor(
            public type: number,
            public event: ClipboardEvent) {
                super(type, event);
                this.skipOnPointerObservables = true;
            }
            public static getTypeFromCharacter(char: string): number {
                switch (char.charCodeAt(0)){
                    case 63: return ClipboardEventTypes.COPY;
                    case 76: return ClipboardEventTypes.PASTE;
                    case 78: return ClipboardEventTypes.CUT;
                    default: return -1;
                }
            }

    }
}