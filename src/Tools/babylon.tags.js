var BABYLON;
(function (BABYLON) {
    var Tags = (function () {
        function Tags() {
        }
        Tags.EnableFor = function (obj) {
            obj._tags = obj._tags || {};
            obj.hasTags = function () {
                return Tags.HasTags(obj);
            };
            obj.addTags = function (tagsString) {
                return Tags.AddTagsTo(obj, tagsString);
            };
            obj.removeTags = function (tagsString) {
                return Tags.RemoveTagsFrom(obj, tagsString);
            };
            obj.matchesTagsQuery = function (tagsQuery) {
                return Tags.MatchesQuery(obj, tagsQuery);
            };
        };
        Tags.DisableFor = function (obj) {
            delete obj._tags;
            delete obj.hasTags;
            delete obj.addTags;
            delete obj.removeTags;
            delete obj.matchesTagsQuery;
        };
        Tags.HasTags = function (obj) {
            if (!obj._tags) {
                return false;
            }
            return !BABYLON.Tools.IsEmpty(obj._tags);
        };
        Tags.GetTags = function (obj, asString) {
            if (asString === void 0) { asString = true; }
            if (!obj._tags) {
                return null;
            }
            if (asString) {
                var tagsArray = [];
                for (var tag in obj._tags) {
                    if (obj._tags.hasOwnProperty(tag) && obj._tags[tag] === true) {
                        tagsArray.push(tag);
                    }
                }
                return tagsArray.join(" ");
            }
            else {
                return obj._tags;
            }
        };
        // the tags 'true' and 'false' are reserved and cannot be used as tags
        // a tag cannot start with '||', '&&', and '!'
        // it cannot contain whitespaces
        Tags.AddTagsTo = function (obj, tagsString) {
            if (!tagsString) {
                return;
            }
            if (typeof tagsString !== "string") {
                return;
            }
            var tags = tagsString.split(" ");
            for (var t in tags) {
                Tags._AddTagTo(obj, tags[t]);
            }
        };
        Tags._AddTagTo = function (obj, tag) {
            tag = tag.trim();
            if (tag === "" || tag === "true" || tag === "false") {
                return;
            }
            if (tag.match(/[\s]/) || tag.match(/^([!]|([|]|[&]){2})/)) {
                return;
            }
            Tags.EnableFor(obj);
            obj._tags[tag] = true;
        };
        Tags.RemoveTagsFrom = function (obj, tagsString) {
            if (!Tags.HasTags(obj)) {
                return;
            }
            var tags = tagsString.split(" ");
            for (var t in tags) {
                Tags._RemoveTagFrom(obj, tags[t]);
            }
        };
        Tags._RemoveTagFrom = function (obj, tag) {
            delete obj._tags[tag];
        };
        Tags.MatchesQuery = function (obj, tagsQuery) {
            if (tagsQuery === undefined) {
                return true;
            }
            if (tagsQuery === "") {
                return Tags.HasTags(obj);
            }
            return BABYLON.Internals.AndOrNotEvaluator.Eval(tagsQuery, function (r) { return Tags.HasTags(obj) && obj._tags[r]; });
        };
        return Tags;
    })();
    BABYLON.Tags = Tags;
})(BABYLON || (BABYLON = {}));
