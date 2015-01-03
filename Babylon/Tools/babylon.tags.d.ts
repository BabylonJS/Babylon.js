declare module BABYLON {
    class Tags {
        static EnableFor(obj: any): void;
        static DisableFor(obj: any): void;
        static HasTags(obj: any): boolean;
        static GetTags(obj: any): any;
        static AddTagsTo(obj: any, tagsString: string): void;
        static _AddTagTo(obj: any, tag: string): void;
        static RemoveTagsFrom(obj: any, tagsString: string): void;
        static _RemoveTagFrom(obj: any, tag: string): void;
        static MatchesQuery(obj: any, tagsQuery: string): boolean;
    }
}
