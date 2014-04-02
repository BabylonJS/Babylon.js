BuildOurOwnBabylonJS
====================

Tool to start playing with (and tuning) BabylonJS as soon as possible

==Paths in this file are relative to this file location==

# Content
- BabylonJS folder: contains a Visual Studio 2013 project that links to the last version of babylon.js file (under ..\\..\\..\\), to ..\\..\\..\\cannon.js and to all the files under ..\\..\\..\\Babylon and ..\\..\\..\\Typescript.

- BuildOurOwnBabylonJS: contains a Visual Studio 2013 project to create ourOwnBabylon.js with ourOwnBabylonJS.xml as input; it also contains the executables (no need to compile the project to create ourOwnBabylon.js).

- BuildOurOwnBabylonJSServer: contains a Visual Studio 2013 project which is a simple MVC3 application with a home page that enables you to select the BabylonJS demo that you want to load; each demo uses [ourOwnBabylon.js](https://github.com/BabylonJS/Babylon.js/blob/master/Tools/BuildOurOwnBabylonJS/BuildOurOwnBabylonJS/ourOwnBabylon.js) to load the corresponding demo (one of the [Samples repository](https://github.com/BabylonJS/Samples)). Another controller is also provided to be able to load your own demos using [ourOwnBabylon.js](https://github.com/BabylonJS/Babylon.js/blob/master/Tools/BuildOurOwnBabylonJS/BuildOurOwnBabylonJS/ourOwnBabylon.js) (more about it in 'Use of the Visual Studio 2013 solution').

# Goal of it
[JSKompactor.exe](https://github.com/BabylonJS/Babylon.js/blob/master/Tools/BuildOurOwnBabylonJS/BuildOurOwnBabylonJS/executables/JSKompactor.exe) provided by Deltakosh enables you to pass a list of javascript files to create the minified version of Babylon.js.
[BuildOurOwnBabylonJS.bat](https://github.com/BabylonJS/Babylon.js/blob/master/Tools/BuildOurOwnBabylonJS/BuildOurOwnBabylonJS/executables/BuildOurOwnBabylonJS.bat) generates for your this list by dealing with dependencies defined in [ourOwnBabylonJS.xml](https://github.com/BabylonJS/Babylon.js/blob/master/Tools/BuildOurOwnBabylonJS/BuildOurOwnBabylonJS/ourOwnBabylonJS.xml)
By editing [ourOwnBabylonJS.xml](https://github.com/BabylonJS/Babylon.js/blob/master/Tools/BuildOurOwnBabylonJS/BuildOurOwnBabylonJS/ourOwnBabylonJS.xml), you customize this list to get only what needed from BabylonJS in [ourOwnBabylon.js](https://github.com/BabylonJS/Babylon.js/blob/master/Tools/BuildOurOwnBabylonJS/BuildOurOwnBabylonJS/ourOwnBabylon.js).
[ourOwnBabylon.js](https://github.com/BabylonJS/Babylon.js/blob/master/Tools/BuildOurOwnBabylonJS/BuildOurOwnBabylonJS/ourOwnBabylon.js) can be included in your project instead of the last version of Babylon.js.
Changes made in the separate files of Babylon.js will appear in [ourOwnBabylon.js](https://github.com/BabylonJS/Babylon.js/blob/master/Tools/BuildOurOwnBabylonJS/BuildOurOwnBabylonJS/ourOwnBabylon.js) once [BuildOurOwnBabylonJS.bat](https://github.com/BabylonJS/Babylon.js/blob/master/Tools/BuildOurOwnBabylonJS/BuildOurOwnBabylonJS/executables/BuildOurOwnBabylonJS.bat) has been run. 

# How to use it
- Edit the files that you want to modify under ..\\..\\..\\Babylon (add new files too if you want so) and then update [babylonJS.xml](https://github.com/BabylonJS/Babylon.js/blob/master/Tools/BuildOurOwnBabylonJS/BuildOurOwnBabylonJS/babylonJS.xml) and [ourOwnBabylonJS.xml](https://github.com/BabylonJS/Babylon.js/blob/master/Tools/BuildOurOwnBabylonJS/BuildOurOwnBabylonJS/ourOwnBabylonJS.xml) accordingly.

- Generate [ourOwnBabylon.js](https://github.com/BabylonJS/Babylon.js/blob/master/Tools/BuildOurOwnBabylonJS/BuildOurOwnBabylonJS/ourOwnBabylon.js). For this, you have two options:
   1. use [BuildOurOwnBabylonJS.bat](https://github.com/BabylonJS/Babylon.js/blob/master/Tools/BuildOurOwnBabylonJS/BuildOurOwnBabylonJS/executables/BuildOurOwnBabylonJS.bat)
   2. open in Visual Studio 2013 [BuildOurOwnBabylonJS.sln](https://github.com/BabylonJS/Babylon.js/blob/master/Tools/BuildOurOwnBabylonJS/BuildOurOwnBabylonJS.sln), set 'BuildOurOwnBabylonJSServer' as default project and then 'Build Solution'

- If you use 1., include in your projects [ourOwnBabylon.js](https://github.com/BabylonJS/Babylon.js/blob/master/Tools/BuildOurOwnBabylonJS/BuildOurOwnBabylonJS/ourOwnBabylon.js) instead of including the last version of Babylon.js (or the files separately).
  If you use 2., 'Start Without Debugging'.
  
# Use of the Visual Studio 2013 solution

- - -
Once:

- First, if you need a local copy of [Samples repository](https://github.com/BabylonJS/Samples) to be able to test [ourOwnBabylon.js](https://github.com/BabylonJS/Babylon.js/blob/master/Tools/BuildOurOwnBabylonJS/BuildOurOwnBabylonJS/ourOwnBabylon.js) against the demos, and to create a batch file at the same location as this file (any funky name you will pick for it will work but 'BuildOurBabylonJS-startVS.bat' is a good name :) ). Put the two following lines in it:
```
set BabylonJSSamplesDirFullPath=C:\Users\Gwena\Documents\dev\git\GitHub\BabylonJS-Samples\
start "%PROGRAMFILES%\Microsoft Visual Studio 12.0\Common7\IDE\devenv.exe" BuildOurOwnBabylonJS.sln
```
Of course, you have to replace `C:\Users\Gwena\Documents\dev\git\GitHub\BabylonJS-Samples\` by the root folder of your local copy of [Samples repository](https://github.com/BabylonJS/Samples). ==**It must end by a '\\'**==.


- - -

- Double-click on BuildOurBabylonJS-startVS.bat (can be another name if you named it differently in the previous step). It will open the solution in Visual Studio 2013.

- Set 'BuildOurOwnBabylonJSServer' as default project.

- ==**DO NOT MANUALLY ADD**== files in [BabylonJS.csproj](https://github.com/BabylonJS/Babylon.js/blob/master/Tools/BuildOurOwnBabylonJS/BabylonJS/BabylonJS.csproj), they are automatically added thanks to wildcards.
  If you want to add files to extend BabylonJS, add them at the right place under ..\\..\\..\\Babylon, then 'Unload Project' for [BabylonJS.csproj](https://github.com/BabylonJS/Babylon.js/blob/master/Tools/BuildOurOwnBabylonJS/BabylonJS/BabylonJS.csproj) and 'Reload Project' for [BabylonJS.csproj](https://github.com/BabylonJS/Babylon.js/blob/master/Tools/BuildOurOwnBabylonJS/BabylonJS/BabylonJS.csproj).

- Edit all the files that you want directly inside Visual Studio 2013.

- Add all your projects/demos by adding new Views under BabylonJSServer\\Views\\OurDemo (BabylonJSServer\\Views\\sample.cshtml is an example to help you starting). Add your .babylon files and other resources under BabylonJSServer\\Views\\Content. ==**DO NOT MANUALLY ADD**== your files (views and .babylon) in [BuildOurOwnBabylonJSServer.csproj](https://github.com/BabylonJS/Babylon.js/blob/master/Tools/BuildOurOwnBabylonJS/BabylonJSServer/BuildOurOwnBabylonJSServer.csproj) and ==**DO NOT COMMIT THEM**==, they are yours.

- Anytime you modify javascript files or [babylonJS.xml](https://github.com/BabylonJS/Babylon.js/blob/master/Tools/BuildOurOwnBabylonJS/BuildOurOwnBabylonJS/babylonJS.xml) or [ourOwnBabylonJS.xml](https://github.com/BabylonJS/Babylon.js/blob/master/Tools/BuildOurOwnBabylonJS/BuildOurOwnBabylonJS/ourOwnBabylonJS.xml), build the solution and refresh your page in your web browser to see the changes.

# Test your demos

Please, first follow the previous section.

'Start Without Debugging' [BuildOurOwnBabylonJSServer.csproj](https://github.com/BabylonJS/Babylon.js/blob/master/Tools/BuildOurOwnBabylonJS/BabylonJSServer/BuildOurOwnBabylonJSServer.csproj).

Go to the following URL once you have replaced 'sample' by the name of your view without the extension and 'Dude' by the name of your own babylon scene file without the extension (if your view is in a child folder of OurDemo, you must provide it and your babylon scene file must be under the same relative folder to Content):
http://localhost:46970/OurDemo/Show?viewName=sample&fileBJS=Dude[&folder=MyDemos]

Note that `fileBJS` is a parameter passed to sample.cshtml thanks to `Model.Dictionary`. In your views you can access parameters of the query string and/or stored in the data of your post/get request thanks to `Model.Dictionary`. You can add as many parameters as a query string (or data) allows you to do and do things like this:
http://localhost:46970/OurDemo/Show?viewName=sample&babylonJS=Dude&shadersFolder=MyShaders[&folder=MyDemos]
You retrieve 'MyShaders' in your view with `Model.Dictionary["shadersFolder"]`

# Support
Please contact [Gwenaël Hagenmuller](http://www.html5gamedevs.com/user/5363-gwenael/) (you may have first create an account on [html5gamedev](http://www.html5gamedevs.com/index.php?app=core&module=global&section=register))
