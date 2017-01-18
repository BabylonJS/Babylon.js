echo off
REM create compressed textures for each .jpg & .png in the current directory
REM arg 1: Q when best image required, else D for developer quality

REM erasing of any previous file
erase ktx-batch.bat

for %%f in (*.jpg) do echo call ktx-files.bat %%f %%~nf 'N' '%1' >>ktx-batch.bat
for %%f in (*.png) do echo call ktx-files.bat %%f %%~nf 'Y' '%1' >>ktx-batch.bat