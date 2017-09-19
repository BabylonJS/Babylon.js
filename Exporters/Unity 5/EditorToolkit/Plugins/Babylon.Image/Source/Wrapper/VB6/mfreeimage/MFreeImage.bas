Attribute VB_Name = "MFreeImage"
'// ==========================================================
'// Visual Basic Wrapper for FreeImage 3
'// Original FreeImage 3 functions and VB compatible derived functions
'// Design and implementation by
'// - Carsten Klein (cklein05@users.sourceforge.net)
'//
'// Main reference : Curland, Matthew., Advanced Visual Basic 6, Addison Wesley, ISBN 0201707128, (c) 2000
'//                  Steve McMahon, creator of the excellent site vbAccelerator at http://www.vbaccelerator.com/
'//                  MSDN Knowlede Base
'//
'// This file is part of FreeImage 3
'//
'// COVERED CODE IS PROVIDED UNDER THIS LICENSE ON AN "AS IS" BASIS, WITHOUT WARRANTY
'// OF ANY KIND, EITHER EXPRESSED OR IMPLIED, INCLUDING, WITHOUT LIMITATION, WARRANTIES
'// THAT THE COVERED CODE IS FREE OF DEFECTS, MERCHANTABLE, FIT FOR A PARTICULAR PURPOSE
'// OR NON-INFRINGING. THE ENTIRE RISK AS TO THE QUALITY AND PERFORMANCE OF THE COVERED
'// CODE IS WITH YOU. SHOULD ANY COVERED CODE PROVE DEFECTIVE IN ANY RESPECT, YOU (NOT
'// THE INITIAL DEVELOPER OR ANY OTHER CONTRIBUTOR) ASSUME THE COST OF ANY NECESSARY
'// SERVICING, REPAIR OR CORRECTION. THIS DISCLAIMER OF WARRANTY CONSTITUTES AN ESSENTIAL
'// PART OF THIS LICENSE. NO USE OF ANY COVERED CODE IS AUTHORIZED HEREUNDER EXCEPT UNDER
'// THIS DISCLAIMER.
'//
'// Use at your own risk!
'// ==========================================================

'// ==========================================================
'// CVS
'// $Revision: 2.23 $
'// $Date: 2014/08/08 06:53:12 $
'// $Id: MFreeImage.bas,v 2.23 2014/08/08 06:53:12 cklein05 Exp $
'// ==========================================================


Option Explicit


'--------------------------------------------------------------------------------
' Win32 API function, structure and constant declarations
'--------------------------------------------------------------------------------

Private Const ERROR_SUCCESS As Long = 0

'KERNEL32
Private Declare Sub CopyMemory Lib "kernel32.dll" Alias "RtlMoveMemory" ( _
    ByRef Destination As Any, _
    ByRef Source As Any, _
    ByVal Length As Long)
    
Private Declare Function lstrlen Lib "kernel32.dll" Alias "lstrlenA" ( _
    ByVal lpString As Long) As Long
    

'OLEAUT32
Private Declare Function OleCreatePictureIndirect Lib "oleaut32.dll" ( _
    ByRef lpPictDesc As PictDesc, _
    ByRef riid As Guid, _
    ByVal fOwn As Long, _
    ByRef lplpvObj As IPicture) As Long
    
Private Declare Function SafeArrayAllocDescriptor Lib "oleaut32.dll" ( _
    ByVal cDims As Long, _
    ByRef ppsaOut As Long) As Long
    
Private Declare Function SafeArrayDestroyDescriptor Lib "oleaut32.dll" ( _
    ByVal psa As Long) As Long
    
Private Declare Sub SafeArrayDestroyData Lib "oleaut32.dll" ( _
    ByVal psa As Long)
    
Private Declare Function OleTranslateColor Lib "oleaut32.dll" ( _
    ByVal clr As OLE_COLOR, _
    ByVal hPal As Long, _
    ByRef lpcolorref As Long) As Long
    
Private Const CLR_INVALID As Long = &HFFFF&


'SAFEARRAY
Private Const FADF_AUTO As Long = (&H1)
Private Const FADF_FIXEDSIZE As Long = (&H10)

Private Type SAVEARRAY1D
   cDims As Integer
   fFeatures As Integer
   cbElements As Long
   cLocks As Long
   pvData As Long
   cElements As Long
   lLbound As Long
End Type

Private Type SAVEARRAY2D
   cDims As Integer
   fFeatures As Integer
   cbElements As Long
   cLocks As Long
   pvData As Long
   cElements1 As Long
   lLbound1 As Long
   cElements2 As Long
   lLbound2 As Long
End Type


'MSVBVM60
Private Declare Function VarPtrArray Lib "msvbvm60.dll" Alias "VarPtr" ( _
    ByRef Ptr() As Any) As Long


'USER32
Private Declare Function ReleaseDC Lib "user32.dll" ( _
    ByVal hWnd As Long, _
    ByVal hDC As Long) As Long

Private Declare Function GetDC Lib "user32.dll" ( _
    ByVal hWnd As Long) As Long
    
Private Declare Function GetDesktopWindow Lib "user32.dll" () As Long
    
Private Declare Function GetDCEx Lib "user32.dll" ( _
    ByVal hWnd As Long, _
    ByVal hrgnclip As Long, _
    ByVal fdwOptions As Long) As Long

Private Const DCX_WINDOW As Long = &H1&
   
Private Declare Function GetWindowRect Lib "user32.dll" ( _
    ByVal hWnd As Long, _
    ByRef lpRect As RECT) As Long

Private Declare Function GetClientRect Lib "user32.dll" ( _
    ByVal hWnd As Long, _
    ByRef lpRect As RECT) As Long

Private Declare Function DestroyIcon Lib "user32.dll" ( _
    ByVal hIcon As Long) As Long

Private Declare Function CreateIconIndirect Lib "user32.dll" ( _
    ByRef piconinfo As ICONINFO) As Long

Private Type RECT
   Left As Long
   Top As Long
   Right As Long
   Bottom As Long
End Type

Private Type Guid
   Data1 As Long
   Data2 As Integer
   Data3 As Integer
   Data4(0 To 7) As Byte
End Type

Private Type PictDesc
   cbSizeofStruct As Long
   picType As Long
   hImage As Long
   xExt As Long
   yExt As Long
End Type

Private Type BITMAP_API
   bmType As Long
   bmWidth As Long
   bmHeight As Long
   bmWidthBytes As Long
   bmPlanes As Integer
   bmBitsPixel As Integer
   bmBits As Long
End Type

Private Type ICONINFO
   fIcon As Long
   xHotspot As Long
   yHotspot As Long
   hBmMask As Long
   hbmColor As Long
End Type

Private Type BLENDFUNCTION
  BlendOp As Byte
  BlendFlags As Byte
  SourceConstantAlpha As Byte
  AlphaFormat As Byte
End Type


'GDI32
Private Declare Function GetDeviceCaps Lib "gdi32.dll" ( _
    ByVal hDC As Long, _
    ByVal nIndex As Long) As Long
    
Private Const HORZRES As Long = 8
Private Const VERTRES As Long = 10

Private Declare Function GetStretchBltMode Lib "gdi32.dll" ( _
    ByVal hDC As Long) As Long

Private Declare Function SetStretchBltMode Lib "gdi32.dll" ( _
    ByVal hDC As Long, _
    ByVal nStretchMode As Long) As Long
    
Private Declare Function SetDIBitsToDevice Lib "gdi32.dll" ( _
    ByVal hDC As Long, _
    ByVal x As Long, _
    ByVal y As Long, _
    ByVal dx As Long, _
    ByVal dy As Long, _
    ByVal SrcX As Long, _
    ByVal SrcY As Long, _
    ByVal Scan As Long, _
    ByVal NumScans As Long, _
    ByVal Bits As Long, _
    ByVal BitsInfo As Long, _
    ByVal wUsage As Long) As Long
    
Private Declare Function StretchDIBits Lib "gdi32.dll" ( _
    ByVal hDC As Long, _
    ByVal x As Long, _
    ByVal y As Long, _
    ByVal dx As Long, _
    ByVal dy As Long, _
    ByVal SrcX As Long, _
    ByVal SrcY As Long, _
    ByVal wSrcWidth As Long, _
    ByVal wSrcHeight As Long, _
    ByVal lpBits As Long, _
    ByVal lpBitsInfo As Long, _
    ByVal wUsage As Long, _
    ByVal dwRop As Long) As Long
    
Private Declare Function CreateDIBitmap Lib "gdi32.dll" ( _
    ByVal hDC As Long, _
    ByVal lpInfoHeader As Long, _
    ByVal dwUsage As Long, _
    ByVal lpInitBits As Long, _
    ByVal lpInitInfo As Long, _
    ByVal wUsage As Long) As Long
    
Private Declare Function CreateDIBSection Lib "gdi32.dll" ( _
    ByVal hDC As Long, _
    ByVal pbmi As Long, _
    ByVal iUsage As Long, _
    ByRef ppvBits As Long, _
    ByVal hSection As Long, _
    ByVal dwOffset As Long) As Long

Private Const CBM_INIT As Long = &H4
    
Private Declare Function CreateCompatibleBitmap Lib "gdi32.dll" ( _
    ByVal hDC As Long, _
    ByVal nWidth As Long, _
    ByVal nHeight As Long) As Long

Private Declare Function CreateCompatibleDC Lib "gdi32.dll" ( _
    ByVal hDC As Long) As Long
    
Private Declare Function DeleteDC Lib "gdi32.dll" ( _
    ByVal hDC As Long) As Long
    
Private Declare Function BitBlt Lib "gdi32.dll" ( _
    ByVal hDestDC As Long, _
    ByVal x As Long, _
    ByVal y As Long, _
    ByVal nWidth As Long, _
    ByVal nHeight As Long, _
    ByVal hSrcDC As Long, _
    ByVal XSrc As Long, _
    ByVal YSrc As Long, _
    ByVal dwRop As Long) As Long
    
Private Declare Function GetDIBits Lib "gdi32.dll" ( _
    ByVal aHDC As Long, _
    ByVal hBitmap As Long, _
    ByVal nStartScan As Long, _
    ByVal nNumScans As Long, _
    ByVal lpBits As Long, _
    ByVal lpBI As Long, _
    ByVal wUsage As Long) As Long
    
Private Declare Function GetObjectAPI Lib "gdi32.dll" Alias "GetObjectA" ( _
    ByVal hObject As Long, _
    ByVal nCount As Long, _
    ByRef lpObject As Any) As Long
    
Private Declare Function SelectObject Lib "gdi32.dll" ( _
    ByVal hDC As Long, _
    ByVal hObject As Long) As Long

Private Declare Function DeleteObject Lib "gdi32.dll" ( _
    ByVal hObject As Long) As Long
    
Private Declare Function GetCurrentObject Lib "gdi32.dll" ( _
    ByVal hDC As Long, _
    ByVal uObjectType As Long) As Long

Private Const OBJ_BITMAP As Long = 7


'MSIMG32
Private Declare Function AlphaBlend Lib "msimg32.dll" ( _
    ByVal hdcDest As Long, _
    ByVal nXOriginDest As Long, _
    ByVal nYOriginDest As Long, _
    ByVal nWidthDest As Long, _
    ByVal nHeightDest As Long, _
    ByVal hdcSrc As Long, _
    ByVal nXOriginSrc As Long, _
    ByVal nYOriginSrc As Long, _
    ByVal nWidthSrc As Long, _
    ByVal nHeightSrc As Long, _
    ByVal lBlendFunction As Long) As Long

Private Const AC_SRC_OVER = &H0
Private Const AC_SRC_ALPHA = &H1

Private Const BLACKONWHITE As Long = 1
Private Const WHITEONBLACK As Long = 2
Private Const COLORONCOLOR As Long = 3

Public Enum STRETCH_MODE
   SM_BLACKONWHITE = BLACKONWHITE
   SM_WHITEONBLACK = WHITEONBLACK
   SM_COLORONCOLOR = COLORONCOLOR
End Enum

Private Const SRCAND As Long = &H8800C6
Private Const SRCCOPY As Long = &HCC0020
Private Const SRCERASE As Long = &H440328
Private Const SRCINVERT As Long = &H660046
Private Const SRCPAINT As Long = &HEE0086
Private Const CAPTUREBLT As Long = &H40000000

Public Enum RASTER_OPERATOR
   ROP_SRCAND = SRCAND
   ROP_SRCCOPY = SRCCOPY
   ROP_SRCERASE = SRCERASE
   ROP_SRCINVERT = SRCINVERT
   ROP_SRCPAINT = SRCPAINT
End Enum

Private Const DIB_PAL_COLORS As Long = 1
Private Const DIB_RGB_COLORS As Long = 0

Public Enum DRAW_MODE
   DM_DRAW_DEFAULT = &H0
   DM_MIRROR_NONE = DM_DRAW_DEFAULT
   DM_MIRROR_VERTICAL = &H1
   DM_MIRROR_HORIZONTAL = &H2
   DM_MIRROR_BOTH = DM_MIRROR_VERTICAL Or DM_MIRROR_HORIZONTAL
End Enum

Public Enum HISTOGRAM_ORIENTATION
   HOR_TOP_DOWN = &H0
   HOR_BOTTOM_UP = &H1
End Enum

'--------------------------------------------------------------------------------
' FreeImage 3 types, constants and enumerations
'--------------------------------------------------------------------------------

'FREEIMAGE

' Version information
Public Const FREEIMAGE_MAJOR_VERSION As Long = 3
Public Const FREEIMAGE_MINOR_VERSION As Long = 16
Public Const FREEIMAGE_RELEASE_SERIAL As Long = 0

' Memory stream pointer operation flags
Public Const SEEK_SET As Long = 0
Public Const SEEK_CUR As Long = 1
Public Const SEEK_END As Long = 2

' Indexes for byte arrays, masks and shifts for treating pixels as words
' These coincide with the order of RGBQUAD and RGBTRIPLE
' Little Endian (x86 / MS Windows, Linux) : BGR(A) order
Public Const FI_RGBA_RED As Long = 2
Public Const FI_RGBA_GREEN As Long = 1
Public Const FI_RGBA_BLUE As Long = 0
Public Const FI_RGBA_ALPHA As Long = 3
Public Const FI_RGBA_RED_MASK As Long = &HFF0000
Public Const FI_RGBA_GREEN_MASK As Long = &HFF00
Public Const FI_RGBA_BLUE_MASK As Long = &HFF
Public Const FI_RGBA_ALPHA_MASK As Long = &HFF000000
Public Const FI_RGBA_RED_SHIFT As Long = 16
Public Const FI_RGBA_GREEN_SHIFT As Long = 8
Public Const FI_RGBA_BLUE_SHIFT As Long = 0
Public Const FI_RGBA_ALPHA_SHIFT As Long = 24

' The 16 bit macros only include masks and shifts, since each color element is not byte aligned
Public Const FI16_555_RED_MASK As Long = &H7C00
Public Const FI16_555_GREEN_MASK As Long = &H3E0
Public Const FI16_555_BLUE_MASK As Long = &H1F
Public Const FI16_555_RED_SHIFT As Long = 10
Public Const FI16_555_GREEN_SHIFT As Long = 5
Public Const FI16_555_BLUE_SHIFT As Long = 0
Public Const FI16_565_RED_MASK As Long = &HF800
Public Const FI16_565_GREEN_MASK As Long = &H7E0
Public Const FI16_565_BLUE_MASK As Long = &H1F
Public Const FI16_565_RED_SHIFT As Long = 11
Public Const FI16_565_GREEN_SHIFT As Long = 5
Public Const FI16_565_BLUE_SHIFT As Long = 0

' ICC profile support
Public Const FIICC_DEFAULT As Long = &H0
Public Const FIICC_COLOR_IS_CMYK As Long = &H1

Private Const FREE_IMAGE_ICC_COLOR_MODEL_MASK As Long = &H1
Public Enum FREE_IMAGE_ICC_COLOR_MODEL
   FIICC_COLOR_MODEL_RGB = &H0
   FIICC_COLOR_MODEL_CMYK = &H1
End Enum

' Load / Save flag constants
Public Const FIF_LOAD_NOPIXELS = &H8000              ' load the image header only (not supported by all plugins)

Public Const BMP_DEFAULT As Long = 0
Public Const BMP_SAVE_RLE As Long = 1
Public Const CUT_DEFAULT As Long = 0
Public Const DDS_DEFAULT As Long = 0
Public Const EXR_DEFAULT As Long = 0                 ' save data as half with piz-based wavelet compression
Public Const EXR_FLOAT As Long = &H1                 ' save data as float instead of as half (not recommended)
Public Const EXR_NONE As Long = &H2                  ' save with no compression
Public Const EXR_ZIP As Long = &H4                   ' save with zlib compression, in blocks of 16 scan lines
Public Const EXR_PIZ As Long = &H8                   ' save with piz-based wavelet compression
Public Const EXR_PXR24 As Long = &H10                ' save with lossy 24-bit float compression
Public Const EXR_B44 As Long = &H20                  ' save with lossy 44% float compression - goes to 22% when combined with EXR_LC
Public Const EXR_LC As Long = &H40                   ' save images with one luminance and two chroma channels, rather than as RGB (lossy compression)
Public Const FAXG3_DEFAULT As Long = 0
Public Const GIF_DEFAULT As Long = 0
Public Const GIF_LOAD256 As Long = 1                 ' Load the image as a 256 color image with ununsed palette entries, if it's 16 or 2 color
Public Const GIF_PLAYBACK As Long = 2                ''Play' the GIF to generate each frame (as 32bpp) instead of returning raw frame data when loading
Public Const HDR_DEFAULT As Long = 0
Public Const ICO_DEFAULT As Long = 0
Public Const ICO_MAKEALPHA As Long = 1               ' convert to 32bpp and create an alpha channel from the AND-mask when loading
Public Const IFF_DEFAULT As Long = 0
Public Const J2K_DEFAULT  As Long = 0                ' save with a 16:1 rate
Public Const JP2_DEFAULT As Long = 0                 ' save with a 16:1 rate
Public Const JPEG_DEFAULT As Long = 0                ' loading (see JPEG_FAST); saving (see JPEG_QUALITYGOOD|JPEG_SUBSAMPLING_420)
Public Const JPEG_FAST As Long = &H1                 ' load the file as fast as possible, sacrificing some quality
Public Const JPEG_ACCURATE As Long = &H2             ' load the file with the best quality, sacrificing some speed
Public Const JPEG_CMYK As Long = &H4                 ' load separated CMYK "as is" (use 'OR' to combine with other flags)
Public Const JPEG_EXIFROTATE As Long = &H8           ' load and rotate according to Exif 'Orientation' tag if available
Public Const JPEG_GREYSCALE As Long = &H10           ' load and convert to a 8-bit greyscale image
Public Const JPEG_QUALITYSUPERB As Long = &H80       ' save with superb quality (100:1)
Public Const JPEG_QUALITYGOOD As Long = &H100        ' save with good quality (75:1)
Public Const JPEG_QUALITYNORMAL As Long = &H200      ' save with normal quality (50:1)
Public Const JPEG_QUALITYAVERAGE As Long = &H400     ' save with average quality (25:1)
Public Const JPEG_QUALITYBAD As Long = &H800         ' save with bad quality (10:1)
Public Const JPEG_PROGRESSIVE As Long = &H2000       ' save as a progressive-JPEG (use 'OR' to combine with other save flags)
Public Const JPEG_SUBSAMPLING_411 As Long = &H1000   ' save with high 4x1 chroma subsampling (4:1:1)
Public Const JPEG_SUBSAMPLING_420 As Long = &H4000   ' save with medium 2x2 medium chroma subsampling (4:2:0) - default value
Public Const JPEG_SUBSAMPLING_422 As Long = &H8000   ' save with low 2x1 chroma subsampling (4:2:2)
Public Const JPEG_SUBSAMPLING_444 As Long = &H10000  ' save with no chroma subsampling (4:4:4)
Public Const JPEG_OPTIMIZE As Long = &H20000         ' on saving, compute optimal Huffman coding tables (can reduce a few percent of file size)
Public Const JPEG_BASELINE As Long = &H40000         ' save basic JPEG, without metadata or any markers
Public Const KOALA_DEFAULT As Long = 0
Public Const LBM_DEFAULT As Long = 0
Public Const MNG_DEFAULT As Long = 0
Public Const PCD_DEFAULT As Long = 0
Public Const PCD_BASE As Long = 1                    ' load the bitmap sized 768 x 512
Public Const PCD_BASEDIV4 As Long = 2                ' load the bitmap sized 384 x 256
Public Const PCD_BASEDIV16 As Long = 3               ' load the bitmap sized 192 x 128
Public Const PCX_DEFAULT As Long = 0
Public Const PFM_DEFAULT As Long = 0
Public Const PICT_DEFAULT As Long = 0
Public Const PNG_DEFAULT As Long = 0
Public Const PNG_IGNOREGAMMA As Long = 1             ' avoid gamma correction
Public Const PNG_Z_BEST_SPEED As Long = &H1          ' save using ZLib level 1 compression flag (default value is 6)
Public Const PNG_Z_DEFAULT_COMPRESSION As Long = &H6 ' save using ZLib level 6 compression flag (default recommended value)
Public Const PNG_Z_BEST_COMPRESSION As Long = &H9    ' save using ZLib level 9 compression flag (default value is 6)
Public Const PNG_Z_NO_COMPRESSION As Long = &H100    ' save without ZLib compression
Public Const PNG_INTERLACED As Long = &H200          ' save using Adam7 interlacing (use | to combine with other save flags)
Public Const PNM_DEFAULT As Long = 0
Public Const PNM_SAVE_RAW As Long = 0                ' if set, the writer saves in RAW format (i.e. P4, P5 or P6)
Public Const PNM_SAVE_ASCII As Long = 1              ' if set, the writer saves in ASCII format (i.e. P1, P2 or P3)
Public Const PSD_DEFAULT As Long = 0
Public Const PSD_CMYK As Long = 1                    ' reads tags for separated CMYK (default is conversion to RGB)
Public Const PSD_LAB As Long = 2                     ' reads tags for CIELab (default is conversion to RGB)
Public Const RAS_DEFAULT As Long = 0
Public Const RAW_DEFAULT As Long = 0                 ' load the file as linear RGB 48-bit
Public Const RAW_PREVIEW As Long = 1                 ' try to load the embedded JPEG preview with included Exif Data or default to RGB 24-bit
Public Const RAW_DISPLAY As Long = 2                 ' load the file as RGB 24-bit
Public Const RAW_HALFSIZE As Long = 4                ' load the file as half-size color image
Public Const RAW_UNPROCESSED As Long = 8             ' load the file as FIT_UINT16 raw Bayer image
Public Const SGI_DEFAULT As Long = 0
Public Const TARGA_DEFAULT As Long = 0
Public Const TARGA_LOAD_RGB888 As Long = 1           ' if set, the loader converts RGB555 and ARGB8888 -> RGB888
Public Const TARGA_SAVE_RLE As Long = 2              ' if set, the writer saves with RLE compression
Public Const TIFF_DEFAULT As Long = 0
Public Const TIFF_CMYK As Long = &H1                 ' reads/stores tags for separated CMYK (use 'OR' to combine with compression flags)
Public Const TIFF_PACKBITS As Long = &H100           ' save using PACKBITS compression
Public Const TIFF_DEFLATE As Long = &H200            ' save using DEFLATE compression (a.k.a. ZLIB compression)
Public Const TIFF_ADOBE_DEFLATE As Long = &H400      ' save using ADOBE DEFLATE compression
Public Const TIFF_NONE As Long = &H800               ' save without any compression
Public Const TIFF_CCITTFAX3 As Long = &H1000         ' save using CCITT Group 3 fax encoding
Public Const TIFF_CCITTFAX4 As Long = &H2000         ' save using CCITT Group 4 fax encoding
Public Const TIFF_LZW As Long = &H4000               ' save using LZW compression
Public Const TIFF_JPEG As Long = &H8000              ' save using JPEG compression
Public Const TIFF_LOGLUV As Long = &H10000           ' save using LogLuv compression
Public Const WBMP_DEFAULT As Long = 0
Public Const XBM_DEFAULT As Long = 0
Public Const XPM_DEFAULT As Long = 0
Public Const WEBP_DEFAULT As Long = 0                ' save with good quality (75:1)
Public Const WEBP_LOSSLESS As Long = &H100           ' save in lossless mode
Public Const JXR_DEFAULT As Long = 0                 ' save with quality 80 and no chroma subsampling (4:4:4)
Public Const JXR_LOSSLESS As Long = &H64             ' save in lossless mode
Public Const JXR_PROGRESSIVE As Long = &H2000        ' save as a progressive-JXR (use Or to combine with other save flags)

' I/O image format identifiers
Public Enum FREE_IMAGE_FORMAT
   FIF_UNKNOWN = -1
   FIF_BMP = 0
   FIF_ICO = 1
   FIF_JPEG = 2
   FIF_JNG = 3
   FIF_KOALA = 4
   FIF_LBM = 5
   FIF_IFF = FIF_LBM
   FIF_MNG = 6
   FIF_PBM = 7
   FIF_PBMRAW = 8
   FIF_PCD = 9
   FIF_PCX = 10
   FIF_PGM = 11
   FIF_PGMRAW = 12
   FIF_PNG = 13
   FIF_PPM = 14
   FIF_PPMRAW = 15
   FIF_RAS = 16
   FIF_TARGA = 17
   FIF_TIFF = 18
   FIF_WBMP = 19
   FIF_PSD = 20
   FIF_CUT = 21
   FIF_XBM = 22
   FIF_XPM = 23
   FIF_DDS = 24
   FIF_GIF = 25
   FIF_HDR = 26
   FIF_FAXG3 = 27
   FIF_SGI = 28
   FIF_EXR = 29
   FIF_J2K = 30
   FIF_JP2 = 31
   FIF_PFM = 32
   FIF_PICT = 33
   FIF_RAW = 34
   FIF_WEBP = 35
   FIF_JXR = 36
End Enum

' Image load options
Public Enum FREE_IMAGE_LOAD_OPTIONS
   FILO_LOAD_NOPIXELS = FIF_LOAD_NOPIXELS         ' load the image header only (not supported by all plugins)
   FILO_LOAD_DEFAULT = 0
   FILO_GIF_DEFAULT = GIF_DEFAULT
   FILO_GIF_LOAD256 = GIF_LOAD256                 ' load the image as a 256 color image with ununsed palette entries, if it's 16 or 2 color
   FILO_GIF_PLAYBACK = GIF_PLAYBACK               ' 'play' the GIF to generate each frame (as 32bpp) instead of returning raw frame data when loading
   FILO_ICO_DEFAULT = ICO_DEFAULT
   FILO_ICO_MAKEALPHA = ICO_MAKEALPHA             ' convert to 32bpp and create an alpha channel from the AND-mask when loading
   FILO_JPEG_DEFAULT = JPEG_DEFAULT               ' for loading this is a synonym for FILO_JPEG_FAST
   FILO_JPEG_FAST = JPEG_FAST                     ' load the file as fast as possible, sacrificing some quality
   FILO_JPEG_ACCURATE = JPEG_ACCURATE             ' load the file with the best quality, sacrificing some speed
   FILO_JPEG_CMYK = JPEG_CMYK                     ' load separated CMYK "as is" (use 'OR' to combine with other load flags)
   FILO_JPEG_EXIFROTATE = JPEG_EXIFROTATE         ' load and rotate according to Exif 'Orientation' tag if available
   FILO_JPEG_GREYSCALE = JPEG_GREYSCALE           ' load and convert to a 8-bit greyscale image
   FILO_PCD_DEFAULT = PCD_DEFAULT
   FILO_PCD_BASE = PCD_BASE                       ' load the bitmap sized 768 x 512
   FILO_PCD_BASEDIV4 = PCD_BASEDIV4               ' load the bitmap sized 384 x 256
   FILO_PCD_BASEDIV16 = PCD_BASEDIV16             ' load the bitmap sized 192 x 128
   FILO_PNG_DEFAULT = PNG_DEFAULT
   FILO_PNG_IGNOREGAMMA = PNG_IGNOREGAMMA         ' avoid gamma correction
   FILO_PSD_CMYK = PSD_CMYK                       ' reads tags for separated CMYK (default is conversion to RGB)
   FILO_PSD_LAB = PSD_LAB                         ' reads tags for CIELab (default is conversion to RGB)
   FILO_RAW_DEFAULT = RAW_DEFAULT                 ' load the file as linear RGB 48-bit
   FILO_RAW_PREVIEW = RAW_PREVIEW                 ' try to load the embedded JPEG preview with included Exif Data or default to RGB 24-bit
   FILO_RAW_DISPLAY = RAW_DISPLAY                 ' load the file as RGB 24-bit
   FILO_RAW_HALFSIZE = RAW_HALFSIZE               ' load the file as half-size color image
   FILO_RAW_UNPROCESSED = RAW_UNPROCESSED         ' load the file as FIT_UINT16 raw Bayer image
   FILO_TARGA_DEFAULT = TARGA_LOAD_RGB888
   FILO_TARGA_LOAD_RGB888 = TARGA_LOAD_RGB888     ' if set, the loader converts RGB555 and ARGB8888 -> RGB888
   FISO_TIFF_DEFAULT = TIFF_DEFAULT
   FISO_TIFF_CMYK = TIFF_CMYK                     ' reads tags for separated CMYK
End Enum

' Image save options
Public Enum FREE_IMAGE_SAVE_OPTIONS
   FISO_SAVE_DEFAULT = 0
   FISO_BMP_DEFAULT = BMP_DEFAULT
   FISO_BMP_SAVE_RLE = BMP_SAVE_RLE
   FISO_EXR_DEFAULT = EXR_DEFAULT                 ' save data as half with piz-based wavelet compression
   FISO_EXR_FLOAT = EXR_FLOAT                     ' save data as float instead of as half (not recommended)
   FISO_EXR_NONE = EXR_NONE                       ' save with no compression
   FISO_EXR_ZIP = EXR_ZIP                         ' save with zlib compression, in blocks of 16 scan lines
   FISO_EXR_PIZ = EXR_PIZ                         ' save with piz-based wavelet compression
   FISO_EXR_PXR24 = EXR_PXR24                     ' save with lossy 24-bit float compression
   FISO_EXR_B44 = EXR_B44                         ' save with lossy 44% float compression - goes to 22% when combined with EXR_LC
   FISO_EXR_LC = EXR_LC                           ' save images with one luminance and two chroma channels, rather than as RGB (lossy compression)
   FISO_JPEG_DEFAULT = JPEG_DEFAULT               ' for saving this is a synonym for FISO_JPEG_QUALITYGOOD
   FISO_JPEG_QUALITYSUPERB = JPEG_QUALITYSUPERB   ' save with superb quality (100:1)
   FISO_JPEG_QUALITYGOOD = JPEG_QUALITYGOOD       ' save with good quality (75:1)
   FISO_JPEG_QUALITYNORMAL = JPEG_QUALITYNORMAL   ' save with normal quality (50:1)
   FISO_JPEG_QUALITYAVERAGE = JPEG_QUALITYAVERAGE ' save with average quality (25:1)
   FISO_JPEG_QUALITYBAD = JPEG_QUALITYBAD         ' save with bad quality (10:1)
   FISO_JPEG_PROGRESSIVE = JPEG_PROGRESSIVE       ' save as a progressive-JPEG (use 'OR' to combine with other save flags)
   FISO_JPEG_SUBSAMPLING_411 = JPEG_SUBSAMPLING_411      ' save with high 4x1 chroma subsampling (4:1:1)
   FISO_JPEG_SUBSAMPLING_420 = JPEG_SUBSAMPLING_420      ' save with medium 2x2 medium chroma subsampling (4:2:0) - default value
   FISO_JPEG_SUBSAMPLING_422 = JPEG_SUBSAMPLING_422      ' save with low 2x1 chroma subsampling (4:2:2)
   FISO_JPEG_SUBSAMPLING_444 = JPEG_SUBSAMPLING_444      ' save with no chroma subsampling (4:4:4)
   FISO_JPEG_OPTIMIZE = JPEG_OPTIMIZE                    ' compute optimal Huffman coding tables (can reduce a few percent of file size)
   FISO_JPEG_BASELINE = JPEG_BASELINE                    ' save basic JPEG, without metadata or any markers
   FISO_PNG_Z_BEST_SPEED = PNG_Z_BEST_SPEED              ' save using ZLib level 1 compression flag (default value is 6)
   FISO_PNG_Z_DEFAULT_COMPRESSION = PNG_Z_DEFAULT_COMPRESSION ' save using ZLib level 6 compression flag (default recommended value)
   FISO_PNG_Z_BEST_COMPRESSION = PNG_Z_BEST_COMPRESSION  ' save using ZLib level 9 compression flag (default value is 6)
   FISO_PNG_Z_NO_COMPRESSION = PNG_Z_NO_COMPRESSION      ' save without ZLib compression
   FISO_PNG_INTERLACED = PNG_INTERLACED           ' save using Adam7 interlacing (use | to combine with other save flags)
   FISO_PNM_DEFAULT = PNM_DEFAULT
   FISO_PNM_SAVE_RAW = PNM_SAVE_RAW               ' if set, the writer saves in RAW format (i.e. P4, P5 or P6)
   FISO_PNM_SAVE_ASCII = PNM_SAVE_ASCII           ' if set, the writer saves in ASCII format (i.e. P1, P2 or P3)
   FISO_TARGA_SAVE_RLE = TARGA_SAVE_RLE           ' if set, the writer saves with RLE compression
   FISO_TIFF_DEFAULT = TIFF_DEFAULT
   FISO_TIFF_CMYK = TIFF_CMYK                     ' stores tags for separated CMYK (use 'OR' to combine with compression flags)
   FISO_TIFF_PACKBITS = TIFF_PACKBITS             ' save using PACKBITS compression
   FISO_TIFF_DEFLATE = TIFF_DEFLATE               ' save using DEFLATE compression (a.k.a. ZLIB compression)
   FISO_TIFF_ADOBE_DEFLATE = TIFF_ADOBE_DEFLATE   ' save using ADOBE DEFLATE compression
   FISO_TIFF_NONE = TIFF_NONE                     ' save without any compression
   FISO_TIFF_CCITTFAX3 = TIFF_CCITTFAX3           ' save using CCITT Group 3 fax encoding
   FISO_TIFF_CCITTFAX4 = TIFF_CCITTFAX4           ' save using CCITT Group 4 fax encoding
   FISO_TIFF_LZW = TIFF_LZW                       ' save using LZW compression
   FISO_TIFF_JPEG = TIFF_JPEG                     ' save using JPEG compression
   FISO_TIFF_LOGLUV = TIFF_LOGLUV                 ' save using LogLuv compression
   FISO_WEBP_LOSSLESS = WEBP_LOSSLESS             ' save in lossless mode
   FISO_JXR_LOSSLESS = JXR_LOSSLESS               ' save in lossless mode
   FISO_JXR_PROGRESSIVE = JXR_PROGRESSIVE         ' save as a progressive-JXR (use Or to combine with other save flags)
End Enum

' Image types used in FreeImage
Public Enum FREE_IMAGE_TYPE
   FIT_UNKNOWN = 0           ' unknown type
   FIT_BITMAP = 1            ' standard image           : 1-, 4-, 8-, 16-, 24-, 32-bit
   FIT_UINT16 = 2            ' array of unsigned short  : unsigned 16-bit
   FIT_INT16 = 3             ' array of short           : signed 16-bit
   FIT_UINT32 = 4            ' array of unsigned long   : unsigned 32-bit
   FIT_INT32 = 5             ' array of long            : signed 32-bit
   FIT_FLOAT = 6             ' array of float           : 32-bit IEEE floating point
   FIT_DOUBLE = 7            ' array of double          : 64-bit IEEE floating point
   FIT_COMPLEX = 8           ' array of FICOMPLEX       : 2 x 64-bit IEEE floating point
   FIT_RGB16 = 9             ' 48-bit RGB image         : 3 x 16-bit
   FIT_RGBA16 = 10           ' 64-bit RGBA image        : 4 x 16-bit
   FIT_RGBF = 11             ' 96-bit RGB float image   : 3 x 32-bit IEEE floating point
   FIT_RGBAF = 12            ' 128-bit RGBA float image : 4 x 32-bit IEEE floating point
End Enum

' Image color types used in FreeImage
Public Enum FREE_IMAGE_COLOR_TYPE
   FIC_MINISWHITE = 0        ' min value is white
   FIC_MINISBLACK = 1        ' min value is black
   FIC_RGB = 2               ' RGB color model
   FIC_PALETTE = 3           ' color map indexed
   FIC_RGBALPHA = 4          ' RGB color model with alpha channel
   FIC_CMYK = 5              ' CMYK color model
End Enum

' Color quantization algorithm constants
Public Enum FREE_IMAGE_QUANTIZE
   FIQ_WUQUANT = 0           ' Xiaolin Wu color quantization algorithm
   FIQ_NNQUANT = 1           ' NeuQuant neural-net quantization algorithm by Anthony Dekker
End Enum

' Dithering algorithm constants
Public Enum FREE_IMAGE_DITHER
   FID_FS = 0                ' Floyd & Steinberg error diffusion
   FID_BAYER4x4 = 1          ' Bayer ordered dispersed dot dithering (order 2 dithering matrix)
   FID_BAYER8x8 = 2          ' Bayer ordered dispersed dot dithering (order 3 dithering matrix)
   FID_CLUSTER6x6 = 3        ' Ordered clustered dot dithering (order 3 - 6x6 matrix)
   FID_CLUSTER8x8 = 4        ' Ordered clustered dot dithering (order 4 - 8x8 matrix)
   FID_CLUSTER16x16 = 5      ' Ordered clustered dot dithering (order 8 - 16x16 matrix)
   FID_BAYER16x16 = 6        ' Bayer ordered dispersed dot dithering (order 4 dithering matrix)
End Enum

' Lossless JPEG transformation constants
Public Enum FREE_IMAGE_JPEG_OPERATION
   FIJPEG_OP_NONE = 0        ' no transformation
   FIJPEG_OP_FLIP_H = 1      ' horizontal flip
   FIJPEG_OP_FLIP_V = 2      ' vertical flip
   FIJPEG_OP_TRANSPOSE = 3   ' transpose across UL-to-LR axis
   FIJPEG_OP_TRANSVERSE = 4  ' transpose across UR-to-LL axis
   FIJPEG_OP_ROTATE_90 = 5   ' 90-degree clockwise rotation
   FIJPEG_OP_ROTATE_180 = 6  ' 180-degree rotation
   FIJPEG_OP_ROTATE_270 = 7  ' 270-degree clockwise (or 90 ccw)
End Enum

' Tone mapping operator constants
Public Enum FREE_IMAGE_TMO
   FITMO_DRAGO03 = 0         ' Adaptive logarithmic mapping (F. Drago, 2003)
   FITMO_REINHARD05 = 1      ' Dynamic range reduction inspired by photoreceptor physiology (E. Reinhard, 2005)
   FITMO_FATTAL02 = 2        ' Gradient domain high dynamic range compression (R. Fattal, 2002)
End Enum

' Up- / Downsampling filter constants
Public Enum FREE_IMAGE_FILTER
   FILTER_BOX = 0            ' Box, pulse, Fourier window, 1st order (constant) b-spline
   FILTER_BICUBIC = 1        ' Mitchell & Netravali's two-param cubic filter
   FILTER_BILINEAR = 2       ' Bilinear filter
   FILTER_BSPLINE = 3        ' 4th order (cubic) b-spline
   FILTER_CATMULLROM = 4     ' Catmull-Rom spline, Overhauser spline
   FILTER_LANCZOS3 = 5       ' Lanczos3 filter
End Enum

' Color channel constants
Public Enum FREE_IMAGE_COLOR_CHANNEL
   FICC_RGB = 0              ' Use red, green and blue channels
   FICC_RED = 1              ' Use red channel
   FICC_GREEN = 2            ' Use green channel
   FICC_BLUE = 3             ' Use blue channel
   FICC_ALPHA = 4            ' Use alpha channel
   FICC_BLACK = 5            ' Use black channel
   FICC_REAL = 6             ' Complex images: use real part
   FICC_IMAG = 7             ' Complex images: use imaginary part
   FICC_MAG = 8              ' Complex images: use magnitude
   FICC_PHASE = 9            ' Complex images: use phase
End Enum

' Tag data type information constants (based on TIFF specifications)
Public Enum FREE_IMAGE_MDTYPE
   FIDT_NOTYPE = 0           ' placeholder
   FIDT_BYTE = 1             ' 8-bit unsigned integer
   FIDT_ASCII = 2            ' 8-bit bytes w/ last byte null
   FIDT_SHORT = 3            ' 16-bit unsigned integer
   FIDT_LONG = 4             ' 32-bit unsigned integer
   FIDT_RATIONAL = 5         ' 64-bit unsigned fraction
   FIDT_SBYTE = 6            ' 8-bit signed integer
   FIDT_UNDEFINED = 7        ' 8-bit untyped data
   FIDT_SSHORT = 8           ' 16-bit signed integer
   FIDT_SLONG = 9            ' 32-bit signed integer
   FIDT_SRATIONAL = 10       ' 64-bit signed fraction
   FIDT_FLOAT = 11           ' 32-bit IEEE floating point
   FIDT_DOUBLE = 12          ' 64-bit IEEE floating point
   FIDT_IFD = 13             ' 32-bit unsigned integer (offset)
   FIDT_PALETTE = 14         ' 32-bit RGBQUAD
End Enum

' Metadata models supported by FreeImage
Public Enum FREE_IMAGE_MDMODEL
   FIMD_NODATA = -1          '
   FIMD_COMMENTS = 0         ' single comment or keywords
   FIMD_EXIF_MAIN = 1        ' Exif-TIFF metadata
   FIMD_EXIF_EXIF = 2        ' Exif-specific metadata
   FIMD_EXIF_GPS = 3         ' Exif GPS metadata
   FIMD_EXIF_MAKERNOTE = 4   ' Exif maker note metadata
   FIMD_EXIF_INTEROP = 5     ' Exif interoperability metadata
   FIMD_IPTC = 6             ' IPTC/NAA metadata
   FIMD_XMP = 7              ' Abobe XMP metadata
   FIMD_GEOTIFF = 8          ' GeoTIFF metadata
   FIMD_ANIMATION = 9        ' Animation metadata
   FIMD_CUSTOM = 10          ' Used to attach other metadata types to a dib
   FIMD_EXIF_RAW = 11        ' Exif metadata as a raw buffer
End Enum

' These are the GIF_DISPOSAL metadata constants
Public Enum FREE_IMAGE_FRAME_DISPOSAL_METHODS
   FIFD_GIF_DISPOSAL_UNSPECIFIED = 0
   FIFD_GIF_DISPOSAL_LEAVE = 1
   FIFD_GIF_DISPOSAL_BACKGROUND = 2
   FIFD_GIF_DISPOSAL_PREVIOUS = 3
End Enum

' Constants used in FreeImage_FillBackground and FreeImage_EnlargeCanvas
Public Enum FREE_IMAGE_COLOR_OPTIONS
   FI_COLOR_IS_RGB_COLOR = &H0          ' RGBQUAD color is a RGB color (contains no valid alpha channel)
   FI_COLOR_IS_RGBA_COLOR = &H1         ' RGBQUAD color is a RGBA color (contains a valid alpha channel)
   FI_COLOR_FIND_EQUAL_COLOR = &H2      ' For palettized images: lookup equal RGB color from palette
   FI_COLOR_ALPHA_IS_INDEX = &H4        ' The color's rgbReserved member (alpha) contains the palette index to be used
End Enum
Public Const FI_COLOR_PALETTE_SEARCH_MASK = _
      (FI_COLOR_FIND_EQUAL_COLOR Or FI_COLOR_ALPHA_IS_INDEX)     ' Flag to test, if any color lookup is performed

' The following enum constants are used by derived (wrapper) functions of the
' FreeImage 3 VB Wrapper
Public Enum FREE_IMAGE_CONVERSION_FLAGS
   FICF_MONOCHROME = &H1
   FICF_MONOCHROME_THRESHOLD = FICF_MONOCHROME
   FICF_MONOCHROME_DITHER = &H3
   FICF_GREYSCALE_4BPP = &H4
   FICF_PALLETISED_8BPP = &H8
   FICF_GREYSCALE_8BPP = FICF_PALLETISED_8BPP Or FICF_MONOCHROME
   FICF_GREYSCALE = FICF_GREYSCALE_8BPP
   FICF_RGB_15BPP = &HF
   FICF_RGB_16BPP = &H10
   FICF_RGB_24BPP = &H18
   FICF_RGB_32BPP = &H20
   FICF_RGB_ALPHA = FICF_RGB_32BPP
   FICF_KEEP_UNORDERED_GREYSCALE_PALETTE = &H0
   FICF_REORDER_GREYSCALE_PALETTE = &H1000
End Enum

Public Enum FREE_IMAGE_COLOR_DEPTH
   FICD_AUTO = &H0
   FICD_MONOCHROME = &H1
   FICD_MONOCHROME_THRESHOLD = FICF_MONOCHROME
   FICD_MONOCHROME_DITHER = &H3
   FICD_1BPP = FICD_MONOCHROME
   FICD_4BPP = &H4
   FICD_8BPP = &H8
   FICD_15BPP = &HF
   FICD_16BPP = &H10
   FICD_24BPP = &H18
   FICD_32BPP = &H20
End Enum

Public Enum FREE_IMAGE_ADJUST_MODE
   AM_STRECH = &H1
   AM_DEFAULT = AM_STRECH
   AM_ADJUST_BOTH = AM_STRECH
   AM_ADJUST_WIDTH = &H2
   AM_ADJUST_HEIGHT = &H4
   AM_ADJUST_OPTIMAL_SIZE = &H8
End Enum

Public Enum FREE_IMAGE_MASK_FLAGS
   FIMF_MASK_NONE = &H0
   FIMF_MASK_FULL_TRANSPARENCY = &H1
   FIMF_MASK_ALPHA_TRANSPARENCY = &H2
   FIMF_MASK_COLOR_TRANSPARENCY = &H4
   FIMF_MASK_FORCE_TRANSPARENCY = &H8
   FIMF_MASK_INVERSE_MASK = &H10
End Enum

Public Enum FREE_IMAGE_COLOR_FORMAT_FLAGS
   FICFF_COLOR_RGB = &H1
   FICFF_COLOR_BGR = &H2
   FICFF_COLOR_PALETTE_INDEX = &H4
   
   FICFF_COLOR_HAS_ALPHA = &H100
   
   FICFF_COLOR_ARGB = FICFF_COLOR_RGB Or FICFF_COLOR_HAS_ALPHA
   FICFF_COLOR_ABGR = FICFF_COLOR_BGR Or FICFF_COLOR_HAS_ALPHA
   
   FICFF_COLOR_FORMAT_ORDER_MASK = FICFF_COLOR_RGB Or FICFF_COLOR_BGR
End Enum

Public Enum FREE_IMAGE_MASK_CREATION_OPTION_FLAGS
   MCOF_CREATE_MASK_IMAGE = &H1
   MCOF_MODIFY_SOURCE_IMAGE = &H2
   MCOF_CREATE_AND_MODIFY = MCOF_CREATE_MASK_IMAGE Or MCOF_MODIFY_SOURCE_IMAGE
End Enum

Public Enum FREE_IMAGE_TRANSPARENCY_STATE_FLAGS
   FITSF_IGNORE_TRANSPARENCY = &H0
   FITSF_NONTRANSPARENT = &H1
   FITSF_TRANSPARENT = &H2
   FITSF_INCLUDE_ALPHA_TRANSPARENCY = &H4
End Enum

Public Enum FREE_IMAGE_ICON_TRANSPARENCY_OPTION_FLAGS
   ITOF_NO_TRANSPARENCY = &H0
   ITOF_USE_TRANSPARENCY_INFO = &H1
   ITOF_USE_TRANSPARENCY_INFO_ONLY = ITOF_USE_TRANSPARENCY_INFO
   ITOF_USE_COLOR_TRANSPARENCY = &H2
   ITOF_USE_COLOR_TRANSPARENCY_ONLY = ITOF_USE_COLOR_TRANSPARENCY
   ITOF_USE_TRANSPARENCY_INFO_OR_COLOR = ITOF_USE_TRANSPARENCY_INFO Or ITOF_USE_COLOR_TRANSPARENCY
   ITOF_USE_DEFAULT_TRANSPARENCY = ITOF_USE_TRANSPARENCY_INFO_OR_COLOR
   ITOF_USE_COLOR_TOP_LEFT_PIXEL = &H0
   ITOF_USE_COLOR_FIRST_PIXEL = ITOF_USE_COLOR_TOP_LEFT_PIXEL
   ITOF_USE_COLOR_TOP_RIGHT_PIXEL = &H20
   ITOF_USE_COLOR_BOTTOM_LEFT_PIXEL = &H40
   ITOF_USE_COLOR_BOTTOM_RIGHT_PIXEL = &H80
   ITOF_USE_COLOR_SPECIFIED = &H100
   ITOF_FORCE_TRANSPARENCY_INFO = &H400
End Enum

Private Const ITOF_USE_COLOR_BITMASK As Long = ITOF_USE_COLOR_TOP_RIGHT_PIXEL Or _
                                               ITOF_USE_COLOR_BOTTOM_LEFT_PIXEL Or _
                                               ITOF_USE_COLOR_BOTTOM_RIGHT_PIXEL Or _
                                               ITOF_USE_COLOR_SPECIFIED

Public Type RGBQUAD
   rgbBlue As Byte
   rgbGreen As Byte
   rgbRed As Byte
   rgbReserved As Byte
End Type

Public Type RGBTRIPLE
   rgbtBlue As Byte
   rgbtGreen As Byte
   rgbtRed As Byte
End Type

Public Type BITMAPINFOHEADER
   biSize As Long
   biWidth As Long
   biHeight As Long
   biPlanes As Integer
   biBitCount As Integer
   biCompression As Long
   biSizeImage As Long
   biXPelsPerMeter As Long
   biYPelsPerMeter As Long
   biClrUsed As Long
   biClrImportant As Long
End Type

Public Type BITMAPINFO
   bmiHeader As BITMAPINFOHEADER
   bmiColors(0) As RGBQUAD
End Type

Public Const BI_RGB As Long = 0
Public Const BI_RLE8 As Long = 1
Public Const BI_RLE4 As Long = 2
Public Const BI_BITFIELDS As Long = 3
Public Const BI_JPEG As Long = 4
Public Const BI_PNG As Long = 5

Public Type FIICCPROFILE
   Flags As Integer      ' info flag
   Size As Long          ' profile's size measured in bytes
   Data As Long          ' points to a block of contiguous memory containing the profile
End Type

' 48-bit RGB
Public Type FIRGB16
   Red As Integer
   Green As Integer
   Blue As Integer
End Type

' 64-bit RGBA
Public Type FIRGBA16
   Red As Integer
   Green As Integer
   Blue As Integer
   Alpha As Integer
End Type

' 96-bit RGB Float
Public Type FIRGBF
   Red As Single
   Green As Single
   Blue As Single
End Type

' 128-bit RGBA Float
Public Type FIRGBAF
   Red As Single
   Green As Single
   Blue As Single
   Alpha As Single
End Type

' data structure for COMPLEX type (complex number)
Public Type FICOMPLEX
   r As Double           ' real part
   i As Double           ' imaginary part
End Type

Public Type FITAG
   Key As Long
   Description As Long
   Id As Integer
   Type As Integer
   Count As Long
   Length As Long
   Value As Long
End Type

Public Type FIRATIONAL
   Numerator As Variant
   Denominator As Variant
End Type

Public Type FREE_IMAGE_TAG
   Model As FREE_IMAGE_MDMODEL
   TagPtr As Long
   Key As String
   Description As String
   Id As Long
   Type As FREE_IMAGE_MDTYPE
   Count As Long
   Length As Long
   StringValue As String
   Palette() As RGBQUAD
   RationalValue() As FIRATIONAL
   Value As Variant
End Type

Public Type FreeImageIO
   read_proc As Long
   write_proc As Long
   seek_proc As Long
   tell_proc As Long
End Type

Public Type Plugin
   format_proc As Long
   description_proc As Long
   extension_proc As Long
   regexpr_proc As Long
   open_proc As Long
   close_proc As Long
   pagecount_proc As Long
   pagecapability_proc As Long
   load_proc As Long
   save_proc As Long
   validate_proc As Long
   mime_proc As Long
   supports_export_bpp_proc As Long
   supports_export_type_proc As Long
   supports_icc_profiles_proc As Long
End Type

' The following structures are used by derived (wrapper) functions of the
' FreeImage 3 VB Wrapper
Public Type ScanLineRGBTRIBLE
   Data() As RGBTRIPLE
End Type

Public Type ScanLinesRGBTRIBLE
   Scanline() As ScanLineRGBTRIBLE
End Type

'--------------------------------------------------------------------------------
' FreeImage 3 function declarations
'--------------------------------------------------------------------------------

' The FreeImage 3 functions are declared in the same order as they are described
' in the FreeImage 3 API documentation (mostly). The documentation's outline is
' included as comments.

' Initialization / Deinitialization functions
Public Declare Sub FreeImage_Initialise Lib "FreeImage.dll" Alias "_FreeImage_Initialise@4" ( _
  Optional ByVal LoadLocalPluginsOnly As Long)

Public Declare Sub FreeImage_DeInitialise Lib "FreeImage.dll" Alias "_FreeImage_DeInitialise@0" ()


' Version functions
Private Declare Function FreeImage_GetVersionInt Lib "FreeImage.dll" Alias "_FreeImage_GetVersion@0" () As Long

Private Declare Function FreeImage_GetCopyrightMessageInt Lib "FreeImage.dll" Alias "_FreeImage_GetCopyrightMessage@0" () As Long


' Message output functions
Public Declare Sub FreeImage_SetOutputMessage Lib "FreeImage.dll" Alias "_FreeImage_SetOutputMessageStdCall@4" ( _
           ByVal omf As Long)


' Allocate / Clone / Unload functions
Public Declare Function FreeImage_Allocate Lib "FreeImage.dll" Alias "_FreeImage_Allocate@24" ( _
           ByVal Width As Long, _
           ByVal Height As Long, _
           ByVal BitsPerPixel As Long, _
  Optional ByVal RedMask As Long, _
  Optional ByVal GreenMask As Long, _
  Optional ByVal BlueMask As Long) As Long

Public Declare Function FreeImage_AllocateT Lib "FreeImage.dll" Alias "_FreeImage_AllocateT@28" ( _
           ByVal ImageType As FREE_IMAGE_TYPE, _
           ByVal Width As Long, _
           ByVal Height As Long, _
  Optional ByVal BitsPerPixel As Long = 8, _
  Optional ByVal RedMask As Long, _
  Optional ByVal GreenMask As Long, _
  Optional ByVal BlueMask As Long) As Long

Public Declare Function FreeImage_Clone Lib "FreeImage.dll" Alias "_FreeImage_Clone@4" ( _
           ByVal Bitmap As Long) As Long

Public Declare Sub FreeImage_Unload Lib "FreeImage.dll" Alias "_FreeImage_Unload@4" ( _
           ByVal Bitmap As Long)


' Header loading functions
Public Declare Function FreeImage_HasPixelsInt Lib "FreeImage.dll" Alias "_FreeImage_HasPixels@4" ( _
           ByVal Bitmap As Long) As Long


' Load / Save functions
Public Declare Function FreeImage_Load Lib "FreeImage.dll" Alias "_FreeImage_Load@12" ( _
           ByVal Format As FREE_IMAGE_FORMAT, _
           ByVal Filename As String, _
  Optional ByVal Flags As FREE_IMAGE_LOAD_OPTIONS) As Long
  
Private Declare Function FreeImage_LoadUInt Lib "FreeImage.dll" Alias "_FreeImage_LoadU@12" ( _
           ByVal Format As FREE_IMAGE_FORMAT, _
           ByVal Filename As Long, _
  Optional ByVal Flags As FREE_IMAGE_LOAD_OPTIONS) As Long

Public Declare Function FreeImage_LoadFromHandle Lib "FreeImage.dll" Alias "_FreeImage_LoadFromHandle@16" ( _
           ByVal Format As FREE_IMAGE_FORMAT, _
           ByVal IO As Long, _
           ByVal Handle As Long, _
  Optional ByVal Flags As FREE_IMAGE_LOAD_OPTIONS) As Long

Private Declare Function FreeImage_SaveInt Lib "FreeImage.dll" Alias "_FreeImage_Save@16" ( _
           ByVal Format As FREE_IMAGE_FORMAT, _
           ByVal Bitmap As Long, _
           ByVal Filename As String, _
  Optional ByVal Flags As FREE_IMAGE_SAVE_OPTIONS) As Long
  
Private Declare Function FreeImage_SaveUInt Lib "FreeImage.dll" Alias "_FreeImage_SaveU@16" ( _
           ByVal Format As FREE_IMAGE_FORMAT, _
           ByVal Bitmap As Long, _
           ByVal Filename As Long, _
  Optional ByVal Flags As FREE_IMAGE_SAVE_OPTIONS) As Long

Private Declare Function FreeImage_SaveToHandleInt Lib "FreeImage.dll" Alias "_FreeImage_SaveToHandle@20" ( _
           ByVal Format As FREE_IMAGE_FORMAT, _
           ByVal Bitmap As Long, _
           ByVal IO As Long, _
           ByVal Handle As Long, _
  Optional ByVal Flags As FREE_IMAGE_SAVE_OPTIONS) As Long


' Memory I/O stream functions
Public Declare Function FreeImage_OpenMemory Lib "FreeImage.dll" Alias "_FreeImage_OpenMemory@8" ( _
  Optional ByRef Data As Byte, _
  Optional ByVal SizeInBytes As Long) As Long
  
Public Declare Function FreeImage_OpenMemoryByPtr Lib "FreeImage.dll" Alias "_FreeImage_OpenMemory@8" ( _
  Optional ByVal DataPtr As Long, _
  Optional ByVal SizeInBytes As Long) As Long

Public Declare Sub FreeImage_CloseMemory Lib "FreeImage.dll" Alias "_FreeImage_CloseMemory@4" ( _
           ByVal Stream As Long)

Public Declare Function FreeImage_LoadFromMemory Lib "FreeImage.dll" Alias "_FreeImage_LoadFromMemory@12" ( _
           ByVal Format As FREE_IMAGE_FORMAT, _
           ByVal Stream As Long, _
  Optional ByVal Flags As FREE_IMAGE_LOAD_OPTIONS) As Long

Private Declare Function FreeImage_SaveToMemoryInt Lib "FreeImage.dll" Alias "_FreeImage_SaveToMemory@16" ( _
           ByVal Format As FREE_IMAGE_FORMAT, _
           ByVal Bitmap As Long, _
           ByVal Stream As Long, _
  Optional ByVal Flags As FREE_IMAGE_SAVE_OPTIONS) As Long

Public Declare Function FreeImage_TellMemory Lib "FreeImage.dll" Alias "_FreeImage_TellMemory@4" ( _
           ByVal Stream As Long) As Long

Private Declare Function FreeImage_SeekMemoryInt Lib "FreeImage.dll" Alias "_FreeImage_SeekMemory@12" ( _
           ByVal Stream As Long, _
           ByVal Offset As Long, _
           ByVal Origin As Long) As Long

Private Declare Function FreeImage_AcquireMemoryInt Lib "FreeImage.dll" Alias "_FreeImage_AcquireMemory@12" ( _
           ByVal Stream As Long, _
           ByRef DataPtr As Long, _
           ByRef SizeInBytes As Long) As Long
           
Public Declare Function FreeImage_ReadMemory Lib "FreeImage.dll" Alias "_FreeImage_ReadMemory@16" ( _
           ByVal BufferPtr As Long, _
           ByVal Size As Long, _
           ByVal Count As Long, _
           ByVal Stream As Long) As Long
           
Public Declare Function FreeImage_WriteMemory Lib "FreeImage.dll" Alias "_FreeImage_WriteMemory@16" ( _
           ByVal BufferPtr As Long, _
           ByVal Size As Long, _
           ByVal Count As Long, _
           ByVal Stream As Long) As Long
           
Public Declare Function FreeImage_LoadMultiBitmapFromMemory Lib "FreeImage.dll" Alias "_FreeImage_LoadMultiBitmapFromMemory@12" ( _
           ByVal Format As FREE_IMAGE_FORMAT, _
           ByVal Stream As Long, _
  Optional ByVal Flags As FREE_IMAGE_LOAD_OPTIONS) As Long

Public Declare Function FreeImage_SaveMultiBitmapToMemory Lib "FreeImage.dll" Alias "_FreeImage_SaveMultiBitmapToMemory@16" ( _
           ByVal Format As FREE_IMAGE_FORMAT, _
           ByVal Bitmap As Long, _
           ByVal Stream As Long, _
  Optional ByVal Flags As FREE_IMAGE_SAVE_OPTIONS) As Long


' Plugin / Format functions
Public Declare Function FreeImage_RegisterLocalPlugin Lib "FreeImage.dll" Alias "_FreeImage_RegisterLocalPlugin@20" ( _
           ByVal InitProcAddress As Long, _
  Optional ByVal Format As String, _
  Optional ByVal Description As String, _
  Optional ByVal Extension As String, _
  Optional ByVal RegExpr As String) As FREE_IMAGE_FORMAT

Public Declare Function FreeImage_RegisterExternalPlugin Lib "FreeImage.dll" Alias "_FreeImage_RegisterExternalPlugin@20" ( _
           ByVal Path As String, _
  Optional ByVal Format As String, _
  Optional ByVal Description As String, _
  Optional ByVal Extension As String, _
  Optional ByVal RegExpr As String) As FREE_IMAGE_FORMAT
  
Public Declare Function FreeImage_GetFIFCount Lib "FreeImage.dll" Alias "_FreeImage_GetFIFCount@0" () As Long

Public Declare Function FreeImage_SetPluginEnabled Lib "FreeImage.dll" Alias "_FreeImage_SetPluginEnabled@8" ( _
           ByVal Format As FREE_IMAGE_FORMAT, _
           ByVal Value As Long) As Long

Public Declare Function FreeImage_IsPluginEnabled Lib "FreeImage.dll" Alias "_FreeImage_IsPluginEnabled@4" ( _
           ByVal Format As FREE_IMAGE_FORMAT) As Long

Public Declare Function FreeImage_GetFIFFromFormat Lib "FreeImage.dll" Alias "_FreeImage_GetFIFFromFormat@4" ( _
           ByVal Format As String) As FREE_IMAGE_FORMAT

Public Declare Function FreeImage_GetFIFFromMime Lib "FreeImage.dll" Alias "_FreeImage_GetFIFFromMime@4" ( _
           ByVal MimeType As String) As FREE_IMAGE_FORMAT

Private Declare Function FreeImage_GetFormatFromFIFInt Lib "FreeImage.dll" Alias "_FreeImage_GetFormatFromFIF@4" ( _
           ByVal Format As FREE_IMAGE_FORMAT) As Long

Private Declare Function FreeImage_GetFIFExtensionListInt Lib "FreeImage.dll" Alias "_FreeImage_GetFIFExtensionList@4" ( _
           ByVal Format As FREE_IMAGE_FORMAT) As Long

Private Declare Function FreeImage_GetFIFDescriptionInt Lib "FreeImage.dll" Alias "_FreeImage_GetFIFDescription@4" ( _
           ByVal Format As FREE_IMAGE_FORMAT) As Long

Private Declare Function FreeImage_GetFIFRegExprInt Lib "FreeImage.dll" Alias "_FreeImage_GetFIFRegExpr@4" ( _
           ByVal Format As FREE_IMAGE_FORMAT) As Long

Private Declare Function FreeImage_GetFIFMimeTypeInt Lib "FreeImage.dll" Alias "_FreeImage_GetFIFMimeType@4" ( _
           ByVal Format As FREE_IMAGE_FORMAT) As Long

Public Declare Function FreeImage_GetFIFFromFilename Lib "FreeImage.dll" Alias "_FreeImage_GetFIFFromFilename@4" ( _
           ByVal Filename As String) As FREE_IMAGE_FORMAT
           
Private Declare Function FreeImage_GetFIFFromFilenameUInt Lib "FreeImage.dll" Alias "_FreeImage_GetFIFFromFilenameU@4" ( _
           ByVal Filename As Long) As FREE_IMAGE_FORMAT

Private Declare Function FreeImage_FIFSupportsReadingInt Lib "FreeImage.dll" Alias "_FreeImage_FIFSupportsReading@4" ( _
           ByVal Format As FREE_IMAGE_FORMAT) As Long

Private Declare Function FreeImage_FIFSupportsWritingInt Lib "FreeImage.dll" Alias "_FreeImage_FIFSupportsWriting@4" ( _
           ByVal Format As FREE_IMAGE_FORMAT) As Long

Private Declare Function FreeImage_FIFSupportsExportBPPInt Lib "FreeImage.dll" Alias "_FreeImage_FIFSupportsExportBPP@8" ( _
           ByVal Format As FREE_IMAGE_FORMAT, _
           ByVal BitsPerPixel As Long) As Long

Private Declare Function FreeImage_FIFSupportsExportTypeInt Lib "FreeImage.dll" Alias "_FreeImage_FIFSupportsExportType@8" ( _
           ByVal Format As FREE_IMAGE_FORMAT, _
           ByVal ImageType As FREE_IMAGE_TYPE) As Long

Private Declare Function FreeImage_FIFSupportsICCProfilesInt Lib "FreeImage.dll" Alias "_FreeImage_FIFSupportsICCProfiles@4" ( _
           ByVal Format As FREE_IMAGE_FORMAT) As Long
           
Private Declare Function FreeImage_FIFSupportsNoPixelsInt Lib "FreeImage.dll" Alias "_FreeImage_FIFSupportsNoPixels@4" ( _
           ByVal Format As FREE_IMAGE_FORMAT) As Long


' Multipaging functions
Private Declare Function FreeImage_OpenMultiBitmapInt Lib "FreeImage.dll" Alias "_FreeImage_OpenMultiBitmap@24" ( _
           ByVal Format As FREE_IMAGE_FORMAT, _
           ByVal Filename As String, _
           ByVal CreateNew As Long, _
           ByVal ReadOnly As Long, _
           ByVal KeepCacheInMemory As Long, _
           ByVal Flags As FREE_IMAGE_LOAD_OPTIONS) As Long

Private Declare Function FreeImage_CloseMultiBitmapInt Lib "FreeImage.dll" Alias "_FreeImage_CloseMultiBitmap@8" ( _
           ByVal Bitmap As Long, _
  Optional ByVal Flags As FREE_IMAGE_SAVE_OPTIONS) As Long

Public Declare Function FreeImage_GetPageCount Lib "FreeImage.dll" Alias "_FreeImage_GetPageCount@4" ( _
           ByVal Bitmap As Long) As Long

Public Declare Sub FreeImage_AppendPage Lib "FreeImage.dll" Alias "_FreeImage_AppendPage@8" ( _
           ByVal Bitmap As Long, _
           ByVal PageBitmap As Long)

Public Declare Sub FreeImage_InsertPage Lib "FreeImage.dll" Alias "_FreeImage_InsertPage@12" ( _
           ByVal Bitmap As Long, _
           ByVal Page As Long, _
           ByVal PageBitmap As Long)

Public Declare Sub FreeImage_DeletePage Lib "FreeImage.dll" Alias "_FreeImage_DeletePage@8" ( _
           ByVal Bitmap As Long, _
           ByVal Page As Long)

Public Declare Function FreeImage_LockPage Lib "FreeImage.dll" Alias "_FreeImage_LockPage@8" ( _
           ByVal Bitmap As Long, _
           ByVal Page As Long) As Long

Private Declare Sub FreeImage_UnlockPageInt Lib "FreeImage.dll" Alias "_FreeImage_UnlockPage@12" ( _
           ByVal Bitmap As Long, _
           ByVal PageBitmap As Long, _
           ByVal ApplyChanges As Long)

Private Declare Function FreeImage_MovePageInt Lib "FreeImage.dll" Alias "_FreeImage_MovePage@12" ( _
           ByVal Bitmap As Long, _
           ByVal TargetPage As Long, _
           ByVal SourcePage As Long) As Long

Private Declare Function FreeImage_GetLockedPageNumbersInt Lib "FreeImage.dll" Alias "_FreeImage_GetLockedPageNumbers@12" ( _
           ByVal Bitmap As Long, _
           ByRef PagesPtr As Long, _
           ByRef Count As Long) As Long


' Filetype request functions
Public Declare Function FreeImage_GetFileType Lib "FreeImage.dll" Alias "_FreeImage_GetFileType@8" ( _
           ByVal Filename As String, _
  Optional ByVal Size As Long) As FREE_IMAGE_FORMAT
  
Private Declare Function FreeImage_GetFileTypeUInt Lib "FreeImage.dll" Alias "_FreeImage_GetFileTypeU@8" ( _
           ByVal Filename As Long, _
  Optional ByVal Size As Long) As FREE_IMAGE_FORMAT

Public Declare Function FreeImage_GetFileTypeFromHandle Lib "FreeImage.dll" Alias "_FreeImage_GetFileTypeFromHandle@12" ( _
           ByVal IO As Long, _
           ByVal Handle As Long, _
  Optional ByVal Size As Long) As FREE_IMAGE_FORMAT

Public Declare Function FreeImage_GetFileTypeFromMemory Lib "FreeImage.dll" Alias "_FreeImage_GetFileTypeFromMemory@8" ( _
           ByVal Stream As Long, _
  Optional ByVal Size As Long) As FREE_IMAGE_FORMAT


' Image type request functions
Public Declare Function FreeImage_GetImageType Lib "FreeImage.dll" Alias "_FreeImage_GetImageType@4" ( _
           ByVal Bitmap As Long) As FREE_IMAGE_TYPE


' FreeImage helper functions
Private Declare Function FreeImage_IsLittleEndianInt Lib "FreeImage.dll" Alias "_FreeImage_IsLittleEndian@0" () As Long

Private Declare Function FreeImage_LookupX11ColorInt Lib "FreeImage.dll" Alias "_FreeImage_LookupX11Color@16" ( _
           ByVal Color As String, _
           ByRef Red As Long, _
           ByRef Green As Long, _
           ByRef Blue As Long) As Long

Private Declare Function FreeImage_LookupSVGColorInt Lib "FreeImage.dll" Alias "_FreeImage_LookupSVGColor@16" ( _
           ByVal Color As String, _
           ByRef Red As Long, _
           ByRef Green As Long, _
           ByRef Blue As Long) As Long


' Pixel access functions
Public Declare Function FreeImage_GetBits Lib "FreeImage.dll" Alias "_FreeImage_GetBits@4" ( _
           ByVal Bitmap As Long) As Long

Public Declare Function FreeImage_GetScanline Lib "FreeImage.dll" Alias "_FreeImage_GetScanLine@8" ( _
           ByVal Bitmap As Long, _
           ByVal Scanline As Long) As Long

Private Declare Function FreeImage_GetPixelIndexInt Lib "FreeImage.dll" Alias "_FreeImage_GetPixelIndex@16" ( _
           ByVal Bitmap As Long, _
           ByVal x As Long, _
           ByVal y As Long, _
           ByRef Value As Byte) As Long

Private Declare Function FreeImage_GetPixelColorInt Lib "FreeImage.dll" Alias "_FreeImage_GetPixelColor@16" ( _
           ByVal Bitmap As Long, _
           ByVal x As Long, _
           ByVal y As Long, _
           ByRef Value As RGBQUAD) As Long
           
Private Declare Function FreeImage_GetPixelColorByLongInt Lib "FreeImage.dll" Alias "_FreeImage_GetPixelColor@16" ( _
           ByVal Bitmap As Long, _
           ByVal x As Long, _
           ByVal y As Long, _
           ByRef Value As Long) As Long

Private Declare Function FreeImage_SetPixelIndexInt Lib "FreeImage.dll" Alias "_FreeImage_SetPixelIndex@16" ( _
           ByVal Bitmap As Long, _
           ByVal x As Long, _
           ByVal y As Long, _
           ByRef Value As Byte) As Long

Private Declare Function FreeImage_SetPixelColorInt Lib "FreeImage.dll" Alias "_FreeImage_SetPixelColor@16" ( _
           ByVal Bitmap As Long, _
           ByVal x As Long, _
           ByVal y As Long, _
           ByRef Value As RGBQUAD) As Long
           
Private Declare Function FreeImage_SetPixelColorByLongInt Lib "FreeImage.dll" Alias "_FreeImage_SetPixelColor@16" ( _
           ByVal Bitmap As Long, _
           ByVal x As Long, _
           ByVal y As Long, _
           ByRef Value As Long) As Long


' DIB info functions
Public Declare Function FreeImage_GetColorsUsed Lib "FreeImage.dll" Alias "_FreeImage_GetColorsUsed@4" ( _
           ByVal Bitmap As Long) As Long

Public Declare Function FreeImage_GetBPP Lib "FreeImage.dll" Alias "_FreeImage_GetBPP@4" ( _
           ByVal Bitmap As Long) As Long

Public Declare Function FreeImage_GetWidth Lib "FreeImage.dll" Alias "_FreeImage_GetWidth@4" ( _
           ByVal Bitmap As Long) As Long

Public Declare Function FreeImage_GetHeight Lib "FreeImage.dll" Alias "_FreeImage_GetHeight@4" ( _
           ByVal Bitmap As Long) As Long

Public Declare Function FreeImage_GetLine Lib "FreeImage.dll" Alias "_FreeImage_GetLine@4" ( _
           ByVal Bitmap As Long) As Long

Public Declare Function FreeImage_GetPitch Lib "FreeImage.dll" Alias "_FreeImage_GetPitch@4" ( _
           ByVal Bitmap As Long) As Long

Public Declare Function FreeImage_GetDIBSize Lib "FreeImage.dll" Alias "_FreeImage_GetDIBSize@4" ( _
           ByVal Bitmap As Long) As Long

Public Declare Function FreeImage_GetPalette Lib "FreeImage.dll" Alias "_FreeImage_GetPalette@4" ( _
           ByVal Bitmap As Long) As Long

Public Declare Function FreeImage_GetDotsPerMeterX Lib "FreeImage.dll" Alias "_FreeImage_GetDotsPerMeterX@4" ( _
           ByVal Bitmap As Long) As Long

Public Declare Function FreeImage_GetDotsPerMeterY Lib "FreeImage.dll" Alias "_FreeImage_GetDotsPerMeterY@4" ( _
           ByVal Bitmap As Long) As Long

Public Declare Sub FreeImage_SetDotsPerMeterX Lib "FreeImage.dll" Alias "_FreeImage_SetDotsPerMeterX@8" ( _
           ByVal Bitmap As Long, _
           ByVal Resolution As Long)

Public Declare Sub FreeImage_SetDotsPerMeterY Lib "FreeImage.dll" Alias "_FreeImage_SetDotsPerMeterY@8" ( _
           ByVal Bitmap As Long, _
           ByVal Resolution As Long)

Public Declare Function FreeImage_GetInfoHeader Lib "FreeImage.dll" Alias "_FreeImage_GetInfoHeader@4" ( _
           ByVal Bitmap As Long) As Long

Public Declare Function FreeImage_GetInfo Lib "FreeImage.dll" Alias "_FreeImage_GetInfo@4" ( _
           ByVal Bitmap As Long) As Long

Public Declare Function FreeImage_GetColorType Lib "FreeImage.dll" Alias "_FreeImage_GetColorType@4" ( _
           ByVal Bitmap As Long) As FREE_IMAGE_COLOR_TYPE

Private Declare Function FreeImage_HasRGBMasksInt Lib "FreeImage.dll" Alias "_FreeImage_HasRGBMasks@4" ( _
           ByVal Bitmap As Long) As Long

Public Declare Function FreeImage_GetRedMask Lib "FreeImage.dll" Alias "_FreeImage_GetRedMask@4" ( _
           ByVal Bitmap As Long) As Long

Public Declare Function FreeImage_GetGreenMask Lib "FreeImage.dll" Alias "_FreeImage_GetGreenMask@4" ( _
           ByVal Bitmap As Long) As Long

Public Declare Function FreeImage_GetBlueMask Lib "FreeImage.dll" Alias "_FreeImage_GetBlueMask@4" ( _
           ByVal Bitmap As Long) As Long

Public Declare Function FreeImage_GetTransparencyCount Lib "FreeImage.dll" Alias "_FreeImage_GetTransparencyCount@4" ( _
           ByVal Bitmap As Long) As Long

Public Declare Function FreeImage_GetTransparencyTable Lib "FreeImage.dll" Alias "_FreeImage_GetTransparencyTable@4" ( _
           ByVal Bitmap As Long) As Long

Private Declare Sub FreeImage_SetTransparentInt Lib "FreeImage.dll" Alias "_FreeImage_SetTransparent@8" ( _
           ByVal Bitmap As Long, _
           ByVal Value As Long)

Public Declare Sub FreeImage_SetTransparencyTable Lib "FreeImage.dll" Alias "_FreeImage_SetTransparencyTable@12" ( _
           ByVal Bitmap As Long, _
           ByVal TransTablePtr As Long, _
           ByVal Count As Long)

Private Declare Function FreeImage_IsTransparentInt Lib "FreeImage.dll" Alias "_FreeImage_IsTransparent@4" ( _
           ByVal Bitmap As Long) As Long

Public Declare Function FreeImage_SetTransparentIndex Lib "FreeImage.dll" Alias "_FreeImage_SetTransparentIndex@8" ( _
           ByVal Bitmap As Long, _
           ByVal Index As Long) As Long

Public Declare Function FreeImage_GetTransparentIndex Lib "FreeImage.dll" Alias "_FreeImage_GetTransparentIndex@4" ( _
           ByVal Bitmap As Long) As Long

Private Declare Function FreeImage_HasBackgroundColorInt Lib "FreeImage.dll" Alias "_FreeImage_HasBackgroundColor@4" ( _
           ByVal Bitmap As Long) As Long
           
Private Declare Function FreeImage_GetBackgroundColorInt Lib "FreeImage.dll" Alias "_FreeImage_GetBackgroundColor@8" ( _
           ByVal Bitmap As Long, _
           ByRef BackColor As RGBQUAD) As Long

Private Declare Function FreeImage_GetBackgroundColorAsLongInt Lib "FreeImage.dll" Alias "_FreeImage_GetBackgroundColor@8" ( _
           ByVal Bitmap As Long, _
           ByRef BackColor As Long) As Long

Private Declare Function FreeImage_SetBackgroundColorInt Lib "FreeImage.dll" Alias "_FreeImage_SetBackgroundColor@8" ( _
           ByVal Bitmap As Long, _
           ByRef BackColor As RGBQUAD) As Long
           
Private Declare Function FreeImage_SetBackgroundColorAsLongInt Lib "FreeImage.dll" Alias "_FreeImage_SetBackgroundColor@8" ( _
           ByVal Bitmap As Long, _
           ByRef BackColor As Long) As Long

Public Declare Function FreeImage_GetThumbnail Lib "FreeImage.dll" Alias "_FreeImage_GetThumbnail@4" ( _
           ByVal Bitmap As Long) As Long
           
Private Declare Function FreeImage_SetThumbnailInt Lib "FreeImage.dll" Alias "_FreeImage_SetThumbnail@8" ( _
           ByVal Bitmap As Long, ByVal Thumbnail As Long) As Long


' ICC profile functions
Private Declare Function FreeImage_GetICCProfileInt Lib "FreeImage.dll" Alias "_FreeImage_GetICCProfile@4" ( _
           ByVal Bitmap As Long) As Long

Public Declare Function FreeImage_CreateICCProfile Lib "FreeImage.dll" Alias "_FreeImage_CreateICCProfile@12" ( _
           ByVal Bitmap As Long, _
           ByRef Data As Long, _
           ByVal Size As Long) As Long

Public Declare Sub FreeImage_DestroyICCProfile Lib "FreeImage.dll" Alias "_FreeImage_DestroyICCProfile@4" ( _
           ByVal Bitmap As Long)

           
' Line conversion functions
Public Declare Sub FreeImage_ConvertLine1To4 Lib "FreeImage.dll" Alias "_FreeImage_ConvertLine1To4@12" ( _
           ByVal TargetPtr As Long, _
           ByVal SourcePtr As Long, _
           ByVal WidthInPixels As Long)
           
Public Declare Sub FreeImage_ConvertLine8To4 Lib "FreeImage.dll" Alias "_FreeImage_ConvertLine1To8@16" ( _
           ByVal TargetPtr As Long, _
           ByVal SourcePtr As Long, _
           ByVal WidthInPixels As Long, _
           ByVal PalettePtr As Long)
           
Public Declare Sub FreeImage_ConvertLine16To4_555 Lib "FreeImage.dll" Alias "_FreeImage_ConvertLine16To4_555@12" ( _
           ByVal TargetPtr As Long, _
           ByVal SourcePtr As Long, _
           ByVal WidthInPixels As Long)
                     
Public Declare Sub FreeImage_ConvertLine16To4_565 Lib "FreeImage.dll" Alias "_FreeImage_ConvertLine16To4_565@12" ( _
           ByVal TargetPtr As Long, _
           ByVal SourcePtr As Long, _
           ByVal WidthInPixels As Long)
           
Public Declare Sub FreeImage_ConvertLine24To4 Lib "FreeImage.dll" Alias "_FreeImage_ConvertLine1To24@12" ( _
           ByVal TargetPtr As Long, _
           ByVal SourcePtr As Long, _
           ByVal WidthInPixels As Long)
           
Public Declare Sub FreeImage_ConvertLine32To4 Lib "FreeImage.dll" Alias "_FreeImage_ConvertLine32To4@12" ( _
           ByVal TargetPtr As Long, _
           ByVal SourcePtr As Long, _
           ByVal WidthInPixels As Long)

Public Declare Sub FreeImage_ConvertLine1To8 Lib "FreeImage.dll" Alias "_FreeImage_ConvertLine1To8@12" ( _
           ByVal TargetPtr As Long, _
           ByVal SourcePtr As Long, _
           ByVal WidthInPixels As Long)

Public Declare Sub FreeImage_ConvertLine4To8 Lib "FreeImage.dll" Alias "_FreeImage_ConvertLine4To8@12" ( _
           ByVal TargetPtr As Long, _
           ByVal SourcePtr As Long, _
           ByVal WidthInPixels As Long)

Public Declare Sub FreeImage_ConvertLine16To8_555 Lib "FreeImage.dll" Alias "_FreeImage_ConvertLine16To8_555@12" ( _
           ByVal TargetPtr As Long, _
           ByVal SourcePtr As Long, _
           ByVal WidthInPixels As Long)

Public Declare Sub FreeImage_ConvertLine16To8_565 Lib "FreeImage.dll" Alias "_FreeImage_ConvertLine16To8_565@12" ( _
           ByVal TargetPtr As Long, _
           ByVal SourcePtr As Long, _
           ByVal WidthInPixels As Long)

Public Declare Sub FreeImage_ConvertLine24To8 Lib "FreeImage.dll" Alias "_FreeImage_ConvertLine24To8@12" ( _
           ByVal TargetPtr As Long, _
           ByVal SourcePtr As Long, _
           ByVal WidthInPixels As Long)

Public Declare Sub FreeImage_ConvertLine32To8 Lib "FreeImage.dll" Alias "_FreeImage_ConvertLine32To8@12" ( _
           ByVal TargetPtr As Long, _
           ByVal SourcePtr As Long, _
           ByVal WidthInPixels As Long)

Public Declare Sub FreeImage_ConvertLine1To16_555 Lib "FreeImage.dll" Alias "_FreeImage_ConvertLine1To16_555@16" ( _
           ByVal TargetPtr As Long, _
           ByVal SourcePtr As Long, _
           ByVal WidthInPixels As Long, _
           ByVal PalettePtr As Long)

Public Declare Sub FreeImage_ConvertLine4To16_555 Lib "FreeImage.dll" Alias "_FreeImage_ConvertLine4To16_555@16" ( _
           ByVal TargetPtr As Long, _
           ByVal SourcePtr As Long, _
           ByVal WidthInPixels As Long, _
           ByVal PalettePtr As Long)

Public Declare Sub FreeImage_ConvertLine8To16_555 Lib "FreeImage.dll" Alias "_FreeImage_ConvertLine8To16_555@16" ( _
           ByVal TargetPtr As Long, _
           ByVal SourcePtr As Long, _
           ByVal WidthInPixels As Long, _
           ByVal PalettePtr As Long)

Public Declare Sub FreeImage_ConvertLine16_565_To16_555 Lib "FreeImage.dll" Alias "_FreeImage_ConvertLine16_565_To16_555@12" ( _
           ByVal TargetPtr As Long, _
           ByVal SourcePtr As Long, _
           ByVal WidthInPixels As Long)

Public Declare Sub FreeImage_ConvertLine24To16_555 Lib "FreeImage.dll" Alias "_FreeImage_ConvertLine24To16_555@12" ( _
           ByVal TargetPtr As Long, _
           ByVal SourcePtr As Long, _
           ByVal WidthInPixels As Long)

Public Declare Sub FreeImage_ConvertLine32To16_555 Lib "FreeImage.dll" Alias "_FreeImage_ConvertLine32To16_555@12" ( _
           ByVal TargetPtr As Long, _
           ByVal SourcePtr As Long, _
           ByVal WidthInPixels As Long)

Public Declare Sub FreeImage_ConvertLine1To16_565 Lib "FreeImage.dll" Alias "_FreeImage_ConvertLine1To16_565@16" ( _
           ByVal TargetPtr As Long, _
           ByVal SourcePtr As Long, _
           ByVal WidthInPixels As Long, _
           ByVal PalettePtr As Long)

Public Declare Sub FreeImage_ConvertLine4To16_565 Lib "FreeImage.dll" Alias "_FreeImage_ConvertLine4To16_565@16" ( _
           ByVal TargetPtr As Long, _
           ByVal SourcePtr As Long, _
           ByVal WidthInPixels As Long, _
           ByVal PalettePtr As Long)

Public Declare Sub FreeImage_ConvertLine8To16_565 Lib "FreeImage.dll" Alias "_FreeImage_ConvertLine8To16_565@16" ( _
           ByVal TargetPtr As Long, _
           ByVal SourcePtr As Long, _
           ByVal WidthInPixels As Long, _
           ByVal PalettePtr As Long)

Public Declare Sub FreeImage_ConvertLine16_555_To16_565 Lib "FreeImage.dll" Alias "_FreeImage_ConvertLine16_555_To16_565@12" ( _
           ByVal TargetPtr As Long, _
           ByVal SourcePtr As Long, _
           ByVal WidthInPixels As Long)

Public Declare Sub FreeImage_ConvertLine24To16_565 Lib "FreeImage.dll" Alias "_FreeImage_ConvertLine24To16_565@12" ( _
           ByVal TargetPtr As Long, _
           ByVal SourcePtr As Long, _
           ByVal WidthInPixels As Long)

Public Declare Sub FreeImage_ConvertLine32To16_565 Lib "FreeImage.dll" Alias "_FreeImage_ConvertLine32To16_565@12" ( _
           ByVal TargetPtr As Long, _
           ByVal SourcePtr As Long, _
           ByVal WidthInPixels As Long)

Public Declare Sub FreeImage_ConvertLine1To24 Lib "FreeImage.dll" Alias "_FreeImage_ConvertLine1To24@16" ( _
           ByVal TargetPtr As Long, _
           ByVal SourcePtr As Long, _
           ByVal WidthInPixels As Long, _
           ByVal PalettePtr As Long)

Public Declare Sub FreeImage_ConvertLine4To24 Lib "FreeImage.dll" Alias "_FreeImage_ConvertLine4To24@16" ( _
           ByVal TargetPtr As Long, _
           ByVal SourcePtr As Long, _
           ByVal WidthInPixels As Long, _
           ByVal PalettePtr As Long)

Public Declare Sub FreeImage_ConvertLine8To24 Lib "FreeImage.dll" Alias "_FreeImage_ConvertLine8To24@16" ( _
           ByVal TargetPtr As Long, _
           ByVal SourcePtr As Long, _
           ByVal WidthInPixels As Long, _
           ByVal PalettePtr As Long)

Public Declare Sub FreeImage_ConvertLine16To24_555 Lib "FreeImage.dll" Alias "_FreeImage_ConvertLine16To24_555@12" ( _
           ByVal TargetPtr As Long, _
           ByVal SourcePtr As Long, _
           ByVal WidthInPixels As Long)

Public Declare Sub FreeImage_ConvertLine16To24_565 Lib "FreeImage.dll" Alias "_FreeImage_ConvertLine16To24_565@12" ( _
           ByVal TargetPtr As Long, _
           ByVal SourcePtr As Long, _
           ByVal WidthInPixels As Long)

Public Declare Sub FreeImage_ConvertLine32To24 Lib "FreeImage.dll" Alias "_FreeImage_ConvertLine32To24@12" ( _
           ByVal TargetPtr As Long, _
           ByVal SourcePtr As Long, _
           ByVal WidthInPixels As Long)

Public Declare Sub FreeImage_ConvertLine1To32 Lib "FreeImage.dll" Alias "_FreeImage_ConvertLine1To32@16" ( _
           ByVal TargetPtr As Long, _
           ByVal SourcePtr As Long, _
           ByVal WidthInPixels As Long, _
           ByVal PalettePtr As Long)

Public Declare Sub FreeImage_ConvertLine4To32 Lib "FreeImage.dll" Alias "_FreeImage_ConvertLine4To32@16" ( _
           ByVal TargetPtr As Long, _
           ByVal SourcePtr As Long, _
           ByVal WidthInPixels As Long, _
           ByVal PalettePtr As Long)

Public Declare Sub FreeImage_ConvertLine8To32 Lib "FreeImage.dll" Alias "_FreeImage_ConvertLine8To32@16" ( _
           ByVal TargetPtr As Long, _
           ByVal SourcePtr As Long, _
           ByVal WidthInPixels As Long, _
           ByVal PalettePtr As Long)

Public Declare Sub FreeImage_ConvertLine16To32_555 Lib "FreeImage.dll" Alias "_FreeImage_ConvertLine16To32_555@12" ( _
           ByVal TargetPtr As Long, _
           ByVal SourcePtr As Long, _
           ByVal WidthInPixels As Long)

Public Declare Sub FreeImage_ConvertLine16To32_565 Lib "FreeImage.dll" Alias "_FreeImage_ConvertLine16To32_565@12" ( _
           ByVal TargetPtr As Long, _
           ByVal SourcePtr As Long, _
           ByVal WidthInPixels As Long)

Public Declare Sub FreeImage_ConvertLine24To32 Lib "FreeImage.dll" Alias "_FreeImage_ConvertLine24To32@12" ( _
           ByVal TargetPtr As Long, _
           ByVal SourcePtr As Long, _
           ByVal WidthInPixels As Long)


' Smart conversion functions
Public Declare Function FreeImage_ConvertTo4Bits Lib "FreeImage.dll" Alias "_FreeImage_ConvertTo4Bits@4" ( _
           ByVal Bitmap As Long) As Long

Public Declare Function FreeImage_ConvertTo8Bits Lib "FreeImage.dll" Alias "_FreeImage_ConvertTo8Bits@4" ( _
           ByVal Bitmap As Long) As Long
           
Public Declare Function FreeImage_ConvertToGreyscale Lib "FreeImage.dll" Alias "_FreeImage_ConvertToGreyscale@4" ( _
           ByVal Bitmap As Long) As Long

Public Declare Function FreeImage_ConvertTo16Bits555 Lib "FreeImage.dll" Alias "_FreeImage_ConvertTo16Bits555@4" ( _
           ByVal Bitmap As Long) As Long

Public Declare Function FreeImage_ConvertTo16Bits565 Lib "FreeImage.dll" Alias "_FreeImage_ConvertTo16Bits565@4" ( _
           ByVal Bitmap As Long) As Long

Public Declare Function FreeImage_ConvertTo24Bits Lib "FreeImage.dll" Alias "_FreeImage_ConvertTo24Bits@4" ( _
           ByVal Bitmap As Long) As Long

Public Declare Function FreeImage_ConvertTo32Bits Lib "FreeImage.dll" Alias "_FreeImage_ConvertTo32Bits@4" ( _
           ByVal Bitmap As Long) As Long

Public Declare Function FreeImage_ColorQuantize Lib "FreeImage.dll" Alias "_FreeImage_ColorQuantize@8" ( _
           ByVal Bitmap As Long, _
           ByVal QuantizeMethod As FREE_IMAGE_QUANTIZE) As Long
           
Private Declare Function FreeImage_ColorQuantizeExInt Lib "FreeImage.dll" Alias "_FreeImage_ColorQuantizeEx@20" ( _
           ByVal Bitmap As Long, _
  Optional ByVal QuantizeMethod As FREE_IMAGE_QUANTIZE = FIQ_WUQUANT, _
  Optional ByVal PaletteSize As Long = 256, _
  Optional ByVal ReserveSize As Long = 0, _
  Optional ByVal ReservePalettePtr As Long = 0) As Long

Public Declare Function FreeImage_Threshold Lib "FreeImage.dll" Alias "_FreeImage_Threshold@8" ( _
           ByVal Bitmap As Long, _
           ByVal Threshold As Byte) As Long

Public Declare Function FreeImage_Dither Lib "FreeImage.dll" Alias "_FreeImage_Dither@8" ( _
           ByVal Bitmap As Long, _
           ByVal DitherMethod As FREE_IMAGE_DITHER) As Long

Private Declare Function FreeImage_ConvertFromRawBitsInt Lib "FreeImage.dll" Alias "_FreeImage_ConvertFromRawBits@36" ( _
           ByVal BitsPtr As Long, _
           ByVal Width As Long, _
           ByVal Height As Long, _
           ByVal Pitch As Long, _
           ByVal BitsPerPixel As Long, _
           ByVal RedMask As Long, _
           ByVal GreenMask As Long, _
           ByVal BlueMask As Long, _
           ByVal TopDown As Long) As Long

Private Declare Function FreeImage_ConvertFromRawBitsExInt Lib "FreeImage.dll" Alias "_FreeImage_ConvertFromRawBitsEx@44" ( _
           ByVal CopySource As Long, _
           ByVal BitsPtr As Long, _
           ByVal ImageType As FREE_IMAGE_TYPE, _
           ByVal Width As Long, _
           ByVal Height As Long, _
           ByVal Pitch As Long, _
           ByVal BitsPerPixel As Long, _
           ByVal RedMask As Long, _
           ByVal GreenMask As Long, _
           ByVal BlueMask As Long, _
           ByVal TopDown As Long) As Long

Private Declare Sub FreeImage_ConvertToRawBitsInt Lib "FreeImage.dll" Alias "_FreeImage_ConvertToRawBits@32" ( _
           ByVal BitsPtr As Long, _
           ByVal Bitmap As Long, _
           ByVal Pitch As Long, _
           ByVal BitsPerPixel As Long, _
           ByVal RedMask As Long, _
           ByVal GreenMask As Long, _
           ByVal BlueMask As Long, _
           ByVal TopDown As Long)

Public Declare Function FreeImage_ConvertToFloat Lib "FreeImage.dll" Alias "_FreeImage_ConvertToFloat@4" ( _
           ByVal Bitmap As Long) As Long

Public Declare Function FreeImage_ConvertToRGBF Lib "FreeImage.dll" Alias "_FreeImage_ConvertToRGBF@4" ( _
           ByVal Bitmap As Long) As Long

Public Declare Function FreeImage_ConvertToUINT16 Lib "FreeImage.dll" Alias "_FreeImage_ConvertToUINT16@4" ( _
           ByVal Bitmap As Long) As Long

Public Declare Function FreeImage_ConvertToRGB16 Lib "FreeImage.dll" Alias "_FreeImage_ConvertToRGB16@4" ( _
           ByVal Bitmap As Long) As Long

Private Declare Function FreeImage_ConvertToStandardTypeInt Lib "FreeImage.dll" Alias "_FreeImage_ConvertToStandardType@8" ( _
           ByVal Bitmap As Long, _
           ByVal ScaleLinear As Long) As Long

Private Declare Function FreeImage_ConvertToTypeInt Lib "FreeImage.dll" Alias "_FreeImage_ConvertToType@12" ( _
           ByVal Bitmap As Long, _
           ByVal DestinationType As FREE_IMAGE_TYPE, _
           ByVal ScaleLinear As Long) As Long


' Tone mapping operators
Public Declare Function FreeImage_ToneMapping Lib "FreeImage.dll" Alias "_FreeImage_ToneMapping@24" ( _
           ByVal Bitmap As Long, _
           ByVal Operator As FREE_IMAGE_TMO, _
  Optional ByVal FirstArgument As Double, _
  Optional ByVal SecondArgument As Double) As Long
  
Public Declare Function FreeImage_TmoDrago03 Lib "FreeImage.dll" Alias "_FreeImage_TmoDrago03@20" ( _
           ByVal Bitmap As Long, _
  Optional ByVal Gamma As Double = 2.2, _
  Optional ByVal Exposure As Double) As Long
  
Public Declare Function FreeImage_TmoReinhard05 Lib "FreeImage.dll" Alias "_FreeImage_TmoReinhard05@20" ( _
           ByVal Bitmap As Long, _
  Optional ByVal Intensity As Double, _
  Optional ByVal Contrast As Double) As Long

Public Declare Function FreeImage_TmoReinhard05Ex Lib "FreeImage.dll" Alias "_FreeImage_TmoReinhard05Ex@36" ( _
           ByVal Bitmap As Long, _
  Optional ByVal Intensity As Double, _
  Optional ByVal Contrast As Double, _
  Optional ByVal Adaptation As Double = 1, _
  Optional ByVal ColorCorrection As Double) As Long

Public Declare Function FreeImage_TmoFattal02 Lib "FreeImage.dll" Alias "_FreeImage_TmoFattal02@20" ( _
           ByVal Bitmap As Long, _
  Optional ByVal ColorSaturation As Double = 0.5, _
  Optional ByVal Attenuation As Double = 0.85) As Long


' ZLib functions
Public Declare Function FreeImage_ZLibCompress Lib "FreeImage.dll" Alias "_FreeImage_ZLibCompress@16" ( _
           ByVal TargetPtr As Long, _
           ByVal TargetSize As Long, _
           ByVal SourcePtr As Long, _
           ByVal SourceSize As Long) As Long

Public Declare Function FreeImage_ZLibUncompress Lib "FreeImage.dll" Alias "_FreeImage_ZLibUncompress@16" ( _
           ByVal TargetPtr As Long, _
           ByVal TargetSize As Long, _
           ByVal SourcePtr As Long, _
           ByVal SourceSize As Long) As Long

Public Declare Function FreeImage_ZLibGZip Lib "FreeImage.dll" Alias "_FreeImage_ZLibGZip@16" ( _
           ByVal TargetPtr As Long, _
           ByVal TargetSize As Long, _
           ByVal SourcePtr As Long, _
           ByVal SourceSize As Long) As Long
           
Public Declare Function FreeImage_ZLibGUnzip Lib "FreeImage.dll" Alias "_FreeImage_ZLibGUnzip@16" ( _
           ByVal TargetPtr As Long, _
           ByVal TargetSize As Long, _
           ByVal SourcePtr As Long, _
           ByVal SourceSize As Long) As Long

Public Declare Function FreeImage_ZLibCRC32 Lib "FreeImage.dll" Alias "_FreeImage_ZLibCRC32@12" ( _
           ByVal CRC As Long, _
           ByVal SourcePtr As Long, _
           ByVal SourceSize As Long) As Long


'--------------------------------------------------------------------------------
' Metadata functions
'--------------------------------------------------------------------------------

' tag creation / destruction
Private Declare Function FreeImage_CreateTag Lib "FreeImage.dll" Alias "_FreeImage_CreateTag@0" () As Long

Private Declare Sub FreeImage_DeleteTag Lib "FreeImage.dll" Alias "_FreeImage_DeleteTag@4" ( _
           ByVal Tag As Long)

Private Declare Function FreeImage_CloneTag Lib "FreeImage.dll" Alias "_FreeImage_CloneTag@4" ( _
           ByVal Tag As Long) As Long


' tag getters and setters (only those actually needed by wrapper functions)
Private Declare Function FreeImage_SetTagKey Lib "FreeImage.dll" Alias "_FreeImage_SetTagKey@8" ( _
           ByVal Tag As Long, _
           ByVal Key As String) As Long

Private Declare Function FreeImage_SetTagValue Lib "FreeImage.dll" Alias "_FreeImage_SetTagValue@8" ( _
           ByVal Tag As Long, _
           ByVal ValuePtr As Long) As Long


' metadata iterators
Public Declare Function FreeImage_FindFirstMetadata Lib "FreeImage.dll" Alias "_FreeImage_FindFirstMetadata@12" ( _
           ByVal Model As FREE_IMAGE_MDMODEL, _
           ByVal Bitmap As Long, _
           ByRef Tag As Long) As Long

Private Declare Function FreeImage_FindNextMetadataInt Lib "FreeImage.dll" Alias "_FreeImage_FindNextMetadata@8" ( _
           ByVal hFind As Long, _
           ByRef Tag As Long) As Long

Public Declare Sub FreeImage_FindCloseMetadata Lib "FreeImage.dll" Alias "_FreeImage_FindCloseMetadata@4" ( _
           ByVal hFind As Long)


' metadata setters and getters
Private Declare Function FreeImage_SetMetadataInt Lib "FreeImage.dll" Alias "_FreeImage_SetMetadata@16" ( _
           ByVal Model As Long, _
           ByVal Bitmap As Long, _
           ByVal Key As String, _
           ByVal Tag As Long) As Long

Private Declare Function FreeImage_GetMetadataInt Lib "FreeImage.dll" Alias "_FreeImage_GetMetadata@16" ( _
           ByVal Model As Long, _
           ByVal Bitmap As Long, _
           ByVal Key As String, _
           ByRef Tag As Long) As Long

Private Declare Function FreeImage_SetMetadataKeyValueInt Lib "FreeImage.dll" Alias "_FreeImage_SetMetadataKeyValue@16" ( _
           ByVal Model As Long, _
           ByVal Bitmap As Long, _
           ByVal Key As String, _
           ByVal Tag As String) As Long


' metadata helper functions
Public Declare Function FreeImage_GetMetadataCount Lib "FreeImage.dll" Alias "_FreeImage_GetMetadataCount@8" ( _
           ByVal Model As Long, _
           ByVal Bitmap As Long) As Long
           
Public Declare Function FreeImage_CloneMetadataInt Lib "FreeImage.dll" Alias "_FreeImage_CloneMetadata@8" ( _
           ByVal BitmapDst As Long, _
           ByVal BitmapSrc As Long) As Long


' tag to string conversion functions
Private Declare Function FreeImage_TagToStringInt Lib "FreeImage.dll" Alias "_FreeImage_TagToString@12" ( _
           ByVal Model As Long, _
           ByVal Tag As Long, _
  Optional ByVal Make As String = vbNullString) As Long


'--------------------------------------------------------------------------------
' JPEG lossless transformation functions
'--------------------------------------------------------------------------------

Private Declare Function FreeImage_JPEGTransformInt Lib "FreeImage.dll" Alias "_FreeImage_JPEGTransform@16" ( _
           ByVal SourceFile As String, _
           ByVal DestFile As String, _
           ByVal Operation As FREE_IMAGE_JPEG_OPERATION, _
           ByVal Perfect As Long) As Long

Private Declare Function FreeImage_JPEGTransformUInt Lib "FreeImage.dll" Alias "_FreeImage_JPEGTransformU@16" ( _
           ByVal SourceFile As Long, _
           ByVal DestFile As Long, _
           ByVal Operation As FREE_IMAGE_JPEG_OPERATION, _
           ByVal Perfect As Long) As Long

Private Declare Function FreeImage_JPEGCropInt Lib "FreeImage.dll" Alias "_FreeImage_JPEGCrop@24" ( _
           ByVal SourceFile As String, _
           ByVal DestFile As String, _
           ByVal Left As Long, _
           ByVal Top As Long, _
           ByVal Right As Long, _
           ByVal Bottom As Long) As Long

Private Declare Function FreeImage_JPEGCropUInt Lib "FreeImage.dll" Alias "_FreeImage_JPEGCropU@24" ( _
           ByVal SourceFile As Long, _
           ByVal DestFile As Long, _
           ByVal Left As Long, _
           ByVal Top As Long, _
           ByVal Right As Long, _
           ByVal Bottom As Long) As Long

Private Declare Function FreeImage_JPEGTransformCombinedInt Lib "FreeImage.dll" Alias "_FreeImage_JPEGTransformCombined@32" ( _
           ByVal SourceFile As String, _
           ByVal DestFile As String, _
           ByVal Operation As FREE_IMAGE_JPEG_OPERATION, _
           ByRef Left As Long, _
           ByRef Top As Long, _
           ByRef Right As Long, _
           ByRef Bottom As Long, _
           ByVal Perfect As Long) As Long

Private Declare Function FreeImage_JPEGTransformCombinedUInt Lib "FreeImage.dll" Alias "_FreeImage_JPEGTransformCombinedU@32" ( _
           ByVal SourceFile As Long, _
           ByVal DestFile As Long, _
           ByVal Operation As FREE_IMAGE_JPEG_OPERATION, _
           ByRef Left As Long, _
           ByRef Top As Long, _
           ByRef Right As Long, _
           ByRef Bottom As Long, _
           ByVal Perfect As Long) As Long

Private Declare Function FreeImage_JPEGTransformCombinedFromMemoryInt Lib "FreeImage.dll" Alias "_FreeImage_JPEGTransformCombinedFromMemory@32" ( _
           ByVal SourceStream As Long, _
           ByVal DestStream As Long, _
           ByVal Operation As FREE_IMAGE_JPEG_OPERATION, _
           ByRef Left As Long, _
           ByRef Top As Long, _
           ByRef Right As Long, _
           ByRef Bottom As Long, _
           ByVal Perfect As Long) As Long


'--------------------------------------------------------------------------------
' Image manipulation toolkit functions
'--------------------------------------------------------------------------------

' rotation and flipping
Public Declare Function FreeImage_RotateClassic Lib "FreeImage.dll" Alias "_FreeImage_RotateClassic@12" ( _
           ByVal Bitmap As Long, _
           ByVal Angle As Double) As Long

Public Declare Function FreeImage_Rotate Lib "FreeImage.dll" Alias "_FreeImage_Rotate@16" ( _
           ByVal Bitmap As Long, _
           ByVal Angle As Double, _
  Optional ByRef Color As Any = 0) As Long

Private Declare Function FreeImage_RotateExInt Lib "FreeImage.dll" Alias "_FreeImage_RotateEx@48" ( _
           ByVal Bitmap As Long, _
           ByVal Angle As Double, _
           ByVal ShiftX As Double, _
           ByVal ShiftY As Double, _
           ByVal OriginX As Double, _
           ByVal OriginY As Double, _
           ByVal UseMask As Long) As Long

Private Declare Function FreeImage_FlipHorizontalInt Lib "FreeImage.dll" Alias "_FreeImage_FlipHorizontal@4" ( _
           ByVal Bitmap As Long) As Long

Private Declare Function FreeImage_FlipVerticalInt Lib "FreeImage.dll" Alias "_FreeImage_FlipVertical@4" ( _
           ByVal Bitmap As Long) As Long


' upsampling / downsampling
Public Declare Function FreeImage_Rescale Lib "FreeImage.dll" Alias "_FreeImage_Rescale@16" ( _
           ByVal Bitmap As Long, _
           ByVal Width As Long, _
           ByVal Height As Long, _
           ByVal Filter As FREE_IMAGE_FILTER) As Long
           
Public Declare Function FreeImage_RescaleRect Lib "FreeImage.dll" Alias "_FreeImage_RescaleRect@32" ( _
           ByVal Bitmap As Long, _
           ByVal Left As Long, _
           ByVal Top As Long, _
           ByVal Right As Long, _
           ByVal Bottom As Long, _
           ByVal Width As Long, _
           ByVal Height As Long, _
           ByVal Filter As FREE_IMAGE_FILTER) As Long
           
Private Declare Function FreeImage_MakeThumbnailInt Lib "FreeImage.dll" Alias "_FreeImage_MakeThumbnail@12" ( _
           ByVal Bitmap As Long, _
           ByVal MaxPixelSize As Long, _
  Optional ByVal Convert As Long) As Long


' color manipulation functions (point operations)
Private Declare Function FreeImage_AdjustCurveInt Lib "FreeImage.dll" Alias "_FreeImage_AdjustCurve@12" ( _
           ByVal Bitmap As Long, _
           ByVal LookupTablePtr As Long, _
           ByVal Channel As FREE_IMAGE_COLOR_CHANNEL) As Long

Private Declare Function FreeImage_AdjustGammaInt Lib "FreeImage.dll" Alias "_FreeImage_AdjustGamma@12" ( _
           ByVal Bitmap As Long, _
           ByVal Gamma As Double) As Long

Private Declare Function FreeImage_AdjustBrightnessInt Lib "FreeImage.dll" Alias "_FreeImage_AdjustBrightness@12" ( _
           ByVal Bitmap As Long, _
           ByVal Percentage As Double) As Long

Private Declare Function FreeImage_AdjustContrastInt Lib "FreeImage.dll" Alias "_FreeImage_AdjustContrast@12" ( _
           ByVal Bitmap As Long, _
           ByVal Percentage As Double) As Long

Private Declare Function FreeImage_InvertInt Lib "FreeImage.dll" Alias "_FreeImage_Invert@4" ( _
           ByVal Bitmap As Long) As Long

Private Declare Function FreeImage_GetHistogramInt Lib "FreeImage.dll" Alias "_FreeImage_GetHistogram@12" ( _
           ByVal Bitmap As Long, _
           ByRef HistogramPtr As Long, _
  Optional ByVal Channel As FREE_IMAGE_COLOR_CHANNEL = FICC_BLACK) As Long
  
Private Declare Function FreeImage_GetAdjustColorsLookupTableInt Lib "FreeImage.dll" Alias "_FreeImage_GetAdjustColorsLookupTable@32" ( _
           ByVal LookupTablePtr As Long, _
           ByVal Brightness As Double, _
           ByVal Contrast As Double, _
           ByVal Gamma As Double, _
           ByVal Invert As Long) As Long

Private Declare Function FreeImage_AdjustColorsInt Lib "FreeImage.dll" Alias "_FreeImage_AdjustColors@32" ( _
           ByVal Bitmap As Long, _
           ByVal Brightness As Double, _
           ByVal Contrast As Double, _
           ByVal Gamma As Double, _
           ByVal Invert As Long) As Long
  
Private Declare Function FreeImage_ApplyColorMappingInt Lib "FreeImage.dll" Alias "_FreeImage_ApplyColorMapping@24" ( _
           ByVal Bitmap As Long, _
           ByVal SourceColorsPtr As Long, _
           ByVal DestinationColorsPtr As Long, _
           ByVal Count As Long, _
           ByVal IgnoreAlpha As Long, _
           ByVal Swap As Long) As Long
  
Private Declare Function FreeImage_SwapColorsInt Lib "FreeImage.dll" Alias "_FreeImage_SwapColors@16" ( _
           ByVal Bitmap As Long, _
           ByRef ColorA As RGBQUAD, _
           ByRef ColorB As RGBQUAD, _
           ByVal IgnoreAlpha As Long) As Long
  
Private Declare Function FreeImage_SwapColorsByLongInt Lib "FreeImage.dll" Alias "_FreeImage_SwapColors@16" ( _
           ByVal Bitmap As Long, _
           ByRef ColorA As Long, _
           ByRef ColorB As Long, _
           ByVal IgnoreAlpha As Long) As Long

Private Declare Function FreeImage_ApplyPaletteIndexMappingInt Lib "FreeImage.dll" Alias "_FreeImage_ApplyPaletteIndexMapping@20" ( _
           ByVal Bitmap As Long, _
           ByVal SourceIndicesPtr As Long, _
           ByVal DestinationIndicesPtr As Long, _
           ByVal Count As Long, _
           ByVal Swap As Long) As Long

Public Declare Function FreeImage_SwapPaletteIndices Lib "FreeImage.dll" Alias "_FreeImage_SwapPaletteIndices@12" ( _
           ByVal Bitmap As Long, _
           ByRef IndexA As Byte, _
           ByRef IndexB As Byte) As Long

' channel processing functions
Public Declare Function FreeImage_GetChannel Lib "FreeImage.dll" Alias "_FreeImage_GetChannel@8" ( _
           ByVal Bitmap As Long, _
           ByVal Channel As FREE_IMAGE_COLOR_CHANNEL) As Long

Private Declare Function FreeImage_SetChannelInt Lib "FreeImage.dll" Alias "_FreeImage_SetChannel@12" ( _
           ByVal BitmapDst As Long, _
           ByVal BitmapSrc As Long, _
           ByVal Channel As FREE_IMAGE_COLOR_CHANNEL) As Long

Public Declare Function FreeImage_GetComplexChannel Lib "FreeImage.dll" Alias "_FreeImage_GetComplexChannel@8" ( _
           ByVal Bitmap As Long, _
           ByVal Channel As FREE_IMAGE_COLOR_CHANNEL) As Long

Private Declare Function FreeImage_SetComplexChannelInt Lib "FreeImage.dll" Alias "_FreeImage_SetComplexChannel@12" ( _
           ByVal BitmapDst As Long, _
           ByVal BitmapSrc As Long, _
           ByVal Channel As FREE_IMAGE_COLOR_CHANNEL) As Long


' copy / paste / composite functions
Public Declare Function FreeImage_Copy Lib "FreeImage.dll" Alias "_FreeImage_Copy@20" ( _
           ByVal Bitmap As Long, _
           ByVal Left As Long, _
           ByVal Top As Long, _
           ByVal Right As Long, _
           ByVal Bottom As Long) As Long

Private Declare Function FreeImage_PasteInt Lib "FreeImage.dll" Alias "_FreeImage_Paste@20" ( _
           ByVal BitmapDst As Long, _
           ByVal BitmapSrc As Long, _
           ByVal Left As Long, _
           ByVal Top As Long, _
           ByVal Alpha As Long) As Long

Public Declare Function FreeImage_Composite Lib "FreeImage.dll" Alias "_FreeImage_Composite@16" ( _
           ByVal Bitmap As Long, _
  Optional ByVal UseFileBackColor As Long, _
  Optional ByRef AppBackColor As Any, _
  Optional ByVal BackgroundBitmap As Long) As Long

Private Declare Function FreeImage_PreMultiplyWithAlphaInt Lib "FreeImage.dll" Alias "_FreeImage_PreMultiplyWithAlpha@4" ( _
           ByVal Bitmap As Long) As Long

' background filling functions
Public Declare Function FreeImage_FillBackground Lib "FreeImage.dll" Alias "_FreeImage_FillBackground@12" ( _
           ByVal Bitmap As Long, _
           ByRef Color As Any, _
  Optional ByVal Options As FREE_IMAGE_COLOR_OPTIONS = FI_COLOR_IS_RGB_COLOR) As Long

Public Declare Function FreeImage_EnlargeCanvas Lib "FreeImage.dll" Alias "_FreeImage_EnlargeCanvas@28" ( _
           ByVal Bitmap As Long, _
           ByVal Left As Long, _
           ByVal Top As Long, _
           ByVal Right As Long, _
           ByVal Bottom As Long, _
           ByRef Color As Any, _
  Optional ByVal Options As FREE_IMAGE_COLOR_OPTIONS = FI_COLOR_IS_RGB_COLOR) As Long

Public Declare Function FreeImage_AllocateEx Lib "FreeImage.dll" Alias "_FreeImage_AllocateEx@36" ( _
           ByVal Width As Long, _
           ByVal Height As Long, _
  Optional ByVal BitsPerPixel As Long = 8, _
  Optional ByRef Color As Any, _
  Optional ByVal Options As FREE_IMAGE_COLOR_OPTIONS, _
  Optional ByVal PalettePtr As Long = 0, _
  Optional ByVal RedMask As Long = 0, _
  Optional ByVal GreenMask As Long = 0, _
  Optional ByVal BlueMask As Long = 0) As Long
           
Public Declare Function FreeImage_AllocateExT Lib "FreeImage.dll" Alias "_FreeImage_AllocateExT@36" ( _
           ByVal ImageType As FREE_IMAGE_TYPE, _
           ByVal Width As Long, _
           ByVal Height As Long, _
  Optional ByVal BitsPerPixel As Long = 8, _
  Optional ByRef Color As Any, _
  Optional ByVal Options As FREE_IMAGE_COLOR_OPTIONS, _
  Optional ByVal PalettePtr As Long, _
  Optional ByVal RedMask As Long, _
  Optional ByVal GreenMask As Long, _
  Optional ByVal BlueMask As Long) As Long

' miscellaneous algorithms
Public Declare Function FreeImage_MultigridPoissonSolver Lib "FreeImage.dll" Alias "_FreeImage_MultigridPoissonSolver@8" ( _
           ByVal LaplacianBitmap As Long, _
  Optional ByVal Cyles As Long = 3) As Long



'--------------------------------------------------------------------------------
' Initialization functions
'--------------------------------------------------------------------------------

Public Function FreeImage_IsAvailable(Optional ByRef Version As String) As Boolean

   On Error Resume Next
   Version = FreeImage_GetVersion()
   FreeImage_IsAvailable = (Err.Number = ERROR_SUCCESS)
   On Error GoTo 0

End Function



'--------------------------------------------------------------------------------
' Error handling functions
'--------------------------------------------------------------------------------

Public Sub FreeImage_InitErrorHandler()

   ' Call this function once for using the FreeImage 3 error handling callback.
   ' The 'FreeImage_ErrorHandler' function is called on each FreeImage 3 error.

   Call FreeImage_SetOutputMessage(AddressOf FreeImage_ErrorHandler)

End Sub

Private Sub FreeImage_ErrorHandler(ByVal Format As FREE_IMAGE_FORMAT, ByVal Message As Long)

Dim strErrorMessage As String
Dim strImageFormat As String

   ' This function is called whenever the FreeImage 3 libraray throws an error.
   ' Currently this function gets the error message and the format name of the
   ' involved image type as VB string and prints both to the VB Debug console. Feel
   ' free to modify this function to call an error handling routine of your own.

   strErrorMessage = pGetStringFromPointerA(Message)
   strImageFormat = FreeImage_GetFormatFromFIF(Format)
   
   Debug.Print "[FreeImage] Error: " & strErrorMessage
   Debug.Print "            Image: " & strImageFormat
   Debug.Print "            Code:  " & Format

End Sub



'--------------------------------------------------------------------------------
' String returning functions wrappers
'--------------------------------------------------------------------------------

Public Function FreeImage_GetVersion() As String

   ' This function returns the version of the FreeImage 3 library
   ' as VB String.
   
   FreeImage_GetVersion = pGetStringFromPointerA(FreeImage_GetVersionInt)

End Function

Public Function FreeImage_GetCopyrightMessage() As String

   ' This function returns the copyright message of the FreeImage 3 library
   ' as VB String.
   
   FreeImage_GetCopyrightMessage = pGetStringFromPointerA(FreeImage_GetCopyrightMessageInt)

End Function

Public Function FreeImage_GetFormatFromFIF(ByVal Format As FREE_IMAGE_FORMAT) As String

   ' This function returns the result of the 'FreeImage_GetFormatFromFIF' function
   ' as VB String.
   
   ' The parameter 'Format' works according to the FreeImage 3 API documentation.
   
   FreeImage_GetFormatFromFIF = pGetStringFromPointerA(FreeImage_GetFormatFromFIFInt(Format))

End Function

Public Function FreeImage_GetFIFExtensionList(ByVal Format As FREE_IMAGE_FORMAT) As String

   ' This function returns the result of the 'FreeImage_GetFIFExtensionList' function
   ' as VB String.
   
   ' The parameter 'Format' works according to the FreeImage 3 API documentation.
   
   FreeImage_GetFIFExtensionList = pGetStringFromPointerA(FreeImage_GetFIFExtensionListInt(Format))

End Function

Public Function FreeImage_GetFIFDescription(ByVal Format As FREE_IMAGE_FORMAT) As String

   ' This function returns the result of the 'FreeImage_GetFIFDescription' function
   ' as VB String.
   
   ' The parameter 'Format' works according to the FreeImage 3 API documentation.
   
   FreeImage_GetFIFDescription = pGetStringFromPointerA(FreeImage_GetFIFDescriptionInt(Format))

End Function

Public Function FreeImage_GetFIFRegExpr(ByVal Format As FREE_IMAGE_FORMAT) As String

   ' This function returns the result of the 'FreeImage_GetFIFRegExpr' function
   ' as VB String.
   
   ' The parameter 'Format' works according to the FreeImage 3 API documentation.
   
   FreeImage_GetFIFRegExpr = pGetStringFromPointerA(FreeImage_GetFIFRegExprInt(Format))

End Function

Public Function FreeImage_GetFIFMimeType(ByVal Format As FREE_IMAGE_FORMAT) As String
   
   ' This function returns the result of the 'FreeImage_GetFIFMimeType' function
   ' as VB String.
   
   ' The parameter 'Format' works according to the FreeImage 3 API documentation.
   
   FreeImage_GetFIFMimeType = pGetStringFromPointerA(FreeImage_GetFIFMimeTypeInt(Format))
   
End Function

Public Function FreeImage_TagToString(ByVal Model As Long, _
                                      ByVal Tag As Long, _
                             Optional ByVal Make As String) As String

   ' This function returns the result of the 'FreeImage_TagToString' function
   ' as VB String.
   
   ' All parameters work according to the FreeImage 3 API documentation.

   FreeImage_TagToString = pGetStringFromPointerA(FreeImage_TagToStringInt(Model, Tag, Make))

End Function



'--------------------------------------------------------------------------------
' UNICODE dealing functions wrappers
'--------------------------------------------------------------------------------

Public Function FreeImage_LoadU(ByVal Format As FREE_IMAGE_FORMAT, _
                                ByVal Filename As String, _
                       Optional ByVal Flags As FREE_IMAGE_LOAD_OPTIONS) As Long
                       
   ' This function is just a thin wrapper to ease the call to an
   ' UNICODE function. Since VB's BSTR strings are actually UNICODE
   ' strings, we just need to pass the pointer to the string data
   ' returned by the (undocumented) function StrPtr().
   
   FreeImage_LoadU = FreeImage_LoadUInt(Format, StrPtr(Filename), Flags)

End Function
  
Public Function FreeImage_SaveU(ByVal Format As FREE_IMAGE_FORMAT, _
                                ByVal Bitmap As Long, _
                                ByVal Filename As String, _
                       Optional ByVal Flags As FREE_IMAGE_SAVE_OPTIONS) As Boolean

   ' This function is just a thin wrapper to ease the call to an
   ' UNICODE function. Since VB's BSTR strings are actually UNICODE
   ' strings, we just need to pass the pointer to the string data
   ' returned by the (undocumented) function StrPtr().
   
   FreeImage_SaveU = (FreeImage_SaveUInt(Format, Bitmap, StrPtr(Filename), Flags) = 1)

End Function

Public Function FreeImage_GetFileTypeU(ByVal Filename As String, _
                              Optional ByVal Size As Long = 0) As FREE_IMAGE_FORMAT

   ' This function is just a thin wrapper to ease the call to an
   ' UNICODE function. Since VB's BSTR strings are actually UNICODE
   ' strings, we just need to pass the pointer to the string data
   ' returned by the (undocumented) function StrPtr().
   
   FreeImage_GetFileTypeU = FreeImage_GetFileTypeUInt(StrPtr(Filename), Size)

End Function

Public Function FreeImage_GetFIFFromFilenameU(ByVal Filename As String) As FREE_IMAGE_FORMAT

   ' This function is just a thin wrapper to ease the call to an
   ' UNICODE function. Since VB's BSTR strings are actually UNICODE
   ' strings, we just need to pass the pointer to the string data
   ' returned by the (undocumented) function StrPtr().

   FreeImage_GetFIFFromFilenameU = FreeImage_GetFIFFromFilenameUInt(StrPtr(Filename))

End Function



'--------------------------------------------------------------------------------
' Boolean returning functions wrappers
'--------------------------------------------------------------------------------

Public Function FreeImage_HasPixels(ByVal Bitmap As Long) As Boolean

   ' Thin wrapper function returning a real VB Boolean value

   FreeImage_HasPixels = (FreeImage_HasPixelsInt(Bitmap) = 1)

End Function

Public Function FreeImage_HasRGBMasks(ByVal Bitmap As Long) As Boolean

   ' Thin wrapper function returning a real VB Boolean value

   FreeImage_HasRGBMasks = (FreeImage_HasRGBMasksInt(Bitmap) = 1)

End Function


Public Function FreeImage_Save(ByVal Format As FREE_IMAGE_FORMAT, _
                               ByVal Bitmap As Long, _
                               ByVal Filename As String, _
                      Optional ByVal Flags As FREE_IMAGE_SAVE_OPTIONS) As Boolean

   ' Thin wrapper function returning a real VB Boolean value

   FreeImage_Save = (FreeImage_SaveInt(Format, Bitmap, Filename, Flags) = 1)

End Function

Public Function FreeImage_SaveToHandle(ByVal Format As FREE_IMAGE_FORMAT, _
                                       ByVal Bitmap As Long, _
                                       ByVal IO As Long, _
                                       ByVal Handle As Long, _
                              Optional ByVal Flags As FREE_IMAGE_SAVE_OPTIONS) As Boolean

   ' Thin wrapper function returning a real VB Boolean value

   FreeImage_SaveToHandle = (FreeImage_SaveToHandleInt(Format, Bitmap, IO, Handle, Flags) = 1)

End Function

Public Function FreeImage_IsTransparent(ByVal Bitmap As Long) As Boolean

   ' Thin wrapper function returning a real VB Boolean value

   FreeImage_IsTransparent = (FreeImage_IsTransparentInt(Bitmap) = 1)

End Function

Public Sub FreeImage_SetTransparent(ByVal Bitmap As Long, ByVal Value As Boolean)

   If (Value) Then
      Call FreeImage_SetTransparentInt(Bitmap, 1)
   Else
      Call FreeImage_SetTransparentInt(Bitmap, 0)
   End If

End Sub
           
Public Function FreeImage_HasBackgroundColor(ByVal Bitmap As Long) As Boolean

   ' Thin wrapper function returning a real VB Boolean value

   FreeImage_HasBackgroundColor = (FreeImage_HasBackgroundColorInt(Bitmap) = 1)

End Function

Public Function FreeImage_GetBackgroundColor(ByVal Bitmap As Long, _
                                             ByRef BackColor As RGBQUAD) As Boolean
   
   ' Thin wrapper function returning a real VB Boolean value

   FreeImage_GetBackgroundColor = (FreeImage_GetBackgroundColorInt(Bitmap, BackColor) = 1)
   
End Function

Public Function FreeImage_GetBackgroundColorAsLong(ByVal Bitmap As Long, _
                                                   ByRef BackColor As Long) As Boolean
   
   ' This function gets the background color of an image as FreeImage_GetBackgroundColor() does but
   ' provides it's result as a Long value.

   FreeImage_GetBackgroundColorAsLong = (FreeImage_GetBackgroundColorAsLongInt(Bitmap, BackColor) = 1)
   
End Function

Public Function FreeImage_GetBackgroundColorEx(ByVal Bitmap As Long, _
                                               ByRef Alpha As Byte, _
                                               ByRef Red As Byte, _
                                               ByRef Green As Byte, _
                                               ByRef Blue As Byte) As Boolean
                                              
Dim bkcolor As RGBQUAD

   ' This function gets the background color of an image as FreeImage_GetBackgroundColor() does but
   ' provides it's result as four different byte values, one for each color component.
                                              
   FreeImage_GetBackgroundColorEx = (FreeImage_GetBackgroundColorInt(Bitmap, bkcolor) = 1)
   With bkcolor
      Alpha = .rgbReserved
      Red = .rgbRed
      Green = .rgbGreen
      Blue = .rgbBlue
   End With

End Function

Public Function FreeImage_SetBackgroundColor(ByVal Bitmap As Long, _
                                             ByRef BackColor As RGBQUAD) As Boolean
                                             
   ' Thin wrapper function returning a real VB Boolean value

   FreeImage_SetBackgroundColor = (FreeImage_SetBackgroundColorInt(Bitmap, BackColor) = 1)
                                             
End Function

Public Function FreeImage_SetBackgroundColorAsLong(ByVal Bitmap As Long, _
                                                   ByVal BackColor As Long) As Boolean
                                             
   ' This function sets the background color of an image as FreeImage_SetBackgroundColor() does but
   ' the color value to set must be provided as a Long value.

   FreeImage_SetBackgroundColorAsLong = (FreeImage_SetBackgroundColorAsLongInt(Bitmap, BackColor) = 1)
                                             
End Function

Public Function FreeImage_SetBackgroundColorEx(ByVal Bitmap As Long, _
                                               ByVal Alpha As Byte, _
                                               ByVal Red As Byte, _
                                               ByVal Green As Byte, _
                                               ByVal Blue As Byte) As Boolean
                                              
Dim tColor As RGBQUAD

   ' This function sets the color at position (x|y) as FreeImage_SetPixelColor() does but
   ' the color value to set must be provided four different byte values, one for each
   ' color component.
                                             
   With tColor
      .rgbReserved = Alpha
      .rgbRed = Red
      .rgbGreen = Green
      .rgbBlue = Blue
   End With
   FreeImage_SetBackgroundColorEx = (FreeImage_SetBackgroundColorInt(Bitmap, tColor) = 1)

End Function

Public Function FreeImage_GetPixelIndex(ByVal Bitmap As Long, _
                                        ByVal x As Long, _
                                        ByVal y As Long, _
                                        ByRef Value As Byte) As Boolean

   ' Thin wrapper function returning a real VB Boolean value

   FreeImage_GetPixelIndex = (FreeImage_GetPixelIndexInt(Bitmap, x, y, Value) = 1)

End Function

Public Function FreeImage_GetPixelColor(ByVal Bitmap As Long, _
                                        ByVal x As Long, _
                                        ByVal y As Long, _
                                        ByRef Value As RGBQUAD) As Boolean
                                        
   ' Thin wrapper function returning a real VB Boolean value

   FreeImage_GetPixelColor = (FreeImage_GetPixelColorInt(Bitmap, x, y, Value) = 1)

End Function
           
Public Function FreeImage_GetPixelColorByLong(ByVal Bitmap As Long, _
                                              ByVal x As Long, _
                                              ByVal y As Long, _
                                              ByRef Value As Long) As Boolean
                                              
   ' This function gets the color at position (x|y) as FreeImage_GetPixelColor() does but
   ' provides it's result as a Long value.
                                              
   FreeImage_GetPixelColorByLong = (FreeImage_GetPixelColorByLongInt(Bitmap, x, y, Value) = 1)

End Function

Public Function FreeImage_GetPixelColorEx(ByVal Bitmap As Long, _
                                          ByVal x As Long, _
                                          ByVal y As Long, _
                                          ByRef Alpha As Byte, _
                                          ByRef Red As Byte, _
                                          ByRef Green As Byte, _
                                          ByRef Blue As Byte) As Boolean
                                              
Dim Value As RGBQUAD

   ' This function gets the color at position (x|y) as FreeImage_GetPixelColor() does but
   ' provides it's result as four different byte values, one for each color component.
                                              
   FreeImage_GetPixelColorEx = (FreeImage_GetPixelColorInt(Bitmap, x, y, Value) = 1)
   With Value
      Alpha = .rgbReserved
      Red = .rgbRed
      Green = .rgbGreen
      Blue = .rgbBlue
   End With

End Function

Public Function FreeImage_SetPixelIndex(ByVal Bitmap As Long, _
                                        ByVal x As Long, _
                                        ByVal y As Long, _
                                        ByRef Value As Byte) As Boolean
                                        
   ' Thin wrapper function returning a real VB Boolean value

   FreeImage_SetPixelIndex = (FreeImage_SetPixelIndexInt(Bitmap, x, y, Value) = 1)

End Function

Public Function FreeImage_SetPixelColor(ByVal Bitmap As Long, _
                                        ByVal x As Long, _
                                        ByVal y As Long, _
                                        ByRef Value As RGBQUAD) As Boolean
                                        
   ' Thin wrapper function returning a real VB Boolean value
                                        
   FreeImage_SetPixelColor = (FreeImage_SetPixelColorInt(Bitmap, x, y, Value) = 1)

End Function
           
Public Function FreeImage_SetPixelColorByLong(ByVal Bitmap As Long, _
                                              ByVal x As Long, _
                                              ByVal y As Long, _
                                              ByRef Value As Long) As Boolean
                                              
   ' This function sets the color at position (x|y) as FreeImage_SetPixelColor() does but
   ' the color value to set must be provided as a Long value.
   
   FreeImage_SetPixelColorByLong = (FreeImage_SetPixelColorByLongInt(Bitmap, x, y, Value) = 1)

End Function

Public Function FreeImage_SetPixelColorEx(ByVal Bitmap As Long, _
                                          ByVal x As Long, _
                                          ByVal y As Long, _
                                          ByVal Alpha As Byte, _
                                          ByVal Red As Byte, _
                                          ByVal Green As Byte, _
                                          ByVal Blue As Byte) As Boolean
                                              
Dim Value As RGBQUAD

   ' This function sets the color at position (x|y) as FreeImage_SetPixelColor() does but
   ' the color value to set must be provided four different byte values, one for each
   ' color component.
                                             
   With Value
      .rgbReserved = Alpha
      .rgbRed = Red
      .rgbGreen = Green
      .rgbBlue = Blue
   End With
   FreeImage_SetPixelColorEx = (FreeImage_SetPixelColorInt(Bitmap, x, y, Value) = 1)

End Function

Public Function FreeImage_FIFSupportsReading(ByVal Format As FREE_IMAGE_FORMAT) As Boolean

   ' Thin wrapper function returning a real VB Boolean value

   FreeImage_FIFSupportsReading = (FreeImage_FIFSupportsReadingInt(Format) = 1)

End Function

Public Function FreeImage_FIFSupportsWriting(ByVal Format As FREE_IMAGE_FORMAT) As Boolean

   ' Thin wrapper function returning a real VB Boolean value

   FreeImage_FIFSupportsWriting = (FreeImage_FIFSupportsWritingInt(Format) = 1)
   
End Function

Public Function FreeImage_FIFSupportsExportType(ByVal Format As FREE_IMAGE_FORMAT, _
                                                ByVal ImageType As FREE_IMAGE_TYPE) As Boolean

   ' Thin wrapper function returning a real VB Boolean value

   FreeImage_FIFSupportsExportType = (FreeImage_FIFSupportsExportTypeInt(Format, ImageType) = 1)

End Function

Public Function FreeImage_FIFSupportsExportBPP(ByVal Format As FREE_IMAGE_FORMAT, _
                                               ByVal BitsPerPixel As Long) As Boolean
   
   ' Thin wrapper function returning a real VB Boolean value

   FreeImage_FIFSupportsExportBPP = (FreeImage_FIFSupportsExportBPPInt(Format, BitsPerPixel) = 1)
                                             
End Function

Public Function FreeImage_FIFSupportsICCProfiles(ByVal Format As FREE_IMAGE_FORMAT) As Boolean

   ' Thin wrapper function returning a real VB Boolean value

   FreeImage_FIFSupportsICCProfiles = (FreeImage_FIFSupportsICCProfilesInt(Format) = 1)

End Function

Public Function FreeImage_FIFSupportsNoPixels(ByVal Format As FREE_IMAGE_FORMAT) As Boolean

   ' Thin wrapper function returning a real VB Boolean value

   FreeImage_FIFSupportsNoPixels = (FreeImage_FIFSupportsNoPixelsInt(Format) = 1)

End Function

Public Function FreeImage_CloseMultiBitmap(ByVal Bitmap As Long, _
                                  Optional ByVal Flags As FREE_IMAGE_SAVE_OPTIONS) As Boolean

   ' Thin wrapper function returning a real VB Boolean value

   FreeImage_CloseMultiBitmap = (FreeImage_CloseMultiBitmapInt(Bitmap, Flags) = 1)

End Function

Public Function FreeImage_MovePage(ByVal Bitmap As Long, _
                                   ByVal TargetPage As Long, _
                                   ByVal SourcePage As Long) As Boolean
                                   
   ' Thin wrapper function returning a real VB Boolean value

   FreeImage_MovePage = (FreeImage_MovePageInt(Bitmap, TargetPage, SourcePage) = 1)
           
End Function

Public Function FreeImage_GetLockedPageNumbers(ByVal Bitmap As Long, _
                                               ByRef PagesPtr As Long, _
                                               ByRef Count As Long) As Boolean
                                               
   ' Thin wrapper function returning a real VB Boolean value

   FreeImage_GetLockedPageNumbers = (FreeImage_GetLockedPageNumbersInt(Bitmap, PagesPtr, Count) = 1)

End Function

Public Function FreeImage_SaveToMemory(ByVal Format As FREE_IMAGE_FORMAT, _
                                       ByVal Bitmap As Long, _
                                       ByVal Stream As Long, _
                              Optional ByVal Flags As FREE_IMAGE_SAVE_OPTIONS) As Boolean
                              
   ' Thin wrapper function returning a real VB Boolean value

   FreeImage_SaveToMemory = (FreeImage_SaveToMemoryInt(Format, Bitmap, Stream, Flags) = 1)
  
End Function

Public Function FreeImage_AcquireMemory(ByVal Stream As Long, _
                                        ByRef DataPtr As Long, _
                                        ByRef SizeInBytes As Long) As Boolean
                                        
   ' Thin wrapper function returning a real VB Boolean value

   FreeImage_AcquireMemory = (FreeImage_AcquireMemoryInt(Stream, DataPtr, SizeInBytes) = 1)
           
End Function

Public Function FreeImage_SeekMemory(ByVal Stream As Long, _
                                     ByVal Offset As Long, _
                                     ByVal Origin As Long) As Boolean
                                     
   ' Thin wrapper function returning a real VB Boolean value

   FreeImage_SeekMemory = (FreeImage_SeekMemoryInt(Stream, Offset, Origin) = 1)

End Function

Public Function FreeImage_IsLittleEndian() As Boolean
   
   ' Thin wrapper function returning a real VB Boolean value

   FreeImage_IsLittleEndian = (FreeImage_IsLittleEndianInt() = 1)

End Function

Public Function FreeImage_LookupX11Color(ByVal Color As String, _
                                         ByRef Red As Long, _
                                         ByRef Green As Long, _
                                         ByRef Blue As Long) As Boolean
                                         
   ' Thin wrapper function returning a real VB Boolean value

   FreeImage_LookupX11Color = (FreeImage_LookupX11ColorInt(Color, Red, Green, Blue) = 1)
           
End Function

Public Function FreeImage_LookupSVGColor(ByVal Color As String, _
                                         ByRef Red As Long, _
                                         ByRef Green As Long, _
                                         ByRef Blue As Long) As Boolean
                                         
   ' Thin wrapper function returning a real VB Boolean value

   FreeImage_LookupSVGColor = (FreeImage_LookupSVGColorInt(Color, Red, Green, Blue) = 1)
         
End Function

Public Function FreeImage_FindNextMetadata(ByVal hFind As Long, _
                                           ByRef Tag As Long) As Boolean
                                           
   ' Thin wrapper function returning a real VB Boolean value

   FreeImage_FindNextMetadata = (FreeImage_FindNextMetadataInt(hFind, Tag) = 1)
                                           
End Function

Public Function FreeImage_CloneMetadata(ByVal BitmapDst As Long, _
                                        ByVal BitmapSrc As Long) As Boolean
                                           
   ' Thin wrapper function returning a real VB Boolean value

   FreeImage_CloneMetadata = (FreeImage_CloneMetadataInt(BitmapDst, BitmapSrc) = 1)
                                           
End Function

Public Function FreeImage_GetMetadata(ByVal Model As Long, _
                                      ByVal Bitmap As Long, _
                                      ByVal Key As String, _
                                      ByVal Tag As Long) As Boolean
                                      
   ' Thin wrapper function returning a real VB Boolean value

   FreeImage_GetMetadata = (FreeImage_GetMetadataInt(Model, Bitmap, Key, Tag) = 1)
                                      
End Function

Public Function FreeImage_SetMetadata(ByVal Model As Long, _
                                      ByVal Bitmap As Long, _
                                      ByVal Key As String, _
                                      ByVal Tag As Long) As Boolean
                                      
   ' Thin wrapper function returning a real VB Boolean value

   FreeImage_SetMetadata = (FreeImage_SetMetadataInt(Model, Bitmap, Key, Tag) = 1)
                                      
End Function

Public Function FreeImage_SetMetadataKeyValue(ByVal Model As Long, _
                                              ByVal Bitmap As Long, _
                                              ByVal Key As String, _
                                              ByVal Value As String) As Boolean
                                      
   ' Thin wrapper function returning a real VB Boolean value

   FreeImage_SetMetadataKeyValue = (FreeImage_SetMetadataKeyValueInt(Model, Bitmap, Key, Value) = 1)
                                      
End Function

Public Function FreeImage_FlipHorizontal(ByVal Bitmap As Long) As Boolean

   ' Thin wrapper function returning a real VB Boolean value

   FreeImage_FlipHorizontal = (FreeImage_FlipHorizontalInt(Bitmap) = 1)

End Function

Public Function FreeImage_FlipVertical(ByVal Bitmap As Long) As Boolean

   ' Thin wrapper function returning a real VB Boolean value

   FreeImage_FlipVertical = (FreeImage_FlipVerticalInt(Bitmap) = 1)

End Function
           
Public Function FreeImage_JPEGTransform(ByVal SourceFile As String, _
                                        ByVal DestFile As String, _
                                        ByVal Operation As FREE_IMAGE_JPEG_OPERATION, _
                               Optional ByVal Perfect As Boolean = True) As Boolean
                               
Dim lPerfect As Long
                               
   ' Thin wrapper function returning a real VB Boolean value

   If (Perfect) Then
      lPerfect = 1
   End If
   FreeImage_JPEGTransform = (FreeImage_JPEGTransformInt(SourceFile, DestFile, Operation, lPerfect) = 1)

End Function

Public Function FreeImage_JPEGTransformU(ByVal SourceFile As String, _
                                         ByVal DestFile As String, _
                                         ByVal Operation As FREE_IMAGE_JPEG_OPERATION, _
                                Optional ByVal Perfect As Boolean = True) As Boolean
                               
Dim lPerfect As Long
                               
   ' Thin wrapper function returning a real VB Boolean value
   
   ' This function is also a thin wrapper to ease the call to an
   ' UNICODE function. Since VB's BSTR strings are actually UNICODE
   ' strings, we just need to pass the pointer to the string data
   ' returned by the (undocumented) function StrPtr().

   If (Perfect) Then
      lPerfect = 1
   End If
   FreeImage_JPEGTransformU = (FreeImage_JPEGTransformInt(StrPtr(SourceFile), StrPtr(DestFile), _
         Operation, lPerfect) = 1)

End Function

Public Function FreeImage_JPEGCrop(ByVal SourceFile As String, _
                                   ByVal DestFile As String, _
                                   ByVal Left As Long, _
                                   ByVal Top As Long, _
                                   ByVal Right As Long, _
                                   ByVal Bottom As Long) As Boolean
                                   
   ' Thin wrapper function returning a real VB Boolean value
   
   FreeImage_JPEGCrop = (FreeImage_JPEGCropInt(SourceFile, DestFile, Left, Top, Right, Bottom) = 1)
                                   
End Function

Public Function FreeImage_JPEGCropU(ByVal SourceFile As String, _
                                    ByVal DestFile As String, _
                                    ByVal Left As Long, _
                                    ByVal Top As Long, _
                                    ByVal Right As Long, _
                                    ByVal Bottom As Long) As Boolean
                                   
   ' Thin wrapper function returning a real VB Boolean value
   
   ' This function is also a thin wrapper to ease the call to an
   ' UNICODE function. Since VB's BSTR strings are actually UNICODE
   ' strings, we just need to pass the pointer to the string data
   ' returned by the (undocumented) function StrPtr().
   
   FreeImage_JPEGCropU = (FreeImage_JPEGCropInt(StrPtr(SourceFile), StrPtr(DestFile), Left, Top, _
         Right, Bottom) = 1)
                                   
End Function

Public Function FreeImage_JPEGTransformCombined(ByVal SourceFile As String, _
                                                ByVal DestFile As String, _
                                                ByVal Operation As FREE_IMAGE_JPEG_OPERATION, _
                                                ByVal Left As Long, _
                                                ByVal Top As Long, _
                                                ByVal Right As Long, _
                                                ByVal Bottom As Long, _
                                       Optional ByVal Perfect As Boolean = True) As Boolean
                               
Dim lPerfect As Long
                               
   ' Thin wrapper function returning a real VB Boolean value

   If (Perfect) Then
      lPerfect = 1
   End If
   FreeImage_JPEGTransformCombined = (FreeImage_JPEGTransformCombinedInt(SourceFile, DestFile, _
         Operation, Left, Top, Right, Bottom, lPerfect) = 1)

End Function

Public Function FreeImage_JPEGTransformCombinedU(ByVal SourceFile As String, _
                                                 ByVal DestFile As String, _
                                                 ByVal Operation As FREE_IMAGE_JPEG_OPERATION, _
                                                 ByVal Left As Long, _
                                                 ByVal Top As Long, _
                                                 ByVal Right As Long, _
                                                 ByVal Bottom As Long, _
                                        Optional ByVal Perfect As Boolean = True) As Boolean
                               
Dim lPerfect As Long
                               
   ' Thin wrapper function returning a real VB Boolean value
   
   ' This function is also a thin wrapper to ease the call to an
   ' UNICODE function. Since VB's BSTR strings are actually UNICODE
   ' strings, we just need to pass the pointer to the string data
   ' returned by the (undocumented) function StrPtr().

   If (Perfect) Then
      lPerfect = 1
   End If
   FreeImage_JPEGTransformCombinedU = (FreeImage_JPEGTransformCombinedUInt(StrPtr(SourceFile), _
         StrPtr(DestFile), Operation, Left, Top, Right, Bottom, lPerfect) = 1)

End Function

Public Function FreeImage_JPEGTransformCombinedFromMemory(ByVal SourceStream As Long, _
                                                          ByVal DestStream As Long, _
                                                          ByVal Operation As FREE_IMAGE_JPEG_OPERATION, _
                                                          ByVal Left As Long, _
                                                          ByVal Top As Long, _
                                                          ByVal Right As Long, _
                                                          ByVal Bottom As Long, _
                                                 Optional ByVal Perfect As Boolean = True) As Boolean
                               
Dim lPerfect As Long
                               
   ' Thin wrapper function returning a real VB Boolean value

   If (Perfect) Then
      lPerfect = 1
   End If
   FreeImage_JPEGTransformCombinedFromMemory = (FreeImage_JPEGTransformCombinedFromMemoryInt(SourceStream, _
         DestStream, Operation, Left, Top, Right, Bottom, lPerfect) = 1)

End Function

Public Function FreeImage_AdjustCurve(ByVal Bitmap As Long, _
                                      ByVal LookupTablePtr As Long, _
                                      ByVal Channel As FREE_IMAGE_COLOR_CHANNEL) As Boolean

   ' Thin wrapper function returning a real VB Boolean value
   
   FreeImage_AdjustCurve = (FreeImage_AdjustCurveInt(Bitmap, LookupTablePtr, Channel) = 1)

End Function

Public Function FreeImage_AdjustGamma(ByVal Bitmap As Long, _
                                      ByVal Gamma As Double) As Boolean

   ' Thin wrapper function returning a real VB Boolean value

   FreeImage_AdjustGamma = (FreeImage_AdjustGammaInt(Bitmap, Gamma) = 1)

End Function

Public Function FreeImage_AdjustBrightness(ByVal Bitmap As Long, _
                                           ByVal Percentage As Double) As Boolean
           
   ' Thin wrapper function returning a real VB Boolean value

   FreeImage_AdjustBrightness = (FreeImage_AdjustBrightnessInt(Bitmap, Percentage) = 1)
           
End Function

Public Function FreeImage_AdjustContrast(ByVal Bitmap As Long, _
                                         ByVal Percentage As Double) As Boolean
           
   ' Thin wrapper function returning a real VB Boolean value

   FreeImage_AdjustContrast = (FreeImage_AdjustContrastInt(Bitmap, Percentage) = 1)
           
End Function

Public Function FreeImage_Invert(ByVal Bitmap As Long) As Boolean
           
   ' Thin wrapper function returning a real VB Boolean value

   FreeImage_Invert = (FreeImage_InvertInt(Bitmap) = 1)
           
End Function

Public Function FreeImage_GetHistogram(ByVal Bitmap As Long, _
                                       ByRef HistogramPtr As Long, _
                              Optional ByVal Channel As FREE_IMAGE_COLOR_CHANNEL = FICC_BLACK) As Boolean

   ' Thin wrapper function returning a real VB Boolean value

   FreeImage_GetHistogram = (FreeImage_GetHistogramInt(Bitmap, HistogramPtr, Channel) = 1)
   
End Function

Public Function FreeImage_AdjustColors(ByVal Bitmap As Long, _
                              Optional ByVal Brightness As Double, _
                              Optional ByVal Contrast As Double, _
                              Optional ByVal Gamma As Double = 1, _
                              Optional ByVal Invert As Boolean) As Boolean
                              
Dim lInvert As Long
                              
   ' Thin wrapper function returning a real VB Boolean value
   If (Invert) Then
      lInvert = 1
   End If
   FreeImage_AdjustColors = (FreeImage_AdjustColorsInt(Bitmap, Brightness, Contrast, Gamma, lInvert) = 1)
   
End Function

Public Function FreeImage_SetChannel(ByVal BitmapDst As Long, _
                                     ByVal BitmapSrc As Long, _
                                     ByVal Channel As FREE_IMAGE_COLOR_CHANNEL) As Boolean
                                     
   ' Thin wrapper function returning a real VB Boolean value
   
   FreeImage_SetChannel = (FreeImage_SetChannelInt(BitmapDst, BitmapSrc, Channel) = 1)
           
End Function

Public Function FreeImage_SetComplexChannel(ByVal BitmapDst As Long, _
                                            ByVal BitmapSrc As Long, _
                                            ByVal Channel As FREE_IMAGE_COLOR_CHANNEL) As Boolean
                                            
   ' Thin wrapper function returning a real VB Boolean value
   
   FreeImage_SetComplexChannel = (FreeImage_SetComplexChannelInt(BitmapDst, BitmapSrc, Channel) = 1)
           
End Function

Public Function FreeImage_Paste(ByVal BitmapDst As Long, _
                                ByVal BitmapSrc As Long, _
                                ByVal Left As Long, _
                                ByVal Top As Long, _
                                ByVal Alpha As Long) As Boolean
   
   ' Thin wrapper function returning a real VB Boolean value
   
   FreeImage_Paste = (FreeImage_PasteInt(BitmapDst, BitmapSrc, Left, Top, Alpha) = 1)

End Function

Public Function FreeImage_PreMultiplyWithAlpha(ByVal Bitmap As Long) As Boolean

   ' Thin wrapper function returning a real VB Boolean value
   
   FreeImage_PreMultiplyWithAlpha = (FreeImage_PreMultiplyWithAlphaInt(Bitmap) = 1)

End Function

Public Function FreeImage_FillBackgroundEx(ByVal Bitmap As Long, _
                                           ByRef Color As RGBQUAD, _
                                  Optional ByVal Options As FREE_IMAGE_COLOR_OPTIONS) As Boolean

   ' Thin wrapper function returning a real VB Boolean value
   
   FreeImage_FillBackgroundEx = (FreeImage_FillBackground(Bitmap, Color, Options) = 1)

End Function
                                
Public Function FreeImage_FillBackgroundByLong(ByVal Bitmap As Long, _
                                               ByRef Color As Long, _
                                      Optional ByVal Options As FREE_IMAGE_COLOR_OPTIONS) As Boolean

   ' Thin wrapper function returning a real VB Boolean value
   
   FreeImage_FillBackgroundByLong = (FreeImage_FillBackground(Bitmap, Color, Options) = 1)

End Function

Public Function FreeImage_SetThumbnail(ByVal Bitmap As Long, ByVal Thumbnail As Long) As Boolean

   ' Thin wrapper function returning a real VB Boolean value
   
   FreeImage_SetThumbnail = (FreeImage_SetThumbnailInt(Bitmap, Thumbnail) = 1)

End Function

Public Function FreeImage_OpenMultiBitmap(ByVal Format As FREE_IMAGE_FORMAT, _
                                          ByVal Filename As String, _
                                 Optional ByVal CreateNew As Boolean, _
                                 Optional ByVal ReadOnly As Boolean, _
                                 Optional ByVal KeepCacheInMemory As Boolean, _
                                 Optional ByVal Flags As FREE_IMAGE_LOAD_OPTIONS) As Long

   FreeImage_OpenMultiBitmap = FreeImage_OpenMultiBitmapInt(Format, Filename, IIf(CreateNew, 1, 0), _
         IIf(ReadOnly And Not CreateNew, 1, 0), IIf(KeepCacheInMemory, 1, 0), Flags)

End Function

Public Sub FreeImage_UnlockPage(ByVal Bitmap As Long, ByVal PageBitmap As Long, ByVal ApplyChanges As Boolean)

Dim lApplyChanges As Long

   If (ApplyChanges) Then
      lApplyChanges = 1
   End If
   Call FreeImage_UnlockPageInt(Bitmap, PageBitmap, lApplyChanges)

End Sub

Public Function FreeImage_RotateEx(ByVal Bitmap As Long, _
                                   ByVal Angle As Double, _
                          Optional ByVal ShiftX As Double, _
                          Optional ByVal ShiftY As Double, _
                          Optional ByVal OriginX As Double, _
                          Optional ByVal OriginY As Double, _
                          Optional ByVal UseMask As Boolean) As Long

Dim lUseMask As Long

   If (UseMask) Then
      lUseMask = 1
   End If
   FreeImage_RotateEx = FreeImage_RotateExInt(Bitmap, Angle, ShiftX, ShiftY, OriginX, OriginY, lUseMask)

End Function

Public Function FreeImage_MakeThumbnail(ByVal Bitmap As Long, _
                                        ByVal MaxPixelSize As Long, _
                               Optional ByVal Convert As Boolean) As Long

Dim lConvert As Long

   If (Convert) Then
      lConvert = 1
   End If
   FreeImage_MakeThumbnail = FreeImage_MakeThumbnailInt(Bitmap, MaxPixelSize, lConvert)

End Function

Public Function FreeImage_GetAdjustColorsLookupTable(ByVal LookupTablePtr As Long, _
                                            Optional ByVal Brightness As Double, _
                                            Optional ByVal Contrast As Double, _
                                            Optional ByVal Gamma As Double, _
                                            Optional ByVal Invert As Boolean) As Long

Dim lInvert As Long

   If (Invert) Then
      lInvert = 1
   End If
   FreeImage_GetAdjustColorsLookupTable = FreeImage_GetAdjustColorsLookupTableInt(LookupTablePtr, _
         Brightness, Contrast, Gamma, lInvert)

End Function

Public Function FreeImage_ApplyColorMapping(ByVal Bitmap As Long, _
                                            ByVal SourceColorsPtr As Long, _
                                            ByVal DestinationColorsPtr As Long, _
                                            ByVal Count As Long, _
                                   Optional ByVal IgnoreAlpha As Boolean = True, _
                                   Optional ByVal Swap As Boolean) As Long

Dim lIgnoreAlpha As Long
Dim lSwap As Long

   If (IgnoreAlpha) Then
      lIgnoreAlpha = 1
   End If
   If (Swap) Then
      lSwap = 1
   End If
   FreeImage_ApplyColorMapping = FreeImage_ApplyColorMappingInt(Bitmap, SourceColorsPtr, _
         DestinationColorsPtr, Count, lIgnoreAlpha, lSwap)

End Function

Public Function FreeImage_SwapColors(ByVal Bitmap As Long, _
                                     ByRef ColorA As RGBQUAD, _
                                     ByRef ColorB As RGBQUAD, _
                            Optional ByVal IgnoreAlpha As Boolean = True) As Long
                         
Dim lIgnoreAlpha As Long

   If (IgnoreAlpha) Then
      lIgnoreAlpha = 1
   End If
   FreeImage_SwapColors = FreeImage_SwapColorsInt(Bitmap, ColorA, ColorB, lIgnoreAlpha)
                         
End Function

Public Function FreeImage_SwapColorsByLong(ByVal Bitmap As Long, _
                                           ByRef ColorA As Long, _
                                           ByRef ColorB As Long, _
                                  Optional ByVal IgnoreAlpha As Boolean = True) As Long
                         
Dim lIgnoreAlpha As Long

   If (IgnoreAlpha) Then
      lIgnoreAlpha = 1
   End If
   FreeImage_SwapColorsByLong = FreeImage_SwapColorsByLongInt(Bitmap, ColorA, ColorB, _
         lIgnoreAlpha)
                         
End Function

Public Function FreeImage_ApplyPaletteIndexMapping(ByVal Bitmap As Long, _
                                                   ByVal SourceIndicesPtr As Long, _
                                                   ByVal DestinationIndicesPtr As Long, _
                                                   ByVal Count As Long, _
                                          Optional ByVal Swap As Boolean) As Long

Dim lSwap As Long

   If (Swap) Then
      lSwap = 1
   End If
   FreeImage_ApplyPaletteIndexMapping = FreeImage_ApplyPaletteIndexMappingInt(Bitmap, SourceIndicesPtr, _
         DestinationIndicesPtr, Count, lSwap)

End Function

Public Function FreeImage_ConvertFromRawBits(ByVal BitsPtr As Long, _
                                             ByVal Width As Long, _
                                             ByVal Height As Long, _
                                             ByVal Pitch As Long, _
                                             ByVal BitsPerPixel As Long, _
                                    Optional ByVal RedMask As Long, _
                                    Optional ByVal GreenMask As Long, _
                                    Optional ByVal BlueMask As Long, _
                                    Optional ByVal TopDown As Boolean) As Long

Dim lTopDown As Long

   If (TopDown) Then
      lTopDown = 1
   End If
   FreeImage_ConvertFromRawBits = FreeImage_ConvertFromRawBitsInt(BitsPtr, Width, Height, Pitch, _
         BitsPerPixel, RedMask, GreenMask, BlueMask, lTopDown)

End Function

Public Function FreeImage_ConvertFromRawBitsEx(ByVal CopySource As Boolean, _
                                               ByVal BitsPtr As Long, _
                                               ByVal ImageType As FREE_IMAGE_TYPE, _
                                               ByVal Width As Long, _
                                               ByVal Height As Long, _
                                               ByVal Pitch As Long, _
                                               ByVal BitsPerPixel As Long, _
                                      Optional ByVal RedMask As Long, _
                                      Optional ByVal GreenMask As Long, _
                                      Optional ByVal BlueMask As Long, _
                                      Optional ByVal TopDown As Boolean) As Long

Dim lCopySource As Long
Dim lTopDown As Long

   If (CopySource) Then
      lCopySource = 1
   End If
   If (TopDown) Then
      lTopDown = 1
   End If
   FreeImage_ConvertFromRawBitsEx = FreeImage_ConvertFromRawBitsExInt(lCopySource, BitsPtr, ImageType, _
         Width, Height, Pitch, BitsPerPixel, RedMask, GreenMask, BlueMask, lTopDown)

End Function

Public Sub FreeImage_ConvertToRawBits(ByVal BitsPtr As Long, _
                                      ByVal Bitmap As Long, _
                                      ByVal Pitch As Long, _
                                      ByVal BitsPerPixel As Long, _
                             Optional ByVal RedMask As Long, _
                             Optional ByVal GreenMask As Long, _
                             Optional ByVal BlueMask As Long, _
                             Optional ByVal TopDown As Boolean)

Dim lTopDown As Long

   If (TopDown) Then
      lTopDown = 1
   End If
   Call FreeImage_ConvertToRawBitsInt(BitsPtr, Bitmap, Pitch, _
         BitsPerPixel, RedMask, GreenMask, BlueMask, lTopDown)

End Sub

Public Function FreeImage_ConvertToStandardType(ByVal Bitmap As Long, _
                                       Optional ByVal ScaleLinear As Boolean = True) As Long
                                       
   If (ScaleLinear) Then
      FreeImage_ConvertToStandardType = FreeImage_ConvertToStandardTypeInt(Bitmap, 1)
   Else
      FreeImage_ConvertToStandardType = FreeImage_ConvertToStandardTypeInt(Bitmap, 0)
   End If
   
End Function

Public Function FreeImage_ConvertToType(ByVal Bitmap As Long, _
                                        ByVal DestinationType As FREE_IMAGE_TYPE, _
                               Optional ByVal ScaleLinear As Boolean = True) As Long
                                       
   If (ScaleLinear) Then
      FreeImage_ConvertToType = FreeImage_ConvertToTypeInt(Bitmap, DestinationType, 1)
   Else
      FreeImage_ConvertToType = FreeImage_ConvertToTypeInt(Bitmap, DestinationType, 0)
   End If
   
End Function



'--------------------------------------------------------------------------------
' Color conversion helper functions
'--------------------------------------------------------------------------------

Public Function ConvertColor(ByVal Color As Long) As Long

   ' This helper function converts a VB-style color value (like vbRed), which
   ' uses the ABGR format into a RGBQUAD compatible color value, using the ARGB
   ' format, needed by FreeImage and vice versa.

   ConvertColor = ((Color And &HFF000000) Or _
                   ((Color And &HFF&) * &H10000) Or _
                   ((Color And &HFF00&)) Or _
                   ((Color And &HFF0000) \ &H10000))

End Function

Public Function ConvertOleColor(ByVal Color As OLE_COLOR) As Long

   ' This helper function converts an OLE_COLOR value (like vbButtonFace), which
   ' uses the BGR format into a RGBQUAD compatible color value, using the ARGB
   ' format, needed by FreeImage.
   
   ' This function generally ingnores the specified color's alpha value but, in
   ' contrast to ConvertColor, also has support for system colors, which have the
   ' format &H80bbggrr.
   
   ' You should not use this function to convert any color provided by FreeImage
   ' in ARGB format into a VB-style ABGR color value. Use function ConvertColor
   ' instead.

Dim lColorRef As Long

   If (OleTranslateColor(Color, 0, lColorRef) = 0) Then
      ConvertOleColor = ConvertColor(lColorRef)
   End If

End Function



'--------------------------------------------------------------------------------
' Extended functions derived from FreeImage 3 functions usually dealing
' with arrays
'--------------------------------------------------------------------------------

Public Sub FreeImage_UnloadEx(ByRef Bitmap As Long)

   ' Extended version of FreeImage_Unload, which additionally sets the
   ' passed Bitmap handle to zero after unloading.

   If (Bitmap <> 0) Then
      Call FreeImage_Unload(Bitmap)
      Bitmap = 0
   End If

End Sub

Public Function FreeImage_GetPaletteEx(ByVal Bitmap As Long) As RGBQUAD()

Dim tSA As SAVEARRAY1D
Dim lpSA As Long

   ' This function returns a VB style array of type RGBQUAD, containing
   ' the palette data of the Bitmap. This array provides read and write access
   ' to the actual palette data provided by FreeImage. This is done by
   ' creating a VB array with an own SAFEARRAY descriptor making the
   ' array point to the palette pointer returned by FreeImage_GetPalette().
   
   ' This makes you use code like you would in C/C++:
   
   ' // this code assumes there is a bitmap loaded and
   ' // present in a variable called ‘dib’
   ' if(FreeImage_GetBPP(Bitmap) == 8) {
   '   // Build a greyscale palette
   '   RGBQUAD *pal = FreeImage_GetPalette(Bitmap);
   '   for (int i = 0; i < 256; i++) {
   '     pal[i].rgbRed = i;
   '     pal[i].rgbGreen = i;
   '     pal[i].rgbBlue = i;
   '   }
   
   ' As in C/C++ the array is only valid while the DIB is loaded and the
   ' palette data remains where the pointer returned by FreeImage_GetPalette
   ' has pointed to when this function was called. So, a good thing would
   ' be, not to keep the returned array in scope over the lifetime of the
   ' Bitmap. Best practise is, to use this function within another routine and
   ' assign the return value (the array) to a local variable only. As soon
   ' as this local variable goes out of scope (when the calling function
   ' returns to it's caller), the array and the descriptor is automatically
   ' cleaned up by VB.
   
   ' This function does not make a deep copy of the palette data, but only
   ' wraps a VB array around the FreeImage palette data. So, it can be called
   ' frequently "on demand" or somewhat "in place" without a significant
   ' performance loss.
   
   ' To learn more about this technique I recommend reading chapter 2 (Leveraging
   ' Arrays) of Matthew Curland's book "Advanced Visual Basic 6"
   
   ' The parameter 'Bitmap' works according to the FreeImage 3 API documentation.
   
   ' To reuse the caller's array variable, this function's result was assigned to,
   ' before it goes out of scope, the caller's array variable must be destroyed with
   ' the FreeImage_DestroyLockedArrayRGBQUAD() function.
   
   
   If (Bitmap) Then
      
      ' create a proper SAVEARRAY descriptor
      With tSA
         .cbElements = 4                              ' size in bytes of RGBQUAD structure
         .cDims = 1                                   ' the array has only 1 dimension
         .cElements = FreeImage_GetColorsUsed(Bitmap) ' the number of elements in the array is
                                                      ' the number of used colors in the Bitmap
         .fFeatures = FADF_AUTO Or FADF_FIXEDSIZE     ' need AUTO and FIXEDSIZE for safety issues,
                                                      ' so the array can not be modified in size
                                                      ' or erased; according to Matthew Curland never
                                                      ' use FIXEDSIZE alone
         .pvData = FreeImage_GetPalette(Bitmap)       ' let the array point to the memory block, the
                                                      ' FreeImage palette pointer points to
      End With
      
      ' allocate memory for an array descriptor
      ' we cannot use the memory block used by tSA, since it is
      ' released when tSA goes out of scope, leaving us with an
      ' array with zeroed descriptor
      ' we use nearly the same method that VB uses, so VB is able
      ' to cleanup the array variable and it's descriptor; the
      ' array data is not touched when cleaning up, since both AUTO
      ' and FIXEDSIZE flags are set
      Call SafeArrayAllocDescriptor(1, lpSA)
      
      ' copy our own array descriptor over the descriptor allocated
      ' by SafeArrayAllocDescriptor; lpSA is a pointer to that memory
      ' location
      Call CopyMemory(ByVal lpSA, tSA, Len(tSA))
      
      ' the implicit variable named as the function is an array variable in VB
      ' make it point to the allocated array descriptor
      Call CopyMemory(ByVal VarPtrArray(FreeImage_GetPaletteEx), lpSA, 4)
   End If

End Function

Public Function FreeImage_GetPaletteExClone(ByVal Bitmap As Long) As RGBQUAD()

Dim lColors As Long
Dim atPal() As RGBQUAD

   ' This function returns a redundant clone of a Bitmap's palette as a
   ' VB style array of type RGBQUAD.
   
   ' The parameter 'Bitmap' works according to the FreeImage 3 API documentation.

   lColors = FreeImage_GetColorsUsed(Bitmap)
   If (lColors > 0) Then
      ReDim atPal(lColors - 1)
      Call CopyMemory(atPal(0), ByVal FreeImage_GetPalette(Bitmap), lColors * 4)
      Call pSwap(ByVal VarPtrArray(atPal), ByVal VarPtrArray(FreeImage_GetPaletteExClone))
   End If

End Function

Public Function FreeImage_GetPaletteExLong(ByVal Bitmap As Long) As Long()

Dim tSA As SAVEARRAY1D
Dim lpSA As Long

   ' This function returns a VB style array of type Long, containing
   ' the palette data of the Bitmap. This array provides read and write access
   ' to the actual palette data provided by FreeImage. This is done by
   ' creating a VB array with an own SAFEARRAY descriptor making the
   ' array point to the palette pointer returned by FreeImage_GetPalette().
   
   ' The function actually returns an array of type RGBQUAD with each
   ' element packed into a Long. This is possible, since the RGBQUAD
   ' structure is also four bytes in size. Palette data, stored in an
   ' array of type Long may be passed ByRef to a function through an
   ' optional paremeter. For an example have a look at function
   ' FreeImage_ConvertColorDepth()
   
   ' This makes you use code like you would in C/C++:
   
   ' // this code assumes there is a bitmap loaded and
   ' // present in a variable called ‘dib’
   ' if(FreeImage_GetBPP(Bitmap) == 8) {
   '   // Build a greyscale palette
   '   RGBQUAD *pal = FreeImage_GetPalette(Bitmap);
   '   for (int i = 0; i < 256; i++) {
   '     pal[i].rgbRed = i;
   '     pal[i].rgbGreen = i;
   '     pal[i].rgbBlue = i;
   '   }
   
   ' As in C/C++ the array is only valid while the DIB is loaded and the
   ' palette data remains where the pointer returned by FreeImage_GetPalette()
   ' has pointed to when this function was called. So, a good thing would
   ' be, not to keep the returned array in scope over the lifetime of the
   ' Bitmap. Best practise is, to use this function within another routine and
   ' assign the return value (the array) to a local variable only. As soon
   ' as this local variable goes out of scope (when the calling function
   ' returns to it's caller), the array and the descriptor is automatically
   ' cleaned up by VB.
   
   ' This function does not make a deep copy of the palette data, but only
   ' wraps a VB array around the FreeImage palette data. So, it can be called
   ' frequently "on demand" or somewhat "in place" without a significant
   ' performance loss.
   
   ' To learn more about this technique I recommend reading chapter 2 (Leveraging
   ' Arrays) of Matthew Curland's book "Advanced Visual Basic 6"
   
   ' The parameter 'Bitmap' works according to the FreeImage 3 API documentation.
   
   ' To reuse the caller's array variable, this function's result was assigned to,
   ' before it goes out of scope, the caller's array variable must be destroyed with
   ' the 'FreeImage_DestroyLockedArray' function.

   
   If (Bitmap) Then
      
      ' create a proper SAVEARRAY descriptor
      With tSA
         .cbElements = 4                              ' size in bytes of RGBQUAD structure
         .cDims = 1                                   ' the array has only 1 dimension
         .cElements = FreeImage_GetColorsUsed(Bitmap) ' the number of elements in the array is
                                                      ' the number of used colors in the Bitmap
         .fFeatures = FADF_AUTO Or FADF_FIXEDSIZE     ' need AUTO and FIXEDSIZE for safety issues,
                                                      ' so the array can not be modified in size
                                                      ' or erased; according to Matthew Curland never
                                                      ' use FIXEDSIZE alone
         .pvData = FreeImage_GetPalette(Bitmap)       ' let the array point to the memory block, the
                                                      ' FreeImage palette pointer points to
      End With
      
      ' allocate memory for an array descriptor
      ' we cannot use the memory block used by tSA, since it is
      ' released when tSA goes out of scope, leaving us with an
      ' array with zeroed descriptor
      ' we use nearly the same method that VB uses, so VB is able
      ' to cleanup the array variable and it's descriptor; the
      ' array data is not touched when cleaning up, since both AUTO
      ' and FIXEDSIZE flags are set
      Call SafeArrayAllocDescriptor(1, lpSA)
      
      ' copy our own array descriptor over the descriptor allocated
      ' by SafeArrayAllocDescriptor; lpSA is a pointer to that memory
      ' location
      Call CopyMemory(ByVal lpSA, tSA, Len(tSA))
      
      ' the implicit variable named as the function is an array variable in VB
      ' make it point to the allocated array descriptor
      Call CopyMemory(ByVal VarPtrArray(FreeImage_GetPaletteExLong), lpSA, 4)
   End If

End Function

Public Function FreeImage_GetPaletteExLongClone(ByVal Bitmap As Long) As Long()

Dim lColors As Long
Dim alPal() As Long

   ' This function returns a redundant clone of a Bitmap's palette as a
   ' VB style array of type Long.
   
   ' The parameter 'Bitmap' works according to the FreeImage 3 API documentation.

   lColors = FreeImage_GetColorsUsed(Bitmap)
   If (lColors > 0) Then
      ReDim alPal(lColors - 1)
      Call CopyMemory(alPal(0), ByVal FreeImage_GetPalette(Bitmap), lColors * 4)
      Call pSwap(ByVal VarPtrArray(alPal), ByVal VarPtrArray(FreeImage_GetPaletteExLongClone))
   End If

End Function

Public Function FreeImage_SetPalette(ByVal Bitmap As Long, ByRef Palette() As RGBQUAD) As Long

   ' This function sets the palette of a palletised bitmap using a RGBQUAD array. Does
   ' nothing on high color bitmaps.
   
   ' This operation makes a deep copy of the provided palette data so, after this function
   ' has returned, changes to the RGBQUAD array are no longer reflected by the bitmap's
   ' palette.

   FreeImage_SetPalette = FreeImage_GetColorsUsed(Bitmap)
   If (FreeImage_SetPalette > 0) Then
      Call CopyMemory(ByVal FreeImage_GetPalette(Bitmap), Palette(0), FreeImage_SetPalette * 4)
   End If

End Function

Public Function FreeImage_SetPaletteLong(ByVal Bitmap As Long, ByRef Palette() As Long) As Long
   
   ' This function sets the palette of a palletised bitmap using a RGBQUAD array. Does
   ' nothing on high color bitmaps.
   
   ' This operation makes a deep copy of the provided palette data so, after this function
   ' has returned, changes to the Long array are no longer reflected by the bitmap's
   ' palette.

   FreeImage_SetPaletteLong = FreeImage_GetColorsUsed(Bitmap)
   If (FreeImage_SetPaletteLong > 0) Then
      Call CopyMemory(ByVal FreeImage_GetPalette(Bitmap), Palette(0), FreeImage_SetPaletteLong * 4)
   End If

End Function

Public Function FreeImage_GetTransparencyTableEx(ByVal Bitmap As Long) As Byte()

Dim tSA As SAVEARRAY1D
Dim lpSA As Long

   ' This function returns a VB style Byte array, containing the transparency
   ' table of the Bitmap. This array provides read and write access to the actual
   ' transparency table provided by FreeImage. This is done by creating a VB array
   ' with an own SAFEARRAY descriptor making the array point to the transparency
   ' table pointer returned by FreeImage_GetTransparencyTable().
   
   ' This makes you use code like you would in C/C++:
   
   ' // this code assumes there is a bitmap loaded and
   ' // present in a variable called ‘dib’
   ' if(FreeImage_GetBPP(Bitmap) == 8) {
   '   // Remove transparency information
   '   byte *transt = FreeImage_GetTransparencyTable(Bitmap);
   '   for (int i = 0; i < 256; i++) {
   '     transt[i].rgbRed = 255;
   '   }
   
   ' As in C/C++ the array is only valid while the DIB is loaded and the transparency
   ' table remains where the pointer returned by FreeImage_GetTransparencyTable() has
   ' pointed to when this function was called. So, a good thing would be, not to keep
   ' the returned array in scope over the lifetime of the DIB. Best practise is, to use
   ' this function within another routine and assign the return value (the array) to a
   ' local variable only. As soon as this local variable goes out of scope (when the
   ' calling function returns to it's caller), the array and the descriptor is
   ' automatically cleaned up by VB.
   
   ' This function does not make a deep copy of the transparency table, but only
   ' wraps a VB array around the FreeImage transparency table. So, it can be called
   ' frequently "on demand" or somewhat "in place" without a significant
   ' performance loss.
   
   ' To learn more about this technique I recommend reading chapter 2 (Leveraging
   ' Arrays) of Matthew Curland's book "Advanced Visual Basic 6"
   
   ' The parameter 'Bitmap' works according to the FreeImage 3 API documentation.
   
   ' To reuse the caller's array variable, this function's result was assigned to,
   ' before it goes out of scope, the caller's array variable must be destroyed with
   ' the FreeImage_DestroyLockedArray() function.
   
   
   If (Bitmap) Then
      
      ' create a proper SAVEARRAY descriptor
      With tSA
         .cbElements = 1                                     ' size in bytes of a byte element
         .cDims = 1                                          ' the array has only 1 dimension
         .cElements = FreeImage_GetTransparencyCount(Bitmap) ' the number of elements in the array is
                                                             ' equal to the number transparency table entries
         .fFeatures = FADF_AUTO Or FADF_FIXEDSIZE            ' need AUTO and FIXEDSIZE for safety issues,
                                                             ' so the array can not be modified in size
                                                             ' or erased; according to Matthew Curland never
                                                             ' use FIXEDSIZE alone
         .pvData = FreeImage_GetTransparencyTable(Bitmap)    ' let the array point to the memory block, the
                                                             ' FreeImage transparency table pointer points to
      End With
      
      ' allocate memory for an array descriptor
      ' we cannot use the memory block used by tSA, since it is
      ' released when tSA goes out of scope, leaving us with an
      ' array with zeroed descriptor
      ' we use nearly the same method that VB uses, so VB is able
      ' to cleanup the array variable and it's descriptor; the
      ' array data is not touched when cleaning up, since both AUTO
      ' and FIXEDSIZE flags are set
      Call SafeArrayAllocDescriptor(1, lpSA)
      
      ' copy our own array descriptor over the descriptor allocated
      ' by SafeArrayAllocDescriptor(); lpSA is a pointer to that memory
      ' location
      Call CopyMemory(ByVal lpSA, tSA, Len(tSA))
      
      ' the implicit variable named as the function is an array variable in VB
      ' make it point to the allocated array descriptor
      Call CopyMemory(ByVal VarPtrArray(FreeImage_GetTransparencyTableEx), lpSA, 4)
   End If

End Function

Public Function FreeImage_GetTransparencyTableExClone(ByVal Bitmap As Long) As Byte()

Dim abBuffer() As Byte
Dim lpTransparencyTable As Long
Dim lEntries As Long

   ' This function returns a copy of a DIB's transparency table as VB style
   ' array of type Byte. So, the array provides read access only from the DIB's
   ' point of view.
   
   ' The parameter 'Bitmap' works according to the FreeImage 3 API documentation.

   lpTransparencyTable = FreeImage_GetTransparencyTable(Bitmap)
   If (lpTransparencyTable) Then
      lEntries = FreeImage_GetTransparencyCount(Bitmap)
      If (lEntries > 0) Then
         ReDim abBuffer(lEntries - 1)
         Call CopyMemory(abBuffer(0), ByVal lpTransparencyTable, lEntries)
         Call pSwap(ByVal VarPtrArray(abBuffer), ByVal VarPtrArray( _
               FreeImage_GetTransparencyTableExClone))
      End If
   End If

End Function

Public Sub FreeImage_SetTransparencyTableEx(ByVal Bitmap As Long, _
                                            ByRef Table() As Byte, _
                                   Optional ByRef Count As Long = -1)

   ' This function sets a DIB's transparency table to the contents of the
   ' parameter table(). When the optional parameter Count is omitted, the
   ' number of entries used is taken from the number of elements stored in
   ' the array, but will never be never greater than 256.
   
   ' The parameter 'Bitmap' works according to the FreeImage 3 API documentation.
   
   If ((Count > UBound(Table) + 1) Or _
       (Count < 0)) Then
      Count = UBound(Table) + 1
   End If
   
   If (Count > 256) Then
      Count = 256
   End If

   Call FreeImage_SetTransparencyTable(Bitmap, VarPtr(Table(0)), Count)

End Sub

Public Function FreeImage_IsTransparencyTableTransparent(ByVal Bitmap As Long) As Boolean

Dim abTransTable() As Byte
Dim i As Long

   ' This function checks whether a Bitmap's transparency table contains any transparent
   ' colors or not.
   
   ' When an image has a transparency table and is transparent, what can be tested
   ' with 'FreeImage_IsTransparent()', the image still may display opaque when there
   ' are no transparent colors defined in the image's transparency table. This
   ' function reads the Bitmap's transparency table directly to determine whether
   ' there are transparent colors defined or not.
   
   ' The return value of this function does not relay on the image's transparency
   ' setting but only on the image's transparency table
   
   If (Bitmap) Then
      abTransTable = FreeImage_GetTransparencyTableEx(Bitmap)
      For i = 0 To UBound(abTransTable)
         FreeImage_IsTransparencyTableTransparent = (abTransTable(i) < 255)
         If (FreeImage_IsTransparencyTableTransparent) Then
            Exit For
         End If
      Next i
   End If

End Function

Public Function FreeImage_GetAdjustColorsLookupTableEx(ByRef LookupTable() As Byte, _
                                              Optional ByVal Brightness As Double, _
                                              Optional ByVal Contrast As Double, _
                                              Optional ByVal Gamma As Double = 1, _
                                              Optional ByVal Invert As Boolean) As Long
                                              
   ' This function is an extended wrapper for FreeImage_GetAdjustColorsLookupTable(), which
   ' takes a real VB style Byte array LUT() to receive the created lookup table. The LUT()
   ' parameter must not be fixed sized or locked, since it is (re-)dimensioned in this
   ' function to contain 256 entries.
                                              
   ' All parameters work according to the FreeImage 3 API documentation.

   ReDim LookupTable(255)
   FreeImage_GetAdjustColorsLookupTableEx = _
         FreeImage_GetAdjustColorsLookupTable(VarPtr(LookupTable(0)), Brightness, Contrast, _
               Gamma, Invert)

End Function

Public Function FreeImage_ApplyColorMappingEx(ByVal Bitmap As Long, _
                                              ByRef SourceColors() As RGBQUAD, _
                                              ByRef DestinationColors() As RGBQUAD, _
                                     Optional ByRef Count As Long = -1, _
                                     Optional ByVal IgnoreAlpha As Boolean = True, _
                                     Optional ByVal Swap As Boolean) As Long
                                     
Dim nsrc As Long
Dim ndst As Long

   ' This function is an extended wrapper for FreeImage_ApplyColorMapping(), which takes
   ' real VB style RGBQUAD arrays for source and destination colors along with an optional
   ' ByRef Count parameter.
   
   ' If 'Count' is omitted upon entry, the number of entries of the smaller of both arrays
   ' is used for 'Count' and also passed back to the caller, due to this parameter's ByRef
   ' nature.
   
   ' All other parameters work according to the FreeImage 3 API documentation.
   
   If (Bitmap) Then
   
      If (Not FreeImage_HasPixels(Bitmap)) Then
         Call Err.Raise(5, "MFreeImage", Error$(5) & vbCrLf & vbCrLf & _
                        "Unable to map colors on a 'header-only' bitmap.")
      End If
   
      nsrc = UBound(SourceColors) + 1
      ndst = UBound(DestinationColors) + 1
      If (Count = -1) Then
         If (nsrc < ndst) Then
            Count = nsrc
         Else
            Count = ndst
         End If
      Else
         If (Count < nsrc) Then
            Count = nsrc
         End If
         If (Count < ndst) Then
            Count = ndst
         End If
      End If
      
      FreeImage_ApplyColorMappingEx = FreeImage_ApplyColorMapping(Bitmap, _
            VarPtr(SourceColors(0)), VarPtr(DestinationColors(0)), Count, IgnoreAlpha, Swap)
   End If

End Function

Public Function FreeImage_ApplyPaletteIndexMappingEx(ByVal Bitmap As Long, _
                                                     ByRef SourceIndices() As Byte, _
                                                     ByRef DestinationIndices() As Byte, _
                                            Optional ByRef Count As Long = -1, _
                                            Optional ByVal Swap As Boolean) As Long
                                     
Dim nsrc As Long
Dim ndst As Long
Dim lSwap As Long

   ' This function is an extended wrapper for FreeImage_ApplyIndexMapping(), which takes
   ' real VB style Byte arrays for source and destination indices along with an optional
   ' ByRef count parameter.
   
   ' If 'Count' is omitted upon entry, the number of entries of the smaller of both arrays
   ' is used for 'Count' and also passed back to the caller, due to this parameter's ByRef
   ' nature.
   
   ' All other parameters work according to the FreeImage 3 API documentation.
   
   
   nsrc = UBound(SourceIndices) + 1
   ndst = UBound(DestinationIndices) + 1
   If (Count = -1) Then
      If (nsrc < ndst) Then
         Count = nsrc
      Else
         Count = ndst
      End If
   Else
      If (Count < nsrc) Then
         Count = nsrc
      End If
      If (Count < ndst) Then
         Count = ndst
      End If
   End If
 
   If (Swap) Then
      lSwap = 1
   End If
   
   FreeImage_ApplyPaletteIndexMappingEx = FreeImage_ApplyPaletteIndexMappingInt(Bitmap, _
         VarPtr(SourceIndices(0)), VarPtr(DestinationIndices(0)), Count, lSwap)

End Function

Public Function FreeImage_ConvertFromRawBitsArray(ByRef Bits() As Byte, _
                                                  ByVal Width As Long, _
                                                  ByVal Height As Long, _
                                                  ByVal Pitch As Long, _
                                                  ByVal BitsPerPixel As Long, _
                                         Optional ByVal RedMask As Long, _
                                         Optional ByVal GreenMask As Long, _
                                         Optional ByVal BlueMask As Long, _
                                         Optional ByVal TopDown As Boolean) As Long

   FreeImage_ConvertFromRawBitsArray = FreeImage_ConvertFromRawBits(VarPtr(Bits(0)), Width, Height, Pitch, _
         BitsPerPixel, RedMask, GreenMask, BlueMask, TopDown)

End Function

Public Sub FreeImage_ConvertToRawBitsArray(ByRef Bits() As Byte, _
                                           ByVal Bitmap As Long, _
                                           ByVal Pitch As Long, _
                                           ByVal BitsPerPixel As Long, _
                                  Optional ByVal RedMask As Long, _
                                  Optional ByVal GreenMask As Long, _
                                  Optional ByVal BlueMask As Long, _
                                  Optional ByVal TopDown As Boolean)

Dim lHeight As Long

   If (Bitmap) Then
   
      If (Not FreeImage_HasPixels(Bitmap)) Then
         Call Err.Raise(5, "MFreeImage", Error$(5) & vbCrLf & vbCrLf & _
                        "Unable to convert a 'header-only' bitmap.")
      End If
   
      If (Pitch > 0) Then
         lHeight = FreeImage_GetHeight(Bitmap)
         ReDim Bits((Pitch * lHeight) - 1)
         Call FreeImage_ConvertToRawBits(VarPtr(Bits(0)), Bitmap, Pitch, _
               BitsPerPixel, RedMask, GreenMask, BlueMask, TopDown)
      End If
   End If

End Sub

Public Function FreeImage_GetHistogramEx(ByVal Bitmap As Long, _
                                Optional ByVal Channel As FREE_IMAGE_COLOR_CHANNEL = FICC_BLACK, _
                                Optional ByRef Success As Boolean) As Long()
                                
Dim alResult() As Long

   ' This function returns a DIB's histogram data as VB style array of
   ' type Long. Since histogram data is never modified directly, it seems
   ' enough to return a clone of the data and no read/write accessible
   ' array wrapped around the actual pointer.
   
   ' All parameters work according to the FreeImage 3 API documentation.
   

   If (Bitmap) Then
   
      If (Not FreeImage_HasPixels(Bitmap)) Then
         Call Err.Raise(5, "MFreeImage", Error$(5) & vbCrLf & vbCrLf & _
                        "Unable to get histogram of a 'header-only' bitmap.")
      End If

      ReDim alResult(255)
      Success = (FreeImage_GetHistogramInt(Bitmap, alResult(0), Channel) = 1)
      If (Success) Then
         Call pSwap(VarPtrArray(FreeImage_GetHistogramEx), VarPtrArray(alResult))
      End If
   End If

End Function

Public Function FreeImage_AdjustCurveEx(ByVal Bitmap As Long, _
                                        ByRef LookupTable As Variant, _
                               Optional ByVal Channel As FREE_IMAGE_COLOR_CHANNEL = FICC_BLACK) As Boolean
                               
Dim lpData As Long
Dim lSizeInBytes As Long

   ' This function extends the FreeImage function 'FreeImage_AdjustCurve'
   ' to a more VB suitable function. The parameter 'LookupTable' may
   ' either be an array of type Byte or may contain the pointer to a memory
   ' block, what in VB is always the address of the memory block, since VB
   ' actually doesn's support native pointers.
   
   ' In case of providing the memory block as an array, make sure, that the
   ' array contains exactly 256 items. In case of providing an address of a
   ' memory block, the size of the memory block is assumed to be 256 bytes
   ' and it is up to the caller to ensure that it is large enough.
   
   
   If (Bitmap) Then
   
      If (Not FreeImage_HasPixels(Bitmap)) Then
         Call Err.Raise(5, "MFreeImage", Error$(5) & vbCrLf & vbCrLf & _
                        "Unable to adjust a 'header-only' bitmap.")
      End If

      If (IsArray(LookupTable)) Then
         lpData = pGetMemoryBlockPtrFromVariant(LookupTable, lSizeInBytes)
      
      ElseIf (IsNumeric(LookupTable)) Then
         lSizeInBytes = 256
         lpData = CLng(LookupTable)
      
      End If
      
      If ((lpData <> 0) And (lSizeInBytes = 256)) Then
         FreeImage_AdjustCurveEx = (FreeImage_AdjustCurveInt(Bitmap, lpData, Channel) = 1)
      End If
   End If

End Function

Public Function FreeImage_GetLockedPageNumbersEx(ByVal Bitmap As Long, _
                                        Optional ByRef Count As Long) As Long()
                                        
Dim lpPages As Long
Dim alResult() As Long

   ' This function extends the FreeImage function FreeImage_GetLockedPageNumbers()
   ' to a more VB suitable function. The original FreeImage parameter 'pages', which
   ' is a pointer to an array of Long, containing all locked page numbers, was turned
   ' into a return value, which is a real VB-style array of type Long. The original
   ' Boolean return value, indicating if there are any locked pages, was dropped from
   ' this function. The caller has to check the 'Count' parameter, which works according
   ' to the FreeImage API documentation.
   
   ' This function returns an array of Longs, dimensioned from 0 to (Count - 1), that
   ' contains the page numbers of all currently locked pages of 'BITMAP', if 'Count' is
   ' greater than 0 after the function returns. If 'Count' is 0, there are no pages
   ' locked and the function returns an uninitialized array.

   
   If (FreeImage_GetLockedPageNumbersInt(Bitmap, lpPages, Count) = 1) Then
      ReDim alResult(Count - 1)
      Call CopyMemory(alResult(0), ByVal lpPages, Count * 4)
   End If

End Function

' Memory and Stream functions

Public Function FreeImage_GetFileTypeFromMemoryEx(ByRef Data As Variant, _
                                         Optional ByRef SizeInBytes As Long) As FREE_IMAGE_FORMAT

Dim hStream As Long
Dim lDataPtr As Long

   ' This function extends the FreeImage function FreeImage_GetFileTypeFromMemory()
   ' to a more VB suitable function. The parameter data of type Variant my
   ' me either an array of type Byte, Integer or Long or may contain the pointer
   ' to a memory block, what in VB is always the address of the memory block,
   ' since VB actually doesn's support native pointers.
   
   ' In case of providing the memory block as an array, the SizeInBytes may
   ' be omitted, zero or less than zero. Then, the size of the memory block
   ' is calculated correctly. When SizeInBytes is given, it is up to the caller
   ' to ensure, it is correct.
   
   ' In case of providing an address of a memory block, SizeInBytes must not
   ' be omitted.
  

   ' get both pointer and size in bytes of the memory block provided
   ' through the Variant parameter 'data'.
   lDataPtr = pGetMemoryBlockPtrFromVariant(Data, SizeInBytes)
   
   ' open the memory stream
   hStream = FreeImage_OpenMemoryByPtr(lDataPtr, SizeInBytes)
   If (hStream) Then
      ' on success, detect image type
      FreeImage_GetFileTypeFromMemoryEx = FreeImage_GetFileTypeFromMemory(hStream)
      Call FreeImage_CloseMemory(hStream)
   Else
      FreeImage_GetFileTypeFromMemoryEx = FIF_UNKNOWN
   End If

End Function

Public Function FreeImage_LoadFromMemoryEx(ByRef Data As Variant, _
                                  Optional ByVal Flags As FREE_IMAGE_LOAD_OPTIONS, _
                                  Optional ByRef SizeInBytes As Long, _
                                  Optional ByRef Format As FREE_IMAGE_FORMAT) As Long

Dim hStream As Long
Dim lDataPtr As Long

   ' This function loads a FreeImage bitmap from memory that has been passed
   ' through parameter 'Data'. This parameter is of type Variant and may actually
   ' be an array of type Byte, Integer or Long or may contain the address of an
   ' arbitrary block of memory.
   
   ' The parameter 'SizeInBytes' specifies the size of the passed block of memory
   ' in bytes. It may be omitted, if parameter 'Data' contains an array of type Byte,
   ' Integer or Long upon entry. In that case, or if 'SizeInBytes' is zero or less
   ' than zero, the size is determined directly from the array and also passed back
   ' to the caller through parameter 'SizeInBytes'.
   
   ' The parameter 'Format' is an OUT only parameter that contains the image type
   ' of the loaded image after the function returns.
   
   ' The parameter 'Flags' works according to the FreeImage API documentation.
   

   ' get both pointer and size in bytes of the memory block provided
   ' through the Variant parameter 'data'.
   lDataPtr = pGetMemoryBlockPtrFromVariant(Data, SizeInBytes)
   
   ' open the memory stream
   hStream = FreeImage_OpenMemoryByPtr(lDataPtr, SizeInBytes)
   If (hStream) Then
      ' on success, detect image type
      Format = FreeImage_GetFileTypeFromMemory(hStream)
      If (Format <> FIF_UNKNOWN) Then
         ' load the image from memory stream only, if known image type
         FreeImage_LoadFromMemoryEx = FreeImage_LoadFromMemory(Format, hStream, Flags)
      End If
      ' close the memory stream
      Call FreeImage_CloseMemory(hStream)
   End If

End Function

Public Function FreeImage_SaveToMemoryEx(ByVal Format As FREE_IMAGE_FORMAT, _
                                         ByVal Bitmap As Long, _
                                         ByRef Data() As Byte, _
                                Optional ByVal Flags As FREE_IMAGE_SAVE_OPTIONS, _
                                Optional ByVal UnloadSource As Boolean) As Boolean

Dim hStream As Long
Dim lpData As Long
Dim lSizeInBytes As Long

   ' This function saves a FreeImage bitmap into memory and returns it through
   ' the byte array passed in parameter 'Data()'. It makes a deep copy of the memory
   ' stream's byte buffer, into which the image has been saved. The memory stream
   ' is closed properly before the function returns.
   
   ' The provided byte array 'Data()' must not be a fixed sized array. It will be
   ' dimensioned to the size required to hold all the memory stream's data.
   
   ' The parameters 'Format', 'Bitmap' and 'Flags' work according to the FreeImage
   ' API documentation.
   
   ' The optional 'UnloadSource' parameter is for unloading the original image
   ' after it has been saved into memory. There is no need to clean up the DIB
   ' at the caller's site.
   
   ' The function returns True on success and False otherwise.
   
   
   If (Bitmap) Then
   
      If (Not FreeImage_HasPixels(Bitmap)) Then
         Call Err.Raise(5, "MFreeImage", Error$(5) & vbCrLf & vbCrLf & _
                        "Unable to save a 'header-only' bitmap.")
      End If
   
      hStream = FreeImage_OpenMemory()
      If (hStream) Then
         FreeImage_SaveToMemoryEx = FreeImage_SaveToMemory(Format, Bitmap, hStream, Flags)
         If (FreeImage_SaveToMemoryEx) Then
            If (FreeImage_AcquireMemoryInt(hStream, lpData, lSizeInBytes)) Then
               On Error Resume Next
               ReDim Data(lSizeInBytes - 1)
               If (Err.Number = ERROR_SUCCESS) Then
                  On Error GoTo 0
                  Call CopyMemory(Data(0), ByVal lpData, lSizeInBytes)
               Else
                  On Error GoTo 0
                  FreeImage_SaveToMemoryEx = False
               End If
            Else
               FreeImage_SaveToMemoryEx = False
            End If
         End If
         Call FreeImage_CloseMemory(hStream)
      Else
         FreeImage_SaveToMemoryEx = False
      End If
      
      If (UnloadSource) Then
         Call FreeImage_Unload(Bitmap)
      End If
   End If

End Function

Public Function FreeImage_SaveToMemoryEx2(ByVal Format As FREE_IMAGE_FORMAT, _
                                          ByVal Bitmap As Long, _
                                          ByRef Data() As Byte, _
                                          ByRef Stream As Long, _
                                 Optional ByVal Flags As FREE_IMAGE_SAVE_OPTIONS, _
                                 Optional ByVal UnloadSource As Boolean) As Boolean

   ' This function saves a FreeImage bitmap into memory and returns it through
   ' the byte array passed in parameter 'Data()'. In contrast to function
   ' 'FreeImage_SaveToMemoryEx', it does not make a deep copy of the memory
   ' stream's byte buffer, but directly wraps the array 'Data()' around the stream's
   ' byte buffer by calling function 'FreeImage_AcquireMemoryEx'. As a result, the
   ' memory stream must remain valid while the array 'Data()' is in use. In other
   ' words, the stream must be maintained by the caller of this function.
   
   ' The provided byte array 'Data()' must not be a fixed sized array. It will be
   ' dimensioned to the size required to hold all the memory stream's data.
   
   ' To reuse the caller's array variable that was passed through parameter 'Data()'
   ' before it goes out of the caller's scope, it must first be destroyed by passing
   ' it to the 'FreeImage_DestroyLockedArray' function.
   
   ' The parameter 'Stream' is an IN/OUT parameter, that keeps track of the memory
   ' stream, the VB array 'Data()' is based on. This parameter may contain an
   ' already opened FreeImage memory stream upon entry and will contain a valid
   ' memory stream when the function returns. It is left up to the caller to close
   ' this memory stream correctly.
   
   ' The array 'Data()' will no longer be valid and accessible after the stream has
   ' been closed, so the stream should only be closed after the passed byte array
   ' variable goes out of the caller's scope or is reused.
   
   ' The parameters 'Format', 'Bitmap' and 'Flags' work according to the FreeImage
   ' API documentation.
   
   ' The optional 'UnloadSource' parameter is for unloading the original image
   ' after it has been saved to memory. There is no need to clean up the DIB
   ' at the caller's site.
   
   ' The function returns True on success and False otherwise.

   If (Bitmap) Then
   
      If (Not FreeImage_HasPixels(Bitmap)) Then
         Call Err.Raise(5, "MFreeImage", Error$(5) & vbCrLf & vbCrLf & _
                        "Unable to save a 'header-only' bitmap.")
      End If
   
      If (Stream = 0) Then
         Stream = FreeImage_OpenMemory()
      End If
      If (Stream) Then
         FreeImage_SaveToMemoryEx2 = FreeImage_SaveToMemory(Format, Bitmap, Stream, Flags)
         If (FreeImage_SaveToMemoryEx2) Then
            FreeImage_SaveToMemoryEx2 = FreeImage_AcquireMemoryEx(Stream, Data)
         End If
         
         ' Do not close the memory stream, since the returned array Data()
         ' directly points to the stream's data. The stream handle is passed back
         ' to the caller through parameter 'Stream'. The caller must close
         ' this stream after being done with the array.
      Else
         FreeImage_SaveToMemoryEx2 = False
      End If
      
      If (UnloadSource) Then
         Call FreeImage_Unload(Bitmap)
      End If
   End If

End Function

Public Function FreeImage_AcquireMemoryEx(ByVal Stream As Long, _
                                          ByRef Data() As Byte, _
                                 Optional ByRef SizeInBytes As Long) As Boolean
                                          
Dim lpData As Long
Dim tSA As SAVEARRAY1D
Dim lpSA As Long

   ' This function wraps the byte array passed through parameter 'Data()' around the
   ' memory acquired from the specified memory stream. After the function returns,
   ' the array passed in 'Data()' points directly to the stream's data pointer and so,
   ' provides full read and write access to the streams byte buffer.
   
   ' To reuse the caller's array variable, this function's result was assigned to,
   ' before it goes out of scope, the caller's array variable must be destroyed with
   ' the 'FreeImage_DestroyLockedArray' function.


   If (Stream) Then
      If (FreeImage_AcquireMemoryInt(Stream, lpData, SizeInBytes)) Then
         With tSA
            .cbElements = 1                           ' one element is one byte
            .cDims = 1                                ' the array has only 1 dimension
            .cElements = SizeInBytes                  ' the number of elements in the array is
                                                      ' the size in bytes of the memory block
            .fFeatures = FADF_AUTO Or FADF_FIXEDSIZE  ' need AUTO and FIXEDSIZE for safety issues,
                                                      ' so the array can not be modified in size
                                                      ' or erased; according to Matthew Curland never
                                                      ' use FIXEDSIZE alone
            .pvData = lpData                          ' let the array point to the memory block
                                                      ' received by FreeImage_AcquireMemory
         End With
         
         lpSA = pDeref(VarPtrArray(Data))
         If (lpSA = 0) Then
            ' allocate memory for an array descriptor
            Call SafeArrayAllocDescriptor(1, lpSA)
            Call CopyMemory(ByVal VarPtrArray(Data), lpSA, 4)
         Else
            Call SafeArrayDestroyData(lpSA)
         End If
         Call CopyMemory(ByVal lpSA, tSA, Len(tSA))
      Else
         FreeImage_AcquireMemoryEx = False
      End If
   Else
      FreeImage_AcquireMemoryEx = False
   End If

End Function

Public Function FreeImage_JPEGTransformCombinedFromMemoryEx(ByRef SourceData As Variant, _
                                                            ByRef DestData() As Byte, _
                                                            ByVal Operation As FREE_IMAGE_JPEG_OPERATION, _
                                                            ByVal Left As Long, _
                                                            ByVal Top As Long, _
                                                            ByVal Right As Long, _
                                                            ByVal Bottom As Long, _
                                                   Optional ByRef SourceSizeInBytes As Long, _
                                                   Optional ByVal Perfect As Boolean = True) As Boolean

Dim hSrcStream As Long
Dim lSrcDataPtr As Long
Dim hDstStream As Long
Dim lDstDataPtr As Long
Dim lDstSizeInBytes As Long
Dim lPerfect As Long
Dim lResult As Long

   ' This function performs a combination of lossless rotation or flipping and
   ' lossless crop on a JPEG file. The source file is loaded from the memory
   ' provided through parameter 'SourceData' and the result JPEG file is saved
   ' to memory accessible by the byte array passed through parameter 'DestData()'.

   ' The source JPEG file is loaded from the memory that has been passed through
   ' parameter 'SourceData'. This parameter is of type Variant and may actually
   ' be an array of type Byte, Integer or Long or may contain the address of an
   ' arbitrary block of memory.
   
   ' The parameter 'SourceSizeInBytes' specifies the size of the passed block of
   ' memory in bytes. It may be omitted, if parameter 'SourceData' contains an array
   ' of type Byte, Integer or Long upon entry. In that case, or if 'SizeInBytes' is
   ' zero or less than zero, the size is determined directly from the array and also
   ' passed back to the caller through parameter 'SourceSizeInBytes'.
   
   ' The result JPEG file function is saved to memory that is accessible through
   ' the byte array passed in parameter 'DestData()' after the function returns.
   ' It makes a deep copy of the memory stream's byte buffer, into which the image
   ' has been saved. The memory stream is closed properly before the function
   ' returns.
   
   ' The provided byte array 'DestData()' must not be a fixed sized array. It will
   ' be dimensioned to the size required to hold all the memory stream's data.

   ' The parameters 'Operation', 'Left', 'Top', 'Right', 'Bottom' and 'Perfect' work
   ' according to the FreeImage API documentation.


   ' get both pointer and size in bytes of the memory block provided
   ' through the Variant parameter 'SourceData'.
   lSrcDataPtr = pGetMemoryBlockPtrFromVariant(SourceData, SourceSizeInBytes)
   
   ' open the source memory stream
   hSrcStream = FreeImage_OpenMemoryByPtr(lSrcDataPtr, SourceSizeInBytes)
   If (hSrcStream) Then
      
      ' open the destination memory stream
      hDstStream = FreeImage_OpenMemory()
      If (hDstStream) Then
         
         If (Perfect) Then
            lPerfect = 1
         End If
         
         ' perform transformations
         lResult = FreeImage_JPEGTransformCombinedFromMemoryInt(hSrcStream, hDstStream, _
               Operation, Left, Top, Right, Bottom, lPerfect)
         
         If (lResult = 1) Then
           ' if the transformations succeeded, access the stream's byte buffer
            If (FreeImage_AcquireMemoryInt(hDstStream, lDstDataPtr, lDstSizeInBytes)) Then
               On Error Resume Next
               ' redim the array
               ReDim DestData(lDstSizeInBytes - 1)
               If (Err.Number = ERROR_SUCCESS) Then
                  On Error GoTo 0
                  ' and make a deep copy of the stream's byte buffer
                  Call CopyMemory(DestData(0), ByVal lDstDataPtr, lDstSizeInBytes)
               Else
                  On Error GoTo 0
                  lResult = 0
               End If
            Else
               lResult = 0
            End If
         End If
         
         ' close the destination memory stream
         Call FreeImage_CloseMemory(hDstStream)
      End If
      
      ' close the source memory stream
      Call FreeImage_CloseMemory(hSrcStream)
   End If

   FreeImage_JPEGTransformCombinedFromMemoryEx = (lResult = 1)

End Function

Public Function FreeImage_JPEGTransformCombinedFromMemoryEx2(ByRef SourceData As Variant, _
                                                             ByRef DestData() As Byte, _
                                                             ByRef DestStream As Long, _
                                                             ByVal Operation As FREE_IMAGE_JPEG_OPERATION, _
                                                             ByVal Left As Long, _
                                                             ByVal Top As Long, _
                                                             ByVal Right As Long, _
                                                             ByVal Bottom As Long, _
                                                    Optional ByRef SourceSizeInBytes As Long, _
                                                    Optional ByVal Perfect As Boolean = True) As Boolean

Dim hSrcStream As Long
Dim lSrcDataPtr As Long
Dim lPerfect As Long
Dim bResult As Boolean

   ' This function performs a combination of lossless rotation or flipping and
   ' lossless crop on a JPEG file. The source file is loaded from the memory
   ' provided through parameter 'SourceData' and the result JPEG file is saved
   ' to memory accessible by the byte array passed through parameter 'DestData()'.

   ' The source JPEG file is loaded from the memory that has been passed through
   ' parameter 'SourceData'. This parameter is of type Variant and may actually
   ' be an array of type Byte, Integer or Long or may contain the address of an
   ' arbitrary block of memory.
   
   ' The parameter 'SourceSizeInBytes' specifies the size of the passed block of
   ' memory in bytes. It may be omitted, if parameter 'SourceData' contains an array
   ' of type Byte, Integer or Long upon entry. In that case, or if 'SizeInBytes' is
   ' zero or less than zero, the size is determined directly from the array and also
   ' passed back to the caller through parameter 'SourceSizeInBytes'.

   ' The result JPEG file function is saved to memory that is accessible through the
   ' the byte array passed in parameter 'DestData()' after the function returns.
   ' In contrast to function 'FreeImage_JPEGTransformCombinedFromMemoryEx', it does
   ' not make a deep copy of the memory stream's byte buffer, but directly wraps the
   ' array 'DestData()' around the stream's byte buffer by calling function
   ' 'FreeImage_AcquireMemoryEx'. As a result, the memory stream must remain valid
   ' while the array 'Data()' is in use. In other words, the stream must be
   ' maintained by the caller of this function.
   
   ' The provided byte array 'DestData()' must not be a fixed sized array. It will be
   ' dimensioned to the size required to hold all the memory stream's data.
   
   ' To reuse the caller's array variable that was passed through parameter 'DestData()'
   ' before it goes out of the caller's scope, it must first be destroyed by passing it
   ' to the 'FreeImage_DestroyLockedArray' function.
   
   ' The parameter 'DestStream' is an IN/OUT parameter, that keeps track of the memory
   ' stream, the VB array 'DestData()' is based on. This parameter may contain an
   ' already opened FreeImage memory stream upon entry and will contain a valid
   ' memory stream when the function returns. It is left up to the caller to close
   ' this memory stream correctly.
   
   ' The array 'DestData()' will no longer be valid and accessible after the stream has
   ' been closed, so the stream should only be closed after the passed byte array
   ' variable goes out of the caller's scope or is reused.
   
   ' The parameters 'Operation', 'Left', 'Top', 'Right', 'Bottom' and 'Perfect' work
   ' according to the FreeImage API documentation.
   

   ' get both pointer and size in bytes of the memory block provided
   ' through the Variant parameter 'SourceData'.
   lSrcDataPtr = pGetMemoryBlockPtrFromVariant(SourceData, SourceSizeInBytes)
   
   ' open the source memory stream
   hSrcStream = FreeImage_OpenMemoryByPtr(lSrcDataPtr, SourceSizeInBytes)
   If (hSrcStream) Then
      
      If (DestStream = 0) Then
         ' open the destination memory stream, only if no valid stream was provided
         DestStream = FreeImage_OpenMemory()
      End If
      
      If (DestStream) Then
         
         If (Perfect) Then
            lPerfect = 1
         End If
         
         ' perform transformations
         bResult = (FreeImage_JPEGTransformCombinedFromMemoryInt(hSrcStream, DestStream, _
               Operation, Left, Top, Right, Bottom, lPerfect) = 1)
         
         If (bResult) Then
            ' if the transformations succeeded, access the stream's byte buffer
            bResult = FreeImage_AcquireMemoryEx(DestStream, DestData)
         End If
         
         ' Do not close the memory stream, since the returned array DestData()
         ' directly points to the stream's data. The stream handle is passed back
         ' to the caller through parameter 'DestStream'. The caller must close
         ' this stream after being done with the array.
      End If
      
      ' close the source memory stream
      Call FreeImage_CloseMemory(hSrcStream)
   End If

   FreeImage_JPEGTransformCombinedFromMemoryEx2 = bResult

End Function

Public Function FreeImage_ReadMemoryEx(ByRef Buffer As Variant, _
                                       ByVal Stream As Long, _
                              Optional ByRef Count As Long, _
                              Optional ByRef Size As Long) As Long
                                       
Dim lBufferPtr As Long
Dim lSizeInBytes As Long
Dim lSize As Long
Dim lCount As Long

   ' This function is a wrapper for 'FreeImage_ReadMemory()' using VB style
   ' arrays instead of a void pointer.
   
   ' The variant parameter 'Buffer' may be a Byte, Integer or Long array or
   ' may contain a pointer to a memory block (the memory block's address).
   
   ' In the latter case, this function behaves exactly like
   ' function 'FreeImage_ReadMemory()'. Then, 'Count' and 'Size' must be valid
   ' upon entry.
   
   ' If 'Buffer' is an initialized (dimensioned) array, 'Count' and 'Size' may
   ' be omitted. Then, the array's layout is used to determine 'Count'
   ' and 'Size'. In that case, any provided value in 'Count' and 'Size' upon
   ' entry will override these calculated values as long as they are not
   ' exceeding the size of the array in 'Buffer'.
   
   ' If 'Buffer' is an uninitialized (not yet dimensioned) array of any valid
   ' type (Byte, Integer or Long) and, at least 'Count' is specified, the
   ' array in 'Buffer' is redimensioned by this function. If 'Buffer' is a
   ' fixed-size or otherwise locked array, a runtime error (10) occurs.
   ' If 'Size' is omitted, the array's element size is assumed to be the
   ' desired value.
   
   ' As FreeImage's function 'FreeImage_ReadMemory()', this function returns
   ' the number of items actually read.
   
   ' Example: (very freaky...)
   '
   ' Dim alLongBuffer() As Long
   ' Dim lRet as Long
   '
   '    ' now reading 303 integers (2 byte) into an array of Longs
   '    lRet = FreeImage_ReadMemoryEx(alLongBuffer, lMyStream, 303, 2)
   '
   '    ' now, lRet contains 303 and UBound(alLongBuffer) is 151 since
   '    ' we need at least 152 Longs (0..151) to store (303 * 2) = 606 bytes
   '    ' so, the higest two bytes of alLongBuffer(151) contain only unset
   '    ' bits. Got it?
   
   ' Remark: This function's parameter order differs from FreeImage's
   '         original funtion 'FreeImage_ReadMemory()'!
                                       
   If (VarType(Buffer) And vbArray) Then
      ' get both pointer and size in bytes of the memory block provided
      ' through the Variant parameter 'Buffer'.
      lBufferPtr = pGetMemoryBlockPtrFromVariant(Buffer, lSizeInBytes, lSize)
      If (lBufferPtr = 0) Then
         ' array is not initialized
         If (Count > 0) Then
            ' only if we have a 'Count' value, redim the array
            If (Size <= 0) Then
               ' if 'Size' is omitted, use array's element size
               Size = lSize
            End If
            
            Select Case lSize
            
            Case 2
               ' Remark: -Int(-a) == ceil(a); a > 0
               ReDim Buffer(-Int(-Count * Size / 2) - 1) As Integer
            
            Case 4
               ' Remark: -Int(-a) == ceil(a); a > 0
               ReDim Buffer(-Int(-Count * Size / 4) - 1) As Long
            
            Case Else
               ReDim Buffer((Count * Size) - 1) As Byte
            
            End Select
            lBufferPtr = pGetMemoryBlockPtrFromVariant(Buffer, lSizeInBytes, lSize)
         End If
      End If
      If (lBufferPtr) Then
         lCount = lSizeInBytes / lSize
         If (Size <= 0) Then
            ' use array's natural value for 'Size' when
            ' omitted
            Size = lSize
         End If
         If (Count <= 0) Then
            ' use array's natural value for 'Count' when
            ' omitted
            Count = lCount
         End If
         If ((Size * Count) > (lSize * lCount)) Then
            If (Size = lSize) Then
               Count = lCount
            Else
               ' Remark: -Fix(-a) == floor(a); a > 0
               Count = -Fix(-lSizeInBytes / Size)
               If (Count = 0) Then
                  Size = lSize
                  Count = lCount
               End If
            End If
         End If
         FreeImage_ReadMemoryEx = FreeImage_ReadMemory(lBufferPtr, Size, Count, Stream)
      End If
   
   ElseIf (VarType(Buffer) = vbLong) Then
      ' if Buffer is a Long, it specifies the address of a memory block
      ' then, we do not know anything about its size, so assume that 'Size'
      ' and 'Count' are correct and forward these directly to the FreeImage
      ' call.
      FreeImage_ReadMemoryEx = FreeImage_ReadMemory(CLng(Buffer), Size, Count, Stream)
   
   End If

End Function

Public Function FreeImage_WriteMemoryEx(ByRef Buffer As Variant, _
                                        ByVal Stream As Long, _
                               Optional ByRef Count As Long, _
                               Optional ByRef Size As Long) As Long
                                       
Dim lBufferPtr As Long
Dim lSizeInBytes As Long
Dim lSize As Long
Dim lCount As Long

   ' This function is a wrapper for 'FreeImage_WriteMemory()' using VB style
   ' arrays instead of a void pointer.
   
   ' The variant parameter 'Buffer' may be a Byte, Integer or Long array or
   ' may contain a pointer to a memory block (the memory block's address).
   
   ' In the latter case, this function behaves exactly
   ' like 'FreeImage_WriteMemory()'. Then, 'Count' and 'Size' must be valid
   ' upon entry.
   
   ' If 'Buffer' is an initialized (dimensioned) array, 'Count' and 'Size' may
   ' be omitted. Then, the array's layout is used to determine 'Count'
   ' and 'Size'. In that case, any provided value in 'Count' and 'Size' upon
   ' entry will override these calculated values as long as they are not
   ' exceeding the size of the array in 'Buffer'.
   
   ' If 'Buffer' is an uninitialized (not yet dimensioned) array of any
   ' type, the function will do nothing an returns 0.
   
   ' Remark: This function's parameter order differs from FreeImage's
   '         original funtion 'FreeImage_ReadMemory()'!

   If (VarType(Buffer) And vbArray) Then
      ' get both pointer and size in bytes of the memory block provided
      ' through the Variant parameter 'Buffer'.
      lBufferPtr = pGetMemoryBlockPtrFromVariant(Buffer, lSizeInBytes, lSize)
      If (lBufferPtr) Then
         lCount = lSizeInBytes / lSize
         If (Size <= 0) Then
            ' use array's natural value for 'Size' when
            ' omitted
            Size = lSize
         End If
         If (Count <= 0) Then
            ' use array's natural value for 'Count' when
            ' omitted
            Count = lCount
         End If
         If ((Size * Count) > (lSize * lCount)) Then
            If (Size = lSize) Then
               Count = lCount
            Else
               ' Remark: -Fix(-a) == floor(a); a > 0
               Count = -Fix(-lSizeInBytes / Size)
               If (Count = 0) Then
                  Size = lSize
                  Count = lCount
               End If
            End If
         End If
         FreeImage_WriteMemoryEx = FreeImage_WriteMemory(lBufferPtr, Size, Count, Stream)
      End If
   
   ElseIf (VarType(Buffer) = vbLong) Then
      ' if Buffer is a Long, it specifies the address of a memory block
      ' then, we do not know anything about its size, so assume that 'Size'
      ' and 'Count' are correct and forward these directly to the FreeImage
      ' call.
      FreeImage_WriteMemoryEx = FreeImage_WriteMemory(CLng(Buffer), Size, Count, Stream)
   
   End If

End Function

Public Function FreeImage_LoadMultiBitmapFromMemoryEx(ByRef Data As Variant, _
                                             Optional ByVal Flags As FREE_IMAGE_LOAD_OPTIONS, _
                                             Optional ByRef SizeInBytes As Long, _
                                             Optional ByRef Format As FREE_IMAGE_FORMAT) As Long

Dim hStream As Long
Dim lDataPtr As Long

   ' This function loads a FreeImage multipage bitmap from memory that has been
   ' passed through parameter 'Data'. This parameter is of type Variant and may
   ' actually be an array of type Byte, Integer or Long or may contain the
   ' address of an arbitrary block of memory.
   
   ' The parameter 'SizeInBytes' specifies the size of the passed block of memory
   ' in bytes. It may be omitted, if parameter 'Data' contains an array of type Byte,
   ' Integer or Long upon entry. In that case, or if 'SizeInBytes' is zero or less
   ' than zero, the size is determined directly from the array and also passed back
   ' to the caller through parameter 'SizeInBytes'.
   
   ' The parameter 'Format' is an OUT only parameter that contains the image type
   ' of the loaded image after the function returns.
   
   ' The parameter 'Flags' works according to the FreeImage API documentation.


   ' get both pointer and size in bytes of the memory block provided
   ' through the Variant parameter 'Data'.
   lDataPtr = pGetMemoryBlockPtrFromVariant(Data, SizeInBytes)
   
   ' open the memory stream
   hStream = FreeImage_OpenMemoryByPtr(lDataPtr, SizeInBytes)
   If (hStream) Then
      ' on success, detect image type
      Format = FreeImage_GetFileTypeFromMemory(hStream)
      If (Format <> FIF_UNKNOWN) Then
         ' load the image from memory stream only, if known image type
         FreeImage_LoadMultiBitmapFromMemoryEx = FreeImage_LoadMultiBitmapFromMemory(Format, _
               hStream, Flags)
      End If
      ' close the memory stream
      Call FreeImage_CloseMemory(hStream)
   End If

End Function

Public Function FreeImage_SaveMultiBitmapToMemoryEx(ByVal Format As FREE_IMAGE_FORMAT, _
                                                    ByVal Bitmap As Long, _
                                                    ByRef Data() As Byte, _
                                           Optional ByVal Flags As FREE_IMAGE_SAVE_OPTIONS, _
                                           Optional ByVal UnloadSource As Boolean) As Boolean

Dim hStream As Long
Dim lpData As Long
Dim lSizeInBytes As Long

   ' This function saves a FreeImage multipage bitmap into memory and returns it
   ' through the byte array passed in parameter 'Data()'. It makes a deep copy of
   ' the memory stream's byte buffer, into which the image has been saved. The
   ' memory stream is closed properly before the function returns.
   
   ' The provided byte array 'Data()' must not be a fixed sized array. It will be
   ' dimensioned to the size required to hold all the memory stream's data.
   
   ' The parameters 'Format', 'Bitmap' and 'Flags' work according to the FreeImage
   ' API documentation.
   
   ' The optional 'UnloadSource' parameter is for unloading the original image
   ' after it has been saved into memory. There is no need to clean up the DIB
   ' at the caller's site.
   
   ' The function returns True on success and False otherwise.
   
   
   If (Bitmap) Then
   
      If (Not FreeImage_HasPixels(Bitmap)) Then
         Call Err.Raise(5, "MFreeImage", Error$(5) & vbCrLf & vbCrLf & _
                        "Unable to save a 'header-only' bitmap.")
      End If
   
      hStream = FreeImage_OpenMemory()
      If (hStream) Then
         FreeImage_SaveMultiBitmapToMemoryEx = FreeImage_SaveMultiBitmapToMemory(Format, _
               Bitmap, hStream, Flags)
         If (FreeImage_SaveMultiBitmapToMemoryEx) Then
            If (FreeImage_AcquireMemoryInt(hStream, lpData, lSizeInBytes)) Then
               On Error Resume Next
               ReDim Data(lSizeInBytes - 1)
               If (Err.Number = ERROR_SUCCESS) Then
                  On Error GoTo 0
                  Call CopyMemory(Data(0), ByVal lpData, lSizeInBytes)
               Else
                  On Error GoTo 0
                  FreeImage_SaveMultiBitmapToMemoryEx = False
               End If
            Else
               FreeImage_SaveMultiBitmapToMemoryEx = False
            End If
         End If
         Call FreeImage_CloseMemory(hStream)
      Else
         FreeImage_SaveMultiBitmapToMemoryEx = False
      End If
      
      If (UnloadSource) Then
         Call FreeImage_CloseMultiBitmapInt(Bitmap)
      End If
   End If

End Function

Public Function FreeImage_SaveMultiBitmapToMemoryEx2(ByVal Format As FREE_IMAGE_FORMAT, _
                                                     ByVal Bitmap As Long, _
                                                     ByRef Data() As Byte, _
                                                     ByRef Stream As Long, _
                                            Optional ByVal Flags As FREE_IMAGE_SAVE_OPTIONS, _
                                            Optional ByVal UnloadSource As Boolean) As Boolean

   ' This function saves a FreeImage multipage bitmap into memory and returns it
   ' through the byte array passed in parameter 'Data()'. In contrast to function
   ' 'FreeImage_SaveToMemoryEx', it does not make a deep copy of the memory
   ' stream's byte buffer, but directly wraps the array 'Data()' around the stream's
   ' byte buffer by calling function 'FreeImage_AcquireMemoryEx'. As a result, the
   ' memory stream must remain valid while the array 'Data()' is in use. In other
   ' words, the stream must be maintained by the caller of this function.
   
   ' The provided byte array 'Data()' must not be a fixed sized array. It will be
   ' dimensioned to the size required to hold all the memory stream's data.
   
   ' To reuse the caller's array variable that was passed through parameter 'Data()'
   ' before it goes out of the caller's scope, it must first be destroyed by passing
   ' it to the 'FreeImage_DestroyLockedArray' function.
   
   ' The parameter 'Stream' is an IN/OUT parameter, that keeps track of the memory
   ' stream, the VB array 'Data()' is based on. This parameter may contain an
   ' already opened FreeImage memory stream upon entry and will contain a valid
   ' memory stream when the function returns. It is left up to the caller to close
   ' this memory stream correctly.
   
   ' The array 'Data()' will no longer be valid and accessible after the stream has
   ' been closed, so the stream should only be closed after the passed byte array
   ' variable goes out of the caller's scope or is reused.
   
   ' The parameters 'Format', 'Bitmap' and 'Flags' work according to the FreeImage
   ' API documentation.
   
   ' The optional 'UnloadSource' parameter is for unloading the original image
   ' after it has been saved to memory. There is no need to clean up the DIB
   ' at the caller's site.
   
   ' The function returns True on success and False otherwise.

   
   If (Bitmap) Then
   
      If (Not FreeImage_HasPixels(Bitmap)) Then
         Call Err.Raise(5, "MFreeImage", Error$(5) & vbCrLf & vbCrLf & _
                        "Unable to save a 'header-only' bitmap.")
      End If
   
      If (Stream = 0) Then
         Stream = FreeImage_OpenMemory()
      End If
      If (Stream) Then
         FreeImage_SaveMultiBitmapToMemoryEx2 = _
               FreeImage_SaveMultiBitmapToMemory(Format, Bitmap, Stream, Flags)
         If (FreeImage_SaveMultiBitmapToMemoryEx2) Then
            FreeImage_SaveMultiBitmapToMemoryEx2 = FreeImage_AcquireMemoryEx(Stream, Data)
         End If
         
         ' Do not close the memory stream, since the returned array Data()
         ' directly points to the stream's data. The stream handle is passed back
         ' to the caller through parameter 'Stream'. The caller must close
         ' this stream after being done with the array.
      Else
         FreeImage_SaveMultiBitmapToMemoryEx2 = False
      End If
      
      If (UnloadSource) Then
         Call FreeImage_CloseMultiBitmapInt(Bitmap)
      End If
   End If

End Function



'--------------------------------------------------------------------------------
' Tag accessing VB friendly helper functions
'--------------------------------------------------------------------------------

Public Function FreeImage_CreateTagEx(ByVal Model As FREE_IMAGE_MDMODEL, _
                             Optional ByVal Key As String, _
                             Optional ByVal TagType As FREE_IMAGE_MDTYPE = FIDT_NOTYPE, _
                             Optional ByRef Value As Variant, _
                             Optional ByRef Count As Long, _
                             Optional ByVal Id As Long) As FREE_IMAGE_TAG
                             
   ' This function is a wrapper for FreeImage_CreateTag() working with
   ' the VB friendly FREE_IMAGE_TAG structure. So, the return value is
   ' not a pointer to a FITAG structure but a FREE_IMAGE_TAG structure.
   
   ' In contrast to FreeImage's original FreeImage_CreateTag() function, the
   ' parameter 'Model' must be specified, the parameters 'Key', 'TagType',
   ' 'Value', 'Count' and 'Id' my be specified.
   
   ' The 'Model' is needed, since each FREE_IMAGE_TAG structure needs a
   ' valid 'Model' member.
   
   ' All other parameters are optional and enable the caller to specify the tag's
   ' values upon tag creation. Any parameter specified, is set to it's corresponding
   ' member in the FREE_IMAGE_TAG structure.
   
   ' The caller should check the returned FREE_IMAGE_TAG structure's 'TagPtr' member.
   ' If this function succeeded, the 'TagPtr' member is non zero. A value of zero
   ' indicates an error condition sourced from FreeImage_CreateTag().
   
   With FreeImage_CreateTagEx
      .TagPtr = FreeImage_CreateTag()
      If (.TagPtr <> 0) Then
         .Model = Model
         If (LenB(Key) > 0) Then
            .Key = Key
         End If
         .Type = TagType
         .Count = Count
         .Id = Id
         If (Not IsMissing(Value)) Then
            .Value = Value
         End If
         Call pTagToTagPtr(FreeImage_CreateTagEx)
         FreeImage_CreateTagEx = pGetTagFromTagPtr(Model, .TagPtr)
      End If
   End With

End Function

Public Function FreeImage_AppendTag(ByVal Bitmap As Long, _
                                    ByVal Model As FREE_IMAGE_MDMODEL, _
                           Optional ByVal Key As String, _
                           Optional ByVal TagType As FREE_IMAGE_MDTYPE = FIDT_NOTYPE, _
                           Optional ByRef Value As Variant, _
                           Optional ByRef Count As Long, _
                           Optional ByVal Id As Long, _
                           Optional ByVal OverwriteExisting As Boolean = True) As FREE_IMAGE_TAG
                           
Dim lpTag As Long

   ' This function is a shortcut wrapper for FreeImage_CreateTagEx() and
   ' FreeImage_SetMetadataEx(). It creates a new tag as FreeImage_CreateTagEx() does
   ' and appends it to the image's metadata model.
   
   ' The parameter 'Bitmap' specifies the image, the new tag should be appended to,
   ' parameters 'Model', 'Key', 'TagType', 'Value', 'Count' and 'Id' are these,
   ' FreeImage_CreateTagEx() has and are just forwarded unchanged.
   
   ' The boolean parameter 'OverwriteExisting' determines, whether to overwrite or
   ' replace an already existing tag with the newly created. If the tag specified
   ' by it's model and key already exists and 'OverwriteExisting' is False, an
   ' empty FREE_IMAGE_TAG structure is returned.
   
   ' So, as with FreeImage_CreateTagEx(), the caller should check the returned
   ' FREE_IMAGE_TAG structure's 'TagPtr' member. If this function succeeded, the
   ' 'TagPtr' member is non zero. A value of zero indicates an error condition
   ' sourced from either the FreeImage_CreateTag() function or may result from
   ' an already existing tag that should not be overwritten.
                           
   If ((FreeImage_GetMetadataInt(Model, Bitmap, Key, lpTag) = 0) Or _
       (OverwriteExisting)) Then
      
      FreeImage_AppendTag = FreeImage_CreateTagEx(Model, Key, TagType, Value, Count, Id)
      If (FreeImage_AppendTag.TagPtr <> 0) Then
         Call FreeImage_SetMetadataEx(Bitmap, FreeImage_AppendTag, Key, Model, True)
      End If
   End If

End Function

Public Function FreeImage_RemoveTag(ByVal Bitmap As Long, _
                                    ByVal Model As FREE_IMAGE_MDMODEL, _
                                    ByVal Key As String) As Boolean
                                    
   ' This function is a wrapper function, that removes a tag, that is actually
   ' part of an image's metadata model. The tag named 'key' of the metadata
   ' model specified in parameter 'Model' of the image 'Bitmap' will be removed.
   
   ' Removing a tag is actually done by calling FreeImage_SetMetadata() with
   ' a NULL pointer for 'FITAG *tag' as described in the API documentation.
   
   ' The function returns the boolean value returned from FreeImage_SetMetadata(),
   ' which is always TRUE when removing a tag in this fashion. So, this function's
   ' caller has no feedback telling if the tag was really present and removed
   ' successfully.
   
   ' Up to version 3.9.1 of FreeImage, there seems to be a bug in removing an
   ' tag from an image's metadata model. Although the removed tag is not accessible
   ' through FreeImage_GetMetadata() any more, iterations with
   ' Freeimage_FindFirst/NextMetadata() will still return this tag an a NULL
   ' pointer.
   
   ' This bug was reported on the Developers Forum. You can revisit the posting at:
   ' http://sourceforge.net/forum/forum.php?thread_id=1536883&forum_id=36111
                               
   FreeImage_RemoveTag = (FreeImage_SetMetadataInt(Model, Bitmap, Key, 0) <> 0)

End Function

Public Function FreeImage_RemoveTagEx(ByVal Bitmap As Long, _
                                      ByRef Tag As FREE_IMAGE_TAG) As Boolean
                                      
   ' This function is a FREE_IMAGE_TAG based wrapper for FreeImage_RemoveTag()

   With Tag
      FreeImage_RemoveTagEx = FreeImage_RemoveTag(Bitmap, .Model, .Key)
   End With

End Function

Public Function FreeImage_TagExists(ByVal Bitmap As Long, _
                                    ByVal Model As FREE_IMAGE_MDMODEL, _
                           Optional ByVal Key As String) As Boolean

Dim lpTag As Long

   ' This function is a small helper function, returning a boolean value
   ' that determines, whether a certain tag specified by metadata model
   ' and key exists for an image specified by 'Bitmap'.

   FreeImage_TagExists = (FreeImage_GetMetadataInt(Model, Bitmap, Key, lpTag) <> 0)

End Function

Public Function FreeImage_TagExistsEx(ByVal Bitmap As Long, _
                                      ByRef Tag As FREE_IMAGE_TAG) As Boolean

   ' This function is a FREE_IMAGE_TAG based wrapper for FreeImage_TagExists()
   
   With Tag
      FreeImage_TagExistsEx = FreeImage_TagExists(Bitmap, .Model, .Key)
   End With

End Function

Public Sub FreeImage_DeleteTagEx(ByRef Tag As FREE_IMAGE_TAG)

   ' This function is a wrapper for FreeImage_DeleteTag() working with
   ' the VB friendly FREE_IMAGE_TAG structure. So, the parameter 'Tag'
   ' is not a pointer to a FITAG structure but a FREE_IMAGE_TAG structure.
   
   ' This function deletes the underlaying FreeImage FITAG structure,
   ' specified the the member 'TagPtr' of the FREE_IMAGE_TAG structure
   ' and also sets all other members of Tag to a null value.
   
   ' Do not get confused with the wrapper functions FreeImage_RemoveTag()
   ' and FreeImage_RemoveTagEx(). These functions remove a tag from an
   ' image's metadata model. This function only deletes of frees (a better
   ' name would be 'FreeImage_FreeTag') a tag created with
   ' FreeImage_CreateTagEx(). Do not delete any tags obtained from any other
   ' function.

   With Tag
      If (.TagPtr <> 0) Then
         Call FreeImage_DeleteTag(.TagPtr)
      End If
      .TagPtr = 0
      .Count = 0
      .Description = vbNullString
      .Id = 0
      .Key = vbNullString
      .Length = 0
      .Model = FIMD_NODATA
      Erase .Palette
      Erase .RationalValue
      .StringValue = vbNullString
      .Type = FIDT_NOTYPE
      .Value = Empty
   End With

End Sub

Public Function FreeImage_CloneTagEx(ByRef Tag As FREE_IMAGE_TAG, _
                            Optional ByVal Model As FREE_IMAGE_MDMODEL = FIMD_NODATA) As FREE_IMAGE_TAG
                            
   ' This function is a thin wrapper for FreeImage_CloneTag() working with
   ' the VB friendly FREE_IMAGE_TAG structure. The parameter 'Tag' works
   ' according to the FreeImage API documentation expect that Tag is not a
   ' pointer to a FITAG structure but a FREE_IMAGE_TAG structure.
   
   ' The additional optional paremeter 'Model' is needed, since the
   ' transformation from a FreeImage FITAG structure to the VB friendly
   ' FREE_IMAGE_TAG structure always need the model to be specified.
   ' When 'Model' is missing (equal to FREE_IMAGE_TAG), the model to be
   ' used is taken from the Tag's member 'Model' itself.
   
   ' See function FreeImage_FindNextMetadataEx() to learn more about the
   ' optional parameter 'Model'
   
   ' Tags obtained from FreeImage_CloneTagEx() must be deleted with
   ' FreeImage_DeleteTagEx() as long as they are not used with
   ' FreeImage_SetMetadataEx() with the parameter 'RefreshTag' set to True.
   
   If (Tag.TagPtr <> 0) Then
      If (Model = FIMD_NODATA) Then
         Model = Tag.Model
      End If
      FreeImage_CloneTagEx = pGetTagFromTagPtr(Model, FreeImage_CloneTag(Tag.TagPtr))
   End If

End Function

Public Function FreeImage_RemoveMetadataModel(ByVal Bitmap As Long, _
                                              ByVal Model As FREE_IMAGE_MDMODEL) As Boolean

   ' This function removes a complete metadata model 'Model' from an image specified
   ' by 'Bitmap'.

   If (Model <> FIMD_NODATA) Then
      FreeImage_RemoveMetadataModel = (FreeImage_SetMetadataInt(Model, Bitmap, vbNullString, 0) <> 0)
   End If

End Function

Public Function FreeImage_FindFirstMetadataEx(ByVal Model As FREE_IMAGE_MDMODEL, _
                                              ByVal Bitmap As Long, _
                                              ByRef Tag As FREE_IMAGE_TAG) As Long
                                              
   ' This function is a wrapper for FreeImage_FindFirstMetadata() working with
   ' the VB friendly FREE_IMAGE_TAG structure. All parameters 'Bitmap', 'Tag',
   ' and 'Model' as the function's return value work according to the
   ' FreeImage API documentation expect that Tag is not a pointer to a FITAG
   ' structure but a FREE_IMAGE_TAG structure.
   
   ' Tags obtained from FreeImage_GetMetadataEx() must not be deleted with
   ' FreeImage_DeleteTagEx().
                                              
   With Tag
      FreeImage_FindFirstMetadataEx = FreeImage_FindFirstMetadata(Model, Bitmap, .TagPtr)
      If (FreeImage_FindFirstMetadataEx <> 0) Then
         Tag = pGetTagFromTagPtr(Model, .TagPtr)
      End If
   End With

End Function

Public Function FreeImage_FindNextMetadataEx(ByVal hFind As Long, _
                                             ByRef Tag As FREE_IMAGE_TAG, _
                                    Optional ByVal Model As FREE_IMAGE_MDMODEL = FIMD_NODATA) As Boolean
                                    
   ' This function is a wrapper for FreeImage_FindNextMetadataEx() working with
   ' the VB friendly FREE_IMAGE_TAG structure. All parameters 'hFind' and 'Tag'
   ' as the function's return value work according to the FreeImage API
   ' documentation expect that Tag is not a pointer to a FITAG structure but a
   ' FREE_IMAGE_TAG structure.
   
   ' The additional optional paremeter 'Model' is needed, since the VB friendly
   ' FREE_IMAGE_TAG structure also contains the member 'StringValue'. This member
   ' is filled with the result of FreeImage_TagToString() which always needs
   ' the model to be specified. Since there should be no static oder global
   ' variables id the FreeImage VB wrapper, the model must be known each time
   ' a FreeImage FITAG structure is converted to a FREE_IMAGE_TAG structure.
   ' (A global VB collection could be used to map the hFind to the model,
   ' but we don't want any globals here)
   
   ' So, when 'Model' is missing (equal to FREE_IMAGE_TAG), the model to be used
   ' is taken from the Tag's member 'Model' itself. This is useful when using this
   ' function in a loop iterating all tags per model (what else would you do
   ' with that function?). The Tag's member 'Model' is populated by
   ' FreeImage_FindFirstMetadataEx() and remains valid during the whole loop, ready
   ' to be used in this function.
   
   ' Tags obtained from FreeImage_GetMetadataEx() must not be deleted with
   ' FreeImage_DeleteTagEx().
                                              
   With Tag
      FreeImage_FindNextMetadataEx = (FreeImage_FindNextMetadataInt(hFind, .TagPtr) <> 0)
      If (FreeImage_FindNextMetadataEx) Then
         If (Model = FIMD_NODATA) Then
            Model = .Model
         End If
         Tag = pGetTagFromTagPtr(Model, .TagPtr)
      End If
   End With
                                              
End Function

Public Function FreeImage_GetAllMetadataTags(ByVal Model As FREE_IMAGE_MDMODEL, _
                                             ByVal Bitmap As Long, _
                                             ByRef Tag() As FREE_IMAGE_TAG) As Long

Dim hMD As Long
Dim lpTag As Long
Dim i As Long

   ' This function is a helper function returning (through a ByRef parameter)
   ' an array of FREE_IMAGE_TAG structures containing all the image's tags of
   ' the metadata model specified by the 'Model' parameter.
   
   ' The parameter 'Tag()' must be an redimensionable array of FREE_IMAGE_TAG
   ' and is redimensioned accordingly. The function returns the number of
   ' tags stored in 'Tag()'.
   
   ' All tags obtained from FreeImage_GetAllMetadataTags() must not be deleted
   ' with FreeImage_DeleteTagEx().

   i = FreeImage_GetMetadataCount(Model, Bitmap)
   If (i > 0) Then
      ReDim Tag(i - 1)
      FreeImage_GetAllMetadataTags = i
      i = 0
      hMD = FreeImage_FindFirstMetadata(Model, Bitmap, lpTag)
      If (hMD <> 0) Then
         Do
            Tag(i) = pGetTagFromTagPtr(Model, lpTag)
            i = i + 1
         Loop While (FreeImage_FindNextMetadataInt(hMD, lpTag) <> 0)
         Call FreeImage_FindCloseMetadata(hMD)
      End If
   End If

End Function

Public Function FreeImage_GetMetadataEx(ByVal Model As FREE_IMAGE_MDMODEL, _
                                        ByVal Bitmap As Long, _
                                        ByVal Key As String, _
                                        ByRef Tag As FREE_IMAGE_TAG) As Boolean
   
   ' This function is a wrapper for FreeImage_GetMetadata() working with
   ' the VB friendly FREE_IMAGE_TAG structure. All parameters 'Bitmap', 'Tag',
   ' 'Key' and 'Model' as well as the function's return value work according
   ' to the FreeImage API documentation expect that Tag is not a pointer to
   ' a FITAG structure but to a FREE_IMAGE_TAG structure.
   
   ' Tags obtained from FreeImage_GetMetadataEx() must not be deleted with
   ' FreeImage_DeleteTagEx().

   With Tag
      If (FreeImage_GetMetadataInt(Model, Bitmap, Key, .TagPtr) <> 0) Then
         Tag = pGetTagFromTagPtr(Model, .TagPtr)
         FreeImage_GetMetadataEx = True
      End If
   End With

End Function

Public Function FreeImage_SetMetadataEx(ByVal Bitmap As Long, _
                                        ByRef Tag As FREE_IMAGE_TAG, _
                               Optional ByVal Key As String, _
                               Optional ByVal Model As FREE_IMAGE_MDMODEL = FIMD_NODATA, _
                               Optional ByVal RefreshTag As Boolean) As Boolean
                               
   ' This function is a wrapper for FreeImage_SetMetadata() using the wrapper's
   ' VB friendly FREE_IMAGE_TAG structure as an replacement for the original
   ' function's pointer to a FITAG structure.
   
   ' All parameters 'Bitmap', 'Tag', 'Key' and 'Model' as the function's return value
   ' work according to the FreeImage API documentation expect that Tag is not a
   ' pointer to a FITAG structure but a FREE_IMAGE_TAG structure.
   
   ' As with FreeImage_SetMetadata(), this function sould only be called with
   ' new tags, created with FreeImage_CreateTagEx(), a wrapper function for
   ' FreeImage_CreateTag() working with the VB friendly FREE_IMAGE_TAG structure.
   
   ' Normally, after a newly created tag must be deleted/freed with a call to
   ' FreeImage_DeleteTagEx(), a wrapper function for FreeImage_DeleteTag() working
   ' with the VB friendly FREE_IMAGE_TAG structure (bored already?), after
   ' the tag was appended to an image's metadata model with
   ' FreeImage_SetMetadataEx(). But...
   
   ' There is a wrapper specific additional boolean parameter 'RefreshTag', that
   ' is similar to the parameter 'UnloadSource' found in many wrapper functions.
   ' When 'RefreshTag' is True upon entry, the tag specified in the 'Tag'
   ' parameter is deleted (the underlaying FITAG structure is deleted with
   ' FreeImage_DeteleTag() and all other members of the FREE_IMAGE_TAG structure
   ' are set to null values) and is reassigned with the tag, that is now part
   ' of the image's metadata model. The tag now referenced in the 'Tag'
   ' parameter must NOT be deleted any more by the caller of this function, since
   ' this tag refers to the actual tag data stored with the image. This is like
   ' a FREE_IMAGE_TAG structure obtained from FreeImage_GetMetadata() or
   ' FreeImage_FindFirst/NextMetadata(). Any changes made to this FREE_IMAGE_TAG
   ' structure may be applied to the image with a later call to
   ' FreeImage_UpdateMetadata().
   
   
   With Tag
      If (Model = FIMD_NODATA) Then
         Model = .Model
      End If
      If (LenB(Key) = 0) Then
         Key = .Key
      End If
      If (FreeImage_SetMetadataInt(Model, Bitmap, Key, .TagPtr) <> 0) Then
         FreeImage_SetMetadataEx = True
      End If
      If (RefreshTag) Then
         Call FreeImage_DeleteTagEx(Tag)
         Call FreeImage_GetMetadataEx(Model, Bitmap, Key, Tag)
      End If
   End With

End Function

Public Function FreeImage_GetImageComment(ByVal Bitmap As Long) As String

Dim tTag As FREE_IMAGE_TAG

   ' This function is a small wrapper around FreeImage_GetMetadata() that
   ' returns the comment of a JPEG, PNG of GIF image.

   If (FreeImage_GetMetadataEx(FIMD_COMMENTS, Bitmap, "Comment", tTag)) Then
      FreeImage_GetImageComment = tTag.Value
   End If

End Function

Public Function FreeImage_SetImageComment(ByVal Bitmap As Long, _
                                 Optional ByVal Comment As String) As Boolean

Dim tTag As FREE_IMAGE_TAG

   ' This function is a small wrapper around FreeImage_SetMetadata() that
   ' sets the comment of a JPEG, PNG of GIF image.

   If (LenB(Comment) > 0) Then
      tTag = FreeImage_AppendTag(Bitmap, FIMD_COMMENTS, "Comment", FIDT_ASCII, Comment)
      FreeImage_SetImageComment = (tTag.TagPtr <> 0)
   Else
      Call FreeImage_RemoveMetadataModel(Bitmap, FIMD_COMMENTS)
      FreeImage_SetImageComment = True
   End If

End Function

Public Function FreeImage_CopyMetadata(ByVal BitmapSrc As Long, _
                                       ByVal BitmapDst As Long, _
                              Optional ByVal ReplaceExisting As Boolean = True, _
                              Optional ByVal Model As FREE_IMAGE_MDMODEL = FIMD_NODATA) As Long

Dim hMDFind As Long
Dim lpTag As Long
Dim strKey As String
Dim bSetTag As Boolean

   ' This derived helper function copies several metadata tags from one
   ' image to another. This is useful when cloning images explicitly with
   ' FreeImage_Clone() or implicitly with FreeImage_ConvertColorDepth() or
   ' with any of the FreeImage_RescaleXXX() functions. Whenever the "same"
   ' image is represented by a new 'Bitmap' pointer, the image was internally
   ' recreated. All of the data, associated with the image, like metadata,
   ' DPI settings or ICC profiles are no more available in the new version of
   ' the image.
   
   ' Setting the DPI for X and Y direction is quite easy with the wrapper
   ' functions FreeImage_Get/SetResolutionX/Y(). This function makes it even
   ' easier to keep track of all associated metadata tags for a cloned image!
   
   ' Both parameters 'BitmapSrc' and 'BitmapDst' specify the source and destination
   ' image. Metadata is copied from 'BitmapSrc' to 'BitmapDst'.
   
   ' The optional parameter 'ReplaceExisting' determines whether existing tags
   ' should be replaced or not. If there are no tags in 'BitmapDst' it is recommended,
   ' to set 'ReplaceExisting' to True (or to omit it, since True is it's default
   ' value) for better performance; when set to True, no tests for tag existence
   ' in the destination image will be run.
   
   ' The optional parameter 'Model' may specify a certain metadata model to be
   ' copied. If this parameter is omitted or set to any value not defined in the
   ' FREE_IMAGE_MDMODEL enumeration, all metadata models will be copied
   ' sequentially.
   
   ' This function returns the number of tags copied or zero when there are no tags
   ' in the source image or an error occured.
   
   ' For the standard use case described above (keeping track of all metadata after
   ' an image was cloned) the calling this function boils down to a very short form:
   
   ' lTagsCopied = FreeImage_CopyMetadata(hDibSrc, hDibDst)

   If ((BitmapSrc <> 0) And (BitmapDst <> 0)) Then
      If ((Model >= FIMD_COMMENTS) And (Model <= FIMD_CUSTOM)) Then
         hMDFind = FreeImage_FindFirstMetadata(Model, BitmapSrc, lpTag)
         If (hMDFind) Then
            Do
               strKey = pGetStringFromPointerA(pDeref(pDeref(lpTag)))
               bSetTag = ReplaceExisting
               If (Not bSetTag) Then
                  bSetTag = (Not FreeImage_TagExists(BitmapDst, Model, strKey))
               End If
               If (bSetTag) Then
                  If (FreeImage_SetMetadataInt(Model, BitmapDst, strKey, lpTag) <> 0) Then
                     FreeImage_CopyMetadata = FreeImage_CopyMetadata + 1
                  End If
               End If
            Loop While (FreeImage_FindNextMetadata(hMDFind, lpTag))
            Call FreeImage_FindCloseMetadata(hMDFind)
         End If
      Else
         For Model = FIMD_COMMENTS To FIMD_CUSTOM
            FreeImage_CopyMetadata = FreeImage_CopyMetadata _
                                   + FreeImage_CopyMetadata(BitmapSrc, BitmapDst, _
                                                            ReplaceExisting, Model)
         Next Model
      End If
   End If

End Function

Public Function FreeImage_CloneMetadataEx(ByVal BitmapSrc As Long, _
                                          ByVal BitmapDst As Long, _
                                 Optional ByVal Model As FREE_IMAGE_MDMODEL = FIMD_NODATA) As Long
                               
   ' This derived helper function copies several metadata tags from one
   ' image to another. It is very similar to FreeImage_CopyMetadata().
   
   ' The main difference is, that this function aims to create exactly the same
   ' metadata layout in the destination image. In contrast to
   ' FreeImage_CopyMetadata(), this function removes all metadata tags in the
   ' desination image that are not part of the metadata set in the source image.
   ' So, this function is particularly useful for destination images that may
   ' have already some tags associated and you want to make shure, that it will
   ' get exactly the same metadata set as the source image.
   
   ' This function will most likely be used in a end user application and should
   ' be invoked through a menu command called: "Set/Apply Metadata From Source Image..."
   
   ' This function returns the number of tags copied or zero if there are no tags
   ' in the source image or an error occured.
                                            
   If ((BitmapSrc <> 0) And (BitmapDst <> 0)) Then
      If ((Model >= FIMD_COMMENTS) And (Model <= FIMD_CUSTOM)) Then
         If (FreeImage_RemoveMetadataModel(BitmapDst, Model)) Then
            FreeImage_CloneMetadataEx = FreeImage_CopyMetadata(BitmapSrc, BitmapDst, _
                                                               True, Model)
         End If
      Else
         For Model = FIMD_COMMENTS To FIMD_CUSTOM
            FreeImage_CloneMetadataEx = FreeImage_CloneMetadataEx _
                                      + FreeImage_CloneMetadataEx(BitmapSrc, BitmapDst, _
                                                                  Model)
         Next Model
      End If
   End If
                                  
End Function

Public Function FreeImage_TagFromPointer(ByVal Model As FREE_IMAGE_MDMODEL, _
                                         ByVal Tag As Long) As FREE_IMAGE_TAG
                                         
   ' This is a generic function that returns a VB wrapper Tag
   ' structure (FREE_IMAGE_TAG) from a FreeImage FITAG *tag pointer.
   
   ' This function is still public due to legacy reasons. Since there are
   ' functions like 'FreeImage_GetMetadataEx()', 'FreeImage_GetAllMetadataTags()'
   ' or 'FreeImage_FindFirst/NextMetadataEx()', this function won't be needed
   ' any more in most cases.

   FreeImage_TagFromPointer = pGetTagFromTagPtr(Model, Tag)

End Function

Public Function FreeImage_UpdateMetadata(ByRef Tag As FREE_IMAGE_TAG) As Boolean

   ' This function updates any changes made in a FREE_IMAGE_TAG
   ' structure.

   FreeImage_UpdateMetadata = pTagToTagPtr(Tag)

End Function

Public Function FreeImage_UnsignedLong(ByVal Value As Long) As Variant

   ' This function converts a signed long (VB's Long data type) into
   ' an unsigned long (not really supported by VB).
   
   ' Basically, this function checks, whether the positive range of
   ' a signed long is sufficient to hold the value (indeed, it checks
   ' the value since the range is obviously constant). If yes,
   ' it returns a Variant with subtype Long ('Variant/Long' in VB's
   ' watch window). In this case, the function did not make any real
   ' changes at all. If not, the value is stored in a Currency variable,
   ' which is able to store the whole range of an unsigned long. Then,
   ' the function returns a Variant with subtype Currency
   ' ('Variant/Currency' in VB's watch window).
   
   If (Value < 0) Then
      Dim curTemp As Currency
      Call CopyMemory(curTemp, Value, 4)
      FreeImage_UnsignedLong = curTemp * 10000
   Else
      FreeImage_UnsignedLong = Value
   End If

End Function

Public Function FreeImage_UnsignedShort(ByVal Value As Integer) As Variant

   ' This function converts a signed short (VB's Integer data type) into
   ' an unsigned short (not really supported by VB).
   
   ' Basically, this function checks, whether the positive range of
   ' a signed short is sufficient to hold the value (indeed, it checks
   ' the value since the range is obviously constant). If yes,
   ' it returns a Variant with subtype Integer ('Variant/Integer' in VB's
   ' watch window). In this case, the function did not make any real
   ' changes at all. If not, the value is stored in a Long variable,
   ' which is able to store the whole range of an unsigned short. Then,
   ' the function returns a Variant with subtype Long
   ' ('Variant/Long' in VB's watch window).
   
   If (Value < 0) Then
      Dim lTemp As Long
      Call CopyMemory(lTemp, Value, 2)
      FreeImage_UnsignedShort = lTemp
   Else
      FreeImage_UnsignedShort = Value
   End If

End Function

Public Function FreeImage_CreateRational(ByRef Numerator As Variant, _
                                         ByRef Denominator As Variant, _
                                Optional ByVal NormalizeValue As Boolean = True) As FIRATIONAL
                                
   ' This function creates an unsigned rational (FIDT_RATIONAL) value to be used with
   ' FreeImage's metadata models. In the VB wrapper, any rational value is stored in a
   ' structure (FIRATIONAL), containing both 'Numerator' and 'Denominator' members. The
   ' rational's value is then defined as the fraction Numerator/Denominator.
   
   ' Both values 'Numerator' and 'Denominator' are actually ULONGs (unsigned longs), a
   ' data type not supported by VB (a VB Long variable is always signed). Therefore,
   ' 'Numerator' and 'Denominator' are typed as Variant. Whenever the range of a signed
   ' long is sufficient to store the value (all values between 0 and 0x7FFFFFFF
   ' (2147483647 decimal)), the Variant gets a Long subtype. If not, a Currency subtype is
   ' used just to give you the mathematical correct value of the unsigned long.
   
   ' The optional parameter 'NormalizeValue' controls, whether the resulting fraction
   ' should be normalized (cancelled down) or not.
   
   ' When calling this function, you can use hexadecimal constants for passing unsinged
   ' longs via the parameters 'Numerator' and 'Denominator'.
   
   '                                                                     2147483647
   ' Example: tRational = FreeImage_CreateRational(&HFFFFFFFF, 12345) -> ----------
   '                                                                       12345
                                
   With FreeImage_CreateRational
      .Numerator = FreeImage_UnsignedLong(Numerator)
      .Denominator = FreeImage_UnsignedLong(Denominator)
   End With
   
   If (NormalizeValue) Then
      Call pNormalizeRational(FreeImage_CreateRational)
   End If

End Function

Public Function FreeImage_CreateSignedRational(ByRef Numerator As Variant, _
                                               ByRef Denominator As Variant, _
                                      Optional ByVal NormalizeValue As Boolean = True) As FIRATIONAL
                                      
   ' This function creates a signed rational (FIDT_RATIONAL) value to be used with
   ' FreeImage's metadata models. In the VB wrapper, any rational value is stored in a
   ' structure (FIRATIONAL), containing both 'Numerator' and 'Denominator' members. The
   ' rational's value is then defined as the fraction Numerator/Denominator.
   
   ' Both values 'Numerator' and 'Denominator' are actually LONGs (signed longs), the
   ' same data type as a VB Long. Since, 'Numerator' and 'Denominator' are typed as
   ' Variant, all possible values between -2,147,483,648 and + 2,147,483,647 are stored
   ' in a Variant with subtype Long (cp. 'FreeImage_CreateRational()').
   
   ' The optional parameter 'NormalizeValue' controls, whether the resulting fraction
   ' should be normalized (cancelled down) or not.
   
   ' When calling this function, you can use hexadecimal constants for passing unsinged
   ' longs via the parameters 'Numerator' and 'Denominator'.
   
   '                                                                            -1         1
   ' Example: tRational = FreeImage_CreateSignedRational(&HFFFFFFFF, 12345) -> ----- = - -----
   '                                                                           12345     12345
                                
   With FreeImage_CreateSignedRational
      .Numerator = CLng(Numerator)
      .Denominator = CLng(Denominator)
   End With
   
   If (NormalizeValue) Then
      Call pNormalizeSRational(FreeImage_CreateSignedRational)
   End If

End Function



'--------------------------------------------------------------------------------
' Derived and hopefully useful functions
'--------------------------------------------------------------------------------

' Plugin and filename functions

Public Function FreeImage_IsExtensionValidForFIF(ByVal Format As FREE_IMAGE_FORMAT, _
                                                 ByVal Extension As String, _
                                        Optional ByVal Compare As VbCompareMethod = vbBinaryCompare) As Boolean
   
   ' This function tests, whether a given filename extension is valid
   ' for a certain image format (fif).
   
   FreeImage_IsExtensionValidForFIF = (InStr(1, _
                                             FreeImage_GetFIFExtensionList(Format) & ",", _
                                             Extension & ",", _
                                             Compare) > 0)

End Function

Public Function FreeImage_IsFilenameValidForFIF(ByVal Format As FREE_IMAGE_FORMAT, _
                                                ByVal Filename As String, _
                                       Optional ByVal Compare As VbCompareMethod = vbBinaryCompare) As Boolean
                                                
Dim strExtension As String
Dim i As Long

   ' This function tests, whether a given complete filename is valid
   ' for a certain image format (fif).

   i = InStrRev(Filename, ".")
   If (i > 0) Then
      strExtension = Mid$(Filename, i + 1)
      FreeImage_IsFilenameValidForFIF = (InStr(1, _
                                               FreeImage_GetFIFExtensionList(Format) & ",", _
                                               strExtension & ",", _
                                               Compare) > 0)
   End If
   
End Function

Public Function FreeImage_GetPrimaryExtensionFromFIF(ByVal Format As FREE_IMAGE_FORMAT) As String

Dim strExtensionList As String
Dim i As Long

   ' This function returns the primary (main or most commonly used?) extension
   ' of a certain image format (fif). This is done by returning the first of
   ' all possible extensions returned by FreeImage_GetFIFExtensionList(). That
   ' assumes, that the plugin returns the extensions in ordered form. If not,
   ' in most cases it is even enough, to receive any extension.
   
   ' This function is primarily used by the function 'SavePictureEx'.

   strExtensionList = FreeImage_GetFIFExtensionList(Format)
   i = InStr(strExtensionList, ",")
   If (i > 0) Then
      FreeImage_GetPrimaryExtensionFromFIF = Left$(strExtensionList, i - 1)
   Else
      FreeImage_GetPrimaryExtensionFromFIF = strExtensionList
   End If

End Function

Public Function FreeImage_IsGreyscaleImage(ByVal Bitmap As Long) As Boolean

Dim atRGB() As RGBQUAD
Dim i As Long

   ' This function returns a boolean value that is true, if the DIB is actually
   ' a greyscale image. Here, the only test condition is, that each palette
   ' entry must be a grey value, what means that each color component has the
   ' same value (red = green = blue).
   
   ' The FreeImage libraray doesn't offer a function to determine if a DIB is
   ' greyscale. The only thing you can do is to use the 'FreeImage_GetColorType'
   ' function, that returns either FIC_MINISWHITE or FIC_MINISBLACK for
   ' greyscale images. However, a DIB needs to have a ordered greyscale palette
   ' (linear ramp or inverse linear ramp) to be judged as FIC_MINISWHITE or
   ' FIC_MINISBLACK. DIB's with an unordered palette that are actually (visually)
   ' greyscale, are said to be (color-)palletized. That's also true for any 4 bpp
   ' image, since it will never have a palette that satifies the tests done
   ' in the 'FreeImage_GetColorType' function.
   
   ' So, there is a chance to omit some color depth conversions, when displaying
   ' an image in greyscale fashion. Maybe the problem will be solved in the
   ' FreeImage library one day.

   Select Case FreeImage_GetBPP(Bitmap)
   
   Case 1, 4, 8
      atRGB = FreeImage_GetPaletteEx(Bitmap)
      FreeImage_IsGreyscaleImage = True
      For i = 0 To UBound(atRGB)
         With atRGB(i)
            If ((.rgbRed <> .rgbGreen) Or (.rgbRed <> .rgbBlue)) Then
               FreeImage_IsGreyscaleImage = False
               Exit For
            End If
         End With
      Next i
   
   End Select

End Function

' Bitmap resolution functions

Public Function FreeImage_GetResolutionX(ByVal Bitmap As Long) As Long

   ' This function gets a DIB's resolution in X-direction measured
   ' in 'dots per inch' (DPI) and not in 'dots per meter'.
   
   FreeImage_GetResolutionX = Int(0.5 + 0.0254 * FreeImage_GetDotsPerMeterX(Bitmap))

End Function

Public Sub FreeImage_SetResolutionX(ByVal Bitmap As Long, ByVal Resolution As Long)

   ' This function sets a DIB's resolution in X-direction measured
   ' in 'dots per inch' (DPI) and not in 'dots per meter'.

   Call FreeImage_SetDotsPerMeterX(Bitmap, Int(Resolution / 0.0254 + 0.5))

End Sub

Public Function FreeImage_GetResolutionY(ByVal Bitmap As Long) As Long

   ' This function gets a DIB's resolution in Y-direction measured
   ' in 'dots per inch' (DPI) and not in 'dots per meter'.

   FreeImage_GetResolutionY = Int(0.5 + 0.0254 * FreeImage_GetDotsPerMeterY(Bitmap))

End Function

Public Sub FreeImage_SetResolutionY(ByVal Bitmap As Long, ByVal Resolution As Long)

   ' This function sets a DIB's resolution in Y-direction measured
   ' in 'dots per inch' (DPI) and not in 'dots per meter'.

   Call FreeImage_SetDotsPerMeterY(Bitmap, Int(Resolution / 0.0254 + 0.5))

End Sub

' ICC Color Profile functions

Public Function FreeImage_GetICCProfile(ByVal Bitmap As Long) As FIICCPROFILE

   ' This function is a wrapper for the FreeImage_GetICCProfile() function, returning
   ' a real FIICCPROFILE structure.
   
   ' Since the original FreeImage function returns a pointer to the FIICCPROFILE
   ' structure (FIICCPROFILE *), as with string returning functions, this wrapper is
   ' needed as VB can't declare a function returning a pointer to anything. So,
   ' analogous to string returning functions, FreeImage_GetICCProfile() is declared
   ' private as FreeImage_GetICCProfileInt() and made publicly available with this
   ' wrapper function.

   Call CopyMemory(FreeImage_GetICCProfile, _
                   ByVal FreeImage_GetICCProfileInt(Bitmap), _
                   LenB(FreeImage_GetICCProfile))

End Function

Public Function FreeImage_GetICCProfileColorModel(ByVal Bitmap As Long) As FREE_IMAGE_ICC_COLOR_MODEL

   ' This function is a thin wrapper around FreeImage_GetICCProfile() returning
   ' the color model in which the ICC color profile data is in, if there is actually
   ' a ICC color profile available for the Bitmap specified.
   
   ' If there is NO color profile along with that bitmap, this function returns the color
   ' model that should (or must) be used for any color profile data to be assigned to the
   ' Bitmap. That depends on the bitmap's color type.

   If (FreeImage_HasICCProfile(Bitmap)) Then
      FreeImage_GetICCProfileColorModel = (pDeref(FreeImage_GetICCProfileInt(Bitmap)) _
            And FREE_IMAGE_ICC_COLOR_MODEL_MASK)
   Else
      ' use FreeImage_GetColorType() to determine, whether this is a CMYK bitmap or not
      If (FreeImage_GetColorType(Bitmap) = FIC_CMYK) Then
         FreeImage_GetICCProfileColorModel = FIICC_COLOR_MODEL_CMYK
      Else
         FreeImage_GetICCProfileColorModel = FIICC_COLOR_MODEL_RGB
      End If
   End If

End Function

Public Function FreeImage_GetICCProfileSize(ByVal Bitmap As Long) As Long

   ' This function is a thin wrapper around FreeImage_GetICCProfile() returning
   ' only the size in bytes of the ICC profile data for the Bitmap specified or zero,
   ' if there is no ICC profile data for the Bitmap.

   FreeImage_GetICCProfileSize = pDeref(FreeImage_GetICCProfileInt(Bitmap) + 4)

End Function

Public Function FreeImage_GetICCProfileDataPointer(ByVal Bitmap As Long) As Long

   ' This function is a thin wrapper around FreeImage_GetICCProfile() returning
   ' only the pointer (the address) of the ICC profile data for the Bitmap specified,
   ' or zero if there is no ICC profile data for the Bitmap.

   FreeImage_GetICCProfileDataPointer = pDeref(FreeImage_GetICCProfileInt(Bitmap) + 8)

End Function

Public Function FreeImage_HasICCProfile(ByVal Bitmap As Long) As Boolean

   ' This function is a thin wrapper around FreeImage_GetICCProfile() returning
   ' True, if there is an ICC color profile available for the Bitmap specified or
   ' returns False otherwise.

   FreeImage_HasICCProfile = (FreeImage_GetICCProfileSize(Bitmap) <> 0)

End Function

' Bitmap Info functions

Public Function FreeImage_GetInfoHeaderEx(ByVal Bitmap As Long) As BITMAPINFOHEADER

Dim lpInfoHeader As Long

   ' This function is a wrapper around FreeImage_GetInfoHeader() and returns a fully
   ' populated BITMAPINFOHEADER structure for a given bitmap.

   lpInfoHeader = FreeImage_GetInfoHeader(Bitmap)
   If (lpInfoHeader) Then
      Call CopyMemory(FreeImage_GetInfoHeaderEx, ByVal lpInfoHeader, LenB(FreeImage_GetInfoHeaderEx))
   End If

End Function

' Image color depth conversion wrapper

Public Function FreeImage_ConvertColorDepth(ByVal Bitmap As Long, _
                                            ByVal Conversion As FREE_IMAGE_CONVERSION_FLAGS, _
                                   Optional ByVal UnloadSource As Boolean, _
                                   Optional ByVal Threshold As Byte = 128, _
                                   Optional ByVal DitherMethod As FREE_IMAGE_DITHER = FID_FS, _
                                   Optional ByVal QuantizeMethod As FREE_IMAGE_QUANTIZE = FIQ_WUQUANT) As Long
                                            
Dim hDIBNew As Long
Dim hDIBTemp As Long
Dim lBPP As Long
Dim bForceLinearRamp As Boolean
Dim lpReservePalette As Long
Dim bAdjustReservePaletteSize As Boolean

   ' This function is an easy-to-use wrapper for color depth conversion, intended
   ' to work around some tweaks in the FreeImage library.
   
   ' The parameters 'Threshold' and 'eDitherMode' control how thresholding or
   ' dithering are performed. The 'QuantizeMethod' parameter determines, what
   ' quantization algorithm will be used when converting to 8 bit color images.
   
   ' The 'Conversion' parameter, which can contain a single value or an OR'ed
   ' combination of some of the FREE_IMAGE_CONVERSION_FLAGS enumeration values,
   ' determines the desired output image format.
   
   ' The optional 'UnloadSource' parameter is for unloading the original image, so
   ' you can "change" an image with this function rather than getting a new DIB
   ' pointer. There is no more need for a second DIB variable at the caller's site.
   
   bForceLinearRamp = ((Conversion And FICF_REORDER_GREYSCALE_PALETTE) = 0)
   lBPP = FreeImage_GetBPP(Bitmap)

   If (Bitmap) Then
   
      If (Not FreeImage_HasPixels(Bitmap)) Then
         Call Err.Raise(5, "MFreeImage", Error$(5) & vbCrLf & vbCrLf & _
                        "Unable to convert a 'header-only' bitmap.")
      End If
   
      Select Case (Conversion And (Not FICF_REORDER_GREYSCALE_PALETTE))
      
      Case FICF_MONOCHROME_THRESHOLD
         If (lBPP > 1) Then
            hDIBNew = FreeImage_Threshold(Bitmap, Threshold)
         End If

      Case FICF_MONOCHROME_DITHER
         If (lBPP > 1) Then
            hDIBNew = FreeImage_Dither(Bitmap, DitherMethod)
         End If
      
      Case FICF_GREYSCALE_4BPP
         If (lBPP <> 4) Then
            ' If the color depth is 1 bpp and the we don't have a linear ramp palette
            ' the bitmap is first converted to an 8 bpp greyscale bitmap with a linear
            ' ramp palette and then to 4 bpp.
            If ((lBPP = 1) And (FreeImage_GetColorType(Bitmap) = FIC_PALETTE)) Then
               hDIBTemp = Bitmap
               Bitmap = FreeImage_ConvertToGreyscale(Bitmap)
               Call FreeImage_Unload(hDIBTemp)
            End If
            hDIBNew = FreeImage_ConvertTo4Bits(Bitmap)
         Else
            ' The bitmap is already 4 bpp but may not have a linear ramp.
            ' If we force a linear ramp the bitmap is converted to 8 bpp with a linear ramp
            ' and then back to 4 bpp.
            If (((Not bForceLinearRamp) And (Not FreeImage_IsGreyscaleImage(Bitmap))) Or _
                (bForceLinearRamp And (FreeImage_GetColorType(Bitmap) = FIC_PALETTE))) Then
               hDIBTemp = FreeImage_ConvertToGreyscale(Bitmap)
               hDIBNew = FreeImage_ConvertTo4Bits(hDIBTemp)
               Call FreeImage_Unload(hDIBTemp)
            End If
         End If
            
      Case FICF_GREYSCALE_8BPP
         ' Convert, if the bitmap is not at 8 bpp or does not have a linear ramp palette.
         If ((lBPP <> 8) Or (((Not bForceLinearRamp) And (Not FreeImage_IsGreyscaleImage(Bitmap))) Or _
                             (bForceLinearRamp And (FreeImage_GetColorType(Bitmap) = FIC_PALETTE)))) Then
            hDIBNew = FreeImage_ConvertToGreyscale(Bitmap)
         End If
         
      Case FICF_PALLETISED_8BPP
         ' note, that the FreeImage library only quantizes 24 bit images
         ' do not convert any 8 bit images
         If (lBPP <> 8) Then
            ' images with a color depth of 24 bits can directly be
            ' converted with the FreeImage_ColorQuantize function;
            ' other images need to be converted to 24 bits first
            If (lBPP = 24) Then
               hDIBNew = FreeImage_ColorQuantize(Bitmap, QuantizeMethod)
            Else
               hDIBTemp = FreeImage_ConvertTo24Bits(Bitmap)
               hDIBNew = FreeImage_ColorQuantize(hDIBTemp, QuantizeMethod)
               Call FreeImage_Unload(hDIBTemp)
            End If
         End If
         
      Case FICF_RGB_15BPP
         If (lBPP <> 15) Then
            hDIBNew = FreeImage_ConvertTo16Bits555(Bitmap)
         End If
      
      Case FICF_RGB_16BPP
         If (lBPP <> 16) Then
            hDIBNew = FreeImage_ConvertTo16Bits565(Bitmap)
         End If
      
      Case FICF_RGB_24BPP
         If (lBPP <> 24) Then
            hDIBNew = FreeImage_ConvertTo24Bits(Bitmap)
         End If
      
      Case FICF_RGB_32BPP
         If (lBPP <> 32) Then
            hDIBNew = FreeImage_ConvertTo32Bits(Bitmap)
         End If
      
      End Select
      
      If (hDIBNew) Then
         FreeImage_ConvertColorDepth = hDIBNew
         If (UnloadSource) Then
            Call FreeImage_Unload(Bitmap)
         End If
      Else
         FreeImage_ConvertColorDepth = Bitmap
      End If
   
   End If

End Function

Public Function FreeImage_ColorQuantizeEx(ByVal Bitmap As Long, _
                                 Optional ByVal QuantizeMethod As FREE_IMAGE_QUANTIZE = FIQ_WUQUANT, _
                                 Optional ByVal UnloadSource As Boolean, _
                                 Optional ByVal PaletteSize As Long = 256, _
                                 Optional ByVal ReserveSize As Long, _
                                 Optional ByRef ReservePalette As Variant = Null) As Long
  
Dim hTmp As Long
Dim lpPalette As Long
Dim lBlockSize As Long
Dim lElementSize As Long

   ' This function is a more VB-friendly wrapper around FreeImage_ColorQuantizeEx,
   ' which lets you specify the ReservePalette to be used not only as a pointer, but
   ' also as a real VB-style array of type Long, where each Long item takes a color
   ' in ARGB format (&HAARRGGBB). The native FreeImage function FreeImage_ColorQuantizeEx
   ' is declared private and named FreeImage_ColorQuantizeExInt and so hidden from the
   ' world outside the wrapper.
   
   ' In contrast to the FreeImage API documentation, ReservePalette is of type Variant
   ' and may either be a pointer to palette data (pointer to an array of type RGBQUAD
   ' == VarPtr(atMyPalette(0)) in VB) or an array of type Long, which then must contain
   ' the palette data in ARGB format. You can receive palette data as an array Longs
   ' from function FreeImage_GetPaletteExLong.
   ' Although ReservePalette is of type Variant, arrays of type RGBQUAD can not be
   ' passed, as long as RGBQUAD is not declared as a public type in a public object
   ' module. So, when dealing with RGBQUAD arrays, you are stuck on VarPtr or may
   ' use function FreeImage_GetPalettePtr, which is a more meaningfully named
   ' convenience wrapper around VarPtr.
   
   ' The optional 'UnloadSource' parameter is for unloading the original image, so
   ' you can "change" an image with this function rather than getting a new DIB
   ' pointer. There is no more need for a second DIB variable at the caller's site.
   
   ' All other parameters work according to the FreeImage API documentation.
   
   ' Note: Currently, any provided ReservePalette is only used, if quantize is
   '       FIQ_NNQUANT. This seems to be either a bug or an undocumented
   '       limitation of the FreeImage library (up to version 3.11.0).

   If (Bitmap) Then
   
      If (Not FreeImage_HasPixels(Bitmap)) Then
         Call Err.Raise(5, "MFreeImage", Error$(5) & vbCrLf & vbCrLf & _
                        "Unable to quantize a 'header-only' bitmap.")
      End If
      
      If (FreeImage_GetBPP(Bitmap) <> 24) Then
         hTmp = Bitmap
         Bitmap = FreeImage_ConvertTo24Bits(Bitmap)
         If (UnloadSource) Then
            Call FreeImage_Unload(hTmp)
         End If
         UnloadSource = True
      End If
      
      ' adjust PaletteSize
      If (PaletteSize < 2) Then
         PaletteSize = 2
      ElseIf (PaletteSize > 256) Then
         PaletteSize = 256
      End If
      
      lpPalette = pGetMemoryBlockPtrFromVariant(ReservePalette, lBlockSize, lElementSize)
      FreeImage_ColorQuantizeEx = FreeImage_ColorQuantizeExInt(Bitmap, QuantizeMethod, _
            PaletteSize, ReserveSize, lpPalette)
      
      If (UnloadSource) Then
         Call FreeImage_Unload(Bitmap)
      End If
   End If

End Function

Public Function FreeImage_GetPalettePtr(ByRef Palette() As RGBQUAD) As Long

   ' Returns a pointer to an array of RGBQUAD. This is sometimes referred to as
   ' a palette.

   FreeImage_GetPalettePtr = VarPtr(Palette(0))

End Function


' Image Rescale wrapper functions

Public Function FreeImage_RescaleEx(ByVal Bitmap As Long, _
                           Optional ByVal Width As Variant, _
                           Optional ByVal Height As Variant, _
                           Optional ByVal IsPercentValue As Boolean, _
                           Optional ByVal UnloadSource As Boolean, _
                           Optional ByVal Filter As FREE_IMAGE_FILTER = FILTER_BICUBIC, _
                           Optional ByVal ForceCloneCreation As Boolean) As Long
                     
Dim lNewWidth As Long
Dim lNewHeight As Long
Dim hDIBNew As Long

   ' This function is a easy-to-use wrapper for rescaling an image with the
   ' FreeImage library. It returns a pointer to a new rescaled DIB provided
   ' by FreeImage.
   
   ' The parameters 'Width', 'Height' and 'IsPercentValue' control
   ' the size of the new image. Here, the function tries to fake something like
   ' overloading known from Java. It depends on the parameter's data type passed
   ' through the Variant, how the provided values for width and height are
   ' actually interpreted. The following rules apply:
   
   ' In general, non integer values are either interpreted as percent values or
   ' factors, the original image size will be multiplied with. The 'IsPercentValue'
   ' parameter controls whether the values are percent values or factors. Integer
   ' values are always considered to be the direct new image size, not depending on
   ' the original image size. In that case, the 'IsPercentValue' parameter has no
   ' effect. If one of the parameters is omitted, the image will not be resized in
   ' that direction (either in width or height) and keeps it's original size. It is
   ' possible to omit both, but that makes actually no sense.
   
   ' The following table shows some of possible data type and value combinations
   ' that might by used with that function: (assume an original image sized 100x100 px)
   
   ' Parameter         |  Values |  Values |  Values |  Values |     Values |
   ' ----------------------------------------------------------------------
   ' Width             |    75.0 |    0.85 |     200 |     120 |      400.0 |
   ' Height            |   120.0 |     1.3 |     230 |       - |      400.0 |
   ' IsPercentValue    |    True |   False |    d.c. |    d.c. |      False | <- wrong option?
   ' ----------------------------------------------------------------------
   ' Result Size       |  75x120 |  85x130 | 200x230 | 120x100 |40000x40000 |
   ' Remarks           | percent |  factor |  direct |         |maybe not   |
   '                                                           |what you    |
   '                                                           |wanted,     |
   '                                                           |right?      |
   
   ' The optional 'UnloadSource' parameter is for unloading the original image, so
   ' you can "change" an image with this function rather than getting a new DIB
   ' pointer. There is no more need for a second DIB variable at the caller's site.
   
   ' As of version 2.0 of the FreeImage VB wrapper, this function and all it's derived
   ' functions like FreeImage_RescaleByPixel() or FreeImage_RescaleByPercent(), do NOT
   ' return a clone of the image, if the new size desired is the same as the source
   ' image's size. That behaviour can be forced by setting the new parameter
   ' 'ForceCloneCreation' to True. Then, an image is also rescaled (and so
   ' effectively cloned), if the new width and height is exactly the same as the source
   ' image's width and height.
   
   ' Since this diversity may be confusing to VB developers, this function is also
   ' callable through three different functions called 'FreeImage_RescaleByPixel',
   ' 'FreeImage_RescaleByPercent' and 'FreeImage_RescaleByFactor'.
   
   If (Bitmap) Then
   
      If (Not FreeImage_HasPixels(Bitmap)) Then
         Call Err.Raise(5, "MFreeImage", Error$(5) & vbCrLf & vbCrLf & _
                        "Unable to rescale a 'header-only' bitmap.")
      End If
   
      If (Not IsMissing(Width)) Then
         Select Case VarType(Width)
         
         Case vbDouble, vbSingle, vbDecimal, vbCurrency
            lNewWidth = FreeImage_GetWidth(Bitmap) * Width
            If (IsPercentValue) Then
               lNewWidth = lNewWidth / 100
            End If
         
         Case Else
            lNewWidth = Width
         
         End Select
      End If
      
      If (Not IsMissing(Height)) Then
         Select Case VarType(Height)
         
         Case vbDouble, vbSingle, vbDecimal
            lNewHeight = FreeImage_GetHeight(Bitmap) * Height
            If (IsPercentValue) Then
               lNewHeight = lNewHeight / 100
            End If
         
         Case Else
            lNewHeight = Height
         
         End Select
      End If
      
      If ((lNewWidth > 0) And (lNewHeight > 0)) Then
         If (ForceCloneCreation) Then
            hDIBNew = FreeImage_Rescale(Bitmap, lNewWidth, lNewHeight, Filter)
         
         ElseIf ((lNewWidth <> FreeImage_GetWidth(Bitmap)) Or _
                 (lNewHeight <> FreeImage_GetHeight(Bitmap))) Then
            hDIBNew = FreeImage_Rescale(Bitmap, lNewWidth, lNewHeight, Filter)
         
         End If
          
      ElseIf (lNewWidth > 0) Then
         If ((lNewWidth <> FreeImage_GetWidth(Bitmap)) Or _
             (ForceCloneCreation)) Then
            lNewHeight = lNewWidth / (FreeImage_GetWidth(Bitmap) / FreeImage_GetHeight(Bitmap))
            hDIBNew = FreeImage_Rescale(Bitmap, lNewWidth, lNewHeight, Filter)
         End If
      
      ElseIf (lNewHeight > 0) Then
         If ((lNewHeight <> FreeImage_GetHeight(Bitmap)) Or _
             (ForceCloneCreation)) Then
            lNewWidth = lNewHeight * (FreeImage_GetWidth(Bitmap) / FreeImage_GetHeight(Bitmap))
            hDIBNew = FreeImage_Rescale(Bitmap, lNewWidth, lNewHeight, Filter)
         End If
      
      End If
      
      If (hDIBNew) Then
         FreeImage_RescaleEx = hDIBNew
         If (UnloadSource) Then
            Call FreeImage_Unload(Bitmap)
         End If
      Else
         FreeImage_RescaleEx = Bitmap
      End If
   End If
                     
End Function

Public Function FreeImage_RescaleByPixel(ByVal Bitmap As Long, _
                                Optional ByVal WidthInPixels As Long, _
                                Optional ByVal HeightInPixels As Long, _
                                Optional ByVal UnloadSource As Boolean, _
                                Optional ByVal Filter As FREE_IMAGE_FILTER = FILTER_BICUBIC, _
                                Optional ByVal ForceCloneCreation As Boolean) As Long
                                
   ' Thin wrapper for function 'FreeImage_RescaleEx' for removing method
   ' overload fake. This function rescales the image directly to the size
   ' specified by the 'WidthInPixels' and 'HeightInPixels' parameters.

   FreeImage_RescaleByPixel = FreeImage_RescaleEx(Bitmap, WidthInPixels, HeightInPixels, False, _
         UnloadSource, Filter, ForceCloneCreation)

End Function

Public Function FreeImage_RescaleByPercent(ByVal Bitmap As Long, _
                                  Optional ByVal WidthPercentage As Double, _
                                  Optional ByVal HeightPercentage As Double, _
                                  Optional ByVal UnloadSource As Boolean, _
                                  Optional ByVal Filter As FREE_IMAGE_FILTER = FILTER_BICUBIC, _
                                  Optional ByVal ForceCloneCreation As Boolean) As Long

   ' Thin wrapper for function 'FreeImage_RescaleEx' for removing method
   ' overload fake. This function rescales the image by a percent value
   ' based on the image's original size.

   FreeImage_RescaleByPercent = FreeImage_RescaleEx(Bitmap, WidthPercentage, HeightPercentage, True, _
         UnloadSource, Filter, ForceCloneCreation)

End Function

Public Function FreeImage_RescaleByFactor(ByVal Bitmap As Long, _
                                 Optional ByVal WidthFactor As Double, _
                                 Optional ByVal HeightFactor As Double, _
                                 Optional ByVal UnloadSource As Boolean, _
                                 Optional ByVal Filter As FREE_IMAGE_FILTER = FILTER_BICUBIC, _
                                 Optional ByVal ForceCloneCreation As Boolean) As Long

   ' Thin wrapper for function 'FreeImage_RescaleEx' for removing method
   ' overload fake. This function rescales the image by a factor
   ' based on the image's original size.

   FreeImage_RescaleByFactor = FreeImage_RescaleEx(Bitmap, WidthFactor, HeightFactor, False, _
         UnloadSource, Filter, ForceCloneCreation)

End Function

' Painting functions

Public Function FreeImage_PaintDC(ByVal hDC As Long, _
                                  ByVal Bitmap As Long, _
                         Optional ByVal XDst As Long, _
                         Optional ByVal YDst As Long, _
                         Optional ByVal XSrc As Long, _
                         Optional ByVal YSrc As Long, _
                         Optional ByVal Width As Long, _
                         Optional ByVal Height As Long) As Long
 
   ' This function draws a FreeImage DIB directly onto a device context (DC). There
   ' are many (selfexplaining?) parameters that control the visual result.
   
   ' Parameters 'XDst' and 'YDst' specify the point where the output should
   ' be painted and 'XSrc', 'YSrc', 'Width' and 'Height' span a rectangle
   ' in the source image 'Bitmap' that defines the area to be painted.
   
   ' If any of parameters 'Width' and 'Height' is zero, it is transparently substituted
   ' by the width or height of teh bitmap to be drawn, resprectively.
   
   If ((hDC <> 0) And (Bitmap <> 0)) Then
   
      If (Not FreeImage_HasPixels(Bitmap)) Then
         Call Err.Raise(5, "MFreeImage", Error$(5) & vbCrLf & vbCrLf & _
                        "Unable to paint a 'header-only' bitmap.")
      End If
            
      If (Width = 0) Then
         Width = FreeImage_GetWidth(Bitmap)
      End If
      
      If (Height = 0) Then
         Height = FreeImage_GetHeight(Bitmap)
      End If
      
      FreeImage_PaintDC = SetDIBitsToDevice(hDC, XDst, YDst - YSrc, Width, Height, XSrc, YSrc, 0, _
            Height, FreeImage_GetBits(Bitmap), FreeImage_GetInfo(Bitmap), DIB_RGB_COLORS)
   End If

End Function

Public Function FreeImage_PaintDCEx(ByVal hDC As Long, _
                                    ByVal Bitmap As Long, _
                           Optional ByVal XDst As Long, _
                           Optional ByVal YDst As Long, _
                           Optional ByVal WidthDst As Long, _
                           Optional ByVal HeightDst As Long, _
                           Optional ByVal XSrc As Long, _
                           Optional ByVal YSrc As Long, _
                           Optional ByVal WidthSrc As Long, _
                           Optional ByVal HeightSrc As Long, _
                           Optional ByVal DrawMode As DRAW_MODE = DM_DRAW_DEFAULT, _
                           Optional ByVal RasterOperator As RASTER_OPERATOR = ROP_SRCCOPY, _
                           Optional ByVal StretchMode As STRETCH_MODE = SM_COLORONCOLOR) As Long

Dim eLastStretchMode As STRETCH_MODE
   
   ' This function draws a FreeImage DIB directly onto a device context (DC). There
   ' are many (selfexplaining?) parameters that control the visual result.
   
   ' The main difference of this function compared to the 'FreeImage_PaintDC' is,
   ' that this function supports both mirroring and stretching of the image to be
   ' painted and so, is somewhat slower than 'FreeImage_PaintDC'.
   
   If ((hDC <> 0) And (Bitmap <> 0)) Then
   
      If (Not FreeImage_HasPixels(Bitmap)) Then
         Call Err.Raise(5, "MFreeImage", Error$(5) & vbCrLf & vbCrLf & _
                        "Unable to paint a 'header-only' bitmap.")
      End If
      
      eLastStretchMode = GetStretchBltMode(hDC)
      Call SetStretchBltMode(hDC, StretchMode)
      
      If (WidthSrc = 0) Then
         WidthSrc = FreeImage_GetWidth(Bitmap)
      End If
      If (WidthDst = 0) Then
         WidthDst = WidthSrc
      End If
      
      If (HeightSrc = 0) Then
         HeightSrc = FreeImage_GetHeight(Bitmap)
      End If
      If (HeightDst = 0) Then
         HeightDst = HeightSrc
      End If
      
      If (DrawMode And DM_MIRROR_VERTICAL) Then
         YDst = YDst + HeightDst
         HeightDst = -HeightDst
      End If
     
      If (DrawMode And DM_MIRROR_HORIZONTAL) Then
         XDst = XDst + WidthDst
         WidthDst = -WidthDst
      End If

      Call StretchDIBits(hDC, XDst, YDst, WidthDst, HeightDst, XSrc, YSrc, WidthSrc, HeightSrc, _
            FreeImage_GetBits(Bitmap), FreeImage_GetInfo(Bitmap), DIB_RGB_COLORS, _
            RasterOperator)
      
      ' restore last mode
      Call SetStretchBltMode(hDC, eLastStretchMode)
   End If

End Function

Public Function FreeImage_PaintTransparent(ByVal hDC As Long, _
                                           ByVal Bitmap As Long, _
                                  Optional ByVal XDst As Long = 0, _
                                  Optional ByVal YDst As Long = 0, _
                                  Optional ByVal WidthDst As Long, _
                                  Optional ByVal HeightDst As Long, _
                                  Optional ByVal XSrc As Long = 0, _
                                  Optional ByVal YSrc As Long = 0, _
                                  Optional ByVal WidthSrc As Long, _
                                  Optional ByVal HeightSrc As Long, _
                                  Optional ByVal Alpha As Byte = 255) As Long
                                  
Dim lpPalette As Long
Dim bIsTransparent As Boolean

   ' This function paints a device independent bitmap to any device context and
   ' thereby honors any transparency information associated with the bitmap.
   ' Furthermore, through the 'Alpha' parameter, an overall transparency level
   ' may be specified.
   
   ' For palletised images, any color set to be transparent in the transparency
   ' table, will be transparent. For high color images, only 32-bit images may
   ' have any transparency information associated in their alpha channel. Only
   ' these may be painted with transparency by this function.
   
   ' Since this is a wrapper for the Windows GDI function AlphaBlend(), 31-bit
   ' images, containing alpha (or per-pixel) transparency, must be 'premultiplied'
   ' for alpha transparent regions to actually show transparent. See MSDN help
   ' on the AlphaBlend() function.
   
   ' FreeImage also offers a function to premultiply 32-bit bitmaps with their alpha
   ' channel, according to the needs of AlphaBlend(). Have a look at function
   ' FreeImage_PreMultiplyWithAlpha().
   
   ' Overall transparency level may be specified for all bitmaps in all color
   ' depths supported by FreeImage. If needed, bitmaps are transparently converted
   ' to 32-bit and unloaded after the paint operation. This is also true for palletised
   ' bitmaps.
   
   ' Parameters 'hDC' and 'Bitmap' seem to be very self-explanatory. All other parameters
   ' are optional. The group of '*Dest*' parameters span a rectangle on the destination
   ' device context, used as drawing area for the bitmap. If these are omitted, the
   ' bitmap will be drawn starting at position 0,0 in the bitmap's actual size.
   ' The group of '*Src*' parameters span a rectangle on the source bitmap, used as
   ' cropping area for the paint operation. If both rectangles differ in size in any
   ' direction, the part of the image actually painted is stretched for to fit into
   ' the drawing area. If any of the parameters '*Width' or '*Height' are omitted,
   ' the bitmap's actual size (width or height) will be used.
   
   ' The 'Alpha' parameter specifies the overall transparency. It takes values in the
   ' range from 0 to 255. Using 0 will paint the bitmap fully transparent, 255 will
   ' paint the image fully opaque. The 'Alpha' value controls, how the non per-pixel
   ' portions of the image will be drawn.
                                  
   If ((hDC <> 0) And (Bitmap <> 0)) Then
   
      If (Not FreeImage_HasPixels(Bitmap)) Then
         Call Err.Raise(5, "MFreeImage", Error$(5) & vbCrLf & vbCrLf & _
                        "Unable to paint a 'header-only' bitmap.")
      End If
   
      ' get image width if not specified
      If (WidthSrc = 0) Then
         WidthSrc = FreeImage_GetWidth(Bitmap)
      End If
      If (WidthDst = 0) Then
         WidthDst = WidthSrc
      End If
      
      ' get image height if not specified
      If (HeightSrc = 0) Then
         HeightSrc = FreeImage_GetHeight(Bitmap)
      End If
      If (HeightDst = 0) Then
         HeightDst = HeightSrc
      End If
      
      lpPalette = FreeImage_GetPalette(Bitmap)
      If (lpPalette) Then
      
         Dim lPaletteSize As Long
         Dim alPalOrg(255) As Long
         Dim alPalMod(255) As Long
         Dim alPalMask(255) As Long
         Dim abTT() As Byte
         Dim i As Long
         
         lPaletteSize = FreeImage_GetColorsUsed(Bitmap) * 4
         Call CopyMemory(alPalOrg(0), ByVal lpPalette, lPaletteSize)
         Call CopyMemory(alPalMod(0), ByVal lpPalette, lPaletteSize)
         abTT = FreeImage_GetTransparencyTableEx(Bitmap)
         
         If ((Alpha = 255) And _
             (HeightDst >= HeightSrc) And (WidthDst >= WidthSrc)) Then
            
            ' create a mask palette and a modified version of the
            ' original palette
            For i = 0 To UBound(abTT)
               If (abTT(i) = 0) Then
                  alPalMask(i) = &HFFFFFFFF   ' white
                  alPalMod(i) = &H0           ' black
                  bIsTransparent = True
               End If
            Next i

            If (Not bIsTransparent) Then
               
               ' if there is no transparency in the image, paint it with
               ' a single SRCCOPY
               Call StretchDIBits(hDC, _
                                  XDst, YDst, WidthDst, HeightDst, _
                                  XSrc, YSrc, WidthSrc, HeightSrc, _
                                  FreeImage_GetBits(Bitmap), _
                                  FreeImage_GetInfo(Bitmap), _
                                  DIB_RGB_COLORS, SRCCOPY)
            Else
            
               ' set mask palette and paint with SRCAND
               Call CopyMemory(ByVal lpPalette, alPalMask(0), lPaletteSize)
               Call StretchDIBits(hDC, _
                                  XDst, YDst, WidthDst, HeightDst, _
                                  XSrc, YSrc, WidthSrc, HeightSrc, _
                                  FreeImage_GetBits(Bitmap), _
                                  FreeImage_GetInfo(Bitmap), _
                                  DIB_RGB_COLORS, SRCAND)
               
               ' set mask modified and paint with SRCPAINT
               Call CopyMemory(ByVal lpPalette, alPalMod(0), lPaletteSize)
               Call StretchDIBits(hDC, _
                                  XDst, YDst, WidthDst, HeightDst, _
                                  XSrc, YSrc, WidthSrc, HeightSrc, _
                                  FreeImage_GetBits(Bitmap), _
                                  FreeImage_GetInfo(Bitmap), _
                                  DIB_RGB_COLORS, SRCPAINT)
                                  
               ' restore original palette
               Call CopyMemory(ByVal lpPalette, alPalOrg(0), lPaletteSize)
            End If
            
            ' we are done, do not paint with AlphaBlend() any more
            Bitmap = 0
         Else
            
            ' create a premultiplied palette
            ' since we have no real per pixel transparency in a palletized
            ' image, we only need to set all transparent colors to zero.
            For i = 0 To UBound(abTT)
               If (abTT(i) = 0) Then
                  alPalMod(i) = 0
               End If
            Next i
            
            ' set premultiplied palette and convert to 32 bits
            Call CopyMemory(ByVal lpPalette, alPalMod(0), lPaletteSize)
            Bitmap = FreeImage_ConvertTo32Bits(Bitmap)
            
            ' restore original palette
            Call CopyMemory(ByVal lpPalette, alPalOrg(0), lPaletteSize)
         End If
      End If

      If (Bitmap) Then
         Dim hMemDC As Long
         Dim hBitmap As Long
         Dim hBitmapOld As Long
         Dim tBF As BLENDFUNCTION
         Dim lBF As Long
         
         hMemDC = CreateCompatibleDC(0)
         If (hMemDC) Then
            hBitmap = FreeImage_GetBitmap(Bitmap, hMemDC)
            hBitmapOld = SelectObject(hMemDC, hBitmap)
            
            With tBF
               .BlendOp = AC_SRC_OVER
               .SourceConstantAlpha = Alpha
               If (FreeImage_GetBPP(Bitmap) = 32) Then
                  .AlphaFormat = AC_SRC_ALPHA
               End If
            End With
            Call CopyMemory(lBF, tBF, 4)
            
            Call AlphaBlend(hDC, XDst, YDst, WidthDst, HeightDst, _
                            hMemDC, XSrc, YSrc, WidthSrc, HeightSrc, _
                            lBF)
                            
            Call SelectObject(hMemDC, hBitmapOld)
            Call DeleteObject(hBitmap)
            Call DeleteDC(hMemDC)
            If (lpPalette) Then
               Call FreeImage_Unload(Bitmap)
            End If
         End If
      End If
   End If

End Function


'--------------------------------------------------------------------------------
' Pixel access functions
'--------------------------------------------------------------------------------

Public Function FreeImage_GetBitsEx(ByVal Bitmap As Long) As Byte()

Dim tSA As SAVEARRAY2D
Dim lpSA As Long

   ' This function returns a two dimensional Byte array containing a DIB's
   ' data-bits. This is done by wrapping a true VB array around the memory
   ' block the returned pointer of FreeImage_GetBits() is pointing to. So, the
   ' array returned provides full read and write acces to the image's data.

   ' To reuse the caller's array variable, this function's result was assigned to,
   ' before it goes out of scope, the caller's array variable must be destroyed with
   ' the FreeImage_DestroyLockedArray() function.

   If (Bitmap) Then
      
      ' create a proper SAVEARRAY descriptor
      With tSA
         .cbElements = 1                           ' size in bytes per array element
         .cDims = 2                                ' the array has 2 dimensions
         .cElements1 = FreeImage_GetHeight(Bitmap) ' the number of elements in y direction (height of Bitmap)
         .cElements2 = FreeImage_GetPitch(Bitmap)  ' the number of elements in x direction (byte width of Bitmap)
         .fFeatures = FADF_AUTO Or FADF_FIXEDSIZE  ' need AUTO and FIXEDSIZE for safety issues,
                                                   ' so the array can not be modified in size
                                                   ' or erased; according to Matthew Curland never
                                                   ' use FIXEDSIZE alone
         .pvData = FreeImage_GetBits(Bitmap)       ' let the array point to the memory block, the
                                                   ' FreeImage scanline data pointer points to
      End With
      
      ' allocate memory for an array descriptor
      ' we cannot use the memory block used by tSA, since it is
      ' released when tSA goes out of scope, leaving us with an
      ' array with zeroed descriptor
      ' we use nearly the same method that VB uses, so VB is able
      ' to cleanup the array variable and it's descriptor; the
      ' array data is not touched when cleaning up, since both AUTO
      ' and FIXEDSIZE flags are set
      Call SafeArrayAllocDescriptor(2, lpSA)
      
      ' copy our own array descriptor over the descriptor allocated
      ' by SafeArrayAllocDescriptor; lpSA is a pointer to that memory
      ' location
      Call CopyMemory(ByVal lpSA, tSA, Len(tSA))
      
      ' the implicit variable named like the function is an array
      ' variable in VB
      ' make it point to the allocated array descriptor
      Call CopyMemory(ByVal VarPtrArray(FreeImage_GetBitsEx), lpSA, 4)
   End If

End Function

Public Function FreeImage_GetBitsExRGBTRIPLE(ByVal Bitmap As Long) As RGBTRIPLE()

Dim tSA As SAVEARRAY2D
Dim lpSA As Long

   ' This function returns a two dimensional RGBTRIPLE array containing a DIB's
   ' data-bits. This is done by wrapping a true VB array around the memory
   ' block the returned pointer of 'FreeImage_GetBits' is pointing to. So, the
   ' array returned provides full read and write acces to the image's data.
   
   ' This function only works with 24 bpp images and, since each FreeImage scanline
   ' is aligned to a 32-bit boundary, only if the image's width in pixels multiplied
   ' by three modulo four is zero. That means, that the image layout in memory must
   ' "naturally" be aligned to a 32-bit boundary, since arrays do not support padding.
   
   ' So, the function only returns an initialized array, if this equotion is true:
   ' (((ImageWidthPixels * 3) Mod 4) = 0)
   
   ' In other words, this is true for all images with no padding.
   
   ' For instance, only images with these widths will be suitable for this function:
   ' 100, 104, 108, 112, 116, 120, 124, ...
   
   ' Have a look at the wrapper function 'FreeImage_GetScanlinesRGBTRIPLE()' to have
   ' a way to work around that limitation.

   ' To reuse the caller's array variable, this function's result was assigned to,
   ' before it goes out of scope, the caller's array variable must be destroyed with
   ' the 'FreeImage_DestroyLockedArray' function.

   If (Bitmap) Then
      
      If (FreeImage_GetBPP(Bitmap) = 24) Then
         If (((FreeImage_GetWidth(Bitmap) * 3) Mod 4) = 0) Then
         
            ' create a proper SAVEARRAY descriptor
            With tSA
               .cbElements = 3                           ' size in bytes per array element
               .cDims = 2                                ' the array has 2 dimensions
               .cElements1 = FreeImage_GetHeight(Bitmap) ' the number of elements in y direction (height of Bitmap)
               .cElements2 = FreeImage_GetWidth(Bitmap)  ' the number of elements in x direction (byte width of Bitmap)
               .fFeatures = FADF_AUTO Or FADF_FIXEDSIZE  ' need AUTO and FIXEDSIZE for safety issues,
                                                         ' so the array can not be modified in size
                                                         ' or erased; according to Matthew Curland never
                                                         ' use FIXEDSIZE alone
               .pvData = FreeImage_GetBits(Bitmap)       ' let the array point to the memory block, the
                                                         ' FreeImage scanline data pointer points to
            End With
            
            ' allocate memory for an array descriptor
            ' we cannot use the memory block used by tSA, since it is
            ' released when tSA goes out of scope, leaving us with an
            ' array with zeroed descriptor
            ' we use nearly the same method that VB uses, so VB is able
            ' to cleanup the array variable and it's descriptor; the
            ' array data is not touched when cleaning up, since both AUTO
            ' and FIXEDSIZE flags are set
            Call SafeArrayAllocDescriptor(2, lpSA)
            
            ' copy our own array descriptor over the descriptor allocated
            ' by SafeArrayAllocDescriptor; lpSA is a pointer to that memory
            ' location
            Call CopyMemory(ByVal lpSA, tSA, Len(tSA))
            
            ' the implicit variable named like the function is an array
            ' variable in VB
            ' make it point to the allocated array descriptor
            Call CopyMemory(ByVal VarPtrArray(FreeImage_GetBitsExRGBTRIPLE), lpSA, 4)
         Else
         
            ' we could throw an error here
         End If
      Else
      
         ' we could throw an error here
      End If
   End If

End Function

Public Function FreeImage_GetBitsExRGBQUAD(ByVal Bitmap As Long) As RGBQUAD()

Dim tSA As SAVEARRAY2D
Dim lpSA As Long

   ' This function returns a two dimensional RGBQUAD array containing a DIB's
   ' data-bits. This is done by wrapping a true VB array around the memory
   ' block the returned pointer of 'FreeImage_GetBits' is pointing to. So, the
   ' array returned provides full read and write acces to the image's data.
   
   ' This function only works with 32 bpp images. Since each scanline must
   ' "naturally" start at a 32-bit boundary if each pixel uses 32 bits, there
   ' are no padding problems like these known with 'FreeImage_GetBitsExRGBTRIPLE',
   ' so, this function is suitable for all 32 bpp images of any size.

   ' To reuse the caller's array variable, this function's result was assigned to,
   ' before it goes out of scope, the caller's array variable must be destroyed with
   ' the 'FreeImage_DestroyLockedArray' function.

   If (Bitmap) Then
   
      If (FreeImage_GetBPP(Bitmap) = 32) Then
      
         ' create a proper SAVEARRAY descriptor
         With tSA
            .cbElements = 4                           ' size in bytes per array element
            .cDims = 2                                ' the array has 2 dimensions
            .cElements1 = FreeImage_GetHeight(Bitmap) ' the number of elements in y direction (height of Bitmap)
            .cElements2 = FreeImage_GetWidth(Bitmap)  ' the number of elements in x direction (byte width of Bitmap)
            .fFeatures = FADF_AUTO Or FADF_FIXEDSIZE  ' need AUTO and FIXEDSIZE for safety issues,
                                                      ' so the array can not be modified in size
                                                      ' or erased; according to Matthew Curland never
                                                      ' use FIXEDSIZE alone
            .pvData = FreeImage_GetBits(Bitmap)       ' let the array point to the memory block, the
                                                      ' FreeImage scanline data pointer points to
         End With
         
         ' allocate memory for an array descriptor
         ' we cannot use the memory block used by tSA, since it is
         ' released when tSA goes out of scope, leaving us with an
         ' array with zeroed descriptor
         ' we use nearly the same method that VB uses, so VB is able
         ' to cleanup the array variable and it's descriptor; the
         ' array data is not touched when cleaning up, since both AUTO
         ' and FIXEDSIZE flags are set
         Call SafeArrayAllocDescriptor(2, lpSA)
         
         ' copy our own array descriptor over the descriptor allocated
         ' by SafeArrayAllocDescriptor; lpSA is a pointer to that memory
         ' location
         Call CopyMemory(ByVal lpSA, tSA, Len(tSA))
         
         ' the implicit variable named like the function is an array
         ' variable in VB
         ' make it point to the allocated array descriptor
         Call CopyMemory(ByVal VarPtrArray(FreeImage_GetBitsExRGBQUAD), lpSA, 4)
      Else
      
         ' we could throw an error here
      End If
   End If

End Function

Public Function FreeImage_GetScanLinesRGBTRIPLE(ByVal Bitmap As Long, _
                                                ByRef Scanlines As ScanLinesRGBTRIBLE, _
                                       Optional ByVal Reverse As Boolean) As Long
Dim lHeight As Long
Dim i As Long

   ' still undocumented
   ' for now, have a look at function FreeImage_GetBitsExRGBTRIPLE()

   If (Bitmap) Then
      If (FreeImage_GetImageType(Bitmap) = FIT_BITMAP) Then
         If (FreeImage_GetBPP(Bitmap) = 24) Then

            lHeight = FreeImage_GetHeight(Bitmap)
            ReDim Scanlines.Scanline(lHeight - 1)
            For i = 0 To lHeight - 1
               If (Not Reverse) Then
                  Scanlines.Scanline(i).Data = FreeImage_GetScanLineBITMAP24(Bitmap, i)
               Else
                  Scanlines.Scanline(i).Data = FreeImage_GetScanLineBITMAP24(Bitmap, lHeight - i - 1)
               End If
            Next i
         End If
      End If
   End If
   
   FreeImage_GetScanLinesRGBTRIPLE = lHeight

End Function

Public Function FreeImage_GetScanLineEx(ByVal Bitmap As Long, _
                                        ByVal Scanline As Long) As Byte()
                                        
Dim tSA As SAVEARRAY1D
Dim lpSA As Long

   ' This function returns a one dimensional Byte array containing a whole
   ' scanline's data-bits. This is done by wrapping a true VB array around
   ' the memory block the returned pointer of 'FreeImage_GetScanline' is
   ' pointing to. So, the array returned provides full read and write acces
   ' to the image's data.
   
   ' This is the most generic function of a complete function set dealing with
   ' scanline data, since this function returns an array of type Byte. It is
   ' up to the caller of the function to interpret these bytes correctly,
   ' according to the results of FreeImage_GetBPP and FreeImage_GetImageType.
   
   ' You may consider using any of the non-generic functions named
   ' 'FreeImage_GetScanLineXXX', that return an array of proper type, according
   ' to the images bit depth and type.

   ' To reuse the caller's array variable, this function's result was assigned to,
   ' before it goes out of scope, the caller's array variable must be destroyed with
   ' the 'FreeImage_DestroyLockedArray' function.
   
   If (Bitmap) Then
      
      ' create a proper SAVEARRAY descriptor
      With tSA
         .cbElements = 1                           ' size in bytes per array element
         .cDims = 1                                ' the array has only 1 dimension
         .cElements = FreeImage_GetLine(Bitmap)    ' the number of elements in the array
         .fFeatures = FADF_AUTO Or FADF_FIXEDSIZE  ' need AUTO and FIXEDSIZE for safety issues,
                                                   ' so the array can not be modified in size
                                                   ' or erased; according to Matthew Curland never
                                                   ' use FIXEDSIZE alone
         .pvData = FreeImage_GetScanline(Bitmap, _
                                         Scanline) ' let the array point to the memory block, the
                                                   ' FreeImage scanline data pointer points to
      End With
      
      ' allocate memory for an array descriptor
      ' we cannot use the memory block used by tSA, since it is
      ' released when tSA goes out of scope, leaving us with an
      ' array with zeroed descriptor
      ' we use nearly the same method that VB uses, so VB is able
      ' to cleanup the array variable and it's descriptor; the
      ' array data is not touched when cleaning up, since both AUTO
      ' and FIXEDSIZE flags are set
      Call SafeArrayAllocDescriptor(1, lpSA)
      
      ' copy our own array descriptor over the descriptor allocated
      ' by SafeArrayAllocDescriptor; lpSA is a pointer to that memory
      ' location
      Call CopyMemory(ByVal lpSA, tSA, Len(tSA))
      
      ' the implicit variable named like the function is an array
      ' variable in VB
      ' make it point to the allocated array descriptor
      Call CopyMemory(ByVal VarPtrArray(FreeImage_GetScanLineEx), lpSA, 4)
   End If
                                        
End Function

Public Function FreeImage_GetScanLineBITMAP8(ByVal Bitmap As Long, _
                                             ByVal Scanline As Long) As Byte()
                                             
   ' This function returns a one dimensional Byte array containing a whole
   ' scanline's data-bits of a 8 bit bitmap image. This is done by wrapping
   ' a true VB array around the memory block the returned pointer of
   ' 'FreeImage_GetScanline' is pointing to. So, the array returned provides
   ' full read and write acces to the image's data.
   
   ' This function is just a thin wrapper for 'FreeImage_GetScanLineEx' but
   ' includes checking of the image's bit depth and type, as all of the
   ' non-generic scanline functions do.

   ' To reuse the caller's array variable, this function's result was assigned to,
   ' before it goes out of scope, the caller's array variable must be destroyed with
   ' the 'FreeImage_DestroyLockedArray' function.

   If (FreeImage_GetImageType(Bitmap) = FIT_BITMAP) Then
      Select Case FreeImage_GetBPP(Bitmap)
      
      Case 1, 4, 8
         FreeImage_GetScanLineBITMAP8 = FreeImage_GetScanLineEx(Bitmap, Scanline)
         
      End Select
   End If

End Function

Public Function FreeImage_GetScanLineBITMAP16(ByVal Bitmap As Long, _
                                              ByVal Scanline As Long) As Integer()

Dim tSA As SAVEARRAY1D
Dim lpSA As Long

   ' This function returns a one dimensional Integer array containing a whole
   ' scanline's data-bits of a 16 bit bitmap image. This is done by wrapping
   ' a true VB array around the memory block the returned pointer of
   ' 'FreeImage_GetScanline' is pointing to. So, the array returned provides
   ' full read and write acces to the image's data.
   
   ' The function includes checking of the image's bit depth and type and
   ' returns a non-initialized array if 'Bitmap' is an image of improper type.

   ' To reuse the caller's array variable, this function's result was assigned to,
   ' before it goes out of scope, the caller's array variable must be destroyed with
   ' the 'FreeImage_DestroyLockedArray' function.

   If (FreeImage_GetImageType(Bitmap) = FIT_BITMAP) Then
      If (FreeImage_GetBPP(Bitmap) = 16) Then
      
         ' create a proper SAVEARRAY descriptor
         With tSA
            .cbElements = 2                           ' size in bytes per array element
            .cDims = 1                                ' the array has only 1 dimension
            .cElements = FreeImage_GetWidth(Bitmap)   ' the number of elements in the array
            .fFeatures = FADF_AUTO Or FADF_FIXEDSIZE  ' need AUTO and FIXEDSIZE for safety issues,
                                                      ' so the array can not be modified in size
                                                      ' or erased; according to Matthew Curland never
                                                      ' use FIXEDSIZE alone
            .pvData = FreeImage_GetScanline(Bitmap, _
                                            Scanline) ' let the array point to the memory block, the
                                                      ' FreeImage scanline data pointer points to
         End With
         
         ' For a complete source code documentation have a
         ' look at the function 'FreeImage_GetScanLineEx'
         Call SafeArrayAllocDescriptor(1, lpSA)
         Call CopyMemory(ByVal lpSA, tSA, Len(tSA))
         Call CopyMemory(ByVal VarPtrArray(FreeImage_GetScanLineBITMAP16), lpSA, 4)
      End If
   End If

End Function

Public Function FreeImage_GetScanLineBITMAP24(ByVal Bitmap As Long, _
                                              ByVal Scanline As Long) As RGBTRIPLE()

Dim tSA As SAVEARRAY1D
Dim lpSA As Long

   ' This function returns a one dimensional RGBTRIPLE array containing a whole
   ' scanline's data-bits of a 24 bit bitmap image. This is done by wrapping
   ' a true VB array around the memory block the returned pointer of
   ' 'FreeImage_GetScanline' is pointing to. So, the array returned provides
   ' full read and write acces to the image's data.
   
   ' The function includes checking of the image's bit depth and type and
   ' returns a non-initialized array if 'Bitmap' is an image of improper type.
   
   ' To reuse the caller's array variable, this function's result was assigned to,
   ' before it goes out of scope, the caller's array variable must be destroyed with
   ' the 'FreeImage_DestroyLockedArrayRGBTRIPLE' function.

   If (FreeImage_GetImageType(Bitmap) = FIT_BITMAP) Then
      If (FreeImage_GetBPP(Bitmap) = 24) Then
      
         ' create a proper SAVEARRAY descriptor
         With tSA
            .cbElements = 3                           ' size in bytes per array element
            .cDims = 1                                ' the array has only 1 dimension
            .cElements = FreeImage_GetWidth(Bitmap)   ' the number of elements in the array
            .fFeatures = FADF_AUTO Or FADF_FIXEDSIZE  ' need AUTO and FIXEDSIZE for safety issues,
                                                      ' so the array can not be modified in size
                                                      ' or erased; according to Matthew Curland never
                                                      ' use FIXEDSIZE alone
            .pvData = FreeImage_GetScanline(Bitmap, _
                                            Scanline) ' let the array point to the memory block, the
                                                      ' FreeImage scanline data pointer points to
         End With
         
         ' For a complete source code documentation have a
         ' look at the function 'FreeImage_GetScanLineEx'
         Call SafeArrayAllocDescriptor(1, lpSA)
         Call CopyMemory(ByVal lpSA, tSA, Len(tSA))
         Call CopyMemory(ByVal VarPtrArray(FreeImage_GetScanLineBITMAP24), lpSA, 4)
      End If
   End If

End Function

Public Function FreeImage_GetScanLineBITMAP32(ByVal Bitmap As Long, _
                                              ByVal Scanline As Long) As RGBQUAD()

Dim tSA As SAVEARRAY1D
Dim lpSA As Long

   ' This function returns a one dimensional RGBQUAD array containing a whole
   ' scanline's data-bits of a 32 bit bitmap image. This is done by wrapping
   ' a true VB array around the memory block the returned pointer of
   ' 'FreeImage_GetScanline' is pointing to. So, the array returned provides
   ' full read and write acces to the image's data.
   
   ' The function includes checking of the image's bit depth and type and
   ' returns a non-initialized array if 'Bitmap' is an image of improper type.

   ' To reuse the caller's array variable, this function's result was assigned to,
   ' before it goes out of scope, the caller's array variable must be destroyed with
   ' the 'FreeImage_DestroyLockedArrayRGBQUAD' function.

   If (FreeImage_GetImageType(Bitmap) = FIT_BITMAP) Then
      If (FreeImage_GetBPP(Bitmap) = 32) Then
      
         ' create a proper SAVEARRAY descriptor
         With tSA
            .cbElements = 4                           ' size in bytes per array element
            .cDims = 1                                ' the array has only 1 dimension
            .cElements = FreeImage_GetWidth(Bitmap)   ' the number of elements in the array
            .fFeatures = FADF_AUTO Or FADF_FIXEDSIZE  ' need AUTO and FIXEDSIZE for safety issues,
                                                      ' so the array can not be modified in size
                                                      ' or erased; according to Matthew Curland never
                                                      ' use FIXEDSIZE alone
            .pvData = FreeImage_GetScanline(Bitmap, _
                                            Scanline) ' let the array point to the memory block, the
                                                      ' FreeImage scanline data pointer points to
         End With
         
         ' For a complete source code documentation have a
         ' look at the function 'FreeImage_GetScanLineEx'
         Call SafeArrayAllocDescriptor(1, lpSA)
         Call CopyMemory(ByVal lpSA, tSA, Len(tSA))
         Call CopyMemory(ByVal VarPtrArray(FreeImage_GetScanLineBITMAP32), lpSA, 4)
      End If
   End If

End Function

Public Function FreeImage_GetScanLineINT16(ByVal Bitmap As Long, _
                                           ByVal Scanline As Long) As Integer()

Dim tSA As SAVEARRAY1D
Dim lpSA As Long
Dim eImageType As FREE_IMAGE_TYPE

   ' This function returns a one dimensional Integer array containing a whole
   ' scanline's data-bits of a FIT_INT16 or FIT_UINT16 image. This is done
   ' by wrapping a true VB array around the memory block the returned pointer
   ' of 'FreeImage_GetScanline' is pointing to. So, the array returned
   ' provides full read and write acces to the image's data.
   
   ' The function includes checking of the image's bit depth and type and
   ' returns a non-initialized array if 'Bitmap' is an image of improper type.
   
   ' Since VB does not distinguish between signed and unsigned data types, both
   ' image types FIT_INT16 and FIT_UINT16 are handled with this function. If 'Bitmap'
   ' specifies an image of type FIT_UINT16, it is up to the caller to treat the
   ' array's Integers as unsigned, although VB knows signed Integers only.

   ' To reuse the caller's array variable, this function's result was assigned to,
   ' before it goes out of scope, the caller's array variable must be destroyed with
   ' the 'FreeImage_DestroyLockedArray' function.

   eImageType = FreeImage_GetImageType(Bitmap)
   If ((eImageType = FIT_INT16) Or _
       (eImageType = FIT_UINT16)) Then
      
      ' create a proper SAVEARRAY descriptor
      With tSA
         .cbElements = 2                           ' size in bytes per array element
         .cDims = 1                                ' the array has only 1 dimension
         .cElements = FreeImage_GetWidth(Bitmap)   ' the number of elements in the array
         .fFeatures = FADF_AUTO Or FADF_FIXEDSIZE  ' need AUTO and FIXEDSIZE for safety issues,
                                                   ' so the array can not be modified in size
                                                   ' or erased; according to Matthew Curland never
                                                   ' use FIXEDSIZE alone
         .pvData = FreeImage_GetScanline(Bitmap, _
                                         Scanline) ' let the array point to the memory block, the
                                                   ' FreeImage scanline data pointer points to
      End With
      
      ' For a complete source code documentation have a
      ' look at the function 'FreeImage_GetScanLineEx'
      Call SafeArrayAllocDescriptor(1, lpSA)
      Call CopyMemory(ByVal lpSA, tSA, Len(tSA))
      Call CopyMemory(ByVal VarPtrArray(FreeImage_GetScanLineINT16), lpSA, 4)
   End If

End Function

Public Function FreeImage_GetScanLineINT32(ByVal Bitmap As Long, _
                                           ByVal Scanline As Long) As Long()

Dim tSA As SAVEARRAY1D
Dim lpSA As Long
Dim eImageType As FREE_IMAGE_TYPE

   ' This function returns a one dimensional Long array containing a whole
   ' scanline's data-bits of a FIT_INT32 or FIT_UINT32 image. This is done
   ' by wrapping a true VB array around the memory block the returned pointer
   ' of 'FreeImage_GetScanline' is pointing to. So, the array returned
   ' provides full read and write acces to the image's data.
   
   ' The function includes checking of the image's bit depth and type and
   ' returns a non-initialized array if 'Bitmap' is an image of improper type.
   
   ' Since VB does not distinguish between signed and unsigned data types, both
   ' image types FIT_INT32 and FIT_UINT32 are handled with this function. If 'Bitmap'
   ' specifies an image of type FIT_UINT32, it is up to the caller to treat the
   ' array's Longs as unsigned, although VB knows signed Longs only.

   ' To reuse the caller's array variable, this function's result was assigned to,
   ' before it goes out of scope, the caller's array variable must be destroyed with
   ' the 'FreeImage_DestroyLockedArray' function.

   eImageType = FreeImage_GetImageType(Bitmap)
   If ((eImageType = FIT_INT32) Or _
       (eImageType = FIT_UINT32)) Then
      
      ' create a proper SAVEARRAY descriptor
      With tSA
         .cbElements = 4                           ' size in bytes per array element
         .cDims = 1                                ' the array has only 1 dimension
         .cElements = FreeImage_GetWidth(Bitmap)   ' the number of elements in the array
         .fFeatures = FADF_AUTO Or FADF_FIXEDSIZE  ' need AUTO and FIXEDSIZE for safety issues,
                                                   ' so the array can not be modified in size
                                                   ' or erased; according to Matthew Curland never
                                                   ' use FIXEDSIZE alone
         .pvData = FreeImage_GetScanline(Bitmap, _
                                         Scanline) ' let the array point to the memory block, the
                                                   ' FreeImage scanline data pointer points to
      End With
      
      ' For a complete source code documentation have a
      ' look at the function 'FreeImage_GetScanLineEx'
      Call SafeArrayAllocDescriptor(1, lpSA)
      Call CopyMemory(ByVal lpSA, tSA, Len(tSA))
      Call CopyMemory(ByVal VarPtrArray(FreeImage_GetScanLineINT32), lpSA, 4)
   End If

End Function

Public Function FreeImage_GetScanLineFLOAT(ByVal Bitmap As Long, _
                                           ByVal Scanline As Long) As Single()

Dim tSA As SAVEARRAY1D
Dim lpSA As Long
Dim eImageType As FREE_IMAGE_TYPE

   ' This function returns a one dimensional Single array containing a whole
   ' scanline's data-bits of a FIT_FLOAT image. This is done by wrapping
   ' a true VB array around the memory block the returned pointer of
   ' 'FreeImage_GetScanline' is pointing to. So, the array returned  provides
   ' full read and write acces to the image's data.
   
   ' The function includes checking of the image's bit depth and type and
   ' returns a non-initialized array if 'Bitmap' is an image of improper type.
   
   ' To reuse the caller's array variable, this function's result was assigned to,
   ' before it goes out of scope, the caller's array variable must be destroyed with
   ' the 'FreeImage_DestroyLockedArray' function.

   eImageType = FreeImage_GetImageType(Bitmap)
   If (eImageType = FIT_FLOAT) Then
      
      ' create a proper SAVEARRAY descriptor
      With tSA
         .cbElements = 4                           ' size in bytes per array element
         .cDims = 1                                ' the array has only 1 dimension
         .cElements = FreeImage_GetWidth(Bitmap)   ' the number of elements in the array
         .fFeatures = FADF_AUTO Or FADF_FIXEDSIZE  ' need AUTO and FIXEDSIZE for safety issues,
                                                   ' so the array can not be modified in size
                                                   ' or erased; according to Matthew Curland never
                                                   ' use FIXEDSIZE alone
         .pvData = FreeImage_GetScanline(Bitmap, _
                                         Scanline) ' let the array point to the memory block, the
                                                   ' FreeImage scanline data pointer points to
      End With
      
      ' For a complete source code documentation have a
      ' look at the function 'FreeImage_GetScanLineEx'
      Call SafeArrayAllocDescriptor(1, lpSA)
      Call CopyMemory(ByVal lpSA, tSA, Len(tSA))
      Call CopyMemory(ByVal VarPtrArray(FreeImage_GetScanLineFLOAT), lpSA, 4)
   End If

End Function

Public Function FreeImage_GetScanLineDOUBLE(ByVal Bitmap As Long, _
                                            ByVal Scanline As Long) As Double()

Dim tSA As SAVEARRAY1D
Dim lpSA As Long
Dim eImageType As FREE_IMAGE_TYPE

   ' This function returns a one dimensional Double array containing a whole
   ' scanline's data-bits of a FIT_DOUBLE image. This is done by wrapping
   ' a true VB array around the memory block the returned pointer of
   ' 'FreeImage_GetScanline' is pointing to. So, the array returned  provides
   ' full read and write acces to the image's data.
   
   ' The function includes checking of the image's bit depth and type and
   ' returns a non-initialized array if 'Bitmap' is an image of improper type.
   
   ' To reuse the caller's array variable, this function's result was assigned to,
   ' before it goes out of scope, the caller's array variable must be destroyed with
   ' the 'FreeImage_DestroyLockedArray' function.

   eImageType = FreeImage_GetImageType(Bitmap)
   If (eImageType = FIT_DOUBLE) Then
      
      ' create a proper SAVEARRAY descriptor
      With tSA
         .cbElements = 8                           ' size in bytes per array element
         .cDims = 1                                ' the array has only 1 dimension
         .cElements = FreeImage_GetWidth(Bitmap)   ' the number of elements in the array
         .fFeatures = FADF_AUTO Or FADF_FIXEDSIZE  ' need AUTO and FIXEDSIZE for safety issues,
                                                   ' so the array can not be modified in size
                                                   ' or erased; according to Matthew Curland never
                                                   ' use FIXEDSIZE alone
         .pvData = FreeImage_GetScanline(Bitmap, _
                                         Scanline) ' let the array point to the memory block, the
                                                   ' FreeImage scanline data pointer points to
      End With
      
      ' For a complete source code documentation have a
      ' look at the function 'FreeImage_GetScanLineEx'
      Call SafeArrayAllocDescriptor(1, lpSA)
      Call CopyMemory(ByVal lpSA, tSA, Len(tSA))
      Call CopyMemory(ByVal VarPtrArray(FreeImage_GetScanLineDOUBLE), lpSA, 4)
   End If

End Function

Public Function FreeImage_GetScanLineCOMPLEX(ByVal Bitmap As Long, _
                                             ByVal Scanline As Long) As FICOMPLEX()

Dim tSA As SAVEARRAY1D
Dim lpSA As Long
Dim eImageType As FREE_IMAGE_TYPE

   ' This function returns a one dimensional FICOMPLEX array containing a whole
   ' scanline's data-bits of a FIT_COMPLEX image. This is done by wrapping
   ' a true VB array around the memory block the returned pointer of
   ' 'FreeImage_GetScanline' is pointing to. So, the array returned  provides
   ' full read and write acces to the image's data.
   
   ' The function includes checking of the image's bit depth and type and
   ' returns a non-initialized array if 'Bitmap' is an image of improper type.

   ' To reuse the caller's array variable, this function's result was assigned to,
   ' before it goes out of scope, the caller's array variable must be destroyed with
   ' the 'FreeImage_DestroyLockedArrayFICOMPLEX' function.

   eImageType = FreeImage_GetImageType(Bitmap)
   If (eImageType = FIT_COMPLEX) Then
      
      ' create a proper SAVEARRAY descriptor
      With tSA
         .cbElements = 16                          ' size in bytes per array element
         .cDims = 1                                ' the array has only 1 dimension
         .cElements = FreeImage_GetWidth(Bitmap)   ' the number of elements in the array
         .fFeatures = FADF_AUTO Or FADF_FIXEDSIZE  ' need AUTO and FIXEDSIZE for safety issues,
                                                   ' so the array can not be modified in size
                                                   ' or erased; according to Matthew Curland never
                                                   ' use FIXEDSIZE alone
         .pvData = FreeImage_GetScanline(Bitmap, _
                                         Scanline) ' let the array point to the memory block, the
                                                   ' FreeImage scanline data pointer points to
      End With
      
      ' For a complete source code documentation have a
      ' look at the function 'FreeImage_GetScanLineEx'
      Call SafeArrayAllocDescriptor(1, lpSA)
      Call CopyMemory(ByVal lpSA, tSA, Len(tSA))
      Call CopyMemory(ByVal VarPtrArray(FreeImage_GetScanLineCOMPLEX), lpSA, 4)
   End If

End Function

Public Function FreeImage_GetScanLineRGB16(ByVal Bitmap As Long, _
                                           ByVal Scanline As Long) As FIRGB16()

Dim tSA As SAVEARRAY1D
Dim lpSA As Long
Dim eImageType As FREE_IMAGE_TYPE

   ' This function returns a one dimensional FIRGB16 array containing a whole
   ' scanline's data-bits of a FIT_RGB16 image. This is done by wrapping
   ' a true VB array around the memory block the returned pointer of
   ' 'FreeImage_GetScanline' is pointing to. So, the array returned  provides
   ' full read and write acces to the image's data.
   
   ' The function includes checking of the image's bit depth and type and
   ' returns a non-initialized array if 'Bitmap' is an image of improper type.

   ' To reuse the caller's array variable, this function's result was assigned to,
   ' before it goes out of scope, the caller's array variable must be destroyed with
   ' the 'FreeImage_DestroyLockedArrayFIRGB16' function.

   eImageType = FreeImage_GetImageType(Bitmap)
   If (eImageType = FIT_RGB16) Then
      
      ' create a proper SAVEARRAY descriptor
      With tSA
         .cbElements = 6                           ' size in bytes per array element
         .cDims = 1                                ' the array has only 1 dimension
         .cElements = FreeImage_GetWidth(Bitmap)   ' the number of elements in the array
         .fFeatures = FADF_AUTO Or FADF_FIXEDSIZE  ' need AUTO and FIXEDSIZE for safety issues,
                                                   ' so the array can not be modified in size
                                                   ' or erased; according to Matthew Curland never
                                                   ' use FIXEDSIZE alone
         .pvData = FreeImage_GetScanline(Bitmap, _
                                         Scanline) ' let the array point to the memory block, the
                                                   ' FreeImage scanline data pointer points to
      End With
      
      ' For a complete source code documentation have a
      ' look at the function 'FreeImage_GetScanLineEx'
      Call SafeArrayAllocDescriptor(1, lpSA)
      Call CopyMemory(ByVal lpSA, tSA, Len(tSA))
      Call CopyMemory(ByVal VarPtrArray(FreeImage_GetScanLineRGB16), lpSA, 4)
   End If

End Function

Public Function FreeImage_GetScanLineRGBA16(ByVal Bitmap As Long, _
                                            ByVal Scanline As Long) As FIRGBA16()

Dim tSA As SAVEARRAY1D
Dim lpSA As Long
Dim eImageType As FREE_IMAGE_TYPE

   ' This function returns a one dimensional FIRGBA16 array containing a whole
   ' scanline's data-bits of a FIT_RGBA16 image. This is done by wrapping
   ' a true VB array around the memory block the returned pointer of
   ' 'FreeImage_GetScanline' is pointing to. So, the array returned  provides
   ' full read and write acces to the image's data.
   
   ' The function includes checking of the image's bit depth and type and
   ' returns a non-initialized array if 'Bitmap' is an image of improper type.

   ' To reuse the caller's array variable, this function's result was assigned to,
   ' before it goes out of scope, the caller's array variable must be destroyed with
   ' the 'FreeImage_DestroyLockedArrayFIRGBA16' function.

   eImageType = FreeImage_GetImageType(Bitmap)
   If (eImageType = FIT_RGBA16) Then
      
      ' create a proper SAVEARRAY descriptor
      With tSA
         .cbElements = 8                           ' size in bytes per array element
         .cDims = 1                                ' the array has only 1 dimension
         .cElements = FreeImage_GetWidth(Bitmap)   ' the number of elements in the array
         .fFeatures = FADF_AUTO Or FADF_FIXEDSIZE  ' need AUTO and FIXEDSIZE for safety issues,
                                                   ' so the array can not be modified in size
                                                   ' or erased; according to Matthew Curland never
                                                   ' use FIXEDSIZE alone
         .pvData = FreeImage_GetScanline(Bitmap, _
                                         Scanline) ' let the array point to the memory block, the
                                                   ' FreeImage scanline data pointer points to
      End With
      
      ' For a complete source code documentation have a
      ' look at the function 'FreeImage_GetScanLineEx'
      Call SafeArrayAllocDescriptor(1, lpSA)
      Call CopyMemory(ByVal lpSA, tSA, Len(tSA))
      Call CopyMemory(ByVal VarPtrArray(FreeImage_GetScanLineRGBA16), lpSA, 4)
   End If

End Function

Public Function FreeImage_GetScanLineRGBF(ByVal Bitmap As Long, _
                                          ByVal Scanline As Long) As FIRGBF()

Dim tSA As SAVEARRAY1D
Dim lpSA As Long
Dim eImageType As FREE_IMAGE_TYPE

   ' This function returns a one dimensional FIRGBF array containing a whole
   ' scanline's data-bits of a FIT_RGBF image. This is done by wrapping
   ' a true VB array around the memory block the returned pointer of
   ' 'FreeImage_GetScanline' is pointing to. So, the array returned  provides
   ' full read and write acces to the image's data.
   
   ' The function includes checking of the image's bit depth and type and
   ' returns a non-initialized array if 'Bitmap' is an image of improper type.

   ' To reuse the caller's array variable, this function's result was assigned to,
   ' before it goes out of scope, the caller's array variable must be destroyed with
   ' the 'FreeImage_DestroyLockedArrayFIRGBF' function.

   eImageType = FreeImage_GetImageType(Bitmap)
   If (eImageType = FIT_RGBF) Then
      
      ' create a proper SAVEARRAY descriptor
      With tSA
         .cbElements = 12                          ' size in bytes per array element
         .cDims = 1                                ' the array has only 1 dimension
         .cElements = FreeImage_GetWidth(Bitmap)   ' the number of elements in the array
         .fFeatures = FADF_AUTO Or FADF_FIXEDSIZE  ' need AUTO and FIXEDSIZE for safety issues,
                                                   ' so the array can not be modified in size
                                                   ' or erased; according to Matthew Curland never
                                                   ' use FIXEDSIZE alone
         .pvData = FreeImage_GetScanline(Bitmap, _
                                         Scanline) ' let the array point to the memory block, the
                                                   ' FreeImage scanline data pointer points to
      End With
      
      ' For a complete source code documentation have a
      ' look at the function 'FreeImage_GetScanLineEx'
      Call SafeArrayAllocDescriptor(1, lpSA)
      Call CopyMemory(ByVal lpSA, tSA, Len(tSA))
      Call CopyMemory(ByVal VarPtrArray(FreeImage_GetScanLineRGBF), lpSA, 4)
   End If

End Function

Public Function FreeImage_GetScanLineRGBAF(ByVal Bitmap As Long, _
                                           ByVal Scanline As Long) As FIRGBAF()

Dim tSA As SAVEARRAY1D
Dim lpSA As Long
Dim eImageType As FREE_IMAGE_TYPE

   ' This function returns a one dimensional FIRGBAF array containing a whole
   ' scanline's data-bits of a FIT_RGBAF image. This is done by wrapping
   ' a true VB array around the memory block the returned pointer of
   ' 'FreeImage_GetScanline' is pointing to. So, the array returned  provides
   ' full read and write acces to the image's data.
   
   ' The function includes checking of the image's bit depth and type and
   ' returns a non-initialized array if 'Bitmap' is an image of improper type.

   ' To reuse the caller's array variable, this function's result was assigned to,
   ' before it goes out of scope, the caller's array variable must be destroyed with
   ' the 'FreeImage_DestroyLockedArrayFIRGBAF' function.

   eImageType = FreeImage_GetImageType(Bitmap)
   If (eImageType = FIT_RGBAF) Then
      
      ' create a proper SAVEARRAY descriptor
      With tSA
         .cbElements = 12                          ' size in bytes per array element
         .cDims = 1                                ' the array has only 1 dimension
         .cElements = FreeImage_GetWidth(Bitmap)   ' the number of elements in the array
         .fFeatures = FADF_AUTO Or FADF_FIXEDSIZE  ' need AUTO and FIXEDSIZE for safety issues,
                                                   ' so the array can not be modified in size
                                                   ' or erased; according to Matthew Curland never
                                                   ' use FIXEDSIZE alone
         .pvData = FreeImage_GetScanline(Bitmap, _
                                         Scanline) ' let the array point to the memory block, the
                                                   ' FreeImage scanline data pointer points to
      End With
      
      ' For a complete source code documentation have a
      ' look at the function 'FreeImage_GetScanLineEx'
      Call SafeArrayAllocDescriptor(1, lpSA)
      Call CopyMemory(ByVal lpSA, tSA, Len(tSA))
      Call CopyMemory(ByVal VarPtrArray(FreeImage_GetScanLineRGBAF), lpSA, 4)
   End If

End Function

'--------------------------------------------------------------------------------
' HBITMAP conversion functions
'--------------------------------------------------------------------------------

Public Function FreeImage_GetBitmap(ByVal Bitmap As Long, _
                           Optional ByVal hDC As Long, _
                           Optional ByVal UnloadSource As Boolean) As Long
                               
Dim bReleaseDC As Boolean
Dim ppvBits As Long
   
   ' This function returns an HBITMAP created by the CreateDIBSection() function which
   ' in turn has the same color depth as the original DIB. A reference DC may be provided
   ' through the 'hDC' parameter. The desktop DC will be used, if no reference DC is
   ' specified.

   If (Bitmap) Then
   
      If (Not FreeImage_HasPixels(Bitmap)) Then
         Call Err.Raise(5, "MFreeImage", Error$(5) & vbCrLf & vbCrLf & _
                        "Unable to create a bitmap from a 'header-only' bitmap.")
      End If
   
      If (hDC = 0) Then
         hDC = GetDC(0)
         bReleaseDC = True
      End If
      If (hDC) Then
         FreeImage_GetBitmap = CreateDIBSection(hDC, FreeImage_GetInfo(Bitmap), _
               DIB_RGB_COLORS, ppvBits, 0, 0)
         If ((FreeImage_GetBitmap <> 0) And (ppvBits <> 0)) Then
            Call CopyMemory(ByVal ppvBits, ByVal FreeImage_GetBits(Bitmap), _
                  FreeImage_GetHeight(Bitmap) * FreeImage_GetPitch(Bitmap))
         End If
         If (UnloadSource) Then
            Call FreeImage_Unload(Bitmap)
         End If
         If (bReleaseDC) Then
            Call ReleaseDC(0, hDC)
         End If
      End If
   End If

End Function

Public Function FreeImage_GetBitmapForDevice(ByVal Bitmap As Long, _
                                    Optional ByVal hDC As Long, _
                                    Optional ByVal UnloadSource As Boolean) As Long
                                    
Dim bReleaseDC As Boolean

   ' This function returns an HBITMAP created by the CreateDIBitmap() function which
   ' in turn has always the same color depth as the reference DC, which may be provided
   ' through the 'hDC' parameter. The desktop DC will be used, if no reference DC is
   ' specified.
                              
   If (Bitmap) Then
   
      If (Not FreeImage_HasPixels(Bitmap)) Then
         Call Err.Raise(5, "MFreeImage", Error$(5) & vbCrLf & vbCrLf & _
                        "Unable to create a bitmap from a 'header-only' bitmap.")
      End If
   
      If (hDC = 0) Then
         hDC = GetDC(0)
         bReleaseDC = True
      End If
      If (hDC) Then
         FreeImage_GetBitmapForDevice = _
               CreateDIBitmap(hDC, FreeImage_GetInfoHeader(Bitmap), CBM_INIT, _
                     FreeImage_GetBits(Bitmap), FreeImage_GetInfo(Bitmap), _
                           DIB_RGB_COLORS)
         If (UnloadSource) Then
            Call FreeImage_Unload(Bitmap)
         End If
         If (bReleaseDC) Then
            Call ReleaseDC(0, hDC)
         End If
      End If
   End If

End Function

'--------------------------------------------------------------------------------
' OlePicture conversion functions
'--------------------------------------------------------------------------------

Public Function FreeImage_GetOlePicture(ByVal Bitmap As Long, _
                               Optional ByVal hDC As Long, _
                               Optional ByVal UnloadSource As Boolean) As IPicture

Dim hBitmap As Long
Dim tPicDesc As PictDesc
Dim tGuid As Guid
Dim cPictureDisp As IPictureDisp

   ' This function creates a VB Picture object (OlePicture) from a FreeImage DIB.
   ' The original image need not remain valid nor loaded after the VB Picture
   ' object has been created.
   
   ' The optional parameter 'hDC' determines the device context (DC) used for
   ' transforming the device independent bitmap (DIB) to a device dependent
   ' bitmap (DDB). This device context's color depth is responsible for this
   ' transformation. This parameter may be null or omitted. In that case, the
   ' windows desktop's device context will be used, what will be the desired
   ' way in almost any cases.
   
   ' The optional 'UnloadSource' parameter is for unloading the original image
   ' after the OlePicture has been created, so you can easily "switch" from a
   ' FreeImage DIB to a VB Picture object. There is no need to unload the DIB
   ' at the caller's site if this argument is True.
   
   If (Bitmap) Then
   
      If (Not FreeImage_HasPixels(Bitmap)) Then
         Call Err.Raise(5, "MFreeImage", Error$(5) & vbCrLf & vbCrLf & _
                        "Unable to create a picture from a 'header-only' bitmap.")
      End If
   
      hBitmap = FreeImage_GetBitmapForDevice(Bitmap, hDC, UnloadSource)
      If (hBitmap) Then
         ' fill tPictDesc structure with necessary parts
         With tPicDesc
            .cbSizeofStruct = Len(tPicDesc)
            ' the vbPicTypeBitmap constant is not available in VBA environemnts
            .picType = 1  'vbPicTypeBitmap
            .hImage = hBitmap
         End With
   
         ' fill in IDispatch Interface ID
         With tGuid
            .Data1 = &H20400
            .Data4(0) = &HC0
            .Data4(7) = &H46
         End With
   
         ' create a picture object
         Call OleCreatePictureIndirect(tPicDesc, tGuid, True, cPictureDisp)
         Set FreeImage_GetOlePicture = cPictureDisp
      End If
   End If

End Function

Public Function FreeImage_GetOlePictureIcon(ByVal hIcon As Long) As IPicture

Dim tPicDesc As PictDesc
Dim tGuid As Guid
Dim cPictureDisp As IPictureDisp

   ' This function creates a VB Picture object (OlePicture) of type picTypeIcon
   ' from FreeImage hIcon handle. The hIcon handle need not remain valid nor loaded
   ' after the VB Picture object has been created.
   
   ' The optional 'UnloadSource' parameter is for destroying the hIcon image
   ' after the OlePicture has been created, so you can easiely "switch" from a
   ' hIcon handle to a VB Picture object. There is no need to unload the hIcon
   ' at the caller's site if this argument is True.
   
   If (hIcon) Then
      ' fill tPictDesc structure with necessary parts
      With tPicDesc
         .cbSizeofStruct = 12
         ' the vbPicTypeIcon constant is not available in VBA environemnts
         .picType = 3  'vbPicTypeIcon
         .hImage = hIcon
      End With

      ' fill in IDispatch Interface ID
      With tGuid
         .Data1 = &H20400
         .Data4(0) = &HC0
         .Data4(7) = &H46
      End With
   
      ' create a picture object
      Call OleCreatePictureIndirect(tPicDesc, tGuid, True, cPictureDisp)
      Set FreeImage_GetOlePictureIcon = cPictureDisp
   End If

End Function

Public Function FreeImage_GetOlePictureThumbnail(ByVal Bitmap As Long, _
                                                 ByVal MaxPixelSize As Long, _
                                        Optional ByVal hDC As Long, _
                                        Optional ByVal UnloadSource As Boolean) As IPicture

Dim hDIBThumbnail As Long

   ' This function is a IOlePicture aware wrapper for FreeImage_MakeThumbnail(). It
   ' returns a VB Picture object instead of a FreeImage DIB.
   
   ' The optional 'UnloadSource' parameter is for unloading the original image
   ' after the OlePicture has been created, so you can easiely "switch" from a
   ' FreeImage DIB to a VB Picture object. There is no need to clean up the DIB
   ' at the caller's site.

   If (Bitmap) Then
      
      If (Not FreeImage_HasPixels(Bitmap)) Then
         Call Err.Raise(5, "MFreeImage", Error$(5) & vbCrLf & vbCrLf & _
                        "Unable to create a thumbnail picture from a 'header-only' bitmap.")
      End If
      
      hDIBThumbnail = FreeImage_MakeThumbnail(Bitmap, MaxPixelSize)
      Set FreeImage_GetOlePictureThumbnail = FreeImage_GetOlePicture(hDIBThumbnail, hDC, True)
      
      If (UnloadSource) Then
         Call FreeImage_Unload(Bitmap)
      End If
   End If
                                                                 
End Function

Public Function FreeImage_CreateFromOlePicture(ByRef Picture As IPicture) As Long

Dim hBitmap As Long
Dim tBM As BITMAP_API
Dim hDIB As Long
Dim hDC As Long
Dim lResult As Long
Dim nColors As Long
Dim lpInfo As Long

   ' Creates a FreeImage DIB from a VB Picture object (OlePicture). This function
   ' returns a pointer to the DIB as, for instance, the FreeImage function
   ' 'FreeImage_Load' does. So, this could be a real replacement for 'FreeImage_Load'
   ' when working with VB Picture objects.

   If (Not Picture Is Nothing) Then
      hBitmap = Picture.Handle
      If (hBitmap) Then
         lResult = GetObjectAPI(hBitmap, Len(tBM), tBM)
         If (lResult) Then
            hDIB = FreeImage_Allocate(tBM.bmWidth, _
                                      tBM.bmHeight, _
                                      tBM.bmBitsPixel)
            If (hDIB) Then
               ' The GetDIBits function clears the biClrUsed and biClrImportant BITMAPINFO
               ' members (dont't know why). So we save these infos below.
               ' This is needed for palletized images only.
               nColors = FreeImage_GetColorsUsed(hDIB)
            
               hDC = GetDC(0)
               lResult = GetDIBits(hDC, hBitmap, 0, _
                                   FreeImage_GetHeight(hDIB), _
                                   FreeImage_GetBits(hDIB), _
                                   FreeImage_GetInfo(hDIB), _
                                   DIB_RGB_COLORS)
               If (lResult) Then
                  FreeImage_CreateFromOlePicture = hDIB
                  If (nColors) Then
                     ' restore BITMAPINFO members
                     ' FreeImage_GetInfo(Bitmap)->biClrUsed = nColors;
                     ' FreeImage_GetInfo(Bitmap)->biClrImportant = nColors;
                     lpInfo = FreeImage_GetInfo(hDIB)
                     Call CopyMemory(ByVal lpInfo + 32, nColors, 4)
                     Call CopyMemory(ByVal lpInfo + 36, nColors, 4)
                  End If
               Else
                  Call FreeImage_Unload(hDIB)
               End If
               Call ReleaseDC(0, hDC)
            End If
         End If
      End If
   End If

End Function

Public Function FreeImage_CreateFromDC(ByVal hDC As Long, _
                              Optional ByRef hBitmap As Long) As Long

Dim tBM As BITMAP_API
Dim hDIB As Long
Dim lResult As Long
Dim nColors As Long
Dim lpInfo As Long

   ' Creates a FreeImage DIB from a Device Context/Compatible Bitmap. This
   ' function returns a pointer to the DIB as, for instance, 'FreeImage_Load()'
   ' does. So, this could be a real replacement for FreeImage_Load() or
   ' 'FreeImage_CreateFromOlePicture()' when working with DCs and BITMAPs directly
   
   ' The 'hDC' parameter specifies a window device context (DC), the optional
   ' parameter 'hBitmap' may specify a handle to a memory bitmap. When 'hBitmap' is
   ' omitted, the bitmap currently selected into the given DC is used to create
   ' the DIB.
   
   ' When 'hBitmap' is not missing but NULL (0), the function uses the DC's currently
   ' selected bitmap. This bitmap's handle is stored in the ('ByRef'!) 'hBitmap' parameter
   ' and so, is avaliable at the caller's site when the function returns.
   
   ' The DIB returned by this function is a copy of the image specified by 'hBitmap' or
   ' the DC's current bitmap when 'hBitmap' is missing. The 'hDC' and also the 'hBitmap'
   ' remain untouched in this function, there will be no objects destroyed or freed.
   ' The caller is responsible to destroy or free the DC and BITMAP if necessary.
   
   ' first, check whether we got a hBitmap or not
   If (hBitmap = 0) Then
      ' if not, the parameter may be missing or is NULL so get the
      ' DC's current bitmap
      hBitmap = GetCurrentObject(hDC, OBJ_BITMAP)
   End If

   lResult = GetObjectAPI(hBitmap, Len(tBM), tBM)
   If (lResult) Then
      hDIB = FreeImage_Allocate(tBM.bmWidth, _
                                tBM.bmHeight, _
                                tBM.bmBitsPixel)
      If (hDIB) Then
         ' The GetDIBits function clears the biClrUsed and biClrImportant BITMAPINFO
         ' members (dont't know why). So we save these infos below.
         ' This is needed for palletized images only.
         nColors = FreeImage_GetColorsUsed(hDIB)
         
         lResult = GetDIBits(hDC, hBitmap, 0, _
                             FreeImage_GetHeight(hDIB), _
                             FreeImage_GetBits(hDIB), _
                             FreeImage_GetInfo(hDIB), _
                             DIB_RGB_COLORS)
                             
         If (lResult) Then
            FreeImage_CreateFromDC = hDIB
            If (nColors) Then
               ' restore BITMAPINFO members
               ' FreeImage_GetInfo(Bitmap)->biClrUsed = nColors;
               ' FreeImage_GetInfo(Bitmap)->biClrImportant = nColors;
               lpInfo = FreeImage_GetInfo(hDIB)
               Call CopyMemory(ByVal lpInfo + 32, nColors, 4)
               Call CopyMemory(ByVal lpInfo + 36, nColors, 4)
            End If
         Else
            Call FreeImage_Unload(hDIB)
         End If
      End If
   End If

End Function

Public Function FreeImage_CreateFromImageContainer(ByRef Container As Object, _
                                          Optional ByVal IncludeDrawings As Boolean) As Long

   ' Creates a FreeImage DIB from a VB container control that has at least a
   ' 'Picture' property. This function returns a pointer to the DIB as, for
   ' instance, 'FreeImage_Load()' does. So, this could be a real replacement for
   ' FreeImage_Load() or 'FreeImage_CreateFromOlePicture()' when working with
   ' image hosting controls like Forms or PictureBoxes.
   
   ' The 'IncludeDrawings' parameter controls whether drawings, drawn with VB
   ' methods like 'Container.Print()', 'Container.Line(x1, y1)-(x2, y2)' or
   ' 'Container.Circle(x, y), radius' as the controls 'BackColor' should be included
   ' into the newly created DIB. However, this only works, with control's that
   ' have their 'AutoRedraw' property set to 'True'.
   
   ' To get the control's picture as well as it's BackColor and custom drawings,
   ' this function uses the control's 'Image' property instead of the 'Picture'
   ' property.
   
   ' This function treats Forms and PictureBox controls explicitly, since the
   ' property sets and behaviours of these controls are publicly known. For any
   ' other control, the function checks for the existence of an 'Image' and
   ' 'AutoRedraw' property. If these are present and 'IncludeDrawings' is 'True',
   ' the function uses the control's 'Image' property instead of the 'Picture'
   ' property. This my be the case for UserControls. In any other case, the function
   ' uses the control's 'Picture' property if present. If none of these properties
   ' is present, a runtime error (5) is generated.
   
   ' Most of this function is actually implemented in the wrapper's private helper
   ' function 'pGetIOlePictureFromContainer'.

   If (Not Container Is Nothing) Then
      FreeImage_CreateFromImageContainer = FreeImage_CreateFromOlePicture( _
                            pGetIOlePictureFromContainer(Container, _
                                                         IncludeDrawings))
   End If

End Function

Public Function FreeImage_CreateFromScreen(Optional ByVal hWnd As Long, _
                                           Optional ByVal ClientAreaOnly As Boolean) As Long

Dim hDC As Long
Dim lWidth As Long
Dim lHeight As Long
Dim hMemDC As Long
Dim hMemBMP As Long
Dim hMemOldBMP As Long
Dim tR As RECT

   ' Creates a FreeImage DIB from the screen which may either be the whole
   ' desktop/screen or a certain window. A certain window may be specified
   ' by it's window handle through the 'hWnd' parameter. By omitting this
   ' parameter, the whole screen/desktop window will be captured.

   If (hWnd = 0) Then
      hWnd = GetDesktopWindow()
      hDC = GetDCEx(hWnd, 0, 0)
      ' get desktop's width and height
      lWidth = GetDeviceCaps(hDC, HORZRES)
      lHeight = GetDeviceCaps(hDC, VERTRES)
   
   ElseIf (ClientAreaOnly) Then
      ' get window's client area DC
      hDC = GetDCEx(hWnd, 0, 0)
      Call GetClientRect(hWnd, tR)
      lWidth = tR.Right
      lHeight = tR.Bottom
      
   Else
      ' get window DC
      hDC = GetDCEx(hWnd, 0, DCX_WINDOW)
      Call GetWindowRect(hWnd, tR)
      lWidth = tR.Right - tR.Left
      lHeight = tR.Bottom - tR.Top

   End If
   
   ' create compatible memory DC and bitmap
   hMemDC = CreateCompatibleDC(hDC)
   hMemBMP = CreateCompatibleBitmap(hDC, lWidth, lHeight)
   ' select compatible bitmap
   hMemOldBMP = SelectObject(hMemDC, hMemBMP)
   ' blit bits
   Call BitBlt(hMemDC, 0, 0, lWidth, lHeight, hDC, 0, 0, SRCCOPY Or CAPTUREBLT)
   
   ' create FreeImage Bitmap from memory DC
   FreeImage_CreateFromScreen = FreeImage_CreateFromDC(hMemDC, hMemBMP)
   
   ' clean up
   Call SelectObject(hMemDC, hMemOldBMP)
   Call DeleteObject(hMemBMP)
   Call DeleteDC(hMemDC)
   Call ReleaseDC(hWnd, hDC)

End Function

'--------------------------------------------------------------------------------
' Microsoft Office / VBA PictureData supporting functions
'--------------------------------------------------------------------------------

Public Function FreeImage_GetPictureData(ByVal Bitmap As Long, _
                                Optional ByVal UnloadSource As Boolean) As Byte()

Const SIZE_OF_LONG = 4
Const SIZE_OF_BITMAPINFOHEADER = 40

Dim abResult() As Byte
Dim lHeaderSize As Long
Dim lPaletteSize As Long
Dim lImageSize As Long
Dim lpInfo As Long
Dim lOffset As Long

   ' This function creates an Office PictureData Byte array from a FreeImage DIB.
   ' The original image must not remain valid nor loaded after the PictureData
   ' array has been created.
   
   ' The optional 'UnloadSource' parameter is for unloading the original image
   ' after the PictureData Byte array has been created, so you can easily "switch"
   ' from a FreeImage DIB to an Office PictureData Byte array. There is no need to
   ' unload the DIB at the caller's site if this argument is True.
   
   If (Bitmap) Then
   
      If (Not FreeImage_HasPixels(Bitmap)) Then
         Call Err.Raise(5, "MFreeImage", Error$(5) & vbCrLf & vbCrLf & _
                        "Unable to create a PictureData array from a 'header-only' bitmap.")
      End If
      
      If (FreeImage_HasRGBMasks(Bitmap)) Then
         lHeaderSize = 3 * SIZE_OF_LONG
      End If
      lHeaderSize = lHeaderSize + SIZE_OF_BITMAPINFOHEADER
      lImageSize = FreeImage_GetHeight(Bitmap) * FreeImage_GetPitch(Bitmap)
      lPaletteSize = FreeImage_GetColorsUsed(Bitmap) * 4
      
      ReDim abResult(lHeaderSize + lPaletteSize + lImageSize - 1)
      
      ' Copy the BITMAPINFOHEADER into the result array.
      lpInfo = FreeImage_GetInfo(Bitmap)
      Call CopyMemory(abResult(0), ByVal lpInfo, lHeaderSize)
      lOffset = lOffset + lHeaderSize
      
      If (lPaletteSize > 0) Then
         ' Copy the image's palette (if any) into the result array.
         Call CopyMemory(abResult(lOffset), ByVal FreeImage_GetPalette(Bitmap), lPaletteSize)
         lOffset = lOffset + lPaletteSize
      End If
      
      ' Copy the image's bits into the result array.
      Call CopyMemory(abResult(lOffset), ByVal FreeImage_GetBits(Bitmap), lImageSize)
      
      Call pSwap(ByVal VarPtrArray(abResult), ByVal VarPtrArray(FreeImage_GetPictureData))
      
      If (UnloadSource) Then
         Call FreeImage_Unload(Bitmap)
      End If
   End If

End Function

Public Function FreeImage_CreateFromPictureData(ByRef PictureData() As Byte) As Long

Dim tBMIH As BITMAPINFOHEADER
Dim lLength As Long
Dim hDIB As Long
Dim lPaletteSize As Long
Dim lOffset As Long
Dim alMasks() As Long

   ' Creates a FreeImage DIB from an Office PictureData Byte array. This function
   ' returns a pointer to the DIB as, for instance, the FreeImage function
   ' 'FreeImage_Load' does. So, this could be a real replacement for 'FreeImage_Load'
   ' when working with PictureData arrays.

   lLength = UBound(PictureData) + 1
   If (lLength > Len(tBMIH)) Then
      Call CopyMemory(tBMIH, PictureData(0), Len(tBMIH))
      With tBMIH
         If (.biSize = 40) Then
            lOffset = 40
            Select Case .biBitCount
            
            Case 0
            
            Case 1, 4, 8
               If (.biClrUsed = 0) Then
                  lPaletteSize = 2 ^ .biBitCount * 4
               Else
                  lPaletteSize = .biClrUsed * 4
               End If
               hDIB = FreeImage_Allocate(.biWidth, .biHeight, .biBitCount)
               Call CopyMemory(ByVal FreeImage_GetPalette(hDIB), _
                        PictureData(lOffset), lPaletteSize)
               lOffset = lOffset + lPaletteSize
            
            Case 16
               If (.biCompression = BI_BITFIELDS) Then
                  ReDim alMasks(2)
                  Call CopyMemory(alMasks(0), PictureData(lOffset), 12)
                  lOffset = lOffset + 12
                  hDIB = FreeImage_Allocate(.biWidth, .biHeight, .biBitCount, _
                        alMasks(0), alMasks(1), alMasks(2))
               Else
                  hDIB = FreeImage_Allocate(.biWidth, .biHeight, .biBitCount, _
                        FI16_555_RED_MASK, FI16_555_GREEN_MASK, FI16_555_BLUE_MASK)
               End If
            
            Case 24, 32
               hDIB = FreeImage_Allocate(.biWidth, .biHeight, .biBitCount)
               
            End Select
            
            If (hDIB) Then
               Call CopyMemory(ByVal FreeImage_GetBits(hDIB), _
                     PictureData(lOffset), lLength - lOffset)
               FreeImage_CreateFromPictureData = hDIB
            End If
         Else
            ' ERROR: invalid or unsupported PictureData array
         End If
      End With
   Else
      ' ERROR: invalid or unsupported PictureData array
   End If

End Function

Public Function FreeImage_CreateMask(ByVal hDIB As Long, _
                            Optional ByVal eMaskCreationOptions As FREE_IMAGE_MASK_CREATION_OPTION_FLAGS = MCOF_CREATE_MASK_IMAGE, _
                            Optional ByVal lBitDepth As Long = 1, _
                            Optional ByVal eMaskOptions As FREE_IMAGE_MASK_FLAGS = FIMF_MASK_FULL_TRANSPARENCY, _
                            Optional ByVal vntMaskColors As Variant, _
                            Optional ByVal eMaskColorsFormat As FREE_IMAGE_COLOR_FORMAT_FLAGS = FICFF_COLOR_RGB, _
                            Optional ByVal lColorTolerance As Long, _
                            Optional ByVal lciMaskColorDst As Long = vbWhite, _
                            Optional ByVal eMaskColorDstFormat As FREE_IMAGE_COLOR_FORMAT_FLAGS = FICFF_COLOR_RGB, _
                            Optional ByVal lciUnmaskColorDst As Long = vbBlack, _
                            Optional ByVal eUnmaskColorDstFormat As FREE_IMAGE_COLOR_FORMAT_FLAGS = FICFF_COLOR_RGB, _
                            Optional ByVal vlciMaskColorSrc As Variant, _
                            Optional ByVal eMaskColorSrcFormat As FREE_IMAGE_COLOR_FORMAT_FLAGS = FICFF_COLOR_RGB, _
                            Optional ByVal vlciUnmaskColorSrc As Variant, _
                            Optional ByVal eUnmaskColorSrcFormat As FREE_IMAGE_COLOR_FORMAT_FLAGS = FICFF_COLOR_RGB) As Long
                         
Dim hDIBResult As Long
Dim lBitDepthSrc As Long
Dim lWidth As Long
Dim lHeight As Long

Dim bMaskColors As Boolean
Dim bMaskTransparency As Boolean
Dim bMaskFullTransparency As Boolean
Dim bMaskAlphaTransparency As Boolean
Dim bInvertMask As Boolean
Dim bHaveMaskColorSrc As Boolean
Dim bHaveUnmaskColorSrc As Boolean
Dim bCreateMaskImage As Boolean
Dim bModifySourceImage As Boolean
Dim alcMaskColors() As Long
Dim lMaskColorsMaxIndex As Long

Dim lciMaskColorSrc As Long
Dim lciUnmaskColorSrc As Long

Dim alPaletteSrc() As Long
Dim abTransparencyTableSrc() As Byte
Dim abBitsBSrc() As Byte
Dim atBitsTSrc As ScanLinesRGBTRIBLE
Dim atBitsQSrc() As RGBQUAD
Dim abBitValues(7) As Byte
Dim abBitMasks(7) As Byte
Dim abBitShifts(7) As Byte

Dim atPaletteDst() As RGBQUAD
Dim abBitsBDst() As Byte
Dim atBitsTDst As ScanLinesRGBTRIBLE
Dim atBitsQDst() As RGBQUAD

Dim bMaskPixel As Boolean
Dim x As Long
Dim x2 As Long
Dim lPixelIndex As Long
Dim y As Long
Dim i As Long

   'TODO: comment this function
   
   ' check for a proper bit depth of the destination (mask) image
   If ((hDIB) And ((lBitDepth = 1) Or _
                   (lBitDepth = 4) Or _
                   (lBitDepth = 8) Or _
                   (lBitDepth = 24) Or _
                   (lBitDepth = 32))) Then
                   
      If (Not FreeImage_HasPixels(hDIB)) Then
         Call Err.Raise(5, "MFreeImage", Error$(5) & vbCrLf & vbCrLf & _
                        "Unable to create a mask image from a 'header-only' bitmap.")
      End If
                   
      ' check for a proper bit depth of the source image
      lBitDepthSrc = FreeImage_GetBPP(hDIB)
      If ((lBitDepthSrc = 4) Or _
          (lBitDepthSrc = 8) Or _
          (lBitDepthSrc = 24) Or _
          (lBitDepthSrc = 32)) Then
          
         
         ' get some information from eMaskCreationOptions
         bCreateMaskImage = (eMaskCreationOptions And MCOF_CREATE_MASK_IMAGE)
         bModifySourceImage = (eMaskCreationOptions And MCOF_MODIFY_SOURCE_IMAGE)
         
         
         If (bCreateMaskImage) Then
            
            ' check mask color format
            If (eMaskColorDstFormat And FICFF_COLOR_BGR) Then
               ' if mask color is in BGR format, convert to RGB format
               lciMaskColorDst = FreeImage_SwapColorLong(lciMaskColorDst)
            
            ElseIf (eMaskColorDstFormat And FICFF_COLOR_PALETTE_INDEX) Then
               ' if mask color is specified as palette index, check, whether the
               ' source image is a palletized image
               Select Case lBitDepthSrc
               
               Case 1
                  lciMaskColorDst = FreeImage_GetPaletteExLong(hDIB)(lciMaskColorDst And &H1)
               
               Case 4
                  lciMaskColorDst = FreeImage_GetPaletteExLong(hDIB)(lciMaskColorDst And &HF)
               
               Case 8
                  lciMaskColorDst = FreeImage_GetPaletteExLong(hDIB)(lciMaskColorDst And &HFF)

               End Select
            End If
            
            ' check unmask color format
            If (eUnmaskColorDstFormat And FICFF_COLOR_BGR) Then
               ' if unmask color is in BGR format, convert to RGB format
               lciUnmaskColorDst = FreeImage_SwapColorLong(lciUnmaskColorDst)
            
            ElseIf (eUnmaskColorDstFormat And FICFF_COLOR_PALETTE_INDEX) Then
               ' if unmask color is specified as palette index, check, whether the
               ' source image is a palletized image
               Select Case lBitDepthSrc
               
               Case 1
                  lciUnmaskColorDst = FreeImage_GetPaletteExLong(hDIB)(lciUnmaskColorDst And &H1)
               
               Case 4
                  lciUnmaskColorDst = FreeImage_GetPaletteExLong(hDIB)(lciUnmaskColorDst And &HF)
               
               Case 8
                  lciUnmaskColorDst = FreeImage_GetPaletteExLong(hDIB)(lciUnmaskColorDst And &HFF)

               End Select
            End If
         End If
         
         
         If (bModifySourceImage) Then
            
            ' check, whether source image can be modified
            bHaveMaskColorSrc = (Not IsMissing(vlciMaskColorSrc))
            bHaveUnmaskColorSrc = (Not IsMissing(vlciUnmaskColorSrc))
            
            Select Case lBitDepthSrc
      
            Case 4, 8
               If (bHaveMaskColorSrc) Then
                  
                  ' get mask color as Long
                  lciMaskColorSrc = vlciMaskColorSrc
                   
                  If (eMaskColorSrcFormat And FICFF_COLOR_PALETTE_INDEX) Then
                     If (lBitDepthSrc = 4) Then
                        lciMaskColorSrc = (lciMaskColorSrc And &HF)
                     Else
                        lciMaskColorSrc = (lciMaskColorSrc And &HFF)
                     End If
                  Else
                     If (eMaskColorSrcFormat And FICFF_COLOR_BGR) Then
                        lciMaskColorSrc = FreeImage_SwapColorLong(lciMaskColorSrc, True)
                     End If
                     lciMaskColorSrc = FreeImage_SearchPalette(hDIB, lciMaskColorSrc)
                     bHaveMaskColorSrc = (lciMaskColorSrc <> -1)
                  End If
               End If
               
               If (bHaveUnmaskColorSrc) Then
               
                  ' get unmask color as Long
                  lciUnmaskColorSrc = vlciUnmaskColorSrc
               
                  If (eUnmaskColorSrcFormat And FICFF_COLOR_PALETTE_INDEX) Then
                     If (lBitDepthSrc = 4) Then
                        lciUnmaskColorSrc = (lciUnmaskColorSrc And &HF)
                     Else
                        lciUnmaskColorSrc = (lciUnmaskColorSrc And &HFF)
                     End If
                  Else
                     If (eUnmaskColorSrcFormat And FICFF_COLOR_BGR) Then
                        lciUnmaskColorSrc = FreeImage_SwapColorLong(lciUnmaskColorSrc, True)
                     End If
                     lciUnmaskColorSrc = FreeImage_SearchPalette(hDIB, lciUnmaskColorSrc)
                     bHaveUnmaskColorSrc = (lciUnmaskColorSrc <> -1)
                  End If
               End If
                  
               ' check, if source image still can be modified in any way
               bModifySourceImage = (bHaveMaskColorSrc Or bHaveUnmaskColorSrc)
               
            Case 24, 32
               If (bHaveMaskColorSrc) Then
                  
                  ' get mask color as Long
                  lciMaskColorSrc = vlciMaskColorSrc
                  
                  If (eMaskColorSrcFormat And FICFF_COLOR_BGR) Then
                     lciMaskColorSrc = FreeImage_SwapColorLong(lciMaskColorSrc, (lBitDepthSrc = 24))
                  End If
               End If
               
               If (bHaveUnmaskColorSrc) Then
                  
                  ' get unmask color as Long
                  lciUnmaskColorSrc = vlciUnmaskColorSrc
                  
                  If (eUnmaskColorSrcFormat And FICFF_COLOR_BGR) Then
                     lciUnmaskColorSrc = FreeImage_SwapColorLong(lciUnmaskColorSrc, (lBitDepthSrc = 24))
                  End If
               End If
               
            End Select
            
         End If
         
          
         If ((bModifySourceImage) Or (bCreateMaskImage)) Then
         
            ' get some information from eMaskOptions
            
            ' check for inverse mask
            bInvertMask = (eMaskOptions And FIMF_MASK_INVERSE_MASK)
            
            ' check for mask colors
            bMaskColors = (eMaskOptions And FIMF_MASK_COLOR_TRANSPARENCY)
            bMaskColors = bMaskColors And (Not IsMissing(vntMaskColors))
            If (bMaskColors) Then
               ' validate specified mask colors; all mask colors are transferred to
               ' an internal array of type Long
               If (Not IsArray(vntMaskColors)) Then
                  ' color masking is only done when the single mask color is
                  ' a numeric (color) value
                  bMaskColors = IsNumeric(vntMaskColors)
                  If (bMaskColors) Then
                     ' this is not an array of mask colors but only a single
                     ' color; this is also transferred into an internal array
                     lMaskColorsMaxIndex = 0
                     ReDim alcMaskColors(lMaskColorsMaxIndex)
                     alcMaskColors(lMaskColorsMaxIndex) = vntMaskColors
                  End If
               Else
                  ' transfer all valid color values (numeric) into an internal
                  ' array
                  ReDim alcMaskColors(UBound(vntMaskColors))
                  For i = LBound(vntMaskColors) To UBound(vntMaskColors)
                     bMaskColors = (IsNumeric(vntMaskColors(i)))
                     If (Not bMaskColors) Then
                        Exit For
                     Else
                        alcMaskColors(lMaskColorsMaxIndex) = vntMaskColors(i)
                        lMaskColorsMaxIndex = lMaskColorsMaxIndex + 1
                     End If
                  Next i
                  If (bMaskColors) Then
                     lMaskColorsMaxIndex = lMaskColorsMaxIndex - 1
                  End If
               End If
            End If
            
            ' check for transparency options
            If ((FreeImage_IsTransparent(hDIB)) Or _
                ((eMaskOptions And FIMF_MASK_FORCE_TRANSPARENCY) > 0)) Then
               bMaskFullTransparency = (eMaskOptions And FIMF_MASK_FULL_TRANSPARENCY)
               bMaskAlphaTransparency = (eMaskOptions And FIMF_MASK_ALPHA_TRANSPARENCY)
               bMaskTransparency = (bMaskFullTransparency Or bMaskAlphaTransparency)
            End If
            
            ' get image dimension
            lWidth = FreeImage_GetWidth(hDIB)
            lHeight = FreeImage_GetHeight(hDIB)
            
            ' create proper accessors for the source image
            Select Case lBitDepthSrc
            
            Case 4, 8
               ' images with a bit depth of 4 or 8 bits will both be
               ' read through a byte array
               abBitsBSrc = FreeImage_GetBitsEx(hDIB)
               ' depending on where to get the transparency information from,
               ' a palette or a transpareny table will be needed
               If (bMaskColors) Then
                  alPaletteSrc = FreeImage_GetPaletteExLong(hDIB)
               End If
               If (bMaskTransparency) Then
                  abTransparencyTableSrc = FreeImage_GetTransparencyTableExClone(hDIB)
               End If
               
               ' for 4 bit source images
               If (lBitDepthSrc = 4) Then
                  ' two additional arrays need to be filled with values
                  ' to mask and shift nibbles to bytes
                  ' index 0 stands for the high nibble of the byte
                  abBitMasks(0) = &HF0
                  abBitShifts(0) = &H10 ' a shift to right is implemented
                                        ' as division in VB
                  ' index 1 stands for the low nibble of the byte
                  abBitMasks(1) = &HF
                  abBitShifts(1) = &H1 ' no shift needed for low nibble
               End If
               
            Case 24
               ' images with a depth of 24 bits could not be used
               ' through a two dimensional array in most cases, so get
               ' an array of individual scanlines (see remarks concerning
               ' pitch at function 'FreeImage_GetBitsExRGBTriple()')
               Call FreeImage_GetScanLinesRGBTRIPLE(hDIB, atBitsTSrc)
            
            Case 32
               atBitsQSrc = FreeImage_GetBitsExRGBQUAD(hDIB)
            
            End Select
      
      
            ' create mask image if needed
            If (bCreateMaskImage) Then
               
               ' create mask image
               hDIBResult = FreeImage_Allocate(lWidth, lHeight, lBitDepth)
               ' if destination bit depth is 8 or below, a proper palette will
               ' be needed, so create a palette where the unmask color is at
               ' index 0 and the mask color is at index 1
               If (lBitDepth <= 8) Then
                  atPaletteDst = FreeImage_GetPaletteEx(hDIBResult)
                  Call CopyMemory(atPaletteDst(0), lciUnmaskColorDst, 4)
                  Call CopyMemory(atPaletteDst(1), lciMaskColorDst, 4)
               End If
               
               ' create proper accessors for the new mask image
               Select Case lBitDepth
               
               Case 1
                  abBitsBDst = FreeImage_GetBitsEx(hDIBResult)
                  x = 1
                  For i = 7 To 0 Step -1
                     abBitValues(i) = x
                     x = x * 2
                  Next i
               
               Case 4
                  abBitsBDst = FreeImage_GetBitsEx(hDIBResult)
                  abBitValues(0) = &H10
                  abBitValues(1) = &H1
                  
               Case 8
                  abBitsBDst = FreeImage_GetBitsEx(hDIBResult)
                  
               Case 24
                  ' images with a depth of 24 bits could not be used
                  ' through a two dimensional array in most cases, so get
                  ' an array of individual scanlines (see remarks concerning
                  ' pitch at function 'FreeImage_GetBitsExRGBTriple()')
                  Call FreeImage_GetScanLinesRGBTRIPLE(hDIBResult, atBitsTDst)
               
               Case 32
                  atBitsQDst = FreeImage_GetBitsExRGBQUAD(hDIBResult)
               
               End Select
            End If
        
            ' walk the hole image
            For y = 0 To lHeight - 1
               For x = 0 To lWidth - 1
                  
                  ' should transparency information be considered to create
                  ' the mask?
                  If (bMaskTransparency) Then
                     
                     Select Case lBitDepthSrc
                     
                     Case 4
                        x2 = x \ 2
                        lPixelIndex = (abBitsBSrc(x2, y) And abBitMasks(x Mod 2)) \ abBitShifts(x Mod 2)
                        bMaskPixel = (abTransparencyTableSrc(lPixelIndex) = 0)
                        If (Not bMaskPixel) Then
                           bMaskPixel = ((abTransparencyTableSrc(lPixelIndex) < 255) And _
                                         (bMaskAlphaTransparency))
                        End If
                     
                     Case 8
                        bMaskPixel = (abTransparencyTableSrc(abBitsBSrc(x, y)) = 0)
                        If (Not bMaskPixel) Then
                           bMaskPixel = ((abTransparencyTableSrc(abBitsBSrc(x, y)) < 255) And _
                                         (bMaskAlphaTransparency))
                        End If
                        
                     Case 24
                        ' no transparency information in 24 bit images
                        ' reset bMaskPixel
                        bMaskPixel = False
                     
                     Case 32
                        bMaskPixel = (atBitsQSrc(x, y).rgbReserved = 0)
                        If (Not bMaskPixel) Then
                           bMaskPixel = ((atBitsQSrc(x, y).rgbReserved < 255) And _
                                         (bMaskAlphaTransparency))
                        End If
                        
                     End Select
                  Else
                     ' clear 'bMaskPixel' if no transparency information was checked
                     ' since the flag might be still True from the last loop
                     bMaskPixel = False
                  End If
                  
                  ' should color information be considered to create the mask?
                  ' do this only if the current pixel is not yet part of the mask
                  If ((bMaskColors) And (Not bMaskPixel)) Then
                  
                     Select Case lBitDepthSrc
                     
                     Case 4
                        x2 = x \ 2
                        lPixelIndex = (abBitsBSrc(x2, y) And abBitMasks(x Mod 2)) \ abBitShifts(x Mod 2)
                        If (eMaskColorsFormat And FICFF_COLOR_PALETTE_INDEX) Then
                           For i = 0 To lMaskColorsMaxIndex
                              If (lColorTolerance = 0) Then
                                 bMaskPixel = (lPixelIndex = alcMaskColors(i))
                              Else
                                 bMaskPixel = (FreeImage_CompareColorsLongLong( _
                                                   alPaletteSrc(lPixelIndex), _
                                                   alPaletteSrc(alcMaskColors(i)), _
                                                   lColorTolerance, _
                                                   FICFF_COLOR_RGB, FICFF_COLOR_RGB) = 0)
                              End If
                              If (bMaskPixel) Then
                                 Exit For
                              End If
                           Next i
                        Else
                           For i = 0 To lMaskColorsMaxIndex
                              bMaskPixel = (FreeImage_CompareColorsLongLong( _
                                                alPaletteSrc(lPixelIndex), _
                                                alcMaskColors(i), lColorTolerance, _
                                                FICFF_COLOR_RGB, _
                                                (eMaskColorsFormat And FICFF_COLOR_FORMAT_ORDER_MASK)) = 0)
                              If (bMaskPixel) Then
                                 Exit For
                              End If
                           Next i
                        End If
                     
                     Case 8
                        If (eMaskColorsFormat And FICFF_COLOR_PALETTE_INDEX) Then
                           For i = 0 To lMaskColorsMaxIndex
                              If (lColorTolerance = 0) Then
                                 bMaskPixel = (abBitsBSrc(x, y) = alcMaskColors(i))
                              Else
                                 bMaskPixel = (FreeImage_CompareColorsLongLong( _
                                                   alPaletteSrc(abBitsBSrc(x, y)), _
                                                   alPaletteSrc(alcMaskColors(i)), _
                                                   lColorTolerance, _
                                                   FICFF_COLOR_RGB, FICFF_COLOR_RGB) = 0)
                              End If
                              If (bMaskPixel) Then
                                 Exit For
                              End If
                           Next i
                        Else
                           For i = 0 To lMaskColorsMaxIndex
                              bMaskPixel = (FreeImage_CompareColorsLongLong( _
                                                alPaletteSrc(abBitsBSrc(x, y)), _
                                                alcMaskColors(i), lColorTolerance, _
                                                FICFF_COLOR_RGB, _
                                                (eMaskColorsFormat And FICFF_COLOR_FORMAT_ORDER_MASK)) = 0)
                              If (bMaskPixel) Then
                                 Exit For
                              End If
                           Next i
                        End If
                        
                     Case 24
                        For i = 0 To lMaskColorsMaxIndex
                           bMaskPixel = (FreeImage_CompareColorsRGBTRIPLELong( _
                                             atBitsTSrc.Scanline(y).Data(x), _
                                             alcMaskColors(i), lColorTolerance, _
                                             (eMaskColorsFormat And FICFF_COLOR_FORMAT_ORDER_MASK)) = 0)
                           If (bMaskPixel) Then
                              Exit For
                           End If
                        Next i
                     
                     Case 32
                        For i = 0 To lMaskColorsMaxIndex
                           bMaskPixel = (FreeImage_CompareColorsRGBQUADLong( _
                                             atBitsQSrc(x, y), _
                                             alcMaskColors(i), lColorTolerance, _
                                             (eMaskColorsFormat And FICFF_COLOR_FORMAT_ORDER_MASK)) = 0)
                           If (bMaskPixel) Then
                              Exit For
                           End If
                        Next i
                        
                     End Select
                  
                  End If
                  
                  ' check whether a mask image needs to be created
                  If (bCreateMaskImage) Then
                     
                     ' write current pixel to destination (mask) image
                     Select Case lBitDepth
                     
                     Case 1
                        x2 = x \ 8
                        If ((bMaskPixel) Xor (bInvertMask)) Then
                           abBitsBDst(x2, y) = abBitsBDst(x2, y) Or abBitValues(x Mod 8)
                        End If
                        
                     Case 4
                        x2 = x \ 2
                        If ((bMaskPixel) Xor (bInvertMask)) Then
                           abBitsBDst(x2, y) = abBitsBDst(x2, y) Or abBitValues(x Mod 2)
                        End If
                        
                     Case 8
                        If ((bMaskPixel) Xor (bInvertMask)) Then
                           abBitsBDst(x, y) = 1
                        End If
                        
                     Case 24
                        If ((bMaskPixel) Xor (bInvertMask)) Then
                           Call CopyMemory(atBitsTDst.Scanline(y).Data(x), lciMaskColorDst, 3)
                        Else
                           Call CopyMemory(atBitsTDst.Scanline(y).Data(x), lciUnmaskColorDst, 3)
                        End If
                        
                     Case 32
                        If ((bMaskPixel) Xor (bInvertMask)) Then
                           Call CopyMemory(atBitsQDst(x, y), lciMaskColorDst, 4)
                        Else
                           Call CopyMemory(atBitsQDst(x, y), lciUnmaskColorDst, 4)
                        End If
                     
                     End Select
                  End If
                  
                  ' check whether a source image needs to be modified
                  If (bModifySourceImage) Then
                     
                     Select Case lBitDepthSrc
                     
                     Case 4
                        x2 = x \ 2
                        If ((bMaskPixel) Xor (bInvertMask)) Then
                           If (bHaveMaskColorSrc) Then
                              abBitsBSrc(x2, y) = _
                                  (abBitsBSrc(x2, y) And (Not abBitMasks(x Mod 2))) Or _
                                            (lciMaskColorSrc * abBitShifts(x Mod 2))
                            End If
                        ElseIf (bHaveUnmaskColorSrc) Then
                           abBitsBSrc(x2, y) = _
                               (abBitsBSrc(x2, y) And (Not abBitMasks(x Mod 2))) Or _
                                         (lciUnmaskColorSrc * abBitShifts(x Mod 2))
                        End If
                     
                     Case 8
                        If ((bMaskPixel) Xor (bInvertMask)) Then
                           If (bHaveMaskColorSrc) Then
                              abBitsBSrc(x, y) = lciMaskColorSrc
                           End If
                        ElseIf (bHaveUnmaskColorSrc) Then
                           abBitsBSrc(x, y) = lciUnmaskColorSrc
                        End If
                        
                     Case 24
                        If ((bMaskPixel) Xor (bInvertMask)) Then
                           If (bHaveMaskColorSrc) Then
                              Call CopyMemory(atBitsTSrc.Scanline(y).Data(x), lciMaskColorSrc, 3)
                           End If
                        ElseIf (bHaveUnmaskColorSrc) Then
                           Call CopyMemory(atBitsTSrc.Scanline(y).Data(x), lciUnmaskColorSrc, 3)
                        End If
                     
                     Case 32
                        If ((bMaskPixel) Xor (bInvertMask)) Then
                           If (bHaveMaskColorSrc) Then
                              Call CopyMemory(atBitsQSrc(x, y), lciMaskColorSrc, 4)
                           End If
                        ElseIf (bHaveUnmaskColorSrc) Then
                           Call CopyMemory(atBitsQSrc(x, y), lciUnmaskColorSrc, 4)
                        End If
                        
                     End Select
                  End If
                  
               Next x
            Next y
         End If
      End If
   End If
   
   FreeImage_CreateMask = hDIBResult

End Function

Public Function FreeImage_CreateMaskImage(ByVal hDIB As Long, _
                                 Optional ByVal lBitDepth As Long = 1, _
                                 Optional ByVal eMaskOptions As FREE_IMAGE_MASK_FLAGS = FIMF_MASK_FULL_TRANSPARENCY, _
                                 Optional ByVal vntMaskColors As Variant, _
                                 Optional ByVal eMaskColorsFormat As FREE_IMAGE_COLOR_FORMAT_FLAGS = FICFF_COLOR_RGB, _
                                 Optional ByVal lColorTolerance As Long, _
                                 Optional ByVal lciMaskColor As Long = vbWhite, _
                                 Optional ByVal eMaskColorFormat As FREE_IMAGE_COLOR_FORMAT_FLAGS = FICFF_COLOR_RGB, _
                                 Optional ByVal lciUnmaskColor As Long = vbBlack, _
                                 Optional ByVal eUnmaskColorFormat As FREE_IMAGE_COLOR_FORMAT_FLAGS = FICFF_COLOR_RGB) As Long

   'TODO: comment this function
                                 
   FreeImage_CreateMaskImage = FreeImage_CreateMask(hDIB, MCOF_CREATE_MASK_IMAGE, _
                                                    lBitDepth, eMaskOptions, _
                                                    vntMaskColors, eMaskColorsFormat, _
                                                    lColorTolerance, _
                                                    lciMaskColor, eMaskColorFormat, _
                                                    lciUnmaskColor, eUnmaskColorFormat)

End Function

Public Function FreeImage_CreateSimpleBWMaskImage(ByVal hDIB As Long, _
                                         Optional ByVal lBitDepth As Long = 1, _
                                         Optional ByVal eMaskOptions As FREE_IMAGE_MASK_FLAGS = FIMF_MASK_FULL_TRANSPARENCY, _
                                         Optional ByVal vntMaskColors As Variant, _
                                         Optional ByVal eMaskColorsFormat As FREE_IMAGE_COLOR_FORMAT_FLAGS = FICFF_COLOR_RGB, _
                                         Optional ByVal lColorTolerance As Long) As Long

   'TODO: comment this function
   
   FreeImage_CreateSimpleBWMaskImage = FreeImage_CreateMask(hDIB, MCOF_CREATE_MASK_IMAGE, _
                                                            lBitDepth, eMaskOptions, _
                                                            vntMaskColors, eMaskColorsFormat, _
                                                            lColorTolerance, _
                                                            vbWhite, FICFF_COLOR_RGB, _
                                                            vbBlack, FICFF_COLOR_RGB)

End Function

Public Function FreeImage_CreateMaskInPlace(ByVal hDIB As Long, _
                                   Optional ByVal lBitDepth As Long = 1, _
                                   Optional ByVal eMaskOptions As FREE_IMAGE_MASK_FLAGS = FIMF_MASK_FULL_TRANSPARENCY, _
                                   Optional ByVal vntMaskColors As Variant, _
                                   Optional ByVal eMaskColorsFormat As FREE_IMAGE_COLOR_FORMAT_FLAGS = FICFF_COLOR_RGB, _
                                   Optional ByVal lColorTolerance As Long, _
                                   Optional ByVal vlciMaskColor As Variant, _
                                   Optional ByVal eMaskColorFormat As FREE_IMAGE_COLOR_FORMAT_FLAGS = FICFF_COLOR_RGB, _
                                   Optional ByVal vlciUnmaskColor As Variant, _
                                   Optional ByVal eUnmaskColorFormat As FREE_IMAGE_COLOR_FORMAT_FLAGS = FICFF_COLOR_RGB) As Long

   'TODO: comment this function
                                 
   FreeImage_CreateMaskInPlace = FreeImage_CreateMask(hDIB, MCOF_MODIFY_SOURCE_IMAGE, _
                                                      lBitDepth, eMaskOptions, _
                                                      vntMaskColors, eMaskColorsFormat, _
                                                      lColorTolerance, _
                                                      , , , , _
                                                      vlciMaskColor, eMaskColorFormat, _
                                                      vlciUnmaskColor, eUnmaskColorFormat)

End Function

Public Function FreeImage_CreateSimpleBWMaskInPlace(ByVal hDIB As Long, _
                                           Optional ByVal lBitDepth As Long = 1, _
                                           Optional ByVal eMaskOptions As FREE_IMAGE_MASK_FLAGS = FIMF_MASK_FULL_TRANSPARENCY, _
                                           Optional ByVal vntMaskColors As Variant, _
                                           Optional ByVal eMaskColorsFormat As FREE_IMAGE_COLOR_FORMAT_FLAGS = FICFF_COLOR_RGB, _
                                           Optional ByVal lColorTolerance As Long) As Long

   'TODO: comment this function
   
   FreeImage_CreateSimpleBWMaskInPlace = FreeImage_CreateMask(hDIB, MCOF_MODIFY_SOURCE_IMAGE, _
                                                              lBitDepth, eMaskOptions, _
                                                              vntMaskColors, eMaskColorsFormat, _
                                                              lColorTolerance, _
                                                              , , , , _
                                                              vbWhite, FICFF_COLOR_RGB, _
                                                              vbBlack, FICFF_COLOR_RGB)

End Function

Public Function FreeImage_CreateMaskColors(ParamArray MaskColors() As Variant) As Variant

   ' this is just a FreeImage signed function that emulates VB's
   ' builtin Array() function, that makes a variant array from
   ' a ParamArray; so, a caller of the FreeImage_CreateMask() function
   ' can specify all mask colors inline in the call statement
   
   ' hDibMask = FreeImage_CreateMask(hDib, 1, FIMF_MASK_COLOR_TRANSPARENCY, _
   '                                 FreeImage_CreateMaskColors(vbRed, vbGreen, vbBlack), _
   '                                 FICFF_COLOR_BGR, .... )
   
   ' keep in mind, that VB colors (vbRed, vbBlue, etc.) are OLE colors that have
   ' BRG format
   
   FreeImage_CreateMaskColors = MaskColors

End Function

Public Function FreeImage_SwapColorLong(ByVal Color As Long, _
                               Optional ByVal IgnoreAlpha As Boolean) As Long

   ' This function swaps both color components Red (R) and Blue (B) in either
   ' and RGB or BGR format color value stored in a Long value. This function is
   ' used to convert from a RGB to a BGR color value and vice versa.

   If (Not IgnoreAlpha) Then
      FreeImage_SwapColorLong = ((Color And &HFF000000) Or _
                                 ((Color And &HFF&) * &H10000) Or _
                                 (Color And &HFF00&) Or _
                                 ((Color And &HFF0000) \ &H10000))
   Else
      FreeImage_SwapColorLong = (((Color And &HFF&) * &H10000) Or _
                                 (Color And &HFF00&) Or _
                                 ((Color And &HFF0000) \ &H10000))
   End If

End Function

Public Function FreeImage_CompareColorsLongLong(ByVal ColorA As Long, _
                                                ByVal ColorB As Long, _
                                       Optional ByVal Tolerance As Long, _
                                       Optional ByVal ColorTypeA As FREE_IMAGE_COLOR_FORMAT_FLAGS = FICFF_COLOR_ARGB, _
                                       Optional ByVal ColorTypeB As FREE_IMAGE_COLOR_FORMAT_FLAGS = FICFF_COLOR_ARGB) As Long
                                   
Dim bFormatEqual As Boolean
Dim bAlphaEqual As Boolean

   ' This function compares two colors that both are specified as a 32 bit Long
   ' value.
   
   ' Use both parameters 'ColorTypeA' and 'ColorTypeB' to specify each color's
   ' format and 'Tolerance' to specify the matching tolerance.
   
   ' The function returns the result of the mathematical substraction
   ' ColorA - ColorB, so if both colors are equal, the function returns NULL (0)
   ' and any other value if both colors are different. Alpha transparency is taken into
   ' account only if both colors are said to have an alpha transparency component by
   ' both parameters 'ColorTypeA' and 'ColorTypeB'. If at least one of both colors
   ' has no alpha transparency component, the comparison only includes the bits for
   ' the red, green and blue component.
   
   ' The matching tolerance is applied to each color component (red, green, blue and
   ' alpha) separately. So, when 'Tolerance' contains a value greater than zero, the
   ' function returns NULL (0) when either both colors are exactly the same or the
   ' differences of each corresponding color components are smaller or equal than
   ' the given tolerance value.
   
   
   If (((ColorTypeA And FICFF_COLOR_PALETTE_INDEX) Or _
        (ColorTypeB And FICFF_COLOR_PALETTE_INDEX)) = 0) Then

      bFormatEqual = ((ColorTypeA And FICFF_COLOR_FORMAT_ORDER_MASK) = _
                                    (ColorTypeB And FICFF_COLOR_FORMAT_ORDER_MASK))
                                    
      bAlphaEqual = ((ColorTypeA And FICFF_COLOR_HAS_ALPHA) And _
                     (ColorTypeB And FICFF_COLOR_HAS_ALPHA))
      
      If (bFormatEqual) Then
         If (bAlphaEqual) Then
            FreeImage_CompareColorsLongLong = ColorA - ColorB
         Else
            FreeImage_CompareColorsLongLong = (ColorA And &HFFFFFF) - (ColorB And &HFFFFFF)
         End If
      Else
         If (bAlphaEqual) Then
            FreeImage_CompareColorsLongLong = ColorA - ((ColorB And &HFF000000) Or _
                                                          ((ColorB And &HFF&) * &H10000) Or _
                                                           (ColorB And &HFF00&) Or _
                                                          ((ColorB And &HFF0000) \ &H10000))
         Else
            FreeImage_CompareColorsLongLong = (ColorA And &HFFFFFF) - _
                                                         (((ColorB And &HFF&) * &H10000) Or _
                                                           (ColorB And &HFF00&) Or _
                                                          ((ColorB And &HFF0000) \ &H10000))
         End If
      End If
      
      If ((Tolerance > 0) And (FreeImage_CompareColorsLongLong <> 0)) Then
         If (bFormatEqual) Then
            If (Abs(((ColorA \ &H10000) And &HFF) - ((ColorB \ &H10000) And &HFF)) <= Tolerance) Then
               If (Abs(((ColorA \ &H100) And &HFF) - ((ColorB \ &H100) And &HFF)) <= Tolerance) Then
                  If (Abs((ColorA And &HFF) - (ColorB And &HFF)) <= Tolerance) Then
                     If (bAlphaEqual) Then
                        If (Abs(((ColorA \ &H1000000) And &HFF) - _
                                        ((ColorB \ &H1000000) And &HFF)) <= Tolerance) Then
                           FreeImage_CompareColorsLongLong = 0
                        End If
                     Else
                        FreeImage_CompareColorsLongLong = 0
                     End If
                  End If
               End If
            End If
         Else
            If (Abs(((ColorA \ &H10000) And &HFF) - (ColorB And &HFF)) <= Tolerance) Then
               If (Abs(((ColorA \ &H100) And &HFF) - ((ColorB \ &H100) And &HFF)) <= Tolerance) Then
                  If (Abs((ColorA And &HFF) - ((ColorB \ &H10000) And &HFF)) <= Tolerance) Then
                     If (bAlphaEqual) Then
                        If (Abs(((ColorA \ &H1000000) And &HFF) - _
                                        ((ColorB \ &H1000000) And &HFF)) <= Tolerance) Then
                           FreeImage_CompareColorsLongLong = 0
                        End If
                     Else
                        FreeImage_CompareColorsLongLong = 0
                     End If
                  End If
               End If
            End If
         End If
      End If
   End If
                                   
End Function

Public Function FreeImage_CompareColorsRGBTRIPLELong(ByRef ColorA As RGBTRIPLE, _
                                                     ByVal ColorB As Long, _
                                            Optional ByVal Tolerance As Long, _
                                            Optional ByVal ColorTypeB As FREE_IMAGE_COLOR_FORMAT_FLAGS = FICFF_COLOR_RGB) As Long
                                   
Dim lcColorA As Long

   ' This is a function derived from 'FreeImage_CompareColorsLongLong()' to make color
   ' comparisons between two colors whereby one color is provided as RGBTRIPLE and the
   ' other color is provided as Long value.
   
   ' Have a look at the documentation of 'FreeImage_CompareColorsLongLong()' to learn
   ' more about color comparisons.

   Call CopyMemory(lcColorA, ColorA, 3)
   FreeImage_CompareColorsRGBTRIPLELong = FreeImage_CompareColorsLongLong(lcColorA, ColorB, _
         Tolerance, FICFF_COLOR_RGB, ColorTypeB)

End Function

Public Function FreeImage_CompareColorsRGBQUADLong(ByRef ColorA As RGBQUAD, _
                                                   ByVal ColorB As Long, _
                                          Optional ByVal Tolerance As Long, _
                                          Optional ByVal ColorTypeB As FREE_IMAGE_COLOR_FORMAT_FLAGS = FICFF_COLOR_ARGB) As Long
                                   
Dim lcColorA As Long

   ' This is a function derived from 'FreeImage_CompareColorsLongLong()' to make color
   ' comparisons between two colors whereby one color is provided as RGBQUAD and the
   ' other color is provided as Long value.
   
   ' Have a look at the documentation of 'FreeImage_CompareColorsLongLong()' to learn
   ' more about color comparisons.
   
   Call CopyMemory(lcColorA, ColorA, 4)
   FreeImage_CompareColorsRGBQUADLong = FreeImage_CompareColorsLongLong(lcColorA, ColorB, _
         Tolerance, FICFF_COLOR_ARGB, ColorTypeB)

End Function

Public Function FreeImage_SearchPalette(ByVal Bitmap As Long, _
                                        ByVal Color As Long, _
                               Optional ByVal Tolerance As Long, _
                               Optional ByVal ColorType As FREE_IMAGE_COLOR_FORMAT_FLAGS = FICFF_COLOR_RGB, _
                               Optional ByVal TransparencyState As FREE_IMAGE_TRANSPARENCY_STATE_FLAGS = FITSF_IGNORE_TRANSPARENCY) As Long

Dim abTransparencyTable() As Byte
Dim alPalette() As Long
Dim i As Long

   ' This function searches an image's color palette for a certain color specified as a
   ' 32 bit Long value in either RGB or BGR format.
   
   ' A search tolerance may be specified in the 'Tolerance' parameter.
   
   ' If no transparency tabe was found for the specified image, transparency information will
   ' be ignored during the search. Then, the function behaves as if FITSF_IGNORE_TRANSPARENCY
   ' was specified for parameter TransparencyState.
   
   ' Use the 'TransparencyState' parameter to control, how the transparency state of
   ' the found palette entry affects the result. These values may be used:
   
   ' FITSF_IGNORE_TRANSPARENCY:        Returns the index of the first palette entry which
   '                                   matches the red, green and blue components.
   '
   ' FITSF_NONTRANSPARENT:             Returns the index of the first palette entry which
   '                                   matches the red, green and blue components and is
   '                                   nontransparent (fully opaque).
   '
   ' FITSF_TRANSPARENT:                Returns the index of the first palette entry which
   '                                   matches the red, green and blue components and is
   '                                   fully transparent.
   '
   ' FITSF_INCLUDE_ALPHA_TRANSPARENCY: Returns the index of the first palette entry which
   '                                   matches the red, green and blue components as well
   '                                   as the alpha transparency.
   
   ' When alpha transparency should be included in the palette search ('FITSF_INCLUDE_ALPHA_TRANSPARENCY'),
   ' the alpha transparency of the color searched is taken from the left most byte of 'Color'
   ' (Color is either in format ARGB or ABGR). The the alpha transparency of the palette entry
   ' actually comes from the image's transparency table rather than from the palette, since palettes
   ' do not contain transparency information.

   If (FreeImage_GetImageType(Bitmap) = FIT_BITMAP) Then
      Select Case FreeImage_GetColorType(Bitmap)
      
      Case FIC_PALETTE, FIC_MINISBLACK, FIC_MINISWHITE
         FreeImage_SearchPalette = -1
         alPalette = FreeImage_GetPaletteExLong(Bitmap)
         If (FreeImage_GetTransparencyCount(Bitmap) > UBound(alPalette)) Then
            abTransparencyTable = FreeImage_GetTransparencyTableExClone(Bitmap)
         Else
            TransparencyState = FITSF_IGNORE_TRANSPARENCY
         End If
         For i = 0 To UBound(alPalette)
            If (FreeImage_CompareColorsLongLong(Color, alPalette(i), _
                                                Tolerance, _
                                                ColorType, FICFF_COLOR_RGB) = 0) Then
               Select Case TransparencyState
               
               Case FITSF_IGNORE_TRANSPARENCY
                  FreeImage_SearchPalette = i
                  Exit For
                  
               Case FITSF_NONTRANSPARENT
                  If (abTransparencyTable(i) = 255) Then
                     FreeImage_SearchPalette = i
                     Exit For
                  End If
               
               Case FITSF_TRANSPARENT
                  If (abTransparencyTable(i) = 0) Then
                     FreeImage_SearchPalette = i
                     Exit For
                  End If
                  
               Case FITSF_INCLUDE_ALPHA_TRANSPARENCY
                  If (abTransparencyTable(i) = ((Color And &HFF000000) \ 1000000)) Then
                     FreeImage_SearchPalette = i
                     Exit For
                  End If
                  
               End Select
            End If
         Next i
      
      Case Else
         FreeImage_SearchPalette = -1
      
      End Select
   Else
      FreeImage_SearchPalette = -1
   End If

End Function

Public Function FreeImage_GetIcon(ByVal hDIB As Long, _
                         Optional ByVal eTransparencyOptions As FREE_IMAGE_ICON_TRANSPARENCY_OPTION_FLAGS = ITOF_USE_DEFAULT_TRANSPARENCY, _
                         Optional ByVal lciTransparentColor As Long, _
                         Optional ByVal eTransparentColorType As FREE_IMAGE_COLOR_FORMAT_FLAGS = FICFF_COLOR_RGB, _
                         Optional ByVal hDC As Long, _
                         Optional ByVal UnloadSource As Boolean) As Long

Dim tIconInfo As ICONINFO
Dim bReleaseDC As Boolean
Dim bModifySourceImage As Boolean
Dim eMaskFlags As FREE_IMAGE_MASK_FLAGS
Dim lBitDepth As Long
Dim bPixelIndex As Byte
Dim hDIBSrc As Long
Dim hDIBMask As Long
Dim hBMPMask As Long
Dim hBmp As Long
   
   ' The optional 'UnloadSource' parameter is for unloading the original image
   ' after the OlePicture has been created, so you can easiely "switch" from a
   ' FreeImage DIB to a VB Picture object. There is no need to clean up the DIB
   ' at the caller's site.
   
   If (hDIB) Then
   
      If (Not FreeImage_HasPixels(hDIB)) Then
         Call Err.Raise(5, "MFreeImage", Error$(5) & vbCrLf & vbCrLf & _
                        "Unable to create an icon from a 'header-only' bitmap.")
      End If
   
      lBitDepth = FreeImage_GetBPP(hDIB)
   
      ' check whether the image supports transparency
      Select Case lBitDepth
      
      Case 4, 8
         If (eTransparencyOptions And ITOF_USE_TRANSPARENCY_INFO) Then
            If (FreeImage_IsTransparent(hDIB)) Then
               eMaskFlags = FIMF_MASK_FULL_TRANSPARENCY
            ElseIf (eTransparencyOptions And ITOF_FORCE_TRANSPARENCY_INFO) Then
               If (FreeImage_IsTransparencyTableTransparent(hDIB)) Then
                  eMaskFlags = (FIMF_MASK_FULL_TRANSPARENCY And _
                                FIMF_MASK_FORCE_TRANSPARENCY)
               End If
            End If
         End If
         If ((eMaskFlags = FIMF_MASK_NONE) And _
             (eTransparencyOptions And ITOF_USE_COLOR_TRANSPARENCY)) Then
            
            eMaskFlags = FIMF_MASK_COLOR_TRANSPARENCY
            
            Select Case (eTransparencyOptions And ITOF_USE_COLOR_BITMASK)
            
            Case ITOF_USE_COLOR_TOP_LEFT_PIXEL
               Call FreeImage_GetPixelIndex(hDIB, _
                                            0, FreeImage_GetHeight(hDIB) - 1, _
                                            bPixelIndex)
               lciTransparentColor = bPixelIndex
               eTransparentColorType = FICFF_COLOR_PALETTE_INDEX
            
            Case ITOF_USE_COLOR_TOP_RIGHT_PIXEL
               Call FreeImage_GetPixelIndex(hDIB, _
                                            FreeImage_GetWidth(hDIB) - 1, FreeImage_GetHeight(hDIB) - 1, _
                                            bPixelIndex)
               lciTransparentColor = bPixelIndex
               eTransparentColorType = FICFF_COLOR_PALETTE_INDEX
            
            Case ITOF_USE_COLOR_BOTTOM_LEFT_PIXEL
               Call FreeImage_GetPixelIndex(hDIB, _
                                            0, 0, _
                                            bPixelIndex)
               lciTransparentColor = bPixelIndex
               eTransparentColorType = FICFF_COLOR_PALETTE_INDEX
            
            Case ITOF_USE_COLOR_BOTTOM_RIGHT_PIXEL
               Call FreeImage_GetPixelIndex(hDIB, _
                                            FreeImage_GetWidth(hDIB) - 1, 0, _
                                            bPixelIndex)
               lciTransparentColor = bPixelIndex
               eTransparentColorType = FICFF_COLOR_PALETTE_INDEX
            
            End Select
         End If
         
         bModifySourceImage = True
         
      Case 24, 32
         If ((lBitDepth = 32) And _
             (eTransparencyOptions And ITOF_USE_TRANSPARENCY_INFO)) Then
            If (FreeImage_IsTransparent(hDIB)) Then
               eMaskFlags = FIMF_MASK_FULL_TRANSPARENCY
            End If
         End If
         If ((eMaskFlags = FIMF_MASK_NONE) And _
             (eTransparencyOptions And ITOF_USE_COLOR_TRANSPARENCY)) Then
            
            eMaskFlags = FIMF_MASK_COLOR_TRANSPARENCY
            
            Select Case (eTransparencyOptions And ITOF_USE_COLOR_BITMASK)
            
            Case ITOF_USE_COLOR_TOP_LEFT_PIXEL
               Call FreeImage_GetPixelColorByLong(hDIB, _
                                                  FreeImage_GetHeight(hDIB) - 1, 0, _
                                                  lciTransparentColor)
               eTransparentColorType = FICFF_COLOR_RGB
            
            Case ITOF_USE_COLOR_TOP_RIGHT_PIXEL
               Call FreeImage_GetPixelColorByLong(hDIB, _
                                                  FreeImage_GetHeight(hDIB) - 1, FreeImage_GetWidth(hDIB) - 1, _
                                                  lciTransparentColor)
               eTransparentColorType = FICFF_COLOR_RGB
            
            Case ITOF_USE_COLOR_BOTTOM_LEFT_PIXEL
               Call FreeImage_GetPixelColorByLong(hDIB, _
                                                  0, 0, _
                                                  lciTransparentColor)
               eTransparentColorType = FICFF_COLOR_RGB
            
            Case ITOF_USE_COLOR_BOTTOM_RIGHT_PIXEL
               Call FreeImage_GetPixelColorByLong(hDIB, _
                                                  0, FreeImage_GetWidth(hDIB) - 1, _
                                                  lciTransparentColor)
               eTransparentColorType = FICFF_COLOR_RGB
            
            End Select
         End If
      
         bModifySourceImage = (lBitDepth = 24)
      
      End Select
      
      
      If (bModifySourceImage) Then
         hDIBSrc = FreeImage_Clone(hDIB)
         hDIBMask = FreeImage_CreateMask(hDIBSrc, MCOF_CREATE_AND_MODIFY, _
                                         1, eMaskFlags, _
                                         lciTransparentColor, eTransparentColorType, _
                                         , , , , , _
                                         FreeImage_SearchPalette(hDIBSrc, 0, , , _
                                                                 FITSF_NONTRANSPARENT), _
                                         FICFF_COLOR_PALETTE_INDEX)
      Else
         hDIBSrc = hDIB
         hDIBMask = FreeImage_CreateMaskImage(hDIB, 1, FIMF_MASK_FULL_TRANSPARENCY)
      End If
     
      If (hDC = 0) Then
         hDC = GetDC(0)
         bReleaseDC = True
      End If

      hBmp = CreateDIBitmap(hDC, _
                            FreeImage_GetInfoHeader(hDIBSrc), _
                            CBM_INIT, _
                            FreeImage_GetBits(hDIBSrc), _
                            FreeImage_GetInfo(hDIBSrc), _
                            DIB_RGB_COLORS)
   
      
      hBMPMask = CreateDIBitmap(hDC, _
                                FreeImage_GetInfoHeader(hDIBMask), _
                                CBM_INIT, _
                                FreeImage_GetBits(hDIBMask), _
                                FreeImage_GetInfo(hDIBMask), _
                                DIB_RGB_COLORS)
                                
      If (bModifySourceImage) Then
         Call FreeImage_Unload(hDIBSrc)
      End If
      
      If (UnloadSource) Then
         Call FreeImage_Unload(hDIB)
      End If
      
      
      If ((hBmp <> 0) And (hBMPMask <> 0)) Then
         
         With tIconInfo
            .fIcon = True
            .hBmMask = hBMPMask
            .hbmColor = hBmp
         End With
         
         FreeImage_GetIcon = CreateIconIndirect(tIconInfo)
      End If
      
      If (bReleaseDC) Then
         Call ReleaseDC(0, hDC)
      End If
   End If

End Function

Public Function FreeImage_AdjustPictureBox(ByRef Control As Object, _
                                  Optional ByVal Mode As FREE_IMAGE_ADJUST_MODE = AM_DEFAULT, _
                                  Optional ByVal Filter As FREE_IMAGE_FILTER = FILTER_BICUBIC) As IPicture

Dim tR As RECT
Dim hDIB As Long
Dim hDIBTemp As Long
Dim lNewWidth As Long
Dim lNewHeight As Long

Const vbObjectOrWithBlockVariableNotSet As Long = 91

   ' This function adjusts an already loaded picture in a VB PictureBox
   ' control in size. This is done by converting the picture to a Bitmap
   ' by FreeImage_CreateFromOlePicture. After resizing the Bitmap it is
   ' converted back to a Ole Picture object and re-assigned to the
   ' PictureBox control.
   
   ' The Control paramater is actually of type Object so any object or control
   ' providing Picture, hWnd, Width and Height properties can be used instead
   ' of a PictureBox control
   
   ' This may be useful when using compile time provided images in VB like
   ' logos or backgrounds that need to be resized during runtime. Using
   ' FreeImage's sophisticated rescaling methods is a much better aproach
   ' than using VB's stretchable Image control.
   
   ' One reason for resizing a usually fixed size logo or background image
   ' may be the following scenario:
   
   ' When running on a Windows machine using smaller or bigger fonts (what can
   ' be configured in the control panel by using different dpi fonts), the
   ' operation system automatically adjusts the sizes of Forms, Labels,
   ' TextBoxes, Frames and even PictureBoxes. So, the hole VB application is
   ' perfectly adapted to these font metrics with the exception of compile time
   ' provided images. Although the PictureBox control is resized, the containing
   ' image remains untouched. This problem could be solved with this function.
   
   ' This function is also wrapped by the function 'AdjustPicture', giving you
   ' a more VB common function name.
   

   If (Not Control Is Nothing) Then
      Call GetClientRect(Control.hWnd, tR)
      If ((tR.Right <> Control.Picture.Width) Or _
          (tR.Bottom <> Control.Picture.Height)) Then
         hDIB = FreeImage_CreateFromOlePicture(Control.Picture)
         If (hDIB) Then
            If (Mode = AM_ADJUST_OPTIMAL_SIZE) Then
               If (Control.Picture.Width >= Control.Picture.Height) Then
                  Mode = AM_ADJUST_WIDTH
               Else
                  Mode = AM_ADJUST_HEIGHT
               End If
            End If
            
            Select Case Mode
            
            Case AM_STRECH
               lNewWidth = tR.Right
               lNewHeight = tR.Bottom
               
            Case AM_ADJUST_WIDTH
               lNewWidth = tR.Right
               lNewHeight = lNewWidth / (Control.Picture.Width / Control.Picture.Height)
               
            Case AM_ADJUST_HEIGHT
               lNewHeight = tR.Bottom
               lNewWidth = lNewHeight * (Control.Picture.Width / Control.Picture.Height)
            
            End Select
            
            hDIBTemp = hDIB
            hDIB = FreeImage_Rescale(hDIB, lNewWidth, lNewHeight, Filter)
            Call FreeImage_Unload(hDIBTemp)
            Set Control.Picture = FreeImage_GetOlePicture(hDIB, , True)
            Set FreeImage_AdjustPictureBox = Control.Picture
         End If
      End If
   Else
      Call Err.Raise(vbObjectOrWithBlockVariableNotSet)
   End If

End Function

Public Function AdjustPicture(ByRef Control As Object, _
                     Optional ByRef Mode As FREE_IMAGE_ADJUST_MODE = AM_DEFAULT, _
                     Optional ByRef Filter As FREE_IMAGE_FILTER = FILTER_BICUBIC) As IPicture
                     
   ' This function is a more VB friendly signed wrapper for
   ' the FreeImage_AdjustPictureBox function.
   
   Set AdjustPicture = FreeImage_AdjustPictureBox(Control, Mode, Filter)

End Function

Public Function FreeImage_LoadEx(ByVal Filename As String, _
                        Optional ByVal Options As FREE_IMAGE_LOAD_OPTIONS, _
                        Optional ByVal Width As Variant, _
                        Optional ByVal Height As Variant, _
                        Optional ByVal InPercent As Boolean, _
                        Optional ByVal Filter As FREE_IMAGE_FILTER, _
                        Optional ByRef Format As FREE_IMAGE_FORMAT) As Long

Const vbInvalidPictureError As Long = 481

   ' The function provides all image formats, the FreeImage library can read. The
   ' image format is determined from the image file to load, the optional parameter
   ' 'Format' is an OUT parameter that will contain the image format that has
   ' been loaded.
   
   ' The parameters 'Width', 'Height', 'InPercent' and 'Filter' make it possible
   ' to "load" the image in a resized version. 'Width', 'Height' specify the desired
   ' width and height, 'Filter' determines, what image filter should be used
   ' on the resizing process.
   
   ' The parameters 'Width', 'Height', 'InPercent' and 'Filter' map directly to the
   ' according parameters of the 'FreeImage_RescaleEx' function. So, read the
   ' documentation of the 'FreeImage_RescaleEx' for a complete understanding of the
   ' usage of these parameters.
   

   Format = FreeImage_GetFileType(Filename)
   If (Format <> FIF_UNKNOWN) Then
      If (FreeImage_FIFSupportsReading(Format)) Then
         FreeImage_LoadEx = FreeImage_Load(Format, Filename, Options)
         If (FreeImage_LoadEx) Then
            
            If ((Not IsMissing(Width)) Or _
                (Not IsMissing(Height))) Then
               FreeImage_LoadEx = FreeImage_RescaleEx(FreeImage_LoadEx, Width, Height, _
                     InPercent, True, Filter)
            End If
         Else
            Call Err.Raise(vbInvalidPictureError)
         End If
      Else
         Call Err.Raise(5, "MFreeImage", Error$(5) & vbCrLf & vbCrLf & _
                        "FreeImage Library plugin '" & FreeImage_GetFormatFromFIF(Format) & "' " & _
                        "does not support reading.")
      End If
   Else
      Call Err.Raise(5, "MFreeImage", Error$(5) & vbCrLf & vbCrLf & _
                     "The file specified has an unknown image format.")
   End If

End Function

Public Function LoadPictureEx(Optional ByRef Filename As Variant, _
                              Optional ByRef Options As FREE_IMAGE_LOAD_OPTIONS, _
                              Optional ByRef Width As Variant, _
                              Optional ByRef Height As Variant, _
                              Optional ByRef InPercent As Boolean, _
                              Optional ByRef Filter As FREE_IMAGE_FILTER, _
                              Optional ByRef Format As FREE_IMAGE_FORMAT) As IPicture
                              
Dim hDIB As Long

   ' This function is an extended version of the VB method 'LoadPicture'. As
   ' the VB version it takes a filename parameter to load the image and throws
   ' the same errors in most cases.
   
   ' This function now is only a thin wrapper for the FreeImage_LoadEx() wrapper
   ' function (as compared to releases of this wrapper prior to version 1.8). So,
   ' have a look at this function's discussion of the parameters.
   
   ' However, we do mask out the FILO_LOAD_NOPIXELS load option, since this
   ' function shall create a VB Picture object, which does not support
   ' FreeImage's header-only loading option.


   If (Not IsMissing(Filename)) Then
      hDIB = FreeImage_LoadEx(Filename, (Options And (Not FILO_LOAD_NOPIXELS)), _
            Width, Height, InPercent, Filter, Format)
      Set LoadPictureEx = FreeImage_GetOlePicture(hDIB, , True)
   End If

End Function

Public Function FreeImage_SaveEx(ByVal Bitmap As Long, _
                                 ByVal Filename As String, _
                        Optional ByVal Format As FREE_IMAGE_FORMAT = FIF_UNKNOWN, _
                        Optional ByVal Options As FREE_IMAGE_SAVE_OPTIONS, _
                        Optional ByVal ColorDepth As FREE_IMAGE_COLOR_DEPTH, _
                        Optional ByVal Width As Variant, _
                        Optional ByVal Height As Variant, _
                        Optional ByVal InPercent As Boolean, _
                        Optional ByVal Filter As FREE_IMAGE_FILTER = FILTER_BICUBIC, _
                        Optional ByVal UnloadSource As Boolean) As Boolean
                     
Dim hDIBRescale As Long
Dim bConvertedOnRescale As Boolean
Dim bIsNewDIB As Boolean
Dim lBPP As Long
Dim lBPPOrg As Long
Dim strExtension As String

   ' This function is an easy to use replacement for FreeImage's FreeImage_Save()
   ' function which supports inline size- and color conversions as well as an
   ' auto image format detection algorithm that determines the desired image format
   ' by the given filename. An even more sophisticated algorithm may auto-detect
   ' the proper color depth for a explicitly given or auto-detected image format.

   ' The function provides all image formats, and save options, the FreeImage
   ' library can write. The optional parameter 'Format' may contain the desired
   ' image format. When omitted, the function tries to get the image format from
   ' the filename extension.
   
   ' The optional parameter 'ColorDepth' may contain the desired color depth for
   ' the saved image. This can be either any value of the FREE_IMAGE_COLOR_DEPTH
   ' enumeration or the value FICD_AUTO what is the default value of the parameter.
   ' When 'ColorDepth' is FICD_AUTO, the function tries to get the most suitable
   ' color depth for the specified image format if the image's current color depth
   ' is not supported by the specified image format. Therefore, the function
   ' firstly reduces the color depth step by step until a proper color depth is
   ' found since an incremention would only increase the file's size with no
   ' quality benefit. Only when there is no lower color depth is found for the
   ' image format, the function starts to increase the color depth.
   
   ' Keep in mind that an explicitly specified color depth that is not supported
   ' by the image format results in a runtime error. For example, when saving
   ' a 24 bit image as GIF image, a runtime error occurs.
   
   ' The function checks, whether the given filename has a valid extension or
   ' not. If not, the "primary" extension for the used image format will be
   ' appended to the filename. The parameter 'Filename' remains untouched in
   ' this case.
   
   ' To learn more about the "primary" extension, read the documentation for
   ' the 'FreeImage_GetPrimaryExtensionFromFIF' function.
   
   ' The parameters 'Width', 'Height', 'InPercent' and 'Filter' make it possible
   ' to save the image in a resized version. 'Width', 'Height' specify the desired
   ' width and height, 'Filter' determines, what image filter should be used
   ' on the resizing process. Since FreeImage_SaveEx relies on FreeImage_RescaleEx,
   ' please refer to the documentation of FreeImage_RescaleEx to learn more
   ' about these four parameters.
   
   ' The optional 'UnloadSource' parameter is for unloading the saved image, so
   ' you can save and unload an image with this function in one operation.
   ' CAUTION: at current, the image is unloaded, even if the image was not
   '          saved correctly!

   
   If (Bitmap) Then
   
      If (Not FreeImage_HasPixels(Bitmap)) Then
         Call Err.Raise(5, "MFreeImage", Error$(5) & vbCrLf & vbCrLf & _
                        "Unable to save 'header-only' bitmaps.")
      End If
   
      If ((Not IsMissing(Width)) Or _
          (Not IsMissing(Height))) Then
          
         lBPP = FreeImage_GetBPP(Bitmap)
         hDIBRescale = FreeImage_RescaleEx(Bitmap, Width, Height, InPercent, UnloadSource, Filter)
         bIsNewDIB = (hDIBRescale <> Bitmap)
         Bitmap = hDIBRescale
         bConvertedOnRescale = (lBPP <> FreeImage_GetBPP(Bitmap))
      End If
      
      If (Format = FIF_UNKNOWN) Then
         Format = FreeImage_GetFIFFromFilename(Filename)
      End If
      If (Format <> FIF_UNKNOWN) Then
         If ((FreeImage_FIFSupportsWriting(Format)) And _
             (FreeImage_FIFSupportsExportType(Format, FIT_BITMAP))) Then
            
            If (Not FreeImage_IsFilenameValidForFIF(Format, Filename)) Then
               strExtension = "." & FreeImage_GetPrimaryExtensionFromFIF(Format)
            End If
            
            ' check color depth
            If (ColorDepth <> FICD_AUTO) Then
               ' mask out bit 1 (0x02) for the case ColorDepth is FICD_MONOCHROME_DITHER (0x03)
               ' FREE_IMAGE_COLOR_DEPTH values are true bit depths in general expect FICD_MONOCHROME_DITHER
               ' by masking out bit 1, 'FreeImage_FIFSupportsExportBPP()' tests for bitdepth 1
               ' what is correct again for dithered images.
               ColorDepth = (ColorDepth And (Not &H2))
               If (Not FreeImage_FIFSupportsExportBPP(Format, ColorDepth)) Then
                  Call Err.Raise(5, "MFreeImage", Error$(5) & vbCrLf & vbCrLf & _
                                 "FreeImage Library plugin '" & FreeImage_GetFormatFromFIF(Format) & "' " & _
                                 "is unable to write images with a color depth " & _
                                 "of " & ColorDepth & " bpp.")
               
               ElseIf (FreeImage_GetBPP(Bitmap) <> ColorDepth) Then
                  Bitmap = FreeImage_ConvertColorDepth(Bitmap, ColorDepth, (UnloadSource Or bIsNewDIB))
                  bIsNewDIB = True
               
               End If
            Else
            
               If (lBPP = 0) Then
                  lBPP = FreeImage_GetBPP(Bitmap)
               End If
               
               If (Not FreeImage_FIFSupportsExportBPP(Format, lBPP)) Then
                  lBPPOrg = lBPP
                  Do
                     lBPP = pGetPreviousColorDepth(lBPP)
                  Loop While ((Not FreeImage_FIFSupportsExportBPP(Format, lBPP)) Or _
                              (lBPP = 0))
                  If (lBPP = 0) Then
                     lBPP = lBPPOrg
                     Do
                        lBPP = pGetNextColorDepth(lBPP)
                     Loop While ((Not FreeImage_FIFSupportsExportBPP(Format, lBPP)) Or _
                                 (lBPP = 0))
                  End If
                  
                  If (lBPP <> 0) Then
                     Bitmap = FreeImage_ConvertColorDepth(Bitmap, lBPP, (UnloadSource Or bIsNewDIB))
                     bIsNewDIB = True
                  End If
               
               ElseIf (bConvertedOnRescale) Then
                  ' restore original color depth
                  ' always unload current DIB here, since 'bIsNewDIB' is True
                  Bitmap = FreeImage_ConvertColorDepth(Bitmap, lBPP, True)
                  
               End If
            End If
            
            FreeImage_SaveEx = FreeImage_Save(Format, Bitmap, Filename & strExtension, Options)
            If ((bIsNewDIB) Or (UnloadSource)) Then
               Call FreeImage_Unload(Bitmap)
            End If
         Else
            Call Err.Raise(5, "MFreeImage", Error$(5) & vbCrLf & vbCrLf & _
                           "FreeImage Library plugin '" & FreeImage_GetFormatFromFIF(Format) & "' " & _
                           "is unable to write images of the image format requested.")
         End If
      Else
         ' unknown image format error
         Call Err.Raise(5, "MFreeImage", Error$(5) & vbCrLf & vbCrLf & _
                        "Unknown image format. Neither an explicit image format " & _
                        "was specified nor any known image format was determined " & _
                        "from the filename specified.")
      End If
   End If

End Function

Public Function SavePictureEx(ByRef Picture As IPicture, _
                              ByRef Filename As String, _
                     Optional ByRef Format As FREE_IMAGE_FORMAT, _
                     Optional ByRef Options As FREE_IMAGE_SAVE_OPTIONS, _
                     Optional ByRef ColorDepth As FREE_IMAGE_COLOR_DEPTH, _
                     Optional ByRef Width As Variant, _
                     Optional ByRef Height As Variant, _
                     Optional ByRef InPercent As Boolean, _
                     Optional ByRef Filter As FREE_IMAGE_FILTER = FILTER_BICUBIC) As Boolean
                     
Dim hDIB As Long

Const vbObjectOrWithBlockVariableNotSet As Long = 91
Const vbInvalidPictureError As Long = 481

   ' This function is an extended version of the VB method 'SavePicture'. As
   ' the VB version it takes a Picture object and a filename parameter to
   ' save the image and throws the same errors in most cases.
   
   ' This function now is only a thin wrapper for the FreeImage_SaveEx() wrapper
   ' function (as compared to releases of this wrapper prior to version 1.8). So,
   ' have a look at this function's discussion of the parameters.
   
   
   If (Not Picture Is Nothing) Then
      hDIB = FreeImage_CreateFromOlePicture(Picture)
      If (hDIB) Then
         SavePictureEx = FreeImage_SaveEx(hDIB, Filename, Format, Options, _
                                          ColorDepth, Width, Height, InPercent, _
                                          FILTER_BICUBIC, True)
      Else
         Call Err.Raise(vbInvalidPictureError)
      End If
   Else
      Call Err.Raise(vbObjectOrWithBlockVariableNotSet)
   End If

End Function

Public Function SaveImageContainerEx(ByRef Container As Object, _
                                     ByRef Filename As String, _
                            Optional ByVal IncludeDrawings As Boolean, _
                            Optional ByRef Format As FREE_IMAGE_FORMAT, _
                            Optional ByRef Options As FREE_IMAGE_SAVE_OPTIONS, _
                            Optional ByRef ColorDepth As FREE_IMAGE_COLOR_DEPTH, _
                            Optional ByRef Width As Variant, _
                            Optional ByRef Height As Variant, _
                            Optional ByRef InPercent As Boolean, _
                            Optional ByRef Filter As FREE_IMAGE_FILTER = FILTER_BICUBIC) As Long
                            
   ' This function is an extended version of the VB method 'SavePicture'. As
   ' the VB version it takes an image hosting control and a filename parameter to
   ' save the image and throws the same errors in most cases.
   
   ' This function merges the functionality of both wrapper functions
   ' 'SavePictureEx()' and 'FreeImage_CreateFromImageContainer()'. Basically this
   ' function is identical to 'SavePictureEx' expect that is does not take a
   ' IOlePicture (IPicture) object but a VB image hosting container control.
   
   ' Please, refer to each of this two function's inline documentation for a
   ' more detailed description.
                            
   Call SavePictureEx(pGetIOlePictureFromContainer(Container, IncludeDrawings), _
            Filename, Format, Options, ColorDepth, Width, Height, InPercent, Filter)

End Function

Public Function FreeImage_OpenMultiBitmapEx(ByVal Filename As String, _
                                   Optional ByVal ReadOnly As Boolean, _
                                   Optional ByVal KeepCacheInMemory As Boolean, _
                                   Optional ByVal Flags As FREE_IMAGE_LOAD_OPTIONS, _
                                   Optional ByRef Format As FREE_IMAGE_FORMAT) As Long

   Format = FreeImage_GetFileType(Filename)
   If (Format <> FIF_UNKNOWN) Then
      Select Case Format
      
      Case FIF_TIFF, FIF_GIF, FIF_ICO
         FreeImage_OpenMultiBitmapEx = FreeImage_OpenMultiBitmap(Format, Filename, False, _
               ReadOnly, KeepCacheInMemory, Flags)
      
      Case Else
         Call Err.Raise(5, "MFreeImage", Error$(5) & vbCrLf & vbCrLf & _
                        "FreeImage Library plugin '" & FreeImage_GetFormatFromFIF(Format) & "' " & _
                        "does not have any support for multi-page bitmaps.")
      End Select
   Else
      Call Err.Raise(5, "MFreeImage", Error$(5) & vbCrLf & vbCrLf & _
                     "The file specified has an unknown image format.")
   End If
   
End Function

Public Function FreeImage_CreateMultiBitmapEx(ByVal Filename As String, _
                                     Optional ByVal KeepCacheInMemory As Boolean, _
                                     Optional ByVal Flags As FREE_IMAGE_LOAD_OPTIONS, _
                                     Optional ByRef Format As FREE_IMAGE_FORMAT) As Long

   If (Format = FIF_UNKNOWN) Then
      Format = FreeImage_GetFIFFromFilename(Filename)
   End If
   
   If (Format <> FIF_UNKNOWN) Then
      Select Case Format
      
      Case FIF_TIFF, FIF_GIF, FIF_ICO
         FreeImage_CreateMultiBitmapEx = FreeImage_OpenMultiBitmap(Format, Filename, True, _
               False, KeepCacheInMemory, Flags)
      
      Case Else
         Call Err.Raise(5, "MFreeImage", Error$(5) & vbCrLf & vbCrLf & _
                       "FreeImage Library plugin '" & _
                       FreeImage_GetFormatFromFIF(Format) & "' " & _
                       "does not have any support for multi-page bitmaps.")
      End Select
   Else
      ' unknown image format error
      Call Err.Raise(5, _
                     "MFreeImage", _
                     Error$(5) & vbCrLf & vbCrLf & _
                     "Unknown image format. Neither an explicit image format " & _
                     "was specified nor any known image format was determined " & _
                     "from the filename specified.")
   End If

End Function



'--------------------------------------------------------------------------------
' OlePicture aware toolkit, rescale and conversion functions
'--------------------------------------------------------------------------------

Public Function FreeImage_RescaleIOP(ByRef Picture As IPicture, _
                            Optional ByVal Width As Variant, _
                            Optional ByVal Height As Variant, _
                            Optional ByVal IsPercentValue As Boolean, _
                            Optional ByVal Filter As FREE_IMAGE_FILTER = FILTER_BICUBIC, _
                            Optional ByVal ForceCloneCreation As Boolean) As IPicture
                            
Dim hDIB As Long

   ' IOlePicture based wrapper for wrapper function FreeImage_RescaleEx()

   hDIB = FreeImage_CreateFromOlePicture(Picture)
   If (hDIB) Then
      hDIB = FreeImage_RescaleEx(hDIB, Width, Height, IsPercentValue, _
            True, Filter, ForceCloneCreation)
      Set FreeImage_RescaleIOP = FreeImage_GetOlePicture(hDIB, , True)
   End If

End Function

Public Function FreeImage_RescaleByPixelIOP(ByRef Picture As IPicture, _
                                   Optional ByVal WidthInPixels As Long, _
                                   Optional ByVal HeightInPixels As Long, _
                                   Optional ByVal Filter As FREE_IMAGE_FILTER = FILTER_BICUBIC, _
                                   Optional ByVal ForceCloneCreation As Boolean) As IPicture
                                
   ' Thin wrapper for function 'FreeImage_RescaleExIOP' for removing method
   ' overload fake. This function rescales the image directly to the size
   ' specified by the 'WidthInPixels' and 'HeightInPixels' parameters.

   Set FreeImage_RescaleByPixelIOP = FreeImage_RescaleIOP(Picture, WidthInPixels, HeightInPixels, _
         False, Filter, ForceCloneCreation)

End Function

Public Function FreeImage_RescaleByPercentIOP(ByRef Picture As IPicture, _
                                     Optional ByVal WidthPercentage As Double, _
                                     Optional ByVal HeightPercentage As Double, _
                                     Optional ByVal Filter As FREE_IMAGE_FILTER = FILTER_BICUBIC, _
                                     Optional ByVal ForceCloneCreation As Boolean) As IPicture

   ' Thin wrapper for function 'FreeImage_RescaleExIOP' for removing method
   ' overload fake. This function rescales the image by a percent value
   ' based on the image's original size.

   Set FreeImage_RescaleByPercentIOP = FreeImage_RescaleIOP(Picture, WidthPercentage, HeightPercentage, _
         True, Filter, ForceCloneCreation)

End Function

Public Function FreeImage_RescaleByFactorIOP(ByRef Picture As IPicture, _
                                    Optional ByVal WidthFactor As Double, _
                                    Optional ByVal HeightFactor As Double, _
                                    Optional ByVal Filter As FREE_IMAGE_FILTER = FILTER_BICUBIC, _
                                    Optional ByVal ForceCloneCreation As Boolean) As IPicture

   ' Thin wrapper for function 'FreeImage_RescaleExIOP' for removing method
   ' overload fake. This function rescales the image by a factor
   ' based on the image's original size.

   Set FreeImage_RescaleByFactorIOP = FreeImage_RescaleIOP(Picture, WidthFactor, HeightFactor, _
         False, Filter, ForceCloneCreation)

End Function

Public Function FreeImage_MakeThumbnailIOP(ByRef Picture As IPicture, _
                                           ByVal MaxPixelSize As Long, _
                                  Optional ByVal Convert As Boolean) As IPicture

Dim hDIB As Long
Dim hDIBThumbnail As Long

   ' IOlePicture based wrapper for wrapper function FreeImage_MakeThumbnail()

   hDIB = FreeImage_CreateFromOlePicture(Picture)
   If (hDIB) Then
      hDIBThumbnail = FreeImage_MakeThumbnail(hDIB, MaxPixelSize, Convert)
      If (hDIBThumbnail) Then
         Set FreeImage_MakeThumbnailIOP = FreeImage_GetOlePicture(hDIBThumbnail, , True)
      End If
      Call FreeImage_Unload(hDIB)
   End If
                                                                 
End Function

Public Function FreeImage_ConvertColorDepthIOP(ByRef Picture As IPicture, _
                                               ByVal Conversion As FREE_IMAGE_CONVERSION_FLAGS, _
                                      Optional ByVal Threshold As Byte = 128, _
                                      Optional ByVal DitherMethod As FREE_IMAGE_DITHER = FID_FS, _
                                      Optional ByVal QuantizeMethod As FREE_IMAGE_QUANTIZE = FIQ_WUQUANT) As IPicture

Dim hDIB As Long

   ' IOlePicture based wrapper for wrapper function FreeImage_ConvertColorDepth()

   hDIB = FreeImage_CreateFromOlePicture(Picture)
   If (hDIB) Then
      hDIB = FreeImage_ConvertColorDepth(hDIB, Conversion, True, Threshold, _
            DitherMethod, QuantizeMethod)
      Set FreeImage_ConvertColorDepthIOP = FreeImage_GetOlePicture(hDIB, , True)
   End If

End Function

Public Function FreeImage_ColorQuantizeExIOP(ByRef Picture As IPicture, _
                                    Optional ByVal QuantizeMethod As FREE_IMAGE_QUANTIZE = FIQ_WUQUANT, _
                                    Optional ByVal PaletteSize As Long = 256, _
                                    Optional ByVal ReserveSize As Long, _
                                    Optional ByRef ReservePalette As Variant = Null) As IPicture
                                 
Dim hDIB As Long

   ' IOlePicture based wrapper for wrapper function FreeImage_ColorQuantizeEx()

   hDIB = FreeImage_CreateFromOlePicture(Picture)
   If (hDIB) Then
      hDIB = FreeImage_ColorQuantizeEx(hDIB, QuantizeMethod, True, PaletteSize, _
            ReserveSize, ReservePalette)
      Set FreeImage_ColorQuantizeExIOP = FreeImage_GetOlePicture(hDIB, , True)
   End If

End Function

Public Function FreeImage_RotateClassicIOP(ByRef Picture As IPicture, _
                                           ByVal Angle As Double) As IPicture

Dim hDIB As Long
Dim hDIBNew As Long

   ' IOlePicture based wrapper for FreeImage function FreeImage_RotateClassic()

   hDIB = FreeImage_CreateFromOlePicture(Picture)
   If (hDIB) Then
      Select Case FreeImage_GetBPP(hDIB)
      
      Case 1, 8, 24, 32
         hDIBNew = FreeImage_RotateClassic(hDIB, Angle)
         Set FreeImage_RotateClassicIOP = FreeImage_GetOlePicture(hDIBNew, , True)
         
      End Select
      Call FreeImage_Unload(hDIB)
   End If

End Function

Public Function FreeImage_RotateIOP(ByRef Picture As IPicture, _
                                    ByVal Angle As Double, _
                           Optional ByVal ColorPtr As Long) As IPicture

Dim hDIB As Long
Dim hDIBNew As Long

   ' IOlePicture based wrapper for FreeImage function FreeImage_Rotate()
   
   ' The optional ColorPtr parameter takes a pointer to (e.g. the address of) an
   ' RGB color value. So, all these assignments are valid for ColorPtr:
   '
   ' Dim tColor As RGBQUAD
   '
   ' VarPtr(tColor)
   ' VarPtr(&H33FF80)
   ' VarPtr(vbWhite) ' However, the VB color constants are in BGR format!

   hDIB = FreeImage_CreateFromOlePicture(Picture)
   If (hDIB) Then
      Select Case FreeImage_GetBPP(hDIB)
      
      Case 1, 8, 24, 32
         hDIBNew = FreeImage_Rotate(hDIB, Angle, ByVal ColorPtr)
         Set FreeImage_RotateIOP = FreeImage_GetOlePicture(hDIBNew, , True)
         
      End Select
      Call FreeImage_Unload(hDIB)
   End If

End Function

Public Function FreeImage_RotateExIOP(ByRef Picture As IPicture, _
                                      ByVal Angle As Double, _
                             Optional ByVal ShiftX As Double, _
                             Optional ByVal ShiftY As Double, _
                             Optional ByVal OriginX As Double, _
                             Optional ByVal OriginY As Double, _
                             Optional ByVal UseMask As Boolean) As IPicture

Dim hDIB As Long
Dim hDIBNew As Long

   ' IOlePicture based wrapper for FreeImage function FreeImage_RotateEx()
   
   hDIB = FreeImage_CreateFromOlePicture(Picture)
   If (hDIB) Then
      Select Case FreeImage_GetBPP(hDIB)
      
      Case 8, 24, 32
         hDIBNew = FreeImage_RotateEx(hDIB, Angle, ShiftX, ShiftY, OriginX, OriginY, UseMask)
         Set FreeImage_RotateExIOP = FreeImage_GetOlePicture(hDIBNew, , True)
         
      End Select
      Call FreeImage_Unload(hDIB)
   End If

End Function

Public Function FreeImage_FlipHorizontalIOP(ByRef Picture As IPicture) As IPicture

Dim hDIB As Long

   ' IOlePicture based wrapper for FreeImage function FreeImage_FlipHorizontal()

   hDIB = FreeImage_CreateFromOlePicture(Picture)
   If (hDIB) Then
      Call FreeImage_FlipHorizontalInt(hDIB)
      Set FreeImage_FlipHorizontalIOP = FreeImage_GetOlePicture(hDIB, , True)
   End If

End Function

Public Function FreeImage_FlipVerticalIOP(ByRef Picture As IPicture) As IPicture

Dim hDIB As Long

   ' IOlePicture based wrapper for FreeImage function FreeImage_FlipVertical()
   
   hDIB = FreeImage_CreateFromOlePicture(Picture)
   If (hDIB) Then
      Call FreeImage_FlipVerticalInt(hDIB)
      Set FreeImage_FlipVerticalIOP = FreeImage_GetOlePicture(hDIB, , True)
   End If

End Function

Public Function FreeImage_AdjustCurveIOP(ByRef Picture As IPicture, _
                                         ByRef LookupTable As Variant, _
                                Optional ByVal Channel As FREE_IMAGE_COLOR_CHANNEL = FICC_BLACK) As IPicture

Dim hDIB As Long

   ' IOlePicture based wrapper for FreeImage function FreeImage_AdjustCurve()
   
   hDIB = FreeImage_CreateFromOlePicture(Picture)
   If (hDIB) Then
      Select Case FreeImage_GetBPP(hDIB)
      
      Case 8, 24, 32
         Call FreeImage_AdjustCurveEx(hDIB, LookupTable, Channel)
         Set FreeImage_AdjustCurveIOP = FreeImage_GetOlePicture(hDIB, , True)
         
      End Select
   End If
   
End Function

Public Function FreeImage_AdjustGammaIOP(ByRef Picture As IPicture, _
                                         ByVal Gamma As Double) As IPicture

Dim hDIB As Long
   
   ' IOlePicture based wrapper for FreeImage function FreeImage_AdjustGamma()
   
   hDIB = FreeImage_CreateFromOlePicture(Picture)
   If (hDIB) Then
      Select Case FreeImage_GetBPP(hDIB)
      
      Case 8, 24, 32
         Call FreeImage_AdjustGammaInt(hDIB, Gamma)
         Set FreeImage_AdjustGammaIOP = FreeImage_GetOlePicture(hDIB, , True)
         
      End Select
   End If
   
End Function

Public Function FreeImage_AdjustBrightnessIOP(ByRef Picture As IPicture, _
                                              ByVal Percentage As Double) As IPicture

Dim hDIB As Long
   
   ' IOlePicture based wrapper for FreeImage function FreeImage_AdjustBrightness()
   
   hDIB = FreeImage_CreateFromOlePicture(Picture)
   If (hDIB) Then
      Select Case FreeImage_GetBPP(hDIB)
      
      Case 8, 24, 32
         Call FreeImage_AdjustBrightnessInt(hDIB, Percentage)
         Set FreeImage_AdjustBrightnessIOP = FreeImage_GetOlePicture(hDIB, , True)
         
      End Select
   End If
   
End Function

Public Function FreeImage_AdjustContrastIOP(ByRef Picture As IPicture, _
                                            ByVal Percentage As Double) As IPicture

Dim hDIB As Long
   
   ' IOlePicture based wrapper for FreeImage function FreeImage_AdjustContrast()
   
   hDIB = FreeImage_CreateFromOlePicture(Picture)
   If (hDIB) Then
      Select Case FreeImage_GetBPP(hDIB)
      
      Case 8, 24, 32
         Call FreeImage_AdjustContrastInt(hDIB, Percentage)
         Set FreeImage_AdjustContrastIOP = FreeImage_GetOlePicture(hDIB, , True)
         
      End Select
   End If
   
End Function

Public Function FreeImage_InvertIOP(ByRef Picture As IPicture) As IPicture

Dim hDIB As Long
   
   ' IOlePicture based wrapper for FreeImage function FreeImage_Invert()
   
   hDIB = FreeImage_CreateFromOlePicture(Picture)
   If (hDIB) Then
      Call FreeImage_InvertInt(hDIB)
      Set FreeImage_InvertIOP = FreeImage_GetOlePicture(hDIB, , True)
   End If
   
End Function

Public Function FreeImage_GetChannelIOP(ByRef Picture As IPicture, _
                                        ByVal Channel As FREE_IMAGE_COLOR_CHANNEL) As IPicture

Dim hDIB As Long
Dim hDIBNew As Long
   
   ' IOlePicture based wrapper for FreeImage function FreeImage_GetChannel()
   
   hDIB = FreeImage_CreateFromOlePicture(Picture)
   If (hDIB) Then
      Select Case FreeImage_GetBPP(hDIB)
      
      Case 24, 32
         hDIBNew = FreeImage_GetChannel(hDIB, Channel)
         Set FreeImage_GetChannelIOP = FreeImage_GetOlePicture(hDIBNew, , True)
         
      End Select
      Call FreeImage_Unload(hDIB)
   End If

End Function

Public Function FreeImage_SetChannelIOP(ByRef Picture As IPicture, _
                                        ByVal BitmapSrc As Long, _
                                        ByVal Channel As FREE_IMAGE_COLOR_CHANNEL) As IPicture

Dim hDIB As Long

   ' IOlePicture based wrapper for FreeImage function FreeImage_SetChannel()

   hDIB = FreeImage_CreateFromOlePicture(Picture)
   If (hDIB) Then
      Select Case FreeImage_GetBPP(hDIB)

      Case 24, 32
         If (FreeImage_SetChannel(hDIB, BitmapSrc, Channel)) Then
            Set FreeImage_SetChannelIOP = FreeImage_GetOlePicture(hDIB, , True)
         End If

      End Select
      Call FreeImage_Unload(hDIB)
   End If

End Function

Public Function FreeImage_CopyIOP(ByRef Picture As IPicture, _
                                  ByVal Left As Long, _
                                  ByVal Top As Long, _
                                  ByVal Right As Long, _
                                  ByVal Bottom As Long) As IPicture

Dim hDIB As Long
Dim hDIBNew As Long
   
   ' IOlePicture based wrapper for FreeImage function FreeImage_Copy()
   
   hDIB = FreeImage_CreateFromOlePicture(Picture)
   If (hDIB) Then
      hDIBNew = FreeImage_Copy(hDIB, Left, Top, Right, Bottom)
      Call FreeImage_Unload(hDIB)
      Set FreeImage_CopyIOP = FreeImage_GetOlePicture(hDIBNew, , True)
   End If

End Function

Public Function FreeImage_PasteIOP(ByRef PictureDst As IPicture, _
                                   ByRef PictureSrc As IPicture, _
                                   ByVal Left As Long, _
                                   ByVal Top As Long, _
                                   ByVal Alpha As Long, _
                          Optional ByVal KeepOriginalDestImage As Boolean) As IPicture

Dim hDIBDst As Long
Dim hDIBSrc As Long
   
   ' IOlePicture based wrapper for FreeImage function FreeImage_Paste()
   
   hDIBDst = FreeImage_CreateFromOlePicture(PictureDst)
   If (hDIBDst) Then
      hDIBSrc = FreeImage_CreateFromOlePicture(PictureSrc)
      If (hDIBSrc) Then
         If FreeImage_Paste(hDIBDst, hDIBSrc, Left, Top, Alpha) Then
            Set FreeImage_PasteIOP = FreeImage_GetOlePicture(hDIBDst, , True)
            If (Not KeepOriginalDestImage) Then
               Set PictureDst = FreeImage_PasteIOP
            End If
         End If
         Call FreeImage_Unload(hDIBSrc)
      End If
   End If

End Function

Public Function FreeImage_CompositeIOP(ByRef Picture As IPicture, _
                              Optional ByVal UseFileBackColor As Boolean, _
                              Optional ByVal AppBackColor As OLE_COLOR, _
                              Optional ByRef BackgroundPicture As IPicture) As IPicture

Dim hDIB As Long
Dim hDIBbg As Long
Dim hDIBResult As Long
Dim lUseFileBackColor As Long
   
   ' IOlePicture based wrapper for FreeImage function FreeImage_Composite()
   
   hDIB = FreeImage_CreateFromOlePicture(Picture)
   If (hDIB) Then
   
      If (UseFileBackColor) Then
         lUseFileBackColor = 1
      End If
    
      hDIBbg = FreeImage_CreateFromOlePicture(BackgroundPicture)
      
      hDIBResult = FreeImage_Composite(hDIB, lUseFileBackColor, ConvertColor(AppBackColor), hDIBbg)
      If (hDIBResult) Then
         Set FreeImage_CompositeIOP = FreeImage_GetOlePicture(hDIBResult, , True)
      End If
      
      Call FreeImage_Unload(hDIB)
      If (hDIBbg) Then
         Call FreeImage_Unload(hDIBbg)
      End If
   End If
   
End Function


'--------------------------------------------------------------------------------
' VB-coded Toolkit functions
'--------------------------------------------------------------------------------

Public Function FreeImage_GetColorizedPalette(ByVal Color As OLE_COLOR, _
                                     Optional ByVal SplitValue As Variant = 0.5) As RGBQUAD()

Dim atPalette(255) As RGBQUAD
Dim lSplitIndex As Long
Dim lSplitIndexInv As Long
Dim lRed As Long
Dim lGreen As Long
Dim lBlue As Long
Dim i As Long

   ' compute the split index
   Select Case VarType(SplitValue)
   
   Case vbByte, vbInteger, vbLong
      lSplitIndex = SplitValue
      
   Case vbDouble, vbSingle, vbDecimal
      lSplitIndex = 256 * SplitValue
   
   Case Else
      lSplitIndex = 128
   
   End Select
   
   ' check ranges of split index
   If (lSplitIndex < 0) Then
      lSplitIndex = 0
   ElseIf (lSplitIndex > 255) Then
      lSplitIndex = 255
   End If
   lSplitIndexInv = 256 - lSplitIndex

   ' extract color components red, green and blue
   lRed = (Color And &HFF)
   lGreen = ((Color \ &H100&) And &HFF)
   lBlue = ((Color \ &H10000) And &HFF)

   For i = 0 To lSplitIndex - 1
      With atPalette(i)
         .rgbRed = (lRed / lSplitIndex) * i
         .rgbGreen = (lGreen / lSplitIndex) * i
         .rgbBlue = (lBlue / lSplitIndex) * i
      End With
   Next i
   For i = lSplitIndex To 255
      With atPalette(i)
         .rgbRed = lRed + ((255 - lRed) / lSplitIndexInv) * (i - lSplitIndex)
         .rgbGreen = lGreen + ((255 - lGreen) / lSplitIndexInv) * (i - lSplitIndex)
         .rgbBlue = lBlue + ((255 - lBlue) / lSplitIndexInv) * (i - lSplitIndex)
      End With
   Next i
   
   FreeImage_GetColorizedPalette = atPalette

End Function

Public Function FreeImage_Colorize(ByVal Bitmap As Long, _
                                   ByVal Color As OLE_COLOR, _
                          Optional ByVal SplitValue As Variant = 0.5) As Long
                          
   If (Bitmap) Then
      If (Not FreeImage_HasPixels(Bitmap)) Then
         Call Err.Raise(5, "MFreeImage", Error$(5) & vbCrLf & vbCrLf & _
                        "Unable to colorize a 'header-only' bitmap.")
      End If
      FreeImage_Colorize = FreeImage_ConvertToGreyscale(Bitmap)
      Call FreeImage_SetPalette(FreeImage_Colorize, _
            FreeImage_GetColorizedPalette(Color, SplitValue))
   End If

End Function

Public Function FreeImage_Sepia(ByVal Bitmap As Long, _
                       Optional ByVal SplitValue As Variant = 0.5) As Long

   FreeImage_Sepia = FreeImage_Colorize(Bitmap, &H658AA2, SplitValue)  ' RGB(162, 138, 101)

End Function


'--------------------------------------------------------------------------------
' Compression functions wrappers
'--------------------------------------------------------------------------------

Public Function FreeImage_ZLibCompressEx(ByRef Target As Variant, _
                                Optional ByRef TargetSize As Long, _
                                Optional ByRef Source As Variant, _
                                Optional ByVal SourceSize As Long, _
                                Optional ByVal Offset As Long) As Long
                                
Dim lSourceDataPtr As Long
Dim lTargetDataPtr As Long
Dim bTargetCreated As Boolean

   ' This function is a more VB friendly wrapper for compressing data with
   ' the 'FreeImage_ZLibCompress' function.
   
   ' The parameter 'Target' may either be a VB style array of Byte, Integer
   ' or Long or a pointer to a memory block. If 'Target' is a pointer to a
   ' memory block (when it contains an address), 'TargetSize' must be
   ' specified and greater than zero. If 'Target' is an initialized array,
   ' the whole array will be used to store compressed data when 'TargetSize'
   ' is missing or below or equal to zero. If 'TargetSize' is specified, only
   ' the first TargetSize bytes of the array will be used.
   ' In each case, all rules according to the FreeImage API documentation
   ' apply, what means that the target buffer must be at least 0.1% greater
   ' than the source buffer plus 12 bytes.
   ' If 'Target' is an uninitialized array, the contents of 'TargetSize'
   ' will be ignored and the size of the array 'Target' will be handled
   ' internally. When the function returns, 'Target' will be initialized
   ' as an array of Byte and sized correctly to hold all the compressed
   ' data.
   
   ' Nearly all, that is true for the parameters 'Target' and 'TargetSize',
   ' is also true for 'Source' and 'SourceSize', expect that 'Source' should
   ' never be an uninitialized array. In that case, the function returns
   ' immediately.
   
   ' The optional parameter 'Offset' may contain a number of bytes to remain
   ' untouched at the beginning of 'Target', when an uninitialized array is
   ' provided through 'Target'. When 'Target' is either a pointer or an
   ' initialized array, 'Offset' will be ignored. This parameter is currently
   ' used by 'FreeImage_ZLibCompressVB' to store the length of the uncompressed
   ' data at the first four bytes of 'Target'.

   
   ' get the pointer and the size in bytes of the source
   ' memory block
   lSourceDataPtr = pGetMemoryBlockPtrFromVariant(Source, SourceSize)
   If (lSourceDataPtr) Then
      ' when we got a valid pointer, get the pointer and the size in bytes
      ' of the target memory block
      lTargetDataPtr = pGetMemoryBlockPtrFromVariant(Target, TargetSize)
      If (lTargetDataPtr = 0) Then
         ' if 'Target' is a null pointer, we will initialized it as an array
         ' of bytes; here we will take 'Offset' into account
         ReDim Target(SourceSize + Int(SourceSize * 0.1) + _
                      12 + Offset) As Byte
         ' get pointer and size in bytes (will never be a null pointer)
         lTargetDataPtr = pGetMemoryBlockPtrFromVariant(Target, TargetSize)
         ' adjust according to 'Offset'
         lTargetDataPtr = lTargetDataPtr + Offset
         TargetSize = TargetSize - Offset
         bTargetCreated = True
      End If
      
      ' compress source data
      FreeImage_ZLibCompressEx = FreeImage_ZLibCompress(lTargetDataPtr, _
                                                        TargetSize, _
                                                        lSourceDataPtr, _
                                                        SourceSize)
      
      ' the function returns the number of bytes needed to store the
      ' compressed data or zero on failure
      If (FreeImage_ZLibCompressEx) Then
         If (bTargetCreated) Then
            ' when we created the array, we need to adjust it's size
            ' according to the length of the compressed data
            ReDim Preserve Target(FreeImage_ZLibCompressEx - 1 + Offset)
         End If
      End If
   End If
                                
End Function

Public Function FreeImage_ZLibUncompressEx(ByRef Target As Variant, _
                                  Optional ByRef TargetSize As Long, _
                                  Optional ByRef Source As Variant, _
                                  Optional ByVal SourceSize As Long) As Long
                                
Dim lSourceDataPtr As Long
Dim lTargetDataPtr As Long

   ' This function is a more VB friendly wrapper for compressing data with
   ' the 'FreeImage_ZLibUncompress' function.
   
   ' The parameter 'Target' may either be a VB style array of Byte, Integer
   ' or Long or a pointer to a memory block. If 'Target' is a pointer to a
   ' memory block (when it contains an address), 'TargetSize' must be
   ' specified and greater than zero. If 'Target' is an initialized array,
   ' the whole array will be used to store uncompressed data when 'TargetSize'
   ' is missing or below or equal to zero. If 'TargetSize' is specified, only
   ' the first TargetSize bytes of the array will be used.
   ' In each case, all rules according to the FreeImage API documentation
   ' apply, what means that the target buffer must be at least as large, to
   ' hold all the uncompressed data.
   ' Unlike the function 'FreeImage_ZLibCompressEx', 'Target' can not be
   ' an uninitialized array, since the size of the uncompressed data can
   ' not be determined by the ZLib functions, but must be specified by a
   ' mechanism outside the FreeImage compression functions' scope.
   
   ' Nearly all, that is true for the parameters 'Target' and 'TargetSize',
   ' is also true for 'Source' and 'SourceSize'.
   
   
   ' get the pointer and the size in bytes of the source
   ' memory block
   lSourceDataPtr = pGetMemoryBlockPtrFromVariant(Source, SourceSize)
   If (lSourceDataPtr) Then
      ' when we got a valid pointer, get the pointer and the size in bytes
      ' of the target memory block
      lTargetDataPtr = pGetMemoryBlockPtrFromVariant(Target, TargetSize)
      If (lTargetDataPtr) Then
         ' if we do not have a null pointer, uncompress the data
         FreeImage_ZLibUncompressEx = FreeImage_ZLibUncompress(lTargetDataPtr, _
                                                               TargetSize, _
                                                               lSourceDataPtr, _
                                                               SourceSize)
      End If
   End If
                                
End Function

Public Function FreeImage_ZLibGZipEx(ByRef Target As Variant, _
                            Optional ByRef TargetSize As Long, _
                            Optional ByRef Source As Variant, _
                            Optional ByVal SourceSize As Long, _
                            Optional ByVal Offset As Long) As Long
                                
Dim lSourceDataPtr As Long
Dim lTargetDataPtr As Long
Dim bTargetCreated As Boolean

   ' This function is a more VB friendly wrapper for compressing data with
   ' the 'FreeImage_ZLibGZip' function.
   
   ' The parameter 'Target' may either be a VB style array of Byte, Integer
   ' or Long or a pointer to a memory block. If 'Target' is a pointer to a
   ' memory block (when it contains an address), 'TargetSize' must be
   ' specified and greater than zero. If 'Target' is an initialized array,
   ' the whole array will be used to store compressed data when 'TargetSize'
   ' is missing or below or equal to zero. If 'TargetSize' is specified, only
   ' the first TargetSize bytes of the array will be used.
   ' In each case, all rules according to the FreeImage API documentation
   ' apply, what means that the target buffer must be at least 0.1% greater
   ' than the source buffer plus 24 bytes.
   ' If 'Target' is an uninitialized array, the contents of 'TargetSize'
   ' will be ignored and the size of the array 'Target' will be handled
   ' internally. When the function returns, 'Target' will be initialized
   ' as an array of Byte and sized correctly to hold all the compressed
   ' data.
   
   ' Nearly all, that is true for the parameters 'Target' and 'TargetSize',
   ' is also true for 'Source' and 'SourceSize', expect that 'Source' should
   ' never be an uninitialized array. In that case, the function returns
   ' immediately.
   
   ' The optional parameter 'Offset' may contain a number of bytes to remain
   ' untouched at the beginning of 'Target', when an uninitialized array is
   ' provided through 'Target'. When 'Target' is either a pointer or an
   ' initialized array, 'Offset' will be ignored. This parameter is currently
   ' used by 'FreeImage_ZLibGZipVB' to store the length of the uncompressed
   ' data at the first four bytes of 'Target'.

   
   ' get the pointer and the size in bytes of the source
   ' memory block
   lSourceDataPtr = pGetMemoryBlockPtrFromVariant(Source, SourceSize)
   If (lSourceDataPtr) Then
      ' when we got a valid pointer, get the pointer and the size in bytes
      ' of the target memory block
      lTargetDataPtr = pGetMemoryBlockPtrFromVariant(Target, TargetSize)
      If (lTargetDataPtr = 0) Then
         ' if 'Target' is a null pointer, we will initialized it as an array
         ' of bytes; here we will take 'Offset' into account
         ReDim Target(SourceSize + Int(SourceSize * 0.1) + _
                      24 + Offset) As Byte
         ' get pointer and size in bytes (will never be a null pointer)
         lTargetDataPtr = pGetMemoryBlockPtrFromVariant(Target, TargetSize)
         ' adjust according to 'Offset'
         lTargetDataPtr = lTargetDataPtr + Offset
         TargetSize = TargetSize - Offset
         bTargetCreated = True
      End If
      
      ' compress source data
      FreeImage_ZLibGZipEx = FreeImage_ZLibGZip(lTargetDataPtr, _
                                                TargetSize, _
                                                lSourceDataPtr, _
                                                SourceSize)
      
      ' the function returns the number of bytes needed to store the
      ' compressed data or zero on failure
      If (FreeImage_ZLibGZipEx) Then
         If (bTargetCreated) Then
            ' when we created the array, we need to adjust it's size
            ' according to the length of the compressed data
            ReDim Preserve Target(FreeImage_ZLibGZipEx - 1 + Offset)
         End If
      End If
   End If
                                
End Function

Public Function FreeImage_ZLibCRC32Ex(ByVal CRC As Long, _
                             Optional ByRef Source As Variant, _
                             Optional ByVal SourceSize As Long) As Long
                                
Dim lSourceDataPtr As Long

   ' This function is a more VB friendly wrapper for compressing data with
   ' the 'FreeImage_ZLibCRC32' function.
   
   ' The parameter 'Source' may either be a VB style array of Byte, Integer
   ' or Long or a pointer to a memory block. If 'Source' is a pointer to a
   ' memory block (when it contains an address), 'SourceSize' must be
   ' specified and greater than zero. If 'Source' is an initialized array,
   ' the whole array will be used to calculate the new CRC when 'SourceSize'
   ' is missing or below or equal to zero. If 'SourceSize' is specified, only
   ' the first SourceSize bytes of the array will be used.

   
   ' get the pointer and the size in bytes of the source
   ' memory block
   lSourceDataPtr = pGetMemoryBlockPtrFromVariant(Source, SourceSize)
   If (lSourceDataPtr) Then
      ' if we do not have a null pointer, calculate the CRC including 'crc'
      FreeImage_ZLibCRC32Ex = FreeImage_ZLibCRC32(CRC, _
                                                  lSourceDataPtr, _
                                                  SourceSize)
   End If
                                
End Function

Public Function FreeImage_ZLibGUnzipEx(ByRef Target As Variant, _
                              Optional ByRef TargetSize As Long, _
                              Optional ByRef Source As Variant, _
                              Optional ByVal SourceSize As Long) As Long
                                
Dim lSourceDataPtr As Long
Dim lTargetDataPtr As Long

   ' This function is a more VB friendly wrapper for compressing data with
   ' the 'FreeImage_ZLibGUnzip' function.
   
   ' The parameter 'Target' may either be a VB style array of Byte, Integer
   ' or Long or a pointer to a memory block. If 'Target' is a pointer to a
   ' memory block (when it contains an address), 'TargetSize' must be
   ' specified and greater than zero. If 'Target' is an initialized array,
   ' the whole array will be used to store uncompressed data when 'TargetSize'
   ' is missing or below or equal to zero. If 'TargetSize' is specified, only
   ' the first TargetSize bytes of the array will be used.
   ' In each case, all rules according to the FreeImage API documentation
   ' apply, what means that the target buffer must be at least as large, to
   ' hold all the uncompressed data.
   ' Unlike the function 'FreeImage_ZLibGZipEx', 'Target' can not be
   ' an uninitialized array, since the size of the uncompressed data can
   ' not be determined by the ZLib functions, but must be specified by a
   ' mechanism outside the FreeImage compression functions' scope.
   
   ' Nearly all, that is true for the parameters 'Target' and 'TargetSize',
   ' is also true for 'Source' and 'SourceSize'.
   
   
   ' get the pointer and the size in bytes of the source
   ' memory block
   lSourceDataPtr = pGetMemoryBlockPtrFromVariant(Source, SourceSize)
   If (lSourceDataPtr) Then
      ' when we got a valid pointer, get the pointer and the size in bytes
      ' of the target memory block
      lTargetDataPtr = pGetMemoryBlockPtrFromVariant(Target, TargetSize)
      If (lTargetDataPtr) Then
         ' if we do not have a null pointer, uncompress the data
         FreeImage_ZLibGUnzipEx = FreeImage_ZLibGUnzip(lTargetDataPtr, _
                                                       TargetSize, _
                                                       lSourceDataPtr, _
                                                       SourceSize)
      End If
   End If
                                
End Function

Public Function FreeImage_ZLibCompressVB(ByRef Data() As Byte, _
                                Optional ByVal IncludeSize As Boolean = True) As Byte()
                                
Dim lOffset As Long
Dim lArrayDataPtr As Long

   ' This function is another, even more VB friendly wrapper for the FreeImage
   ' 'FreeImage_ZLibCompress' function, that uses the 'FreeImage_ZLibCompressEx'
   ' function. This function is very easy to use, since it deals only with VB
   ' style Byte arrays.
   
   ' The parameter 'Data()' is a Byte array, providing the uncompressed source
   ' data, that will be compressed.
   
   ' The optional parameter 'IncludeSize' determines whether the size of the
   ' uncompressed data should be stored in the first four bytes of the returned
   ' byte buffer containing the compressed data or not. When 'IncludeSize' is
   ' True, the size of the uncompressed source data will be stored. This works
   ' in conjunction with the corresponding 'FreeImage_ZLibUncompressVB' function.
   
   ' The function returns a VB style Byte array containing the compressed data.
   

   ' start population the memory block with compressed data
   ' at offset 4 bytes, when the unclompressed size should
   ' be included
   If (IncludeSize) Then
      lOffset = 4
   End If
   
   Call FreeImage_ZLibCompressEx(FreeImage_ZLibCompressVB, , Data, , lOffset)
                                 
   If (IncludeSize) Then
      ' get the pointer actual pointing to the array data of
      ' the Byte array 'FreeImage_ZLibCompressVB'
      lArrayDataPtr = pDeref(pDeref(VarPtrArray(FreeImage_ZLibCompressVB)) + 12)

      ' copy uncompressed size into the first 4 bytes
      Call CopyMemory(ByVal lArrayDataPtr, UBound(Data) + 1, 4)
   End If

End Function

Public Function FreeImage_ZLibUncompressVB(ByRef Data() As Byte, _
                                  Optional ByVal SizeIncluded As Boolean = True, _
                                  Optional ByVal SizeNeeded As Long) As Byte()

Dim abBuffer() As Byte

   ' This function is another, even more VB friendly wrapper for the FreeImage
   ' 'FreeImage_ZLibUncompress' function, that uses the 'FreeImage_ZLibUncompressEx'
   ' function. This function is very easy to use, since it deals only with VB
   ' style Byte arrays.
   
   ' The parameter 'Data()' is a Byte array, providing the compressed source
   ' data that will be uncompressed either withthe size of the uncompressed
   ' data included or not.
   
   ' When the optional parameter 'SizeIncluded' is True, the function assumes,
   ' that the first four bytes contain the size of the uncompressed data as a
   ' Long value. In that case, 'SizeNeeded' will be ignored.
   
   ' When the size of the uncompressed data is not included in the buffer 'Data()'
   ' containing the compressed data, the optional parameter 'SizeNeeded' must
   ' specify the size in bytes needed to hold all the uncompressed data.
   
   ' The function returns a VB style Byte array containing the uncompressed data.


   If (SizeIncluded) Then
      ' get uncompressed size from the first 4 bytes and allocate
      ' buffer accordingly
      Call CopyMemory(SizeNeeded, Data(0), 4)
      ReDim abBuffer(SizeNeeded - 1)
      Call FreeImage_ZLibUncompressEx(abBuffer, , VarPtr(Data(4)), UBound(Data) - 3)
      Call pSwap(VarPtrArray(FreeImage_ZLibUncompressVB), VarPtrArray(abBuffer))
   
   ElseIf (SizeNeeded) Then
      ' no size included in compressed data, so just forward the
      ' call to 'FreeImage_ZLibUncompressEx' and trust on SizeNeeded
      ReDim abBuffer(SizeNeeded - 1)
      Call FreeImage_ZLibUncompressEx(abBuffer, , Data)
      Call pSwap(VarPtrArray(FreeImage_ZLibUncompressVB), VarPtrArray(abBuffer))
   
   End If

End Function

Public Function FreeImage_ZLibGZipVB(ByRef Data() As Byte, _
                            Optional ByVal IncludeSize As Boolean = True) As Byte()
                                
Dim lOffset As Long
Dim lArrayDataPtr As Long

   ' This function is another, even more VB friendly wrapper for the FreeImage
   ' 'FreeImage_ZLibGZip' function, that uses the 'FreeImage_ZLibGZipEx'
   ' function. This function is very easy to use, since it deals only with VB
   ' style Byte arrays.
   
   ' The parameter 'Data()' is a Byte array, providing the uncompressed source
   ' data that will be compressed.
   
   ' The optional parameter 'IncludeSize' determines whether the size of the
   ' uncompressed data should be stored in the first four bytes of the returned
   ' byte buffer containing the compressed data or not. When 'IncludeSize' is
   ' True, the size of the uncompressed source data will be stored. This works
   ' in conjunction with the corresponding 'FreeImage_ZLibGUnzipVB' function.
   
   ' The function returns a VB style Byte array containing the compressed data.


   ' start population the memory block with compressed data
   ' at offset 4 bytes, when the unclompressed size should
   ' be included
   If (IncludeSize) Then
      lOffset = 4
   End If
   
   Call FreeImage_ZLibGZipEx(FreeImage_ZLibGZipVB, , Data, , lOffset)
                                 
   If (IncludeSize) Then
      ' get the pointer actual pointing to the array data of
      ' the Byte array 'FreeImage_ZLibCompressVB'
      lArrayDataPtr = pDeref(pDeref(VarPtrArray(FreeImage_ZLibGZipVB)) + 12)

      ' copy uncompressed size into the first 4 bytes
      Call CopyMemory(ByVal lArrayDataPtr, UBound(Data) + 1, 4)
   End If

End Function

Public Function FreeImage_ZLibGUnzipVB(ByRef Data() As Byte, _
                              Optional ByVal SizeIncluded As Boolean = True, _
                              Optional ByVal SizeNeeded As Long) As Byte()

Dim abBuffer() As Byte

   ' This function is another, even more VB friendly wrapper for the FreeImage
   ' 'FreeImage_ZLibGUnzip' function, that uses the 'FreeImage_ZLibGUnzipEx'
   ' function. This function is very easy to use, since it deals only with VB
   ' style Byte arrays.
   
   ' The parameter 'Data()' is a Byte array, providing the compressed source
   ' data that will be uncompressed either withthe size of the uncompressed
   ' data included or not.
   
   ' When the optional parameter 'SizeIncluded' is True, the function assumes,
   ' that the first four bytes contain the size of the uncompressed data as a
   ' Long value. In that case, 'SizeNeeded' will be ignored.
   
   ' When the size of the uncompressed data is not included in the buffer 'Data()'
   ' containing the compressed data, the optional parameter 'SizeNeeded' must
   ' specify the size in bytes needed to hold all the uncompressed data.
   
   ' The function returns a VB style Byte array containing the uncompressed data.


   If (SizeIncluded) Then
      ' get uncompressed size from the first 4 bytes and allocate
      ' buffer accordingly
      Call CopyMemory(SizeNeeded, Data(0), 4)
      ReDim abBuffer(SizeNeeded - 1)
      Call FreeImage_ZLibGUnzipEx(abBuffer, , VarPtr(Data(4)), UBound(Data) - 3)
      Call pSwap(VarPtrArray(FreeImage_ZLibGUnzipVB), VarPtrArray(abBuffer))
   
   ElseIf (SizeNeeded) Then
      ' no size included in compressed data, so just forward the
      ' call to 'FreeImage_ZLibUncompressEx' and trust on SizeNeeded
      ReDim abBuffer(SizeNeeded - 1)
      Call FreeImage_ZLibGUnzipEx(abBuffer, , Data)
      Call pSwap(VarPtrArray(FreeImage_ZLibGUnzipVB), VarPtrArray(abBuffer))
   
   End If

End Function


'--------------------------------------------------------------------------------
' Public functions to destroy custom safearrays
'--------------------------------------------------------------------------------

Public Function FreeImage_DestroyLockedArray(ByRef Data As Variant) As Long

Dim lpArrayPtr As Long

   ' This function destroys an array, that was self created with a custom
   ' array descriptor of type ('fFeatures' member) 'FADF_AUTO Or FADF_FIXEDSIZE'.
   ' Such arrays are returned by mostly all of the array-dealing wrapper
   ' functions. Since these should not destroy the actual array data, when
   ' going out of scope, they are craeted as 'FADF_FIXEDSIZE'.'
   
   ' So, VB sees them as fixed or temporarily locked, when you try to manipulate
   ' the array's dimensions. There will occur some strange effects, you should
   ' know about:
   
   ' 1. When trying to 'ReDim' the array, this run-time error will occur:
   '    Error #10, 'This array is fixed or temporarily locked'
   
   ' 2. When trying to assign another array to the array variable, this
   '    run-time error will occur:
   '    Error #13, 'Type mismatch'
   
   ' 3. The 'Erase' statement has no effect on the array
   
   ' Although VB clears up these arrays correctly, when the array variable
   ' goes out of scope, you have to destroy the array manually, when you want
   ' to reuse the array variable in current scope.
   
   ' For an example assume, that you want do walk all scanlines in an image:
   
   ' For i = 0 To FreeImage_GetHeight(Bitmap)
   '
   '    ' assign scanline-array to array variable
   '    abByte = FreeImage_GetScanLineEx(Bitmap, i)
   '
   '    ' do some work on it...
   '
   '    ' destroy the array (only the array, not the actual data)
   '    Call FreeImage_DestroyLockedArray(dbByte)
   ' Next i
   
   ' The function returns zero on success and any other value on failure
   
   ' !! Attention !!
   ' This function uses a Variant parameter for passing the array to be
   ' destroyed. Since VB does not allow to pass an array of non public
   ' structures through a Variant parameter, this function can not be used
   ' with arrays of cutom type.
   
   ' You will get this compiler error: "Only public user defined types defined
   ' in public object modules can be used as parameters or return types for
   ' public procedures of class modules or as fields of public user defined types"
   
   ' So, there is a function in the wrapper called 'FreeImage_DestroyLockedArrayByPtr'
   ' that takes a pointer to the array variable which can be used to work around
   ' that VB limitation and furthermore can be used for any of these self-created
   ' arrays. To get the array variable's pointer, a declared version of the
   ' VB 'VarPtr' function can be used which works for all types of arrays expect
   ' String arrays. Declare this function like this in your code:
   
   ' Private Declare Function VarPtrArray Lib "msvbvm60.dll" Alias "VarPtr" ( _
         ByRef Ptr() As Any) As Long
         
   ' Then an array could be destroyed by calling the 'FreeImage_DestroyLockedArrayByPtr'
   ' function like this:
   
   ' lResult = FreeImage_DestroyLockedArrayByPtr(VarPtrArray(MyLockedArray))
   
   ' Additionally there are some handy wrapper functions available, one for each
   ' commonly used structure in FreeImage like RGBTRIPLE, RGBQUAD, FICOMPLEX etc.
   
   
   ' Currently, these functions do return 'FADF_AUTO Or FADF_FIXEDSIZE' arrays
   ' that must be destroyed using this or any of it's derived functions:
   
   ' FreeImage_GetPaletteEx()           with FreeImage_DestroyLockedArrayRGBQUAD()
   ' FreeImage_GetPaletteLong()         with FreeImage_DestroyLockedArray()
   ' FreeImage_SaveToMemoryEx2()        with FreeImage_DestroyLockedArray()
   ' FreeImage_AcquireMemoryEx()        with FreeImage_DestroyLockedArray()
   ' FreeImage_GetScanLineEx()          with FreeImage_DestroyLockedArray()
   ' FreeImage_GetScanLineBITMAP8()     with FreeImage_DestroyLockedArray()
   ' FreeImage_GetScanLineBITMAP16()    with FreeImage_DestroyLockedArray()
   ' FreeImage_GetScanLineBITMAP24()    with FreeImage_DestroyLockedArrayRGBTRIPLE()
   ' FreeImage_GetScanLineBITMAP32()    with FreeImage_DestroyLockedArrayRGBQUAD()
   ' FreeImage_GetScanLineINT16()       with FreeImage_DestroyLockedArray()
   ' FreeImage_GetScanLineINT32()       with FreeImage_DestroyLockedArray()
   ' FreeImage_GetScanLineFLOAT()       with FreeImage_DestroyLockedArray()
   ' FreeImage_GetScanLineDOUBLE()      with FreeImage_DestroyLockedArray()
   ' FreeImage_GetScanLineCOMPLEX()     with FreeImage_DestroyLockedArrayFICOMPLEX()
   ' FreeImage_GetScanLineRGB16()       with FreeImage_DestroyLockedArrayFIRGB16()
   ' FreeImage_GetScanLineRGBA16()      with FreeImage_DestroyLockedArrayFIRGBA16()
   ' FreeImage_GetScanLineRGBF()        with FreeImage_DestroyLockedArrayFIRGBF()
   ' FreeImage_GetScanLineRGBAF()       with FreeImage_DestroyLockedArrayFIRGBAF()

   
   ' ensure, this is an array
   If (VarType(Data) And vbArray) Then
   
      ' data is a VB array, what means a SAFEARRAY in C/C++, that is
      ' passed through a ByRef Variant variable, that is a pointer to
      ' a VARIANTARG structure
      
      ' the VARIANTARG structure looks like this:
      
      ' typedef struct tagVARIANT VARIANTARG;
      ' struct tagVARIANT
      '     {
      '     Union
      '         {
      '         struct __tagVARIANT
      '             {
      '             VARTYPE vt;
      '             WORD wReserved1;
      '             WORD wReserved2;
      '             WORD wReserved3;
      '             Union
      '                 {
      '                 [...]
      '             SAFEARRAY *parray;    // used when not VT_BYREF
      '                 [...]
      '             SAFEARRAY **pparray;  // used when VT_BYREF
      '                 [...]
      
      ' the data element (SAFEARRAY) has an offset of 8, since VARTYPE
      ' and WORD both have a length of 2 bytes; the pointer to the
      ' VARIANTARG structure is the VarPtr of the Variant variable in VB
      
      ' getting the contents of the data element (in C/C++: *(data + 8))
      lpArrayPtr = pDeref(VarPtr(Data) + 8)
      
      ' call the 'FreeImage_DestroyLockedArrayByPtr' function to destroy
      ' the array properly
      Call FreeImage_DestroyLockedArrayByPtr(lpArrayPtr)
   Else
      
      FreeImage_DestroyLockedArray = -1
   End If

End Function

Public Function FreeImage_DestroyLockedArrayByPtr(ByVal ArrayPtr As Long) As Long

Dim lpSA As Long

   ' This function destroys a self-created array with a custom array
   ' descriptor by a pointer to the array variable.

   ' dereference the pointer once (in C/C++: *ArrayPtr)
   lpSA = pDeref(ArrayPtr)
   ' now 'lpSA' is a pointer to the actual SAFEARRAY structure
   ' and could be a null pointer when the array is not initialized
   ' then, we have nothing to do here but return (-1) to indicate
   ' an "error"
   If (lpSA) Then
      
      ' destroy the array descriptor
      Call SafeArrayDestroyDescriptor(lpSA)
      
      ' make 'lpSA' a null pointer, that is an uninitialized array;
      ' keep in mind, that we here use 'ArrayPtr' as a ByVal argument,
      ' since 'ArrayPtr' is a pointer to lpSA (the address of lpSA);
      ' we need to zero these four bytes, 'ArrayPtr' points to
      Call CopyMemory(ByVal ArrayPtr, 0&, 4)
   Else
      
      ' the array is already uninitialized, so return an "error" value
      FreeImage_DestroyLockedArrayByPtr = -1
   End If

End Function

Public Function FreeImage_DestroyLockedArrayRGBTRIPLE(ByRef Data() As RGBTRIPLE) As Long

   ' This function is a thin wrapper for 'FreeImage_DestroyLockedArrayByPtr'
   ' for destroying arrays of type 'RGBTRIPLE'.
   
   FreeImage_DestroyLockedArrayRGBTRIPLE = FreeImage_DestroyLockedArrayByPtr(VarPtrArray(Data))

End Function

Public Function FreeImage_DestroyLockedArrayRGBQUAD(ByRef Data() As RGBQUAD) As Long

   ' This function is a thin wrapper for 'FreeImage_DestroyLockedArrayByPtr'
   ' for destroying arrays of type 'RGBQUAD'.

   FreeImage_DestroyLockedArrayRGBQUAD = FreeImage_DestroyLockedArrayByPtr(VarPtrArray(Data))

End Function

Public Function FreeImage_DestroyLockedArrayFICOMPLEX(ByRef Data() As FICOMPLEX) As Long

   ' This function is a thin wrapper for 'FreeImage_DestroyLockedArrayByPtr'
   ' for destroying arrays of type 'FICOMPLEX'.

   FreeImage_DestroyLockedArrayFICOMPLEX = FreeImage_DestroyLockedArrayByPtr(VarPtrArray(Data))

End Function

Public Function FreeImage_DestroyLockedArrayFIRGB16(ByRef Data() As FIRGB16) As Long

   ' This function is a thin wrapper for 'FreeImage_DestroyLockedArrayByPtr'
   ' for destroying arrays of type 'FIRGB16'.

   FreeImage_DestroyLockedArrayFIRGB16 = FreeImage_DestroyLockedArrayByPtr(VarPtrArray(Data))

End Function

Public Function FreeImage_DestroyLockedArrayFIRGBA16(ByRef Data() As FIRGBA16) As Long

   ' This function is a thin wrapper for 'FreeImage_DestroyLockedArrayByPtr'
   ' for destroying arrays of type 'FIRGBA16'.

   FreeImage_DestroyLockedArrayFIRGBA16 = FreeImage_DestroyLockedArrayByPtr(VarPtrArray(Data))

End Function

Public Function FreeImage_DestroyLockedArrayFIRGBF(ByRef Data() As FIRGBF) As Long

   ' This function is a thin wrapper for 'FreeImage_DestroyLockedArrayByPtr'
   ' for destroying arrays of type 'FIRGBF'.

   FreeImage_DestroyLockedArrayFIRGBF = FreeImage_DestroyLockedArrayByPtr(VarPtrArray(Data))

End Function

Public Function FreeImage_DestroyLockedArrayFIRGBAF(ByRef Data() As FIRGBAF) As Long

   ' This function is a thin wrapper for 'FreeImage_DestroyLockedArrayByPtr'
   ' for destroying arrays of type 'FIRGBAF'.

   FreeImage_DestroyLockedArrayFIRGBAF = FreeImage_DestroyLockedArrayByPtr(VarPtrArray(Data))

End Function



'--------------------------------------------------------------------------------
' Private IOlePicture related helper functions
'--------------------------------------------------------------------------------

Private Function pGetIOlePictureFromContainer(ByRef Container As Object, _
                                     Optional ByVal IncludeDrawings As Boolean) As IPicture

   ' Returns a VB IOlePicture object (IPicture) from a VB image hosting control.
   ' See the inline documentation of function 'FreeImage_CreateFromImageContainer'
   ' for a detailed description of this helper function.

   If (Not Container Is Nothing) Then
      
      Select Case TypeName(Container)
      
      Case "PictureBox", "Form"
         If (IncludeDrawings) Then
            If (Not Container.AutoRedraw) Then
               Call Err.Raise(5, _
                              "MFreeImage", _
                              Error$(5) & vbCrLf & vbCrLf & _
                              "Custom drawings can only be included into the DIB when " & _
                              "the container's 'AutoRedraw' property is set to True.")
               Exit Function
            End If
            Set pGetIOlePictureFromContainer = Container.Image
         Else
            Set pGetIOlePictureFromContainer = Container.Picture
         End If
      
      Case Else
      
         Dim bHasPicture As Boolean
         Dim bHasImage As Boolean
         Dim bIsAutoRedraw As Boolean
         
         On Error Resume Next
         bHasPicture = (Container.Picture <> 0)
         bHasImage = (Container.Image <> 0)
         bIsAutoRedraw = Container.AutoRedraw
         On Error GoTo 0
         
         If ((IncludeDrawings) And _
             (bHasImage) And _
             (bIsAutoRedraw)) Then
            Set pGetIOlePictureFromContainer = Container.Image
         
         ElseIf (bHasPicture) Then
            Set pGetIOlePictureFromContainer = Container.Picture
            
         Else
            Call Err.Raise(5, _
                           "MFreeImage", _
                           Error$(5) & vbCrLf & vbCrLf & _
                           "Cannot create DIB from container control. Container " & _
                           "control has no 'Picture' property.")
         
         End If
      
      End Select
      
   End If

End Function



'--------------------------------------------------------------------------------
' Private image and color helper functions
'--------------------------------------------------------------------------------

Private Function pGetPreviousColorDepth(ByVal bpp As Long) As Long

   ' This function returns the 'previous' color depth of a given
   ' color depth. Here, 'previous' means the next smaller color
   ' depth.
   
   Select Case bpp
   
   Case 32
      pGetPreviousColorDepth = 24
   
   Case 24
      pGetPreviousColorDepth = 16
   
   Case 16
      pGetPreviousColorDepth = 15
   
   Case 15
      pGetPreviousColorDepth = 8
   
   Case 8
      pGetPreviousColorDepth = 4
      
   Case 4
      pGetPreviousColorDepth = 1
   
   End Select
   
End Function

Private Function pGetNextColorDepth(ByVal bpp As Long) As Long

   ' This function returns the 'next' color depth of a given
   ' color depth. Here, 'next' means the next greater color
   ' depth.
   
   Select Case bpp
   
   Case 1
      pGetNextColorDepth = 4
      
   Case 4
      pGetNextColorDepth = 8
      
   Case 8
      pGetNextColorDepth = 15
      
   Case 15
      pGetNextColorDepth = 16
      
   Case 16
      pGetNextColorDepth = 24
      
   Case 24
      pGetNextColorDepth = 32
      
   End Select
   
End Function



'--------------------------------------------------------------------------------
' Private metadata helper functions
'--------------------------------------------------------------------------------

Private Function pGetTagFromTagPtr(ByVal Model As FREE_IMAGE_MDMODEL, _
                                   ByVal TagPtr As Long) As FREE_IMAGE_TAG

Dim tTag As FITAG
Dim lTemp As Long
Dim i As Long

   ' This function converts data stored in a real FreeImage tag
   ' pointer (FITAG **tag) into a VB friendly structure FREE_IMAGE_TAG.
   
   If (TagPtr <> 0) Then
   
      ' this is like (only like!) tTag tag = (FITAG) TagPtr; in C/C++
      ' we copy Len(tTag) bytes from the address in TagPtr in to a
      ' private FITAG structure tTag so we have easy access to all
      ' FITAG members
      Call CopyMemory(tTag, ByVal pDeref(TagPtr), Len(tTag))
      
      With pGetTagFromTagPtr
      
         ' first fill all members expect 'Value' in our
         ' VB friendly FREE_IMAGE_TAG structure
         
         ' since we use this VB friendly FREE_IMAGE_TAG structure
         ' for later tag modification too, we also need to store the
         ' tag model and the pointer to the actual FreeImage FITAG
         ' structure
         .Model = Model
         .TagPtr = TagPtr
         
         ' although FITAG's 'count' and 'length' members are
         ' unsigned longs, we do not expect values greater
         ' than 2,147,483,647, so we store them in normal VB
         ' signed longs
         .Count = tTag.Count
         .Length = tTag.Length
         
         ' strings are stored as pointers to the actual string
         ' data in FITAG
         .Description = pGetStringFromPointerA(tTag.Description)
         .Key = pGetStringFromPointerA(tTag.Key)
         
         ' FITAG's 'id' and 'type' members are unsigned shorts;
         ' first of all 'id' may exceed the range of a signed
         ' short (Integer data type in VB), so we store them in
         ' signed longs and use CopyMemory for to keep the
         ' unsigned bit layout
         Call CopyMemory(.Id, tTag.Id, 2)
         Call CopyMemory(.Type, tTag.Type, 2)
         
         ' StringValue is the result of FreeImage_TagToString(); we
         ' also store this tag representation in our structure
         .StringValue = FreeImage_TagToString(Model, TagPtr)
         
         ' now comes the hard part, getting the tag's value
         
         Select Case .Type
         
         Case FIDT_BYTE, _
              FIDT_UNDEFINED
            If (.Count > 1) Then
               Dim abBytes() As Byte
               ' for a byte array, just redim a VB Byte array and
               ' copy Count bytes from the pointer
               ReDim abBytes(.Count - 1)
               Call CopyMemory(abBytes(0), ByVal tTag.Value, .Count)
               .Value = abBytes
            Else
               ' copy a single byte into a Long and assign
               ' with CByte()
               Call CopyMemory(lTemp, ByVal tTag.Value, 1)
               .Value = CByte(lTemp)
            End If
         
         Case FIDT_ASCII
            ' for an ASCII string, 'value' is just a pointer to the
            ' string's actual data
            .Value = pGetStringFromPointerA(tTag.Value)
            
         Case FIDT_SHORT
            Dim iTemp As Integer
            If (.Count > 1) Then
               ' for a unsigned long array, first redim Value to
               ' proper size
               ReDim .Value(.Count - 1)
               ' iterate over all items
               For i = 0 To .Count - 1
                  ' copy each value into a Long and
                  ' assign with FreeImage_UnsignedShort() to the
                  ' corresponding item in the (Variant) Value array
                  Call CopyMemory(iTemp, ByVal tTag.Value + i * 2, 2)
                  .Value(i) = FreeImage_UnsignedShort(iTemp)
               Next i
            Else
               ' copy a single byte into a Long and assign
               ' with FreeImgage_UnsignedShort()
               Call CopyMemory(iTemp, ByVal tTag.Value, 2)
               ' this works although FreeImage_UnsignedShort() takes
               ' an Integer parameter since lTemp was 0 before and
               ' we copied only 2 bytes so, VB's implicit conversion
               ' to Integer will never produce an overflow
               .Value = FreeImage_UnsignedShort(iTemp)
            End If
            
         Case FIDT_LONG, _
              FIDT_IFD
            If (.Count > 1) Then
               ' for a unsigned long array, first redim Value to
               ' proper size
               ReDim .Value(.Count - 1)
               ' iterate over all items
               For i = 0 To .Count - 1
                  ' copy each value into a (signed) Long and
                  ' assign with FreeImage_UnsignedLong() to the
                  ' corresponding item in the (Variant) Value array
                  Call CopyMemory(lTemp, ByVal tTag.Value + i * 4, 4)
                  .Value(i) = FreeImage_UnsignedLong(lTemp)
               Next i
            Else
               ' copy a single unsigned long into a (signed) Long and
               ' assign with FreeImage_UnsignedLong()
               Call CopyMemory(lTemp, ByVal tTag.Value, 2)
               .Value = FreeImage_UnsignedLong(lTemp)
            End If
            
         Case FIDT_RATIONAL, _
              FIDT_SRATIONAL
            ' rational values are always stored in the FREE_IMAGE_TAG
            ' structure's FIRATIONAL array 'RationalValue' so, allocate
            ' enough space in both the 'Value' and 'RationalValue'
            ' members to hold 'Count' items
            ReDim .Value(.Count - 1)
            ReDim .RationalValue(.Count - 1)
            For i = 0 To .Count - 1
               ' iterate over all items
               With .RationalValue(i)
                  ' for each item, copy both numerator and denominator
                  ' into a (signed) Long and assign it to the corresponding
                  ' member of the FIRATIONAL structure so, we first assume
                  ' havinge a signed rational (FIDT_SRATIONAL) here
                  Call CopyMemory(lTemp, ByVal tTag.Value + i * 8, 4)
                  .Numerator = lTemp
                  Call CopyMemory(lTemp, ByVal tTag.Value + i * 8 + 4, 4)
                  .Denominator = lTemp
               End With
               ' if we have an unsigned rational (FIDT_RATIONAL), convert
               ' numerator and denominator
               If (.Type = FIDT_RATIONAL) Then
                  ' convert with FreeImage_UnsignedLong()
                  With .RationalValue(i)
                     .Numerator = FreeImage_UnsignedLong(.Numerator)
                     .Denominator = FreeImage_UnsignedLong(.Denominator)
                  End With
                  ' normalze the unsigned rational value
                  Call pNormalizeRational(.RationalValue(i))
               Else
                  ' normalze the signed rational value
                  Call pNormalizeSRational(.RationalValue(i))
               End If
               ' store the current fraction's value (maybe only approximated) in
               ' the 'Value' member of the FREE_IMAGE_TAG structure, if the
               ' denominator is not zero
               If (.RationalValue(i).Denominator <> 0) Then
                  .Value(i) = .RationalValue(i).Numerator / .RationalValue(i).Denominator
               End If
            Next i
            
         Case FIDT_SBYTE
            If (.Count > 1) Then
               ' for a signed byte array, first redim Value to
               ' proper size
               ReDim .Value(.Count - 1)
               ' iterate over all items
               For i = 0 To .Count - 1
                  ' copy each signed byte value into a Long and
                  ' check, whether it is negative (bit 7 set)
                  Call CopyMemory(lTemp, ByVal tTag.Value, 1)
                  If (lTemp And 128) Then
                     ' if negative, calculate the negative value
                     ' and store it in an Integer
                     .Value(i) = CInt(-256 - (Not (lTemp - 1)))
                  Else
                     ' if positive, assign to Value as byte
                     .Value(i) = CByte(lTemp)
                  End If
               Next i
            Else
               ' copy a single signed byte into a Long and
               ' check, whether it is negative (bit 7 set)
               Call CopyMemory(lTemp, ByVal tTag.Value, 1)
               If (lTemp And 128) Then
                  ' if negative, calculate the negative value
                  ' and store it in an Integer
                  .Value = CInt(-256 - (Not (lTemp - 1)))
               Else
                  ' if positive, assign to Value as byte
                  .Value = CByte(lTemp)
               End If
            End If
            
         Case FIDT_SSHORT
            If (.Count > 1) Then
               Dim aiSShorts() As Integer
               ' for a signed short array, just redim a VB Integer array and
               ' copy Count bytes from the pointer
               ReDim aiSShorts(.Count - 1)
               Call CopyMemory(aiSShorts(0), ByVal tTag.Value, .Count * 2)
               .Value = aiSShorts
            Else
               ' copy a single signed short into a Long and assign
               ' with CInt()
               Call CopyMemory(lTemp, ByVal tTag.Value, 2)
               .Value = CInt(lTemp)
            End If
            
         Case FIDT_SLONG
            If (.Count > 1) Then
               Dim alSLongs() As Long
               ' for a signed long array, just redim a VB Long array and
               ' copy Count bytes from the pointer
               ReDim alSLongs(.Count - 1)
               Call CopyMemory(alSLongs(0), ByVal tTag.Value, .Count * 4)
               .Value = alSLongs
            Else
               ' copy a single signed long into a Long and assign
               ' directly
               Call CopyMemory(lTemp, ByVal tTag.Value, 4)
               .Value = lTemp
            End If
            
         Case FIDT_FLOAT
            If (.Count > 1) Then
               Dim asngFloats() As Single
               ' for a float array, just redim a VB Single array and
               ' copy Count bytes from the pointer
               ReDim asngFloats(.Count - 1)
               Call CopyMemory(asngFloats(0), ByVal tTag.Value, .Count * 4)
               .Value = asngFloats
            Else
               Dim sngFloat As Single
               ' copy a single float into a Single and assign
               ' directly
               Call CopyMemory(sngFloat, ByVal tTag.Value, 4)
               .Value = sngFloat
            End If
            
         Case FIDT_DOUBLE
            If (.Count > 1) Then
               Dim adblDoubles() As Double
               ' for a double array, just redim a VB Double array and
               ' copy Count bytes from the pointer
               ReDim adblDoubles(.Count - 1)
               Call CopyMemory(adblDoubles(0), ByVal tTag.Value, .Count * 8)
               .Value = adblDoubles
            Else
               Dim dblDouble As Double
               ' copy a single double into a Double and assign
               ' directly
               Call CopyMemory(dblDouble, ByVal tTag.Value, 8)
               .Value = dblDouble
            End If
            
         Case FIDT_PALETTE
            ' copy 'Count' palette entries (RGBQUAD) form the value
            ' pointer into the proper dimensioned array of RGBQUAD
            ReDim .Palette(.Count - 1)
            For i = 0 To .Count - 1
               Call CopyMemory(.Palette(i), ByVal tTag.Value + i * 4, 4)
            Next i
         
         End Select
      
      End With
   End If

End Function

Private Sub pNormalizeRational(ByRef Value As FIRATIONAL)

Dim vntCommon As Long

   ' This function normalizes an unsigned fraction stored in a FIRATIONAL
   ' structure by cancelling down the fraction. This is commonly done
   ' by dividing both numerator and denominator by their greates
   ' common divisor (gcd).
   ' Does nothing if any of numerator and denominator is 1 or 0.

   With Value
      If ((.Numerator <> 1) And (.Denominator <> 1) And _
          (.Numerator <> 0) And (.Denominator <> 0)) Then
         vntCommon = gcd(.Numerator, .Denominator)
         If (vntCommon <> 1) Then
            ' convert values back to an unsigned long (may
            ' result in a subtype Currency if the range of the
            ' VB Long is insufficient for storing the value!)
            .Numerator = FreeImage_UnsignedLong(.Numerator / vntCommon)
            .Denominator = FreeImage_UnsignedLong(.Denominator / vntCommon)
         End If
      End If
   End With

End Sub

Private Sub pNormalizeSRational(ByRef Value As FIRATIONAL)

Dim lCommon As Long

   ' This function normalizes a signed fraction stored in a FIRATIONAL
   ' structure by cancelling down the fraction. This is commonly done
   ' by dividing both numerator and denominator by their greates
   ' common divisor (gcd).
   ' Does nothing if any of numerator and denominator is 1 or 0.
   
   With Value
      If ((.Numerator <> 1) And (.Denominator <> 1) And _
          (.Numerator <> 0) And (.Denominator <> 0)) Then
         lCommon = gcd(.Numerator, .Denominator)
         If (lCommon <> 1) Then
            ' using the CLng() function for not to get
            ' a subtype Double here
            .Numerator = CLng(.Numerator / lCommon)
            .Denominator = CLng(.Denominator / lCommon)
         End If
      End If
      
      ' adjust the position of the negative sign if one is present:
      ' it should preceed the numerator, not the denominator
      If (.Denominator < 0) Then
         .Denominator = -.Denominator
         .Numerator = -.Numerator
      End If
   End With

End Sub

Private Function gcd(ByVal a As Variant, ByVal b As Variant) As Variant

Dim vntTemp As Variant

   ' calculate greatest common divisor

   Do While (b)
      vntTemp = b
      ' calculate b = a % b (modulo)
      ' this could be just:
      ' b = a Mod b
      ' but VB's Mod operator fails for unsigned
      ' long values stored in currency variables
      ' so, we use the mathematical definition of
      ' the modulo operator taken from Wikipedia.
      b = a - floor(a / b) * b
      a = vntTemp
   Loop
   gcd = a

End Function

Private Function floor(ByRef a As Variant) As Variant

   ' This is a VB version of the floor() function.
   If (a < 0) Then
      floor = VBA.Int(a)
   Else
      floor = -VBA.Fix(-a)
   End If

End Function

Private Function pTagToTagPtr(ByRef Tag As FREE_IMAGE_TAG) As Boolean

Dim tTagSave As FITAG
Dim lpTag As Long
Dim abValueBuffer() As Byte
Dim lLength As Long
Dim lCount As Long

   ' This function converts tag data stored in a VB friendly structure
   ' FREE_IMAGE_TAG into a real FreeImage tag pointer (FITAG **tag).
   
   ' This function is called, whenever tag data should be updated for an
   ' image, since the FreeImage's tag pointer remains valid during the
   ' whole lifetime of a DIB. So, changes written to that pointer (or
   ' even better, the FITAG structure at the address, the pointer points
   ' to), are real updates to the image's tag.

   With Tag
   
      lpTag = pDeref(.TagPtr)
      
      ' save current (FITAG) tag for an optional 'undo' operation
      ' invoked on failure
      Call CopyMemory(tTagSave, ByVal lpTag, Len(tTagSave))
      
      ' set tag id
      Call CopyMemory(ByVal lpTag + 8, .Id, 2)
      ' set tag type
      Call CopyMemory(ByVal lpTag + 10, .Type, 2)
      ' set tag key (use native FreeImage function to handle
      ' memory allocation)
      Call FreeImage_SetTagKey(.TagPtr, .Key)
      
      ' here, we update the tag's value
      ' generally, we create a plain byte buffer containing all the
      ' value's data and use FreeImage_SetTagValue() with the
      ' const void *value pointer set to the byte buffer's address.
      
      ' the variable abValueBuffer is our byte buffer that is,
      ' depending on the FreeImage tag data type, allocated and filled
      ' accordingly
      ' The variables 'lLength' and 'lCount' are set up correctly for
      ' each data type and will be filled into the FITAG structure
      ' before calling FreeImage_SetTagValue(); after all, the VB
      ' Tag structure's (FREE_IMAGE_TAG) 'Count' and 'Length' members
      ' are updated with 'lLength' and 'lCount'.
      
      Select Case .Type
      
      Case FIDT_ASCII
         ' use StrConv() to get an ASCII byte array from a VB String (BSTR)
         abValueBuffer = StrConv(.Value, vbFromUnicode)
         ' according to FreeImage's source code, both 'count' and 'length'
         ' must be the length of the string
         lCount = Len(.Value)
         lLength = lCount
         
      Case FIDT_PALETTE
         ' ensure, that there are at least 'Count' entries in the
         ' palette array
         lCount = .Count
         If (UBound(.Palette) + 1 < lCount) Then
            ' if not, adjust Count
            lCount = UBound(.Palette) + 1
         End If
         ' 4 bytes per element
         lLength = lCount * 4
         ' allocate buffer and copy data from Palatte array
         ReDim abValueBuffer(lLength - 1)
         Call CopyMemory(abValueBuffer(0), .Palette(LBound(.Palette)), lLength)
         
      Case FIDT_RATIONAL, _
           FIDT_SRATIONAL
         ' we use a helper function to get a byte buffer for any type of
         ' rational value
         lCount = pGetRationalValueBuffer(.RationalValue, abValueBuffer)
         If (lCount > .Count) Then
            lCount = .Count
         End If
         ' eight bytes per element (2 longs)
         lLength = lCount * 8
         
      Case Else
         ' we use a helper function to get a byte buffer for any other type
         lCount = pGetValueBuffer(.Value, .Type, lLength, abValueBuffer)
         If (lCount > .Count) Then
            lCount = .Count
         End If
         ' lLength was used as an OUT parameter when calling pGetValueBuffer
         ' it now contains the size of one element in bytes so, multiply with
         ' lCount to get the total length
         lLength = lLength * lCount
      
      End Select
      
      ' set tag length
      Call CopyMemory(ByVal lpTag + 16, lLength, 4)
      ' set tag count
      Call CopyMemory(ByVal lpTag + 12, lCount, 4)
       
      If (FreeImage_SetTagValue(.TagPtr, VarPtr(abValueBuffer(0))) <> 0) Then
         
         ' update Tag's members
         ' update Count
         .Count = lCount
         ' update Length
         .Length = lLength
         ' update StringValue
         .StringValue = FreeImage_TagToString(.Model, .TagPtr)
         pTagToTagPtr = True
      Else
      
         ' restore saved (FITAG) tag values on failure
         Call CopyMemory(ByVal lpTag, tTagSave, Len(tTagSave))
      End If
   
   End With

End Function

Private Function pGetValueBuffer(ByRef Value As Variant, _
                                 ByVal MetaDataVarType As FREE_IMAGE_MDTYPE, _
                                 ByRef ElementSize As Long, _
                                 ByRef Buffer() As Byte) As Long
                            
Dim lElementCount As Long
Dim bIsArray As Boolean
Dim abValueBuffer(7) As Byte
Dim cBytes As Long
Dim i As Long

   ' This function copies any value provided in the Variant 'Value'
   ' parameter into the byte array Buffer. 'Value' may contain an
   ' array as well. The values in the byte buffer are aligned to fit
   ' the FreeImage data type for tag values specified in
   ' 'MetaDataVarType'. For integer values, it does not matter, in
   ' which VB data type the values are provided. For example, it is
   ' possible to transform a provided byte array into a unsigned long
   ' array.
   
   ' The parameter 'ElementSize' is an OUT value, providing the actual
   ' size per element in the byte buffer in bytes to the caller.
   
   ' This function works for the types FIDT_BYTE, FIDT_SHORT, FIDT_LONG,
   ' FIDT_SBYTE , FIDT_SSHORT, FIDT_SLONG, FIDT_FLOAT, FIDT_DOUBLE
   ' and FIDT_IFD
                            
   ElementSize = pGetElementSize(MetaDataVarType)
   If (Not IsArray(Value)) Then
      lElementCount = 1
   Else
      On Error Resume Next
      lElementCount = UBound(Value) - LBound(Value) + 1
      On Error GoTo 0
      bIsArray = True
   End If
   
   If (lElementCount > 0) Then
      ReDim Buffer((lElementCount * ElementSize) - 1)
      
      If (Not bIsArray) Then
         cBytes = pGetVariantAsByteBuffer(Value, abValueBuffer)
         If (cBytes > ElementSize) Then
            cBytes = ElementSize
         End If
         Call CopyMemory(Buffer(0), abValueBuffer(0), cBytes)
      Else
         For i = LBound(Value) To UBound(Value)
            cBytes = pGetVariantAsByteBuffer(Value(i), abValueBuffer)
            If (cBytes > ElementSize) Then
               cBytes = ElementSize
            End If
            Call CopyMemory(Buffer(0 + (i * ElementSize)), abValueBuffer(0), cBytes)
         Next i
      End If
      
      pGetValueBuffer = lElementCount
   End If

End Function

Private Function pGetRationalValueBuffer(ByRef RationalValues() As FIRATIONAL, _
                                         ByRef Buffer() As Byte) As Long
                                         
Dim lElementCount As Long
Dim abValueBuffer(7) As Byte
Dim cBytes As Long
Dim i As Long

   ' This function copies a number of elements from the FIRATIONAL array
   ' 'RationalValues' into the byte buffer 'Buffer'.
   
   ' From the caller's point of view, this function is the same as
   ' 'pGetValueBuffer', except, it only works for arrays of FIRATIONAL.
   
   ' This function works for the types FIDT_RATIONAL and FIDT_SRATIONAL.
   
   lElementCount = UBound(RationalValues) - LBound(RationalValues) + 1
   ReDim Buffer(lElementCount * 8 + 1)
   
   For i = LBound(RationalValues) To UBound(RationalValues)
      cBytes = pGetVariantAsByteBuffer(RationalValues(i).Numerator, abValueBuffer)
      If (cBytes > 4) Then
         cBytes = 4
      End If
      Call CopyMemory(Buffer(0 + (i * 8)), abValueBuffer(0), cBytes)
      
      cBytes = pGetVariantAsByteBuffer(RationalValues(i).Denominator, abValueBuffer)
      If (cBytes > 4) Then
         cBytes = 4
      End If
      Call CopyMemory(Buffer(4 + (i * 8)), abValueBuffer(0), cBytes)
   Next i
   
   pGetRationalValueBuffer = lElementCount
                                         
End Function

Private Function pGetVariantAsByteBuffer(ByRef Value As Variant, _
                                         ByRef Buffer() As Byte) As Long

Dim lLength As Long

   ' This function fills a byte buffer 'Buffer' with data taken
   ' from a Variant parameter. Depending on the Variant's type and,
   ' width, it copies N (lLength) bytes into the buffer starting
   ' at the buffer's first byte at Buffer(0). The function returns
   ' the number of bytes copied.
   
   ' It is much easier to assign the Variant to a variable of
   ' the proper native type first, since gathering a Variant's
   ' actual value is a hard job to implement for each subtype.
   
   Select Case VarType(Value)
   
   Case vbByte
      Buffer(0) = Value
      lLength = 1
   
   Case vbInteger
      Dim iInteger As Integer
      iInteger = Value
      lLength = 2
      Call CopyMemory(Buffer(0), iInteger, lLength)
   
   Case vbLong
      Dim lLong As Long
      lLong = Value
      lLength = 4
      Call CopyMemory(Buffer(0), lLong, lLength)
   
   Case vbCurrency
      Dim cCurrency As Currency
      ' since the Currency data type is a so called scaled
      ' integer, we have to divide by 10.000 first to get the
      ' proper bit layout.
      cCurrency = Value / 10000
      lLength = 8
      Call CopyMemory(Buffer(0), cCurrency, lLength)
   
   Case vbSingle
      Dim sSingle As Single
      sSingle = Value
      lLength = 4
      Call CopyMemory(Buffer(0), sSingle, lLength)
   
   Case vbDouble
      Dim dblDouble As Double
      dblDouble = Value
      lLength = 8
      Call CopyMemory(Buffer(0), dblDouble, lLength)
   
   End Select
   
   pGetVariantAsByteBuffer = lLength
                                         
End Function

Private Function pGetElementSize(ByVal vt As FREE_IMAGE_MDTYPE) As Long

   ' This function returns the width in bytes for any of the
   ' FreeImage metadata tag data types.

   Select Case vt
   
   Case FIDT_BYTE, _
        FIDT_SBYTE, _
        FIDT_UNDEFINED, _
        FIDT_ASCII
      pGetElementSize = 1
   
   Case FIDT_SHORT, _
        FIDT_SSHORT
      pGetElementSize = 2

   Case FIDT_LONG, _
        FIDT_SLONG, _
        FIDT_FLOAT, _
        FIDT_PALETTE, _
        FIDT_IFD
      pGetElementSize = 4

   Case Else
      pGetElementSize = 8
      
   End Select

End Function



'--------------------------------------------------------------------------------
' Private pointer manipulation helper functions
'--------------------------------------------------------------------------------

Private Function pGetStringFromPointerA(ByRef Ptr As Long) As String

Dim abBuffer() As Byte
Dim lLength As Long

   ' This function creates and returns a VB BSTR variable from
   ' a C/C++ style string pointer by making a redundant deep
   ' copy of the string's characters.

   If (Ptr) Then
      ' get the length of the ANSI string pointed to by ptr
      lLength = lstrlen(Ptr)
      If (lLength) Then
         ' copy characters to a byte array
         ReDim abBuffer(lLength - 1)
         Call CopyMemory(abBuffer(0), ByVal Ptr, lLength)
         ' convert from byte array to unicode BSTR
         pGetStringFromPointerA = StrConv(abBuffer, vbUnicode)
      End If
   End If

End Function

Private Function pDeref(ByVal Ptr As Long) As Long

   ' This function dereferences a pointer and returns the
   ' contents as it's return value.
   
   ' in C/C++ this would be:
   ' return *(ptr);
   
   Call CopyMemory(pDeref, ByVal Ptr, 4)

End Function

Private Sub pSwap(ByVal lpSrc As Long, _
                  ByVal lpDst As Long)

Dim lpTmp As Long

   ' This function swaps two DWORD memory blocks pointed to
   ' by lpSrc and lpDst, whereby lpSrc and lpDst are actually
   ' no pointer types but contain the pointer's address.
   
   ' in C/C++ this would be:
   ' void pSwap(int lpSrc, int lpDst) {
   '   int tmp = *(int*)lpSrc;
   '   *(int*)lpSrc = *(int*)lpDst;
   '   *(int*)lpDst = tmp;
   ' }
  
   Call CopyMemory(lpTmp, ByVal lpSrc, 4)
   Call CopyMemory(ByVal lpSrc, ByVal lpDst, 4)
   Call CopyMemory(ByVal lpDst, lpTmp, 4)

End Sub

Private Function pGetMemoryBlockPtrFromVariant(ByRef Data As Variant, _
                                      Optional ByRef SizeInBytes As Long, _
                                      Optional ByRef ElementSize As Long) As Long
                                            
   ' This function returns the pointer to the memory block provided through
   ' the Variant parameter 'data', which could be either a Byte, Integer or
   ' Long array or the address of the memory block itself. In the last case,
   ' the parameter 'SizeInBytes' must not be omitted or zero, since it's
   ' correct value (the size of the memory block) can not be determined by
   ' the address only. So, the function fails, if 'SizeInBytes' is omitted
   ' or zero and 'data' is not an array but contains a Long value (the address
   ' of a memory block) by returning Null.
   
   ' If 'data' contains either a Byte, Integer or Long array, the pointer to
   ' the actual array data is returned. The parameter 'SizeInBytes' will
   ' be adjusted correctly, if it was less or equal zero upon entry.
   
   ' The function returns Null (zero) if there was no supported memory block
   ' provided.
   
   ' do we have an array?
   If (VarType(Data) And vbArray) Then
      Select Case (VarType(Data) And (Not vbArray))
      
      Case vbByte
         ElementSize = 1
         pGetMemoryBlockPtrFromVariant = pGetArrayPtrFromVariantArray(Data)
         If (pGetMemoryBlockPtrFromVariant) Then
            If (SizeInBytes <= 0) Then
               SizeInBytes = (UBound(Data) + 1)
            
            ElseIf (SizeInBytes > (UBound(Data) + 1)) Then
               SizeInBytes = (UBound(Data) + 1)
            
            End If
         End If
      
      Case vbInteger
         ElementSize = 2
         pGetMemoryBlockPtrFromVariant = pGetArrayPtrFromVariantArray(Data)
         If (pGetMemoryBlockPtrFromVariant) Then
            If (SizeInBytes <= 0) Then
               SizeInBytes = (UBound(Data) + 1) * 2
            
            ElseIf (SizeInBytes > ((UBound(Data) + 1) * 2)) Then
               SizeInBytes = (UBound(Data) + 1) * 2
            
            End If
         End If
      
      Case vbLong
         ElementSize = 4
         pGetMemoryBlockPtrFromVariant = pGetArrayPtrFromVariantArray(Data)
         If (pGetMemoryBlockPtrFromVariant) Then
            If (SizeInBytes <= 0) Then
               SizeInBytes = (UBound(Data) + 1) * 4
            
            ElseIf (SizeInBytes > ((UBound(Data) + 1) * 4)) Then
               SizeInBytes = (UBound(Data) + 1) * 4
            
            End If
         End If
      
      End Select
   Else
      ElementSize = 1
      If ((VarType(Data) = vbLong) And _
          (SizeInBytes >= 0)) Then
         pGetMemoryBlockPtrFromVariant = Data
      End If
   End If
                                            
End Function

Private Function pGetArrayPtrFromVariantArray(ByRef Data As Variant) As Long

Dim eVarType As VbVarType
Dim lDataPtr As Long

   ' This function returns a pointer to the first array element of
   ' a VB array (SAFEARRAY) that is passed through a Variant type
   ' parameter. (Don't try this at home...)
   
   ' cache VarType in variable
   eVarType = VarType(Data)
   
   ' ensure, this is an array
   If (eVarType And vbArray) Then
      
      ' data is a VB array, what means a SAFEARRAY in C/C++, that is
      ' passed through a ByRef Variant variable, that is a pointer to
      ' a VARIANTARG structure
      
      ' the VARIANTARG structure looks like this:
      
      ' typedef struct tagVARIANT VARIANTARG;
      ' struct tagVARIANT
      '     {
      '     Union
      '         {
      '         struct __tagVARIANT
      '             {
      '             VARTYPE vt;
      '             WORD wReserved1;
      '             WORD wReserved2;
      '             WORD wReserved3;
      '             Union
      '                 {
      '                 [...]
      '             SAFEARRAY *parray;    // used when not VT_BYREF
      '                 [...]
      '             SAFEARRAY **pparray;  // used when VT_BYREF
      '                 [...]
      
      ' the data element (SAFEARRAY) has an offset of 8, since VARTYPE
      ' and WORD both have a length of 2 bytes; the pointer to the
      ' VARIANTARG structure is the VarPtr of the Variant variable in VB
      
      ' getting the contents of the data element (in C/C++: *(data + 8))
      lDataPtr = pDeref(VarPtr(Data) + 8)
      
      ' dereference the pointer again (in C/C++: *(lDataPtr))
      lDataPtr = pDeref(lDataPtr)
      
      ' test, whether 'lDataPtr' now is a Null pointer
      ' in that case, the array is not yet initialized and so we can't dereference
      ' it another time since we have no permisson to acces address 0
      
      ' the contents of 'lDataPtr' may be Null now in case of an uninitialized
      ' array; then we can't access any of the SAFEARRAY members since the array
      ' variable doesn't event point to a SAFEARRAY structure, so we will return
      ' the null pointer
      
      If (lDataPtr) Then
         ' the contents of lDataPtr now is a pointer to the SAFEARRAY structure
            
         ' the SAFEARRAY structure looks like this:
         
         ' typedef struct FARSTRUCT tagSAFEARRAY {
         '    unsigned short cDims;       // Count of dimensions in this array.
         '    unsigned short fFeatures;   // Flags used by the SafeArray
         '                                // routines documented below.
         ' #if defined(WIN32)
         '    unsigned long cbElements;   // Size of an element of the array.
         '                                // Does not include size of
         '                                // pointed-to data.
         '    unsigned long cLocks;       // Number of times the array has been
         '                                // locked without corresponding unlock.
         ' #Else
         '    unsigned short cbElements;
         '    unsigned short cLocks;
         '    unsigned long handle;       // Used on Macintosh only.
         ' #End If
         '    void HUGEP* pvData;               // Pointer to the data.
         '    SAFEARRAYBOUND rgsabound[1];      // One bound for each dimension.
         ' } SAFEARRAY;
         
         ' since we live in WIN32, the pvData element has an offset
         ' of 12 bytes from the base address of the structure,
         ' so dereference the pvData pointer, what indeed is a pointer
         ' to the actual array (in C/C++: *(lDataPtr + 12))
         lDataPtr = pDeref(lDataPtr + 12)
      End If
      
      ' return this value
      pGetArrayPtrFromVariantArray = lDataPtr
      
      ' a more shorter form of this function would be:
      ' (doesn't work for uninitialized arrays, but will likely crash!)
      'pGetArrayPtrFromVariantArray = pDeref(pDeref(pDeref(VarPtr(data) + 8)) + 12)
   End If

End Function


#If (False) Then

' Enum STRETCH_MODE
Const STRETCH_MODE = 1
Const SM_BLACKONWHITE = 1
Const SM_WHITEONBLACK = 1
Const SM_COLORONCOLOR = 1

' Enum RASTER_OPERATOR
Const RASTER_OPERATOR = 1
Const ROP_SRCAND = 1
Const ROP_SRCCOPY = 1
Const ROP_SRCERASE = 1
Const ROP_SRCINVERT = 1
Const ROP_SRCPAINT = 1

' Enum DRAW_MODE
Const DRAW_MODE = 1
Const DM_DRAW_DEFAULT = 1
Const DM_MIRROR_NONE = 1
Const DM_MIRROR_VERTICAL = 1
Const DM_MIRROR_HORIZONTAL = 1
Const DM_MIRROR_BOTH = 1

' Enum HISTOGRAM_ORIENTATION
Const HISTOGRAM_ORIENTATION = 1
Const HOR_TOP_DOWN = 1
Const HOR_BOTTOM_UP = 1

' Enum FREE_IMAGE_ICC_COLOR_MODEL
Const FREE_IMAGE_ICC_COLOR_MODEL = 1
Const FIICC_COLOR_MODEL_RGB = 1
Const FIICC_COLOR_MODEL_CMYK = 1

' Enum FREE_IMAGE_FORMAT
Const FREE_IMAGE_FORMAT = 1
Const FIF_UNKNOWN = 1
Const FIF_BMP = 1
Const FIF_ICO = 1
Const FIF_JPEG = 1
Const FIF_JNG = 1
Const FIF_KOALA = 1
Const FIF_LBM = 1
Const FIF_IFF = 1
Const FIF_MNG = 1
Const FIF_PBM = 1
Const FIF_PBMRAW = 1
Const FIF_PCD = 1
Const FIF_PCX = 1
Const FIF_PGM = 1
Const FIF_PGMRAW = 1
Const FIF_PNG = 1
Const FIF_PPM = 1
Const FIF_PPMRAW = 1
Const FIF_RAS = 1
Const FIF_TARGA = 1
Const FIF_TIFF = 1
Const FIF_WBMP = 1
Const FIF_PSD = 1
Const FIF_CUT = 1
Const FIF_XBM = 1
Const FIF_XPM = 1
Const FIF_DDS = 1
Const FIF_GIF = 1
Const FIF_HDR = 1
Const FIF_FAXG3 = 1
Const FIF_SGI = 1
Const FIF_EXR = 1
Const FIF_J2K = 1
Const FIF_JP2 = 1
Const FIF_PFM = 1
Const FIF_PICT = 1
Const FIF_RAW = 1
Const FIF_WEBP = 1
Const FIF_JXR = 1

' Enum FREE_IMAGE_LOAD_OPTIONS
Const FREE_IMAGE_LOAD_OPTIONS = 1
Const FILO_LOAD_NOPIXELS = 1
Const FILO_LOAD_DEFAULT = 1
Const FILO_GIF_DEFAULT = 1
Const FILO_GIF_LOAD256 = 1
Const FILO_GIF_PLAYBACK = 1
Const FILO_ICO_DEFAULT = 1
Const FILO_ICO_MAKEALPHA = 1
Const FILO_JPEG_DEFAULT = 1
Const FILO_JPEG_FAST = 1
Const FILO_JPEG_ACCURATE = 1
Const FILO_JPEG_CMYK = 1
Const FILO_JPEG_EXIFROTATE = 1
Const FILO_JPEG_GREYSCALE = 1
Const FILO_PCD_DEFAULT = 1
Const FILO_PCD_BASE = 1
Const FILO_PCD_BASEDIV4 = 1
Const FILO_PCD_BASEDIV16 = 1
Const FILO_PNG_DEFAULT = 1
Const FILO_PNG_IGNOREGAMMA = 1
Const FILO_PSD_CMYK = 1
Const FILO_PSD_LAB = 1
Const FILO_RAW_DEFAULT = 1
Const FILO_RAW_PREVIEW = 1
Const FILO_RAW_DISPLAY = 1
Const FILO_RAW_HALFSIZE = 1
Const FILO_TARGA_DEFAULT = 1
Const FILO_TARGA_LOAD_RGB888 = 1
Const FISO_TIFF_DEFAULT = 1
Const FISO_TIFF_CMYK = 1

' Enum FREE_IMAGE_SAVE_OPTIONS
Const FREE_IMAGE_SAVE_OPTIONS = 1
Const FISO_SAVE_DEFAULT = 1
Const FISO_BMP_DEFAULT = 1
Const FISO_BMP_SAVE_RLE = 1
Const FISO_EXR_DEFAULT = 1
Const FISO_EXR_FLOAT = 1
Const FISO_EXR_NONE = 1
Const FISO_EXR_ZIP = 1
Const FISO_EXR_PIZ = 1
Const FISO_EXR_PXR24 = 1
Const FISO_EXR_B44 = 1
Const FISO_EXR_LC = 1
Const FISO_JPEG_DEFAULT = 1
Const FISO_JPEG_QUALITYSUPERB = 1
Const FISO_JPEG_QUALITYGOOD = 1
Const FISO_JPEG_QUALITYNORMAL = 1
Const FISO_JPEG_QUALITYAVERAGE = 1
Const FISO_JPEG_QUALITYBAD = 1
Const FISO_JPEG_PROGRESSIVE = 1
Const FISO_JPEG_SUBSAMPLING_411 = 1
Const FISO_JPEG_SUBSAMPLING_420 = 1
Const FISO_JPEG_SUBSAMPLING_422 = 1
Const FISO_JPEG_SUBSAMPLING_444 = 1
Const FISO_JPEG_OPTIMIZE = 1
Const FISO_JPEG_BASELINE = 1
Const FISO_PNG_Z_BEST_SPEED = 1
Const FISO_PNG_Z_DEFAULT_COMPRESSION = 1
Const FISO_PNG_Z_BEST_COMPRESSION = 1
Const FISO_PNG_Z_NO_COMPRESSION = 1
Const FISO_PNG_INTERLACED = 1
Const FISO_PNM_DEFAULT = 1
Const FISO_PNM_SAVE_RAW = 1
Const FISO_PNM_SAVE_ASCII = 1
Const FISO_TARGA_SAVE_RLE = 1
Const FISO_TIFF_DEFAULT = 1
Const FISO_TIFF_CMYK = 1
Const FISO_TIFF_PACKBITS = 1
Const FISO_TIFF_DEFLATE = 1
Const FISO_TIFF_ADOBE_DEFLATE = 1
Const FISO_TIFF_NONE = 1
Const FISO_TIFF_CCITTFAX3 = 1
Const FISO_TIFF_CCITTFAX4 = 1
Const FISO_TIFF_LZW = 1
Const FISO_TIFF_JPEG = 1
Const FISO_TIFF_LOGLUV = 1
Const FISO_WEBP_LOSSLESS = 1
Const FISO_JXR_LOSSLESS = 1
Const FISO_JXR_PROGRESSIVE = 1

' Enum FREE_IMAGE_TYPE
Const FREE_IMAGE_TYPE = 1
Const FIT_UNKNOWN = 1
Const FIT_BITMAP = 1
Const FIT_UINT16 = 1
Const FIT_INT16 = 1
Const FIT_UINT32 = 1
Const FIT_INT32 = 1
Const FIT_FLOAT = 1
Const FIT_DOUBLE = 1
Const FIT_COMPLEX = 1
Const FIT_RGB16 = 1
Const FIT_RGBA16 = 1
Const FIT_RGBF = 1
Const FIT_RGBAF = 1

' Enum FREE_IMAGE_COLOR_TYPE
Const FREE_IMAGE_COLOR_TYPE = 1
Const FIC_MINISWHITE = 1
Const FIC_MINISBLACK = 1
Const FIC_RGB = 1
Const FIC_PALETTE = 1
Const FIC_RGBALPHA = 1
Const FIC_CMYK = 1

' Enum FREE_IMAGE_QUANTIZE
Const FREE_IMAGE_QUANTIZE = 1
Const FIQ_WUQUANT = 1
Const FIQ_NNQUANT = 1

' Enum FREE_IMAGE_DITHER
Const FREE_IMAGE_DITHER = 1
Const FID_FS = 1
Const FID_BAYER4x4 = 1
Const FID_BAYER8x8 = 1
Const FID_CLUSTER6x6 = 1
Const FID_CLUSTER8x8 = 1
Const FID_CLUSTER16x16 = 1
Const FID_BAYER16x16 = 1

' Enum FREE_IMAGE_JPEG_OPERATION
Const FREE_IMAGE_JPEG_OPERATION = 1
Const FIJPEG_OP_NONE = 1
Const FIJPEG_OP_FLIP_H = 1
Const FIJPEG_OP_FLIP_V = 1
Const FIJPEG_OP_TRANSPOSE = 1
Const FIJPEG_OP_TRANSVERSE = 1
Const FIJPEG_OP_ROTATE_90 = 1
Const FIJPEG_OP_ROTATE_180 = 1
Const FIJPEG_OP_ROTATE_270 = 1

' Enum FREE_IMAGE_TMO
Const FREE_IMAGE_TMO = 1
Const FITMO_DRAGO03 = 1
Const FITMO_REINHARD05 = 1
Const FITMO_FATTAL02 = 1

' Enum FREE_IMAGE_FILTER
Const FREE_IMAGE_FILTER = 1
Const FILTER_BOX = 1
Const FILTER_BICUBIC = 1
Const FILTER_BILINEAR = 1
Const FILTER_BSPLINE = 1
Const FILTER_CATMULLROM = 1
Const FILTER_LANCZOS3 = 1

' Enum FREE_IMAGE_COLOR_CHANNEL
Const FREE_IMAGE_COLOR_CHANNEL = 1
Const FICC_RGB = 1
Const FICC_RED = 1
Const FICC_GREEN = 1
Const FICC_BLUE = 1
Const FICC_ALPHA = 1
Const FICC_BLACK = 1
Const FICC_REAL = 1
Const FICC_IMAG = 1
Const FICC_MAG = 1
Const FICC_PHASE = 1

' Enum FREE_IMAGE_MDTYPE
Const FREE_IMAGE_MDTYPE = 1
Const FIDT_NOTYPE = 1
Const FIDT_BYTE = 1
Const FIDT_ASCII = 1
Const FIDT_SHORT = 1
Const FIDT_LONG = 1
Const FIDT_RATIONAL = 1
Const FIDT_SBYTE = 1
Const FIDT_UNDEFINED = 1
Const FIDT_SSHORT = 1
Const FIDT_SLONG = 1
Const FIDT_SRATIONAL = 1
Const FIDT_FLOAT = 1
Const FIDT_DOUBLE = 1
Const FIDT_IFD = 1
Const FIDT_PALETTE = 1

' Enum FREE_IMAGE_MDMODEL
Const FREE_IMAGE_MDMODEL = 1
Const FIMD_NODATA = 1
Const FIMD_COMMENTS = 1
Const FIMD_EXIF_MAIN = 1
Const FIMD_EXIF_EXIF = 1
Const FIMD_EXIF_GPS = 1
Const FIMD_EXIF_MAKERNOTE = 1
Const FIMD_EXIF_INTEROP = 1
Const FIMD_IPTC = 1
Const FIMD_XMP = 1
Const FIMD_GEOTIFF = 1
Const FIMD_ANIMATION = 1
Const FIMD_CUSTOM = 1
Const FIMD_EXIF_RAW = 1

' Enum FREE_IMAGE_FRAME_DISPOSAL_METHODS
Const FREE_IMAGE_FRAME_DISPOSAL_METHODS = 1
Const FIFD_GIF_DISPOSAL_UNSPECIFIED = 1
Const FIFD_GIF_DISPOSAL_LEAVE = 1
Const FIFD_GIF_DISPOSAL_BACKGROUND = 1
Const FIFD_GIF_DISPOSAL_PREVIOUS = 1

' Enum FREE_IMAGE_COLOR_OPTIONS
Const FREE_IMAGE_COLOR_OPTIONS = 1
Const FI_COLOR_IS_RGB_COLOR = 1
Const FI_COLOR_IS_RGBA_COLOR = 1
Const FI_COLOR_FIND_EQUAL_COLOR = 1
Const FI_COLOR_ALPHA_IS_INDEX = 1

' Enum FREE_IMAGE_CONVERSION_FLAGS
Const FREE_IMAGE_CONVERSION_FLAGS = 1
Const FICF_MONOCHROME = 1
Const FICF_MONOCHROME_THRESHOLD = 1
Const FICF_MONOCHROME_DITHER = 1
Const FICF_GREYSCALE_4BPP = 1
Const FICF_PALLETISED_8BPP = 1
Const FICF_GREYSCALE_8BPP = 1
Const FICF_GREYSCALE = 1
Const FICF_RGB_15BPP = 1
Const FICF_RGB_16BPP = 1
Const FICF_RGB_24BPP = 1
Const FICF_RGB_32BPP = 1
Const FICF_RGB_ALPHA = 1
Const FICF_KEEP_UNORDERED_GREYSCALE_PALETTE = 1
Const FICF_REORDER_GREYSCALE_PALETTE = 1

' Enum FREE_IMAGE_COLOR_DEPTH
Const FREE_IMAGE_COLOR_DEPTH = 1
Const FICD_AUTO = 1
Const FICD_MONOCHROME = 1
Const FICD_MONOCHROME_THRESHOLD = 1
Const FICD_MONOCHROME_DITHER = 1
Const FICD_1BPP = 1
Const FICD_4BPP = 1
Const FICD_8BPP = 1
Const FICD_15BPP = 1
Const FICD_16BPP = 1
Const FICD_24BPP = 1
Const FICD_32BPP = 1

' Enum FREE_IMAGE_ADJUST_MODE
Const FREE_IMAGE_ADJUST_MODE = 1
Const AM_STRECH = 1
Const AM_DEFAULT = 1
Const AM_ADJUST_BOTH = 1
Const AM_ADJUST_WIDTH = 1
Const AM_ADJUST_HEIGHT = 1
Const AM_ADJUST_OPTIMAL_SIZE = 1

' Enum FREE_IMAGE_MASK_FLAGS
Const FREE_IMAGE_MASK_FLAGS = 1
Const FIMF_MASK_NONE = 1
Const FIMF_MASK_FULL_TRANSPARENCY = 1
Const FIMF_MASK_ALPHA_TRANSPARENCY = 1
Const FIMF_MASK_COLOR_TRANSPARENCY = 1
Const FIMF_MASK_FORCE_TRANSPARENCY = 1
Const FIMF_MASK_INVERSE_MASK = 1

' Enum FREE_IMAGE_MASK_CREATION_OPTION_FLAGS
Const FREE_IMAGE_MASK_CREATION_OPTION_FLAGS = 1
Const MCOF_CREATE_MASK_IMAGE = 1
Const MCOF_MODIFY_SOURCE_IMAGE = 1
Const MCOF_CREATE_AND_MODIFY = 1

' Enum FREE_IMAGE_TRANSPARENCY_STATE_FLAGS
Const FREE_IMAGE_TRANSPARENCY_STATE_FLAGS = 1
Const FITSF_IGNORE_TRANSPARENCY = 1
Const FITSF_NONTRANSPARENT = 1
Const FITSF_TRANSPARENT = 1
Const FITSF_INCLUDE_ALPHA_TRANSPARENCY = 1

' Enum FREE_IMAGE_ICON_TRANSPARENCY_OPTION_FLAGS
Const FREE_IMAGE_ICON_TRANSPARENCY_OPTION_FLAGS = 1
Const ITOF_NO_TRANSPARENCY = 1
Const ITOF_USE_TRANSPARENCY_INFO = 1
Const ITOF_USE_TRANSPARENCY_INFO_ONLY = 1
Const ITOF_USE_COLOR_TRANSPARENCY = 1
Const ITOF_USE_COLOR_TRANSPARENCY_ONLY = 1
Const ITOF_USE_TRANSPARENCY_INFO_OR_COLOR = 1
Const ITOF_USE_DEFAULT_TRANSPARENCY = 1
Const ITOF_USE_COLOR_TOP_LEFT_PIXEL = 1
Const ITOF_USE_COLOR_FIRST_PIXEL = 1
Const ITOF_USE_COLOR_TOP_RIGHT_PIXEL = 1
Const ITOF_USE_COLOR_BOTTOM_LEFT_PIXEL = 1
Const ITOF_USE_COLOR_BOTTOM_RIGHT_PIXEL = 1
Const ITOF_USE_COLOR_SPECIFIED = 1
Const ITOF_FORCE_TRANSPARENCY_INFO = 1

#End If
