@ECHO OFF
IF NOT EXIST bin MD bin
IF NOT EXIST bin\Release MD bin\Release
csc.exe /out:bin\Release\FreeImageNET.dll /target:library /doc:bin\Release\FreeImageNET.XML /debug- /o /nowarn:419 /unsafe+ /filealign:512 /recurse:*.cs
IF EXIST ..\Bin copy bin\Release\FreeImageNET.dll ..\Bin > NUL
IF EXIST ..\Bin copy bin\Release\FreeImageNET.XML ..\Bin > NUL
pause