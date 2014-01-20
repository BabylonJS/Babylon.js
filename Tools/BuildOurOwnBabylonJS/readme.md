BuildOurOwnBabylonJS
====================

Tool to start playing with and tuning BabylonJS as soon as possible

(Paths in this file are relative to this file location.)

## Content
- BabylonJS folder: contains a Visual Studio 2010 project that links to the last version of babylon.js file (under ..\\..\\..\\),
                    to ..\\..\\..\\cannon.js and to all the files under ..\\..\\..\Babylon and ..\\..\\..\\Typescript
- BuildOurOwnBabylonJS: contains a Visual Studio 2010 project to create ourOwnBabylon.js with ourOwnBabylonJS.xml as input;
                        it also contains the executables (no need to compile the project to create ourOwnBabylon.js)
- BuildOurOwnBabylonJSServer: contains a Visual Studio 2010 project which is a simple MVC3 application with a single sample page;
                              this sample page includes ourOwnBabylon.js to load the [Train demo] (http://www.babylonjs.com/)

## Goal of it
[JSKompactor.exe](https://github.com/BabylonJS/Babylon.js/blob/master/Tools/BuildOurOwnBabylonJS/BuildOurOwnBabylonJS/executables/JSKompactor.exe) provided by Deltakosh enables you to pass a list of javascript files to create the minified version of Babylon.js.
[BuildOurOwnBabylonJS.bat](https://github.com/BabylonJS/Babylon.js/blob/master/Tools/BuildOurOwnBabylonJS/BuildOurOwnBabylonJS/executables/BuildOurOwnBabylonJS.bat) generates for your this list by dealing with dependencies defined in [ourOwnBabylonJS.xml](https://github.com/BabylonJS/Babylon.js/blob/master/Tools/BuildOurOwnBabylonJS/BuildOurOwnBabylonJS/ourOwnBabylonJS.xml)
By editing [ourOwnBabylonJS.xml](https://github.com/BabylonJS/Babylon.js/blob/master/Tools/BuildOurOwnBabylonJS/BuildOurOwnBabylonJS/ourOwnBabylonJS.xml), you customize this list to get only what needed from BabylonJS in [ourOwnBabylon.js](https://github.com/BabylonJS/Babylon.js/blob/master/Tools/BuildOurOwnBabylonJS/BuildOurOwnBabylonJS/ourOwnBabylon.js).
[ourOwnBabylon.js](https://github.com/BabylonJS/Babylon.js/blob/master/Tools/BuildOurOwnBabylonJS/BuildOurOwnBabylonJS/ourOwnBabylon.js) can be included in your project instead of the last version of Babylon.js.
Changes made in the separate files of Babylon.js will appear in [ourOwnBabylon.js](https://github.com/BabylonJS/Babylon.js/blob/master/Tools/BuildOurOwnBabylonJS/BuildOurOwnBabylonJS/ourOwnBabylon.js) once [BuildOurOwnBabylonJS.bat](https://github.com/BabylonJS/Babylon.js/blob/master/Tools/BuildOurOwnBabylonJS/BuildOurOwnBabylonJS/executables/BuildOurOwnBabylonJS.bat) has been run. 

## How to use it
- Edit the files that you want to modify under the files under ..\\..\\..\\Babylon, add new files too if you want and then update [babylonJS.xml](https://github.com/BabylonJS/Babylon.js/blob/master/Tools/BuildOurOwnBabylonJS/BuildOurOwnBabylonJS/babylonJS.xml) and [ourOwnBabylonJS.xml](https://github.com/BabylonJS/Babylon.js/blob/master/Tools/BuildOurOwnBabylonJS/BuildOurOwnBabylonJS/ourOwnBabylonJS.xml) accordingly
- Generate [ourOwnBabylon.js](https://github.com/BabylonJS/Babylon.js/blob/master/Tools/BuildOurOwnBabylonJS/BuildOurOwnBabylonJS/ourOwnBabylon.js). For this, you have two options:
   1. use [BuildOurOwnBabylonJS.bat](https://github.com/BabylonJS/Babylon.js/blob/master/Tools/BuildOurOwnBabylonJS/BuildOurOwnBabylonJS/executables/BuildOurOwnBabylonJS.bat)
   2. open in Visual Studio 2010 [BuildOurOwnBabylonJS.sln](https://github.com/BabylonJS/Babylon.js/blob/master/Tools/BuildOurOwnBabylonJS/BuildOurOwnBabylonJS.sln), set 'BuildOurOwnBabylonJSServer' as default project and then 'Build Solution'
- If you use i., include in your projects [ourOwnBabylon.js](https://github.com/BabylonJS/Babylon.js/blob/master/Tools/BuildOurOwnBabylonJS/BuildOurOwnBabylonJS/ourOwnBabylon.js) instead of including the last version of Babylon.js (or the files separately).
  If you use ii., 'Start Without Debugging'
  
## Use of the Visual Studio 2010 solution
- Open in Visual Studio 2010 [BuildOurOwnBabylonJS.sln](https://github.com/BabylonJS/Babylon.js/blob/master/Tools/BuildOurOwnBabylonJS/BuildOurOwnBabylonJS.sln), set 'BuildOurOwnBabylonJSServer' as default project
- **DO NOT MANUALLY ADD** files in [BabylonJS.csproj](https://github.com/BabylonJS/Babylon.js/blob/master/Tools/BuildOurOwnBabylonJS/BabylonJS/BabylonJS.csproj), they are automatically added thanks to wildcards.
  If you want to add files to extend BabylonJS, add them at the right place under ..\\..\\..\\Babylon, then 'Unload Project' for [BabylonJS.csproj](https://github.com/BabylonJS/Babylon.js/blob/master/Tools/BuildOurOwnBabylonJS/BabylonJS/BabylonJS.csproj) and 'Reload Project' for [BabylonJS.csproj](https://github.com/BabylonJS/Babylon.js/blob/master/Tools/BuildOurOwnBabylonJS/BabylonJS/BabylonJS.csproj)
- Edit all the files that you want directly inside Visual Studio 2010
- Add all your projects/demos by adding new Views under the Home folder of BuildOurOwnBabylonJS.csproj. Index.cshtml is an example to help you start.
- Anytime you modify javascript files or babylonJS.xml or ourOwnBabylonJS.xml, build the solution and refresh your page in your web browser to see the changes.

## Support
Please contact [Gwenaël Hagenmuller](mailto:gwenaelhagen@gmail.com)
