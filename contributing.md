# Contributing to Babylon.js

## Golden rules

**Babylon.js** is built upon 3 golden rules:

1. You cannot add code that will break backward compatibility
2. You cannot add code that will slow down the rendering process
3. You cannot add code that will make things complex to use

### Backward compatibility

The first golden rule is a really important one because we want our users to trust Babylon.js. And when we need to introduce something that will break backward compatibility, we know that it will imply more work for our customers to switch to a new version. So even if something could be simpler to do by breaking the backward compatibility, we will not do it (exceptions may apply of course if there is a problem with performance or if this is related to a bug).

### Performance

Babylon.js is a 3D rendering engine. So every piece of code has to be scrutinized to look for potential bottlenecks or slow downs. Ultimately the goal is to render more with less resources.

### Simplicity

A developer should be able to quickly and easily learn to use the API. 

Simplicity and a low barrier to entry are must-have features of every API. If you have any second thoughts about the complexity of a design, it is almost always much better to cut the feature from the current release and spend more time to get the design right for the next release. 

You can always add to an API, you cannot ever remove anything from one. If the design does not feel right, and you ship it anyway, you are likely to regret having done so.

## Forum and Github issues

Since the very beginning, Babylon.js relies on a great forum and a tremendous community: https://forum.babylonjs.com/.
Please use the forum for **ANY questions you may have**.

Please use the Github issues (after discussing them on the forum) **only** for:
- Bugs
- Feature requests

We will try to enforce these rules as we consider the forum is a better place for discussions and learnings.

## Online one-click setup for Contributing

You can use Gitpod (A free online VS Code like IDE) for contributing online. With a single click it'll launch a workspace and automatically:

- clone the BabylonJS repo.
- install the dependencies.
- run `npm run start` in `Tools/Gulp`.

so that you can start straight away.

[![Open in Gitpod](https://gitpod.io/button/open-in-gitpod.svg)](https://gitpod.io/#https://github.com/BabylonJS/Babylon.js)

## Pull requests

We are not complicated people, but we still have some [coding guidelines](http://doc.babylonjs.com/how_to/approved_naming_conventions)
Before submitting your PR, just check that everything goes well by [creating the minified version](http://doc.babylonjs.com/resources/creating_the_mini-fied_version)

You should read the [how to contribute documentation](http://doc.babylonjs.com/how_to/how_to_start) before working on your PR.
  
To validate your PR, please follow these steps:
- Run "gulp" locally and make sure that no error is generated
- Make sure that all public functions and classes are commented using JSDoc syntax
- Make sure to add a line about your PR in the [what's new](https://github.com/BabylonJS/Babylon.js/blob/master/dist/preview%20release/what's%20new.md)
  
 ## What should go where?

In order to not bloat the core engine with unwanted or unnecessary features (that we will need to maintain forever), here is a list of questions you could ask yourself before submitting a new feature (or feature request) for Babylon.js core engine:
- Does my feature belong to a framework library?
- Can my feature be used by multiple different applications?
- Is there a general use case for this feature?
- Does this feature already exist in a similar framework?

If your PR is does not fall into the core category you can consider using our [Extensions repo](https://github.com/BabylonJS/Extensions) for more high level features.
