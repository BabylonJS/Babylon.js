del dist\*.dll /s /q
del dist\*.lib /s /q
del dist\*.h /s /q
del *.ncb /s /q
del *.plg /s /q
del *.opt /s /q
del *.suo /s /q /a:h
del *.user /s /q
del *.log /s /q
del *.sdf /s /q
del test\page*.tiff
del test\*.png
del test\mpage*.tif
del test\clone*.tif
del test\redirect-stream.tif
rd dist\x64 /s /q
rd dist\x32 /s /q
rd Release /s /q
rd Debug /s /q
rd x64 /s /q
rd Win32 /s /q
rd test\x64 /s /q
rd test\Win32 /s /q
rd test\Debug /s /q
rd test\Release /s /q

