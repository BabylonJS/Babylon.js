import * as Recast from "@recast-navigation/core";
import * as Generators from "@recast-navigation/generators";

await Recast.init();
window.Recast = Recast;
window.RecastGenerators = Generators;
