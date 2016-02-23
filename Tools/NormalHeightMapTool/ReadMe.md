Normal/Height Map Tool
======================

This little command line tool is used to perform these tasks:

- Pack two distinct normal map and height map files into a single one, store the height in the alpha channel.

- Perform Color based invert on R and/or G channel of a normal map to reoriente the normal vector.

You can find a single .exe file in the Redist folder, if you build the project beware that the ImageProcessor.dll must be merged or bring along with the exe.


### Command line usage:
```
 To pack a normal map file and a height map file in one single file (height map will be stored in alpha channel and the value will be taken in the Red component of the source heightmap if -heightmapchannel is not specified):
 -pack -normalmap:<filepathname> -heightmap:<filepathname> [-heightmapchannel:R|G|B|A] -save:<targetfilepathname>

 To invert the R &| G component of a normal map:
 -invert:<normalmapfilepathname> [-R] [-G] -save:<targetfilepathname>
```

### Acknowledgement
This tool use the [ImageProcessor library](http://imageprocessor.org/)

Exe+dll are merged thanks to [ILMerge-GUI](http://ilmergegui.codeplex.com//)