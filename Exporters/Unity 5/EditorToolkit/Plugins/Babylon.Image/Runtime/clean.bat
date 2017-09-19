@ECHO OFF

rd "Library\bin" /s /q
rd "Library\obj" /s /q

rd "Samples\Sample 01 - Loading and saving\bin" /s /q
rd "Samples\Sample 01 - Loading and saving\obj" /s /q

rd "Samples\Sample 02 - Multipaged bitmaps\bin" /s /q
rd "Samples\Sample 02 - Multipaged bitmaps\obj" /s /q

rd "Samples\Sample 03 - Allocating\bin" /s /q
rd "Samples\Sample 03 - Allocating\obj" /s /q

rd "Samples\Sample 04 - Getting bitmap informations\bin" /s /q
rd "Samples\Sample 04 - Getting bitmap informations\obj" /s /q

rd "Samples\Sample 05 - Working with pixels\bin" /s /q
rd "Samples\Sample 05 - Working with pixels\obj" /s /q

rd "Samples\Sample 06 - Converting\bin" /s /q
rd "Samples\Sample 06 - Converting\obj" /s /q

rd "Samples\Sample 07 - ICC Profiles\bin" /s /q
rd "Samples\Sample 07 - ICC Profiles\obj" /s /q

rd "Samples\Sample 08 - Creating a plugin\bin" /s /q
rd "Samples\Sample 08 - Creating a plugin\obj" /s /q

rd "Samples\Sample 09 - Working with streams\bin" /s /q
rd "Samples\Sample 09 - Working with streams\obj" /s /q

rd "Samples\Sample 10 - Metadata\bin" /s /q
rd "Samples\Sample 10 - Metadata\obj" /s /q

rd "Samples\Sample 11 - Using the FreeImageBitmap class\bin" /s /q
rd "Samples\Sample 11 - Using the FreeImageBitmap class\obj" /s /q

rd "SourceFileMerger\bin" /s /q
rd "SourceFileMerger\obj" /s /q

rd "UnitTest\bin" /s /q
rd "UnitTest\obj" /s /q

del "FreeImage.net.VisualState.xml"
del "TestResult.xml"
del *.suo /A:H /S /Q
del *.user /S /Q