module BABYLON {
    export class Tags {
        public static EnableFor(obj: any): void {
            obj._tags = obj._tags || {};

            obj.hasTags = () => {
                return Tags.HasTags(obj);
            };

            obj.addTags = (tagsString: string) => {
                return Tags.AddTagsTo(obj, tagsString);
            };

            obj.removeTags = (tagsString: string) => {
                return Tags.RemoveTagsFrom(obj, tagsString);
            };

            obj.matchesTagsQuery = (tagsQuery: string) => {
                return Tags.MatchesQuery(obj, tagsQuery);
            };
        }

        public static DisableFor(obj: any): void {
            delete obj._tags;
            delete obj.hasTags;
            delete obj.addTags;
            delete obj.removeTags;
            delete obj.matchesTagsQuery;
        }

        public static HasTags(obj: any): boolean {
            if (!obj._tags) {
                return false;
            }
            return !Tools.IsEmpty(obj._tags);
        }

        public static GetTags(obj: any, asString: boolean = true): any {
            if (!obj._tags) {
                return null;
            }
            if (asString) {
                var tagsArray = []
                for (var tag in obj._tags) {
                    if (obj._tags.hasOwnProperty(tag) && obj._tags[tag] === true) {
                        tagsArray.push(tag);
                    }
                }
                return tagsArray.join(" ");
            } else {
                return obj._tags;
            }

        }

        // the tags 'true' and 'false' are reserved and cannot be used as tags
        // a tag cannot start with '||', '&&', and '!'
        // it cannot contain whitespaces
        public static AddTagsTo(obj: any, tagsString: string): void {
            if (!tagsString) {
                return;
            }

            if (typeof tagsString !== "string") {
                return;
            }

            var tags = tagsString.split(" ");
            tags.forEach( function(tag, index, array) {
                Tags._AddTagTo(obj, tag);
            });
        }

        public static _AddTagTo(obj: any, tag: string): void {
            tag = tag.trim();

            if (tag === "" || tag === "true" || tag === "false") {
                return;
            }

            if (tag.match(/[\s]/) || tag.match(/^([!]|([|]|[&]){2})/)) {
                return;
            }

            Tags.EnableFor(obj);
            obj._tags[tag] = true;
        }

        public static RemoveTagsFrom(obj: any, tagsString: string) {
            if (!Tags.HasTags(obj)) {
                return;
            }
            var tags = tagsString.split(" ");
            for (var t in tags) {
                Tags._RemoveTagFrom(obj, tags[t]);
            }
        }

        public static _RemoveTagFrom(obj: any, tag: string): void {
            delete obj._tags[tag];
        }

        public static MatchesQuery(obj: any, tagsQuery: string): boolean {
            if (tagsQuery === undefined) {
                return true;
            }

            if (tagsQuery === "") {
                return Tags.HasTags(obj);
            }

            return Internals.AndOrNotEvaluator.Eval(tagsQuery, r => Tags.HasTags(obj) && obj._tags[r]);
        }
    }
}
