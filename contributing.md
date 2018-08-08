# Contributing to Babylon.js

The foundation of **Babylon.js** is simplicity. 

A developer should be able to quickly and easily learn to use the API. 

Simplicity and a low barrier to entry are must-have features of every API. If you have any second thoughts about the complexity of a design, it is almost always much better to cut the feature from the current release and spend more time to get the design right for the next release. 

You can always add to an API, you cannot ever remove anything from one. If the design does not feel right, and you ship it anyway, you are likely to regret having done so.

That's why many of the guidelines of this document are obvious and serve only one purpose: Simplicity.

## Forum and Github issues

Since the very beginning, Babylon.js relies on a great forum and a tremendous community: http://www.html5gamedevs.com/forum/16-babylonjs/.
Please use the forum for **ANY questions you may have**.

Please use the Github issues **only** for:
- Bugs
- Feature requests

We will try to enforce these rules as we consider the forum is a better place for discussions and learnings.

## Pull requests

We are not complicated people, but we still have some [coding guidelines](http://doc.babylonjs.com/how_to/approved_naming_conventions)
Before submitting your PR, just check that everything goes well by [creating the minified version](http://doc.babylonjs.com/resources/creating_the_mini-fied_version)

Need help contributing, here are some links:
- [Gulp](https://github.com/BabylonJS/Babylon.js/tree/master/Tools/Gulp) to build from command line.
- [VSCode Editor](https://code.visualstudio.com/), Microsoft Code editor, see [Julian Chenard's post](http://pixelcodr.com/tutos/contribute/contribute.html) a Microsoft code editor.
- [Forum thread](http://www.html5gamedevs.com/topic/20456-contributing-on-babylonjs/) for assistance from our very helpful family.
  
To validate your PR, please follow these steps:
- Run "gulp" locally and make sure that no error is generated
- Make sure that all public functions and classes are commented using JSDoc syntax
- Make sure to add a line about your PR in the [what's new](https://github.com/BabylonJS/Babylon.js/blob/master/dist/preview%20release/what's%20new.md)
  
 ## What should go where?

In order to not bloat the core engine with unwanted or unnecessary features, here is a list of questions you could ask yourself before submitting a new feature (or feature request) for Babylon.js core engine:
- Does my feature belong to a framework library?
- Can my feature be used by multiple different applications?
- Is there a general use case for this feature?
- Does this feature already exist in a similar framework?

If your PR is does not fall into the core category you can consider using our [Extensions repo](https://github.com/BabylonJS/Extensions) for more high level features.
