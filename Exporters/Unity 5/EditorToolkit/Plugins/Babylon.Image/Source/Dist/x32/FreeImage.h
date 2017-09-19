// ==========================================================
// FreeImage 3
//
// Design and implementation by
// - Floris van den Berg (flvdberg@wxs.nl)
// - Hervé Drolon (drolon@infonie.fr)
//
// Contributors:
// - see changes log named 'Whatsnew.txt', see header of each .h and .cpp file
//
// This file is part of FreeImage 3
//
// COVERED CODE IS PROVIDED UNDER THIS LICENSE ON AN "AS IS" BASIS, WITHOUT WARRANTY
// OF ANY KIND, EITHER EXPRESSED OR IMPLIED, INCLUDING, WITHOUT LIMITATION, WARRANTIES
// THAT THE COVERED CODE IS FREE OF DEFECTS, MERCHANTABLE, FIT FOR A PARTICULAR PURPOSE
// OR NON-INFRINGING. THE ENTIRE RISK AS TO THE QUALITY AND PERFORMANCE OF THE COVERED
// CODE IS WITH YOU. SHOULD ANY COVERED CODE PROVE DEFECTIVE IN ANY RESPECT, YOU (NOT
// THE INITIAL DEVELOPER OR ANY OTHER CONTRIBUTOR) ASSUME THE COST OF ANY NECESSARY
// SERVICING, REPAIR OR CORRECTION. THIS DISCLAIMER OF WARRANTY CONSTITUTES AN ESSENTIAL
// PART OF THIS LICENSE. NO USE OF ANY COVERED CODE IS AUTHORIZED HEREUNDER EXCEPT UNDER
// THIS DISCLAIMER.
//
// Use at your own risk!
// ==========================================================

#ifndef FREEIMAGE_H
#define FREEIMAGE_H

// Version information ------------------------------------------------------

#define FREEIMAGE_MAJOR_VERSION   3
#define FREEIMAGE_MINOR_VERSION   17
#define FREEIMAGE_RELEASE_SERIAL  0

// Compiler options ---------------------------------------------------------

#include <wchar.h>	// needed for UNICODE functions

#if defined(FREEIMAGE_LIB)
	#define DLL_API
	#define DLL_CALLCONV
#else
	#if defined(_WIN32) || defined(__WIN32__)
		#define DLL_CALLCONV __stdcall
		// The following ifdef block is the standard way of creating macros which make exporting 
		// from a DLL simpler. All files within this DLL are compiled with the FREEIMAGE_EXPORTS
		// symbol defined on the command line. this symbol should not be defined on any project
		// that uses this DLL. This way any other project whose source files include this file see 
		// DLL_API functions as being imported from a DLL, wheras this DLL sees symbols
		// defined with this macro as being exported.
		#ifdef FREEIMAGE_EXPORTS
			#define DLL_API __declspec(dllexport)
		#else
			#define DLL_API __declspec(dllimport)
		#endif // FREEIMAGE_EXPORTS
	#else 
		// try the gcc visibility support (see http://gcc.gnu.org/wiki/Visibility)
		#if defined(__GNUC__) && ((__GNUC__ >= 4) || (__GNUC__ == 3 && __GNUC_MINOR__ >= 4))
			#ifndef GCC_HASCLASSVISIBILITY
				#define GCC_HASCLASSVISIBILITY
			#endif
		#endif // __GNUC__
		#define DLL_CALLCONV
		#if defined(GCC_HASCLASSVISIBILITY)
			#define DLL_API __attribute__ ((visibility("default")))
		#else
			#define DLL_API
		#endif		
	#endif // WIN32 / !WIN32
#endif // FREEIMAGE_LIB

// Endianness:
// Some versions of gcc may have BYTE_ORDER or __BYTE_ORDER defined.
// If your big endian system isn't being detected, add an OS specific check
// or define any of FREEIMAGE_BIGENDIAN and FREEIMAGE_LITTLEENDIAN directly
// to specify the desired endianness.
#if (!defined(FREEIMAGE_BIGENDIAN) && !defined(FREEIMAGE_LITTLEENDIAN))
	#if (defined(BYTE_ORDER) && BYTE_ORDER==BIG_ENDIAN) || (defined(__BYTE_ORDER) && __BYTE_ORDER==__BIG_ENDIAN) || defined(__BIG_ENDIAN__)
		#define FREEIMAGE_BIGENDIAN
	#endif // BYTE_ORDER
#endif // !FREEIMAGE_[BIG|LITTLE]ENDIAN

// Color-Order:
// The specified order of color components red, green and blue affects 24-
// and 32-bit images of type FIT_BITMAP as well as the colors that are part
// of a color palette. All other images always use RGB order. By default,
// color order is coupled to endianness:
// little-endian -> BGR
// big-endian    -> RGB
// However, you can always define FREEIMAGE_COLORORDER to any of the known
// orders FREEIMAGE_COLORORDER_BGR (0) and FREEIMAGE_COLORORDER_RGB (1) to
// specify your preferred color order.
#define FREEIMAGE_COLORORDER_BGR    0
#define FREEIMAGE_COLORORDER_RGB    1
#if (!defined(FREEIMAGE_COLORORDER)) || ((FREEIMAGE_COLORORDER != FREEIMAGE_COLORORDER_BGR) && (FREEIMAGE_COLORORDER != FREEIMAGE_COLORORDER_RGB))
	#if defined(FREEIMAGE_BIGENDIAN)
		#define FREEIMAGE_COLORORDER FREEIMAGE_COLORORDER_RGB
	#else
		#define FREEIMAGE_COLORORDER FREEIMAGE_COLORORDER_BGR
	#endif // FREEIMAGE_BIGENDIAN
#endif // FREEIMAGE_COLORORDER

// Ensure 4-byte enums if we're using Borland C++ compilers
#if defined(__BORLANDC__)
#pragma option push -b
#endif

// For C compatibility --------------------------------------------------------

#ifdef __cplusplus
#define FI_DEFAULT(x)	= x
#define FI_ENUM(x)      enum x
#define FI_STRUCT(x)	struct x
#else
#define FI_DEFAULT(x)
#define FI_ENUM(x)      typedef int x; enum x
#define FI_STRUCT(x)	typedef struct x x; struct x
#endif

// Bitmap types -------------------------------------------------------------

FI_STRUCT (FIBITMAP) { void *data; };
FI_STRUCT (FIMULTIBITMAP) { void *data; };

// Types used in the library (directly copied from Windows) -----------------

#if defined(__MINGW32__) && defined(_WINDOWS_H)
#define _WINDOWS_	// prevent a bug in MinGW32
#endif // __MINGW32__

#ifndef _WINDOWS_
#define _WINDOWS_

#ifndef FALSE
#define FALSE 0
#endif
#ifndef TRUE
#define TRUE 1
#endif
#ifndef NULL
#define NULL 0
#endif

#ifndef SEEK_SET
#define SEEK_SET  0
#define SEEK_CUR  1
#define SEEK_END  2
#endif

#ifndef _MSC_VER
// define portable types for 32-bit / 64-bit OS
#include <inttypes.h>
typedef int32_t BOOL;
typedef uint8_t BYTE;
typedef uint16_t WORD;
typedef uint32_t DWORD;
typedef int32_t LONG;
typedef int64_t INT64;
typedef uint64_t UINT64;
#else
// MS is not C99 ISO compliant
typedef long BOOL;
typedef unsigned char BYTE;
typedef unsigned short WORD;
typedef unsigned long DWORD;
typedef long LONG;
typedef signed __int64 INT64;
typedef unsigned __int64 UINT64;
#endif // _MSC_VER

#if (defined(_WIN32) || defined(__WIN32__))
#pragma pack(push, 1)
#else
#pragma pack(1)
#endif // WIN32

typedef struct tagRGBQUAD {
#if FREEIMAGE_COLORORDER == FREEIMAGE_COLORORDER_BGR
  BYTE rgbBlue;
  BYTE rgbGreen;
  BYTE rgbRed;
#else
  BYTE rgbRed;
  BYTE rgbGreen;
  BYTE rgbBlue;
#endif // FREEIMAGE_COLORORDER
  BYTE rgbReserved;
} RGBQUAD;

typedef struct tagRGBTRIPLE {
#if FREEIMAGE_COLORORDER == FREEIMAGE_COLORORDER_BGR
  BYTE rgbtBlue;
  BYTE rgbtGreen;
  BYTE rgbtRed;
#else
  BYTE rgbtRed;
  BYTE rgbtGreen;
  BYTE rgbtBlue;
#endif // FREEIMAGE_COLORORDER
} RGBTRIPLE;

#if (defined(_WIN32) || defined(__WIN32__))
#pragma pack(pop)
#else
#pragma pack()
#endif // WIN32

typedef struct tagBITMAPINFOHEADER{
  DWORD biSize;
  LONG  biWidth; 
  LONG  biHeight; 
  WORD  biPlanes; 
  WORD  biBitCount;
  DWORD biCompression; 
  DWORD biSizeImage; 
  LONG  biXPelsPerMeter; 
  LONG  biYPelsPerMeter; 
  DWORD biClrUsed; 
  DWORD biClrImportant;
} BITMAPINFOHEADER, *PBITMAPINFOHEADER; 

typedef struct tagBITMAPINFO { 
  BITMAPINFOHEADER bmiHeader; 
  RGBQUAD          bmiColors[1];
} BITMAPINFO, *PBITMAPINFO;

#endif // _WINDOWS_

// Types used in the library (specific to FreeImage) ------------------------

#if (defined(_WIN32) || defined(__WIN32__))
#pragma pack(push, 1)
#else
#pragma pack(1)
#endif // WIN32

/** 48-bit RGB 
*/
typedef struct tagFIRGB16 {
	WORD red;
	WORD green;
	WORD blue;
} FIRGB16;

/** 64-bit RGBA
*/
typedef struct tagFIRGBA16 {
	WORD red;
	WORD green;
	WORD blue;
	WORD alpha;
} FIRGBA16;

/** 96-bit RGB Float
*/
typedef struct tagFIRGBF {
	float red;
	float green;
	float blue;
} FIRGBF;

/** 128-bit RGBA Float
*/
typedef struct tagFIRGBAF {
	float red;
	float green;
	float blue;
	float alpha;
} FIRGBAF;

/** Data structure for COMPLEX type (complex number)
*/
typedef struct tagFICOMPLEX {
    /// real part
	double r;
	/// imaginary part
    double i;
} FICOMPLEX;

#if (defined(_WIN32) || defined(__WIN32__))
#pragma pack(pop)
#else
#pragma pack()
#endif // WIN32

// Indexes for byte arrays, masks and shifts for treating pixels as words ---
// These coincide with the order of RGBQUAD and RGBTRIPLE -------------------

#ifndef FREEIMAGE_BIGENDIAN
#if FREEIMAGE_COLORORDER == FREEIMAGE_COLORORDER_BGR
// Little Endian (x86 / MS Windows, Linux) : BGR(A) order
#define FI_RGBA_RED				2
#define FI_RGBA_GREEN			1
#define FI_RGBA_BLUE			0
#define FI_RGBA_ALPHA			3
#define FI_RGBA_RED_MASK		0x00FF0000
#define FI_RGBA_GREEN_MASK		0x0000FF00
#define FI_RGBA_BLUE_MASK		0x000000FF
#define FI_RGBA_ALPHA_MASK		0xFF000000
#define FI_RGBA_RED_SHIFT		16
#define FI_RGBA_GREEN_SHIFT		8
#define FI_RGBA_BLUE_SHIFT		0
#define FI_RGBA_ALPHA_SHIFT		24
#else
// Little Endian (x86 / MaxOSX) : RGB(A) order
#define FI_RGBA_RED				0
#define FI_RGBA_GREEN			1
#define FI_RGBA_BLUE			2
#define FI_RGBA_ALPHA			3
#define FI_RGBA_RED_MASK		0x000000FF
#define FI_RGBA_GREEN_MASK		0x0000FF00
#define FI_RGBA_BLUE_MASK		0x00FF0000
#define FI_RGBA_ALPHA_MASK		0xFF000000
#define FI_RGBA_RED_SHIFT		0
#define FI_RGBA_GREEN_SHIFT		8
#define FI_RGBA_BLUE_SHIFT		16
#define FI_RGBA_ALPHA_SHIFT		24
#endif // FREEIMAGE_COLORORDER
#else
#if FREEIMAGE_COLORORDER == FREEIMAGE_COLORORDER_BGR
// Big Endian (PPC / none) : BGR(A) order
#define FI_RGBA_RED				2
#define FI_RGBA_GREEN			1
#define FI_RGBA_BLUE			0
#define FI_RGBA_ALPHA			3
#define FI_RGBA_RED_MASK		0x0000FF00
#define FI_RGBA_GREEN_MASK		0x00FF0000
#define FI_RGBA_BLUE_MASK		0xFF000000
#define FI_RGBA_ALPHA_MASK		0x000000FF
#define FI_RGBA_RED_SHIFT		8
#define FI_RGBA_GREEN_SHIFT		16
#define FI_RGBA_BLUE_SHIFT		24
#define FI_RGBA_ALPHA_SHIFT		0
#else
// Big Endian (PPC / Linux, MaxOSX) : RGB(A) order
#define FI_RGBA_RED				0
#define FI_RGBA_GREEN			1
#define FI_RGBA_BLUE			2
#define FI_RGBA_ALPHA			3
#define FI_RGBA_RED_MASK		0xFF000000
#define FI_RGBA_GREEN_MASK		0x00FF0000
#define FI_RGBA_BLUE_MASK		0x0000FF00
#define FI_RGBA_ALPHA_MASK		0x000000FF
#define FI_RGBA_RED_SHIFT		24
#define FI_RGBA_GREEN_SHIFT		16
#define FI_RGBA_BLUE_SHIFT		8
#define FI_RGBA_ALPHA_SHIFT		0
#endif // FREEIMAGE_COLORORDER
#endif // FREEIMAGE_BIGENDIAN

#define FI_RGBA_RGB_MASK		(FI_RGBA_RED_MASK|FI_RGBA_GREEN_MASK|FI_RGBA_BLUE_MASK)

// The 16bit macros only include masks and shifts, since each color element is not byte aligned

#define FI16_555_RED_MASK		0x7C00
#define FI16_555_GREEN_MASK		0x03E0
#define FI16_555_BLUE_MASK		0x001F
#define FI16_555_RED_SHIFT		10
#define FI16_555_GREEN_SHIFT	5
#define FI16_555_BLUE_SHIFT		0
#define FI16_565_RED_MASK		0xF800
#define FI16_565_GREEN_MASK		0x07E0
#define FI16_565_BLUE_MASK		0x001F
#define FI16_565_RED_SHIFT		11
#define FI16_565_GREEN_SHIFT	5
#define FI16_565_BLUE_SHIFT		0

// ICC profile support ------------------------------------------------------

#define FIICC_DEFAULT			0x00
#define FIICC_COLOR_IS_CMYK		0x01

FI_STRUCT (FIICCPROFILE) { 
	WORD    flags;	//! info flag
	DWORD	size;	//! profile's size measured in bytes
	void   *data;	//! points to a block of contiguous memory containing the profile
};

// Important enums ----------------------------------------------------------

/** I/O image format identifiers.
*/
FI_ENUM(FREE_IMAGE_FORMAT) {
	FIF_UNKNOWN = -1,
	FIF_BMP		= 0,
	FIF_ICO		= 1,
	FIF_JPEG	= 2,
	FIF_JNG		= 3,
	FIF_KOALA	= 4,
	FIF_LBM		= 5,
	FIF_IFF = FIF_LBM,
	FIF_MNG		= 6,
	FIF_PBM		= 7,
	FIF_PBMRAW	= 8,
	FIF_PCD		= 9,
	FIF_PCX		= 10,
	FIF_PGM		= 11,
	FIF_PGMRAW	= 12,
	FIF_PNG		= 13,
	FIF_PPM		= 14,
	FIF_PPMRAW	= 15,
	FIF_RAS		= 16,
	FIF_TARGA	= 17,
	FIF_TIFF	= 18,
	FIF_WBMP	= 19,
	FIF_PSD		= 20,
	FIF_CUT		= 21,
	FIF_XBM		= 22,
	FIF_XPM		= 23,
	FIF_DDS		= 24,
	FIF_GIF     = 25,
	FIF_HDR		= 26,
	FIF_FAXG3	= 27,
	FIF_SGI		= 28,
	FIF_EXR		= 29,
	FIF_J2K		= 30,
	FIF_JP2		= 31,
	FIF_PFM		= 32,
	FIF_PICT	= 33,
	FIF_RAW		= 34,
	FIF_WEBP	= 35,
	FIF_JXR		= 36
};

/** Image type used in FreeImage.
*/
FI_ENUM(FREE_IMAGE_TYPE) {
	FIT_UNKNOWN = 0,	//! unknown type
	FIT_BITMAP  = 1,	//! standard image			: 1-, 4-, 8-, 16-, 24-, 32-bit
	FIT_UINT16	= 2,	//! array of unsigned short	: unsigned 16-bit
	FIT_INT16	= 3,	//! array of short			: signed 16-bit
	FIT_UINT32	= 4,	//! array of unsigned long	: unsigned 32-bit
	FIT_INT32	= 5,	//! array of long			: signed 32-bit
	FIT_FLOAT	= 6,	//! array of float			: 32-bit IEEE floating point
	FIT_DOUBLE	= 7,	//! array of double			: 64-bit IEEE floating point
	FIT_COMPLEX	= 8,	//! array of FICOMPLEX		: 2 x 64-bit IEEE floating point
	FIT_RGB16	= 9,	//! 48-bit RGB image			: 3 x 16-bit
	FIT_RGBA16	= 10,	//! 64-bit RGBA image		: 4 x 16-bit
	FIT_RGBF	= 11,	//! 96-bit RGB float image	: 3 x 32-bit IEEE floating point
	FIT_RGBAF	= 12	//! 128-bit RGBA float image	: 4 x 32-bit IEEE floating point
};

/** Image color type used in FreeImage.
*/
FI_ENUM(FREE_IMAGE_COLOR_TYPE) {
	FIC_MINISWHITE = 0,		//! min value is white
    FIC_MINISBLACK = 1,		//! min value is black
    FIC_RGB        = 2,		//! RGB color model
    FIC_PALETTE    = 3,		//! color map indexed
	FIC_RGBALPHA   = 4,		//! RGB color model with alpha channel
	FIC_CMYK       = 5		//! CMYK color model
};

/** Color quantization algorithms.
Constants used in FreeImage_ColorQuantize.
*/
FI_ENUM(FREE_IMAGE_QUANTIZE) {
    FIQ_WUQUANT = 0,		//! Xiaolin Wu color quantization algorithm
    FIQ_NNQUANT = 1,		//! NeuQuant neural-net quantization algorithm by Anthony Dekker
	FIQ_LFPQUANT = 2		//! Lossless Fast Pseudo-Quantization Algorithm by Carsten Klein
};

/** Dithering algorithms.
Constants used in FreeImage_Dither.
*/
FI_ENUM(FREE_IMAGE_DITHER) {
    FID_FS			= 0,	//! Floyd & Steinberg error diffusion
	FID_BAYER4x4	= 1,	//! Bayer ordered dispersed dot dithering (order 2 dithering matrix)
	FID_BAYER8x8	= 2,	//! Bayer ordered dispersed dot dithering (order 3 dithering matrix)
	FID_CLUSTER6x6	= 3,	//! Ordered clustered dot dithering (order 3 - 6x6 matrix)
	FID_CLUSTER8x8	= 4,	//! Ordered clustered dot dithering (order 4 - 8x8 matrix)
	FID_CLUSTER16x16= 5,	//! Ordered clustered dot dithering (order 8 - 16x16 matrix)
	FID_BAYER16x16	= 6		//! Bayer ordered dispersed dot dithering (order 4 dithering matrix)
};

/** Lossless JPEG transformations
Constants used in FreeImage_JPEGTransform
*/
FI_ENUM(FREE_IMAGE_JPEG_OPERATION) {
	FIJPEG_OP_NONE			= 0,	//! no transformation
	FIJPEG_OP_FLIP_H		= 1,	//! horizontal flip
	FIJPEG_OP_FLIP_V		= 2,	//! vertical flip
	FIJPEG_OP_TRANSPOSE		= 3,	//! transpose across UL-to-LR axis
	FIJPEG_OP_TRANSVERSE	= 4,	//! transpose across UR-to-LL axis
	FIJPEG_OP_ROTATE_90		= 5,	//! 90-degree clockwise rotation
	FIJPEG_OP_ROTATE_180	= 6,	//! 180-degree rotation
	FIJPEG_OP_ROTATE_270	= 7		//! 270-degree clockwise (or 90 ccw)
};

/** Tone mapping operators.
Constants used in FreeImage_ToneMapping.
*/
FI_ENUM(FREE_IMAGE_TMO) {
    FITMO_DRAGO03	 = 0,	//! Adaptive logarithmic mapping (F. Drago, 2003)
	FITMO_REINHARD05 = 1,	//! Dynamic range reduction inspired by photoreceptor physiology (E. Reinhard, 2005)
	FITMO_FATTAL02	 = 2	//! Gradient domain high dynamic range compression (R. Fattal, 2002)
};

/** Upsampling / downsampling filters. 
Constants used in FreeImage_Rescale.
*/
FI_ENUM(FREE_IMAGE_FILTER) {
	FILTER_BOX		  = 0,	//! Box, pulse, Fourier window, 1st order (constant) b-spline
	FILTER_BICUBIC	  = 1,	//! Mitchell & Netravali's two-param cubic filter
	FILTER_BILINEAR   = 2,	//! Bilinear filter
	FILTER_BSPLINE	  = 3,	//! 4th order (cubic) b-spline
	FILTER_CATMULLROM = 4,	//! Catmull-Rom spline, Overhauser spline
	FILTER_LANCZOS3	  = 5	//! Lanczos3 filter
};

/** Color channels.
Constants used in color manipulation routines.
*/
FI_ENUM(FREE_IMAGE_COLOR_CHANNEL) {
	FICC_RGB	= 0,	//! Use red, green and blue channels
	FICC_RED	= 1,	//! Use red channel
	FICC_GREEN	= 2,	//! Use green channel
	FICC_BLUE	= 3,	//! Use blue channel
	FICC_ALPHA	= 4,	//! Use alpha channel
	FICC_BLACK	= 5,	//! Use black channel
	FICC_REAL	= 6,	//! Complex images: use real part
	FICC_IMAG	= 7,	//! Complex images: use imaginary part
	FICC_MAG	= 8,	//! Complex images: use magnitude
	FICC_PHASE	= 9		//! Complex images: use phase
};

// Metadata support ---------------------------------------------------------

/**
  Tag data type information (based on TIFF specifications)

  Note: RATIONALs are the ratio of two 32-bit integer values.
*/
FI_ENUM(FREE_IMAGE_MDTYPE) {
	FIDT_NOTYPE		= 0,	//! placeholder 
	FIDT_BYTE		= 1,	//! 8-bit unsigned integer 
	FIDT_ASCII		= 2,	//! 8-bit bytes w/ last byte null 
	FIDT_SHORT		= 3,	//! 16-bit unsigned integer 
	FIDT_LONG		= 4,	//! 32-bit unsigned integer 
	FIDT_RATIONAL	= 5,	//! 64-bit unsigned fraction 
	FIDT_SBYTE		= 6,	//! 8-bit signed integer 
	FIDT_UNDEFINED	= 7,	//! 8-bit untyped data 
	FIDT_SSHORT		= 8,	//! 16-bit signed integer 
	FIDT_SLONG		= 9,	//! 32-bit signed integer 
	FIDT_SRATIONAL	= 10,	//! 64-bit signed fraction 
	FIDT_FLOAT		= 11,	//! 32-bit IEEE floating point 
	FIDT_DOUBLE		= 12,	//! 64-bit IEEE floating point 
	FIDT_IFD		= 13,	//! 32-bit unsigned integer (offset) 
	FIDT_PALETTE	= 14,	//! 32-bit RGBQUAD 
	FIDT_LONG8		= 16,	//! 64-bit unsigned integer 
	FIDT_SLONG8		= 17,	//! 64-bit signed integer
	FIDT_IFD8		= 18	//! 64-bit unsigned integer (offset)
};

/**
  Metadata models supported by FreeImage
*/
FI_ENUM(FREE_IMAGE_MDMODEL) {
	FIMD_NODATA			= -1,
	FIMD_COMMENTS		= 0,	//! single comment or keywords
	FIMD_EXIF_MAIN		= 1,	//! Exif-TIFF metadata
	FIMD_EXIF_EXIF		= 2,	//! Exif-specific metadata
	FIMD_EXIF_GPS		= 3,	//! Exif GPS metadata
	FIMD_EXIF_MAKERNOTE = 4,	//! Exif maker note metadata
	FIMD_EXIF_INTEROP	= 5,	//! Exif interoperability metadata
	FIMD_IPTC			= 6,	//! IPTC/NAA metadata
	FIMD_XMP			= 7,	//! Abobe XMP metadata
	FIMD_GEOTIFF		= 8,	//! GeoTIFF metadata
	FIMD_ANIMATION		= 9,	//! Animation metadata
	FIMD_CUSTOM			= 10,	//! Used to attach other metadata types to a dib
	FIMD_EXIF_RAW		= 11	//! Exif metadata as a raw buffer
};

/**
  Handle to a metadata model
*/
FI_STRUCT (FIMETADATA) { void *data; };

/**
  Handle to a FreeImage tag
*/
FI_STRUCT (FITAG) { void *data; };

// File IO routines ---------------------------------------------------------

#ifndef FREEIMAGE_IO
#define FREEIMAGE_IO

typedef void* fi_handle;
typedef unsigned (DLL_CALLCONV *FI_ReadProc) (void *buffer, unsigned size, unsigned count, fi_handle handle);
typedef unsigned (DLL_CALLCONV *FI_WriteProc) (void *buffer, unsigned size, unsigned count, fi_handle handle);
typedef int (DLL_CALLCONV *FI_SeekProc) (fi_handle handle, long offset, int origin);
typedef long (DLL_CALLCONV *FI_TellProc) (fi_handle handle);

#if (defined(_WIN32) || defined(__WIN32__))
#pragma pack(push, 1)
#else
#pragma pack(1)
#endif // WIN32

FI_STRUCT(FreeImageIO) {
	FI_ReadProc  read_proc;     //! pointer to the function used to read data
    FI_WriteProc write_proc;    //! pointer to the function used to write data
    FI_SeekProc  seek_proc;     //! pointer to the function used to seek
    FI_TellProc  tell_proc;     //! pointer to the function used to aquire the current position
};

#if (defined(_WIN32) || defined(__WIN32__))
#pragma pack(pop)
#else
#pragma pack()
#endif // WIN32

/**
Handle to a memory I/O stream
*/
FI_STRUCT (FIMEMORY) { void *data; };

#endif // FREEIMAGE_IO

// Plugin routines ----------------------------------------------------------

#ifndef PLUGINS
#define PLUGINS

typedef const char *(DLL_CALLCONV *FI_FormatProc)(void);
typedef const char *(DLL_CALLCONV *FI_DescriptionProc)(void);
typedef const char *(DLL_CALLCONV *FI_ExtensionListProc)(void);
typedef const char *(DLL_CALLCONV *FI_RegExprProc)(void);
typedef void *(DLL_CALLCONV *FI_OpenProc)(FreeImageIO *io, fi_handle handle, BOOL read);
typedef void (DLL_CALLCONV *FI_CloseProc)(FreeImageIO *io, fi_handle handle, void *data);
typedef int (DLL_CALLCONV *FI_PageCountProc)(FreeImageIO *io, fi_handle handle, void *data);
typedef int (DLL_CALLCONV *FI_PageCapabilityProc)(FreeImageIO *io, fi_handle handle, void *data);
typedef FIBITMAP *(DLL_CALLCONV *FI_LoadProc)(FreeImageIO *io, fi_handle handle, int page, int flags, void *data);
typedef BOOL (DLL_CALLCONV *FI_SaveProc)(FreeImageIO *io, FIBITMAP *dib, fi_handle handle, int page, int flags, void *data);
typedef BOOL (DLL_CALLCONV *FI_ValidateProc)(FreeImageIO *io, fi_handle handle);
typedef const char *(DLL_CALLCONV *FI_MimeProc)(void);
typedef BOOL (DLL_CALLCONV *FI_SupportsExportBPPProc)(int bpp);
typedef BOOL (DLL_CALLCONV *FI_SupportsExportTypeProc)(FREE_IMAGE_TYPE type);
typedef BOOL (DLL_CALLCONV *FI_SupportsICCProfilesProc)(void);
typedef BOOL (DLL_CALLCONV *FI_SupportsNoPixelsProc)(void);

FI_STRUCT (Plugin) {
	FI_FormatProc format_proc;
	FI_DescriptionProc description_proc;
	FI_ExtensionListProc extension_proc;
	FI_RegExprProc regexpr_proc;
	FI_OpenProc open_proc;
	FI_CloseProc close_proc;
	FI_PageCountProc pagecount_proc;
	FI_PageCapabilityProc pagecapability_proc;
	FI_LoadProc load_proc;
	FI_SaveProc save_proc;
	FI_ValidateProc validate_proc;
	FI_MimeProc mime_proc;
	FI_SupportsExportBPPProc supports_export_bpp_proc;
	FI_SupportsExportTypeProc supports_export_type_proc;
	FI_SupportsICCProfilesProc supports_icc_profiles_proc;
	FI_SupportsNoPixelsProc supports_no_pixels_proc;
};

typedef void (DLL_CALLCONV *FI_InitProc)(Plugin *plugin, int format_id);

#endif // PLUGINS


// Load / Save flag constants -----------------------------------------------

#define FIF_LOAD_NOPIXELS 0x8000	//! loading: load the image header only (not supported by all plugins, default to full loading)

#define BMP_DEFAULT         0
#define BMP_SAVE_RLE        1
#define CUT_DEFAULT         0
#define DDS_DEFAULT			0
#define EXR_DEFAULT			0		//! save data as half with piz-based wavelet compression
#define EXR_FLOAT			0x0001	//! save data as float instead of as half (not recommended)
#define EXR_NONE			0x0002	//! save with no compression
#define EXR_ZIP				0x0004	//! save with zlib compression, in blocks of 16 scan lines
#define EXR_PIZ				0x0008	//! save with piz-based wavelet compression
#define EXR_PXR24			0x0010	//! save with lossy 24-bit float compression
#define EXR_B44				0x0020	//! save with lossy 44% float compression - goes to 22% when combined with EXR_LC
#define EXR_LC				0x0040	//! save images with one luminance and two chroma channels, rather than as RGB (lossy compression)
#define FAXG3_DEFAULT		0
#define GIF_DEFAULT			0
#define GIF_LOAD256			1		//! load the image as a 256 color image with ununsed palette entries, if it's 16 or 2 color
#define GIF_PLAYBACK		2		//! 'Play' the GIF to generate each frame (as 32bpp) instead of returning raw frame data when loading
#define HDR_DEFAULT			0
#define ICO_DEFAULT         0
#define ICO_MAKEALPHA		1		//! convert to 32bpp and create an alpha channel from the AND-mask when loading
#define IFF_DEFAULT         0
#define J2K_DEFAULT			0		//! save with a 16:1 rate
#define JP2_DEFAULT			0		//! save with a 16:1 rate
#define JPEG_DEFAULT        0		//! loading (see JPEG_FAST); saving (see JPEG_QUALITYGOOD|JPEG_SUBSAMPLING_420)
#define JPEG_FAST           0x0001	//! load the file as fast as possible, sacrificing some quality
#define JPEG_ACCURATE       0x0002	//! load the file with the best quality, sacrificing some speed
#define JPEG_CMYK			0x0004	//! load separated CMYK "as is" (use | to combine with other load flags)
#define JPEG_EXIFROTATE		0x0008	//! load and rotate according to Exif 'Orientation' tag if available
#define JPEG_GREYSCALE		0x0010	//! load and convert to a 8-bit greyscale image
#define JPEG_QUALITYSUPERB  0x80	//! save with superb quality (100:1)
#define JPEG_QUALITYGOOD    0x0100	//! save with good quality (75:1)
#define JPEG_QUALITYNORMAL  0x0200	//! save with normal quality (50:1)
#define JPEG_QUALITYAVERAGE 0x0400	//! save with average quality (25:1)
#define JPEG_QUALITYBAD     0x0800	//! save with bad quality (10:1)
#define JPEG_PROGRESSIVE	0x2000	//! save as a progressive-JPEG (use | to combine with other save flags)
#define JPEG_SUBSAMPLING_411 0x1000		//! save with high 4x1 chroma subsampling (4:1:1) 
#define JPEG_SUBSAMPLING_420 0x4000		//! save with medium 2x2 medium chroma subsampling (4:2:0) - default value
#define JPEG_SUBSAMPLING_422 0x8000		//! save with low 2x1 chroma subsampling (4:2:2) 
#define JPEG_SUBSAMPLING_444 0x10000	//! save with no chroma subsampling (4:4:4)
#define JPEG_OPTIMIZE		0x20000		//! on saving, compute optimal Huffman coding tables (can reduce a few percent of file size)
#define JPEG_BASELINE		0x40000		//! save basic JPEG, without metadata or any markers
#define KOALA_DEFAULT       0
#define LBM_DEFAULT         0
#define MNG_DEFAULT         0
#define PCD_DEFAULT         0
#define PCD_BASE            1		//! load the bitmap sized 768 x 512
#define PCD_BASEDIV4        2		//! load the bitmap sized 384 x 256
#define PCD_BASEDIV16       3		//! load the bitmap sized 192 x 128
#define PCX_DEFAULT         0
#define PFM_DEFAULT         0
#define PICT_DEFAULT        0
#define PNG_DEFAULT         0
#define PNG_IGNOREGAMMA		1		//! loading: avoid gamma correction
#define PNG_Z_BEST_SPEED			0x0001	//! save using ZLib level 1 compression flag (default value is 6)
#define PNG_Z_DEFAULT_COMPRESSION	0x0006	//! save using ZLib level 6 compression flag (default recommended value)
#define PNG_Z_BEST_COMPRESSION		0x0009	//! save using ZLib level 9 compression flag (default value is 6)
#define PNG_Z_NO_COMPRESSION		0x0100	//! save without ZLib compression
#define PNG_INTERLACED				0x0200	//! save using Adam7 interlacing (use | to combine with other save flags)
#define PNM_DEFAULT         0
#define PNM_SAVE_RAW        0       //! if set the writer saves in RAW format (i.e. P4, P5 or P6)
#define PNM_SAVE_ASCII      1       //! if set the writer saves in ASCII format (i.e. P1, P2 or P3)
#define PSD_DEFAULT         0
#define PSD_CMYK			1		//! reads tags for separated CMYK (default is conversion to RGB)
#define PSD_LAB				2		//! reads tags for CIELab (default is conversion to RGB)
#define RAS_DEFAULT         0
#define RAW_DEFAULT         0		//! load the file as linear RGB 48-bit
#define RAW_PREVIEW			1		//! try to load the embedded JPEG preview with included Exif Data or default to RGB 24-bit
#define RAW_DISPLAY			2		//! load the file as RGB 24-bit
#define RAW_HALFSIZE		4		//! output a half-size color image
#define RAW_UNPROCESSED		8		//! output a FIT_UINT16 raw Bayer image
#define SGI_DEFAULT			0
#define TARGA_DEFAULT       0
#define TARGA_LOAD_RGB888   1       //! if set the loader converts RGB555 and ARGB8888 -> RGB888.
#define TARGA_SAVE_RLE		2		//! if set, the writer saves with RLE compression
#define TIFF_DEFAULT        0
#define TIFF_CMYK			0x0001	//! reads/stores tags for separated CMYK (use | to combine with compression flags)
#define TIFF_PACKBITS       0x0100  //! save using PACKBITS compression
#define TIFF_DEFLATE        0x0200  //! save using DEFLATE compression (a.k.a. ZLIB compression)
#define TIFF_ADOBE_DEFLATE  0x0400  //! save using ADOBE DEFLATE compression
#define TIFF_NONE           0x0800  //! save without any compression
#define TIFF_CCITTFAX3		0x1000  //! save using CCITT Group 3 fax encoding
#define TIFF_CCITTFAX4		0x2000  //! save using CCITT Group 4 fax encoding
#define TIFF_LZW			0x4000	//! save using LZW compression
#define TIFF_JPEG			0x8000	//! save using JPEG compression
#define TIFF_LOGLUV			0x10000	//! save using LogLuv compression
#define WBMP_DEFAULT        0
#define XBM_DEFAULT			0
#define XPM_DEFAULT			0
#define WEBP_DEFAULT		0		//! save with good quality (75:1)
#define WEBP_LOSSLESS		0x100	//! save in lossless mode
#define JXR_DEFAULT			0		//! save with quality 80 and no chroma subsampling (4:4:4)
#define JXR_LOSSLESS		0x0064	//! save lossless
#define JXR_PROGRESSIVE		0x2000	//! save as a progressive-JXR (use | to combine with other save flags)

// Background filling options ---------------------------------------------------------
// Constants used in FreeImage_FillBackground and FreeImage_EnlargeCanvas

#define FI_COLOR_IS_RGB_COLOR			0x00	//! RGBQUAD color is a RGB color (contains no valid alpha channel)
#define FI_COLOR_IS_RGBA_COLOR			0x01	//! RGBQUAD color is a RGBA color (contains a valid alpha channel)
#define FI_COLOR_FIND_EQUAL_COLOR		0x02	//! For palettized images: lookup equal RGB color from palette
#define FI_COLOR_ALPHA_IS_INDEX			0x04	//! The color's rgbReserved member (alpha) contains the palette index to be used
#define FI_COLOR_PALETTE_SEARCH_MASK	(FI_COLOR_FIND_EQUAL_COLOR | FI_COLOR_ALPHA_IS_INDEX)	// No color lookup is performed

// RescaleEx options ---------------------------------------------------------
// Constants used in FreeImage_RescaleEx

#define FI_RESCALE_DEFAULT			0x00    //! default options; none of the following other options apply
#define FI_RESCALE_TRUE_COLOR		0x01	//! for non-transparent greyscale images, convert to 24-bit if src bitdepth <= 8 (default is a 8-bit greyscale image). 
#define FI_RESCALE_OMIT_METADATA	0x02	//! do not copy metadata to the rescaled image


#ifdef __cplusplus
extern "C" {
#endif

// Init / Error routines ----------------------------------------------------

DLL_API void DLL_CALLCONV FreeImage_Initialise(BOOL load_local_plugins_only FI_DEFAULT(FALSE));
DLL_API void DLL_CALLCONV FreeImage_DeInitialise(void);

// Version routines ---------------------------------------------------------

DLL_API const char *DLL_CALLCONV FreeImage_GetVersion(void);
DLL_API const char *DLL_CALLCONV FreeImage_GetCopyrightMessage(void);

// Message output functions -------------------------------------------------

typedef void (*FreeImage_OutputMessageFunction)(FREE_IMAGE_FORMAT fif, const char *msg);
typedef void (DLL_CALLCONV *FreeImage_OutputMessageFunctionStdCall)(FREE_IMAGE_FORMAT fif, const char *msg); 

DLL_API void DLL_CALLCONV FreeImage_SetOutputMessageStdCall(FreeImage_OutputMessageFunctionStdCall omf); 
DLL_API void DLL_CALLCONV FreeImage_SetOutputMessage(FreeImage_OutputMessageFunction omf);
DLL_API void DLL_CALLCONV FreeImage_OutputMessageProc(int fif, const char *fmt, ...);

// Allocate / Clone / Unload routines ---------------------------------------

DLL_API FIBITMAP *DLL_CALLCONV FreeImage_Allocate(int width, int height, int bpp, unsigned red_mask FI_DEFAULT(0), unsigned green_mask FI_DEFAULT(0), unsigned blue_mask FI_DEFAULT(0));
DLL_API FIBITMAP *DLL_CALLCONV FreeImage_AllocateT(FREE_IMAGE_TYPE type, int width, int height, int bpp FI_DEFAULT(8), unsigned red_mask FI_DEFAULT(0), unsigned green_mask FI_DEFAULT(0), unsigned blue_mask FI_DEFAULT(0));
DLL_API FIBITMAP * DLL_CALLCONV FreeImage_Clone(FIBITMAP *dib);
DLL_API void DLL_CALLCONV FreeImage_Unload(FIBITMAP *dib);

// Header loading routines
DLL_API BOOL DLL_CALLCONV FreeImage_HasPixels(FIBITMAP *dib);

// Load / Save routines -----------------------------------------------------

DLL_API FIBITMAP *DLL_CALLCONV FreeImage_Load(FREE_IMAGE_FORMAT fif, const char *filename, int flags FI_DEFAULT(0));
DLL_API FIBITMAP *DLL_CALLCONV FreeImage_LoadU(FREE_IMAGE_FORMAT fif, const wchar_t *filename, int flags FI_DEFAULT(0));
DLL_API FIBITMAP *DLL_CALLCONV FreeImage_LoadFromHandle(FREE_IMAGE_FORMAT fif, FreeImageIO *io, fi_handle handle, int flags FI_DEFAULT(0));
DLL_API BOOL DLL_CALLCONV FreeImage_Save(FREE_IMAGE_FORMAT fif, FIBITMAP *dib, const char *filename, int flags FI_DEFAULT(0));
DLL_API BOOL DLL_CALLCONV FreeImage_SaveU(FREE_IMAGE_FORMAT fif, FIBITMAP *dib, const wchar_t *filename, int flags FI_DEFAULT(0));
DLL_API BOOL DLL_CALLCONV FreeImage_SaveToHandle(FREE_IMAGE_FORMAT fif, FIBITMAP *dib, FreeImageIO *io, fi_handle handle, int flags FI_DEFAULT(0));

// Memory I/O stream routines -----------------------------------------------

DLL_API FIMEMORY *DLL_CALLCONV FreeImage_OpenMemory(BYTE *data FI_DEFAULT(0), DWORD size_in_bytes FI_DEFAULT(0));
DLL_API void DLL_CALLCONV FreeImage_CloseMemory(FIMEMORY *stream);
DLL_API FIBITMAP *DLL_CALLCONV FreeImage_LoadFromMemory(FREE_IMAGE_FORMAT fif, FIMEMORY *stream, int flags FI_DEFAULT(0));
DLL_API BOOL DLL_CALLCONV FreeImage_SaveToMemory(FREE_IMAGE_FORMAT fif, FIBITMAP *dib, FIMEMORY *stream, int flags FI_DEFAULT(0));
DLL_API long DLL_CALLCONV FreeImage_TellMemory(FIMEMORY *stream);
DLL_API BOOL DLL_CALLCONV FreeImage_SeekMemory(FIMEMORY *stream, long offset, int origin);
DLL_API BOOL DLL_CALLCONV FreeImage_AcquireMemory(FIMEMORY *stream, BYTE **data, DWORD *size_in_bytes);
DLL_API unsigned DLL_CALLCONV FreeImage_ReadMemory(void *buffer, unsigned size, unsigned count, FIMEMORY *stream);
DLL_API unsigned DLL_CALLCONV FreeImage_WriteMemory(const void *buffer, unsigned size, unsigned count, FIMEMORY *stream);

DLL_API FIMULTIBITMAP *DLL_CALLCONV FreeImage_LoadMultiBitmapFromMemory(FREE_IMAGE_FORMAT fif, FIMEMORY *stream, int flags FI_DEFAULT(0));
DLL_API BOOL DLL_CALLCONV FreeImage_SaveMultiBitmapToMemory(FREE_IMAGE_FORMAT fif, FIMULTIBITMAP *bitmap, FIMEMORY *stream, int flags);

// Plugin Interface ---------------------------------------------------------

DLL_API FREE_IMAGE_FORMAT DLL_CALLCONV FreeImage_RegisterLocalPlugin(FI_InitProc proc_address, const char *format FI_DEFAULT(0), const char *description FI_DEFAULT(0), const char *extension FI_DEFAULT(0), const char *regexpr FI_DEFAULT(0));
DLL_API FREE_IMAGE_FORMAT DLL_CALLCONV FreeImage_RegisterExternalPlugin(const char *path, const char *format FI_DEFAULT(0), const char *description FI_DEFAULT(0), const char *extension FI_DEFAULT(0), const char *regexpr FI_DEFAULT(0));
DLL_API int DLL_CALLCONV FreeImage_GetFIFCount(void);
DLL_API int DLL_CALLCONV FreeImage_SetPluginEnabled(FREE_IMAGE_FORMAT fif, BOOL enable);
DLL_API int DLL_CALLCONV FreeImage_IsPluginEnabled(FREE_IMAGE_FORMAT fif);
DLL_API FREE_IMAGE_FORMAT DLL_CALLCONV FreeImage_GetFIFFromFormat(const char *format);
DLL_API FREE_IMAGE_FORMAT DLL_CALLCONV FreeImage_GetFIFFromMime(const char *mime);
DLL_API const char *DLL_CALLCONV FreeImage_GetFormatFromFIF(FREE_IMAGE_FORMAT fif);
DLL_API const char *DLL_CALLCONV FreeImage_GetFIFExtensionList(FREE_IMAGE_FORMAT fif);
DLL_API const char *DLL_CALLCONV FreeImage_GetFIFDescription(FREE_IMAGE_FORMAT fif);
DLL_API const char *DLL_CALLCONV FreeImage_GetFIFRegExpr(FREE_IMAGE_FORMAT fif);
DLL_API const char *DLL_CALLCONV FreeImage_GetFIFMimeType(FREE_IMAGE_FORMAT fif);
DLL_API FREE_IMAGE_FORMAT DLL_CALLCONV FreeImage_GetFIFFromFilename(const char *filename);
DLL_API FREE_IMAGE_FORMAT DLL_CALLCONV FreeImage_GetFIFFromFilenameU(const wchar_t *filename);
DLL_API BOOL DLL_CALLCONV FreeImage_FIFSupportsReading(FREE_IMAGE_FORMAT fif);
DLL_API BOOL DLL_CALLCONV FreeImage_FIFSupportsWriting(FREE_IMAGE_FORMAT fif);
DLL_API BOOL DLL_CALLCONV FreeImage_FIFSupportsExportBPP(FREE_IMAGE_FORMAT fif, int bpp);
DLL_API BOOL DLL_CALLCONV FreeImage_FIFSupportsExportType(FREE_IMAGE_FORMAT fif, FREE_IMAGE_TYPE type);
DLL_API BOOL DLL_CALLCONV FreeImage_FIFSupportsICCProfiles(FREE_IMAGE_FORMAT fif);
DLL_API BOOL DLL_CALLCONV FreeImage_FIFSupportsNoPixels(FREE_IMAGE_FORMAT fif);

// Multipaging interface ----------------------------------------------------

DLL_API FIMULTIBITMAP * DLL_CALLCONV FreeImage_OpenMultiBitmap(FREE_IMAGE_FORMAT fif, const char *filename, BOOL create_new, BOOL read_only, BOOL keep_cache_in_memory FI_DEFAULT(FALSE), int flags FI_DEFAULT(0));
DLL_API FIMULTIBITMAP * DLL_CALLCONV FreeImage_OpenMultiBitmapFromHandle(FREE_IMAGE_FORMAT fif, FreeImageIO *io, fi_handle handle, int flags FI_DEFAULT(0));
DLL_API BOOL DLL_CALLCONV FreeImage_SaveMultiBitmapToHandle(FREE_IMAGE_FORMAT fif, FIMULTIBITMAP *bitmap, FreeImageIO *io, fi_handle handle, int flags FI_DEFAULT(0));
DLL_API BOOL DLL_CALLCONV FreeImage_CloseMultiBitmap(FIMULTIBITMAP *bitmap, int flags FI_DEFAULT(0));
DLL_API int DLL_CALLCONV FreeImage_GetPageCount(FIMULTIBITMAP *bitmap);
DLL_API void DLL_CALLCONV FreeImage_AppendPage(FIMULTIBITMAP *bitmap, FIBITMAP *data);
DLL_API void DLL_CALLCONV FreeImage_InsertPage(FIMULTIBITMAP *bitmap, int page, FIBITMAP *data);
DLL_API void DLL_CALLCONV FreeImage_DeletePage(FIMULTIBITMAP *bitmap, int page);
DLL_API FIBITMAP * DLL_CALLCONV FreeImage_LockPage(FIMULTIBITMAP *bitmap, int page);
DLL_API void DLL_CALLCONV FreeImage_UnlockPage(FIMULTIBITMAP *bitmap, FIBITMAP *data, BOOL changed);
DLL_API BOOL DLL_CALLCONV FreeImage_MovePage(FIMULTIBITMAP *bitmap, int target, int source);
DLL_API BOOL DLL_CALLCONV FreeImage_GetLockedPageNumbers(FIMULTIBITMAP *bitmap, int *pages, int *count);

// Filetype request routines ------------------------------------------------

DLL_API FREE_IMAGE_FORMAT DLL_CALLCONV FreeImage_GetFileType(const char *filename, int size FI_DEFAULT(0));
DLL_API FREE_IMAGE_FORMAT DLL_CALLCONV FreeImage_GetFileTypeU(const wchar_t *filename, int size FI_DEFAULT(0));
DLL_API FREE_IMAGE_FORMAT DLL_CALLCONV FreeImage_GetFileTypeFromHandle(FreeImageIO *io, fi_handle handle, int size FI_DEFAULT(0));
DLL_API FREE_IMAGE_FORMAT DLL_CALLCONV FreeImage_GetFileTypeFromMemory(FIMEMORY *stream, int size FI_DEFAULT(0));

// Image type request routine -----------------------------------------------

DLL_API FREE_IMAGE_TYPE DLL_CALLCONV FreeImage_GetImageType(FIBITMAP *dib);

// FreeImage helper routines ------------------------------------------------

DLL_API BOOL DLL_CALLCONV FreeImage_IsLittleEndian(void);
DLL_API BOOL DLL_CALLCONV FreeImage_LookupX11Color(const char *szColor, BYTE *nRed, BYTE *nGreen, BYTE *nBlue);
DLL_API BOOL DLL_CALLCONV FreeImage_LookupSVGColor(const char *szColor, BYTE *nRed, BYTE *nGreen, BYTE *nBlue);

// Pixel access routines ----------------------------------------------------

DLL_API BYTE *DLL_CALLCONV FreeImage_GetBits(FIBITMAP *dib);
DLL_API BYTE *DLL_CALLCONV FreeImage_GetScanLine(FIBITMAP *dib, int scanline);

DLL_API BOOL DLL_CALLCONV FreeImage_GetPixelIndex(FIBITMAP *dib, unsigned x, unsigned y, BYTE *value);
DLL_API BOOL DLL_CALLCONV FreeImage_GetPixelColor(FIBITMAP *dib, unsigned x, unsigned y, RGBQUAD *value);
DLL_API BOOL DLL_CALLCONV FreeImage_SetPixelIndex(FIBITMAP *dib, unsigned x, unsigned y, BYTE *value);
DLL_API BOOL DLL_CALLCONV FreeImage_SetPixelColor(FIBITMAP *dib, unsigned x, unsigned y, RGBQUAD *value);

// DIB info routines --------------------------------------------------------

DLL_API unsigned DLL_CALLCONV FreeImage_GetColorsUsed(FIBITMAP *dib);
DLL_API unsigned DLL_CALLCONV FreeImage_GetBPP(FIBITMAP *dib);
DLL_API unsigned DLL_CALLCONV FreeImage_GetWidth(FIBITMAP *dib);
DLL_API unsigned DLL_CALLCONV FreeImage_GetHeight(FIBITMAP *dib);
DLL_API unsigned DLL_CALLCONV FreeImage_GetLine(FIBITMAP *dib);
DLL_API unsigned DLL_CALLCONV FreeImage_GetPitch(FIBITMAP *dib);
DLL_API unsigned DLL_CALLCONV FreeImage_GetDIBSize(FIBITMAP *dib);
DLL_API unsigned DLL_CALLCONV FreeImage_GetMemorySize(FIBITMAP *dib);
DLL_API RGBQUAD *DLL_CALLCONV FreeImage_GetPalette(FIBITMAP *dib);

DLL_API unsigned DLL_CALLCONV FreeImage_GetDotsPerMeterX(FIBITMAP *dib);
DLL_API unsigned DLL_CALLCONV FreeImage_GetDotsPerMeterY(FIBITMAP *dib);
DLL_API void DLL_CALLCONV FreeImage_SetDotsPerMeterX(FIBITMAP *dib, unsigned res);
DLL_API void DLL_CALLCONV FreeImage_SetDotsPerMeterY(FIBITMAP *dib, unsigned res);

DLL_API BITMAPINFOHEADER *DLL_CALLCONV FreeImage_GetInfoHeader(FIBITMAP *dib);
DLL_API BITMAPINFO *DLL_CALLCONV FreeImage_GetInfo(FIBITMAP *dib);
DLL_API FREE_IMAGE_COLOR_TYPE DLL_CALLCONV FreeImage_GetColorType(FIBITMAP *dib);

DLL_API unsigned DLL_CALLCONV FreeImage_GetRedMask(FIBITMAP *dib);
DLL_API unsigned DLL_CALLCONV FreeImage_GetGreenMask(FIBITMAP *dib);
DLL_API unsigned DLL_CALLCONV FreeImage_GetBlueMask(FIBITMAP *dib);

DLL_API unsigned DLL_CALLCONV FreeImage_GetTransparencyCount(FIBITMAP *dib);
DLL_API BYTE * DLL_CALLCONV FreeImage_GetTransparencyTable(FIBITMAP *dib);
DLL_API void DLL_CALLCONV FreeImage_SetTransparent(FIBITMAP *dib, BOOL enabled);
DLL_API void DLL_CALLCONV FreeImage_SetTransparencyTable(FIBITMAP *dib, BYTE *table, int count);
DLL_API BOOL DLL_CALLCONV FreeImage_IsTransparent(FIBITMAP *dib);
DLL_API void DLL_CALLCONV FreeImage_SetTransparentIndex(FIBITMAP *dib, int index);
DLL_API int DLL_CALLCONV FreeImage_GetTransparentIndex(FIBITMAP *dib);

DLL_API BOOL DLL_CALLCONV FreeImage_HasBackgroundColor(FIBITMAP *dib);
DLL_API BOOL DLL_CALLCONV FreeImage_GetBackgroundColor(FIBITMAP *dib, RGBQUAD *bkcolor);
DLL_API BOOL DLL_CALLCONV FreeImage_SetBackgroundColor(FIBITMAP *dib, RGBQUAD *bkcolor);

DLL_API FIBITMAP *DLL_CALLCONV FreeImage_GetThumbnail(FIBITMAP *dib);
DLL_API BOOL DLL_CALLCONV FreeImage_SetThumbnail(FIBITMAP *dib, FIBITMAP *thumbnail);

// ICC profile routines -----------------------------------------------------

DLL_API FIICCPROFILE *DLL_CALLCONV FreeImage_GetICCProfile(FIBITMAP *dib);
DLL_API FIICCPROFILE *DLL_CALLCONV FreeImage_CreateICCProfile(FIBITMAP *dib, void *data, long size);
DLL_API void DLL_CALLCONV FreeImage_DestroyICCProfile(FIBITMAP *dib);

// Line conversion routines -------------------------------------------------

DLL_API void DLL_CALLCONV FreeImage_ConvertLine1To4(BYTE *target, BYTE *source, int width_in_pixels);
DLL_API void DLL_CALLCONV FreeImage_ConvertLine8To4(BYTE *target, BYTE *source, int width_in_pixels, RGBQUAD *palette);
DLL_API void DLL_CALLCONV FreeImage_ConvertLine16To4_555(BYTE *target, BYTE *source, int width_in_pixels);
DLL_API void DLL_CALLCONV FreeImage_ConvertLine16To4_565(BYTE *target, BYTE *source, int width_in_pixels);
DLL_API void DLL_CALLCONV FreeImage_ConvertLine24To4(BYTE *target, BYTE *source, int width_in_pixels);
DLL_API void DLL_CALLCONV FreeImage_ConvertLine32To4(BYTE *target, BYTE *source, int width_in_pixels);
DLL_API void DLL_CALLCONV FreeImage_ConvertLine1To8(BYTE *target, BYTE *source, int width_in_pixels);
DLL_API void DLL_CALLCONV FreeImage_ConvertLine4To8(BYTE *target, BYTE *source, int width_in_pixels);
DLL_API void DLL_CALLCONV FreeImage_ConvertLine16To8_555(BYTE *target, BYTE *source, int width_in_pixels);
DLL_API void DLL_CALLCONV FreeImage_ConvertLine16To8_565(BYTE *target, BYTE *source, int width_in_pixels);
DLL_API void DLL_CALLCONV FreeImage_ConvertLine24To8(BYTE *target, BYTE *source, int width_in_pixels);
DLL_API void DLL_CALLCONV FreeImage_ConvertLine32To8(BYTE *target, BYTE *source, int width_in_pixels);
DLL_API void DLL_CALLCONV FreeImage_ConvertLine1To16_555(BYTE *target, BYTE *source, int width_in_pixels, RGBQUAD *palette);
DLL_API void DLL_CALLCONV FreeImage_ConvertLine4To16_555(BYTE *target, BYTE *source, int width_in_pixels, RGBQUAD *palette);
DLL_API void DLL_CALLCONV FreeImage_ConvertLine8To16_555(BYTE *target, BYTE *source, int width_in_pixels, RGBQUAD *palette);
DLL_API void DLL_CALLCONV FreeImage_ConvertLine16_565_To16_555(BYTE *target, BYTE *source, int width_in_pixels);
DLL_API void DLL_CALLCONV FreeImage_ConvertLine24To16_555(BYTE *target, BYTE *source, int width_in_pixels);
DLL_API void DLL_CALLCONV FreeImage_ConvertLine32To16_555(BYTE *target, BYTE *source, int width_in_pixels);
DLL_API void DLL_CALLCONV FreeImage_ConvertLine1To16_565(BYTE *target, BYTE *source, int width_in_pixels, RGBQUAD *palette);
DLL_API void DLL_CALLCONV FreeImage_ConvertLine4To16_565(BYTE *target, BYTE *source, int width_in_pixels, RGBQUAD *palette);
DLL_API void DLL_CALLCONV FreeImage_ConvertLine8To16_565(BYTE *target, BYTE *source, int width_in_pixels, RGBQUAD *palette);
DLL_API void DLL_CALLCONV FreeImage_ConvertLine16_555_To16_565(BYTE *target, BYTE *source, int width_in_pixels);
DLL_API void DLL_CALLCONV FreeImage_ConvertLine24To16_565(BYTE *target, BYTE *source, int width_in_pixels);
DLL_API void DLL_CALLCONV FreeImage_ConvertLine32To16_565(BYTE *target, BYTE *source, int width_in_pixels);
DLL_API void DLL_CALLCONV FreeImage_ConvertLine1To24(BYTE *target, BYTE *source, int width_in_pixels, RGBQUAD *palette);
DLL_API void DLL_CALLCONV FreeImage_ConvertLine4To24(BYTE *target, BYTE *source, int width_in_pixels, RGBQUAD *palette);
DLL_API void DLL_CALLCONV FreeImage_ConvertLine8To24(BYTE *target, BYTE *source, int width_in_pixels, RGBQUAD *palette);
DLL_API void DLL_CALLCONV FreeImage_ConvertLine16To24_555(BYTE *target, BYTE *source, int width_in_pixels);
DLL_API void DLL_CALLCONV FreeImage_ConvertLine16To24_565(BYTE *target, BYTE *source, int width_in_pixels);
DLL_API void DLL_CALLCONV FreeImage_ConvertLine32To24(BYTE *target, BYTE *source, int width_in_pixels);
DLL_API void DLL_CALLCONV FreeImage_ConvertLine1To32(BYTE *target, BYTE *source, int width_in_pixels, RGBQUAD *palette);
DLL_API void DLL_CALLCONV FreeImage_ConvertLine4To32(BYTE *target, BYTE *source, int width_in_pixels, RGBQUAD *palette);
DLL_API void DLL_CALLCONV FreeImage_ConvertLine8To32(BYTE *target, BYTE *source, int width_in_pixels, RGBQUAD *palette);
DLL_API void DLL_CALLCONV FreeImage_ConvertLine16To32_555(BYTE *target, BYTE *source, int width_in_pixels);
DLL_API void DLL_CALLCONV FreeImage_ConvertLine16To32_565(BYTE *target, BYTE *source, int width_in_pixels);
DLL_API void DLL_CALLCONV FreeImage_ConvertLine24To32(BYTE *target, BYTE *source, int width_in_pixels);

// Smart conversion routines ------------------------------------------------

DLL_API FIBITMAP *DLL_CALLCONV FreeImage_ConvertTo4Bits(FIBITMAP *dib);
DLL_API FIBITMAP *DLL_CALLCONV FreeImage_ConvertTo8Bits(FIBITMAP *dib);
DLL_API FIBITMAP *DLL_CALLCONV FreeImage_ConvertToGreyscale(FIBITMAP *dib);
DLL_API FIBITMAP *DLL_CALLCONV FreeImage_ConvertTo16Bits555(FIBITMAP *dib);
DLL_API FIBITMAP *DLL_CALLCONV FreeImage_ConvertTo16Bits565(FIBITMAP *dib);
DLL_API FIBITMAP *DLL_CALLCONV FreeImage_ConvertTo24Bits(FIBITMAP *dib);
DLL_API FIBITMAP *DLL_CALLCONV FreeImage_ConvertTo32Bits(FIBITMAP *dib);
DLL_API FIBITMAP *DLL_CALLCONV FreeImage_ColorQuantize(FIBITMAP *dib, FREE_IMAGE_QUANTIZE quantize);
DLL_API FIBITMAP *DLL_CALLCONV FreeImage_ColorQuantizeEx(FIBITMAP *dib, FREE_IMAGE_QUANTIZE quantize FI_DEFAULT(FIQ_WUQUANT), int PaletteSize FI_DEFAULT(256), int ReserveSize FI_DEFAULT(0), RGBQUAD *ReservePalette FI_DEFAULT(NULL));
DLL_API FIBITMAP *DLL_CALLCONV FreeImage_Threshold(FIBITMAP *dib, BYTE T);
DLL_API FIBITMAP *DLL_CALLCONV FreeImage_Dither(FIBITMAP *dib, FREE_IMAGE_DITHER algorithm);

DLL_API FIBITMAP *DLL_CALLCONV FreeImage_ConvertFromRawBits(BYTE *bits, int width, int height, int pitch, unsigned bpp, unsigned red_mask, unsigned green_mask, unsigned blue_mask, BOOL topdown FI_DEFAULT(FALSE));
DLL_API FIBITMAP *DLL_CALLCONV FreeImage_ConvertFromRawBitsEx(BOOL copySource, BYTE *bits, FREE_IMAGE_TYPE type, int width, int height, int pitch, unsigned bpp, unsigned red_mask, unsigned green_mask, unsigned blue_mask, BOOL topdown FI_DEFAULT(FALSE));
DLL_API void DLL_CALLCONV FreeImage_ConvertToRawBits(BYTE *bits, FIBITMAP *dib, int pitch, unsigned bpp, unsigned red_mask, unsigned green_mask, unsigned blue_mask, BOOL topdown FI_DEFAULT(FALSE));

DLL_API FIBITMAP *DLL_CALLCONV FreeImage_ConvertToFloat(FIBITMAP *dib);
DLL_API FIBITMAP *DLL_CALLCONV FreeImage_ConvertToRGBF(FIBITMAP *dib);
DLL_API FIBITMAP *DLL_CALLCONV FreeImage_ConvertToRGBAF(FIBITMAP *dib);
DLL_API FIBITMAP *DLL_CALLCONV FreeImage_ConvertToUINT16(FIBITMAP *dib);
DLL_API FIBITMAP *DLL_CALLCONV FreeImage_ConvertToRGB16(FIBITMAP *dib);
DLL_API FIBITMAP *DLL_CALLCONV FreeImage_ConvertToRGBA16(FIBITMAP *dib);

DLL_API FIBITMAP *DLL_CALLCONV FreeImage_ConvertToStandardType(FIBITMAP *src, BOOL scale_linear FI_DEFAULT(TRUE));
DLL_API FIBITMAP *DLL_CALLCONV FreeImage_ConvertToType(FIBITMAP *src, FREE_IMAGE_TYPE dst_type, BOOL scale_linear FI_DEFAULT(TRUE));

// Tone mapping operators ---------------------------------------------------

DLL_API FIBITMAP *DLL_CALLCONV FreeImage_ToneMapping(FIBITMAP *dib, FREE_IMAGE_TMO tmo, double first_param FI_DEFAULT(0), double second_param FI_DEFAULT(0));
DLL_API FIBITMAP *DLL_CALLCONV FreeImage_TmoDrago03(FIBITMAP *src, double gamma FI_DEFAULT(2.2), double exposure FI_DEFAULT(0));
DLL_API FIBITMAP *DLL_CALLCONV FreeImage_TmoReinhard05(FIBITMAP *src, double intensity FI_DEFAULT(0), double contrast FI_DEFAULT(0));
DLL_API FIBITMAP *DLL_CALLCONV FreeImage_TmoReinhard05Ex(FIBITMAP *src, double intensity FI_DEFAULT(0), double contrast FI_DEFAULT(0), double adaptation FI_DEFAULT(1), double color_correction FI_DEFAULT(0));

DLL_API FIBITMAP *DLL_CALLCONV FreeImage_TmoFattal02(FIBITMAP *src, double color_saturation FI_DEFAULT(0.5), double attenuation FI_DEFAULT(0.85));

// ZLib interface -----------------------------------------------------------

DLL_API DWORD DLL_CALLCONV FreeImage_ZLibCompress(BYTE *target, DWORD target_size, BYTE *source, DWORD source_size);
DLL_API DWORD DLL_CALLCONV FreeImage_ZLibUncompress(BYTE *target, DWORD target_size, BYTE *source, DWORD source_size);
DLL_API DWORD DLL_CALLCONV FreeImage_ZLibGZip(BYTE *target, DWORD target_size, BYTE *source, DWORD source_size);
DLL_API DWORD DLL_CALLCONV FreeImage_ZLibGUnzip(BYTE *target, DWORD target_size, BYTE *source, DWORD source_size);
DLL_API DWORD DLL_CALLCONV FreeImage_ZLibCRC32(DWORD crc, BYTE *source, DWORD source_size);

// --------------------------------------------------------------------------
// Metadata routines
// --------------------------------------------------------------------------

// tag creation / destruction
DLL_API FITAG *DLL_CALLCONV FreeImage_CreateTag(void);
DLL_API void DLL_CALLCONV FreeImage_DeleteTag(FITAG *tag);
DLL_API FITAG *DLL_CALLCONV FreeImage_CloneTag(FITAG *tag);

// tag getters and setters
DLL_API const char *DLL_CALLCONV FreeImage_GetTagKey(FITAG *tag);
DLL_API const char *DLL_CALLCONV FreeImage_GetTagDescription(FITAG *tag);
DLL_API WORD DLL_CALLCONV FreeImage_GetTagID(FITAG *tag);
DLL_API FREE_IMAGE_MDTYPE DLL_CALLCONV FreeImage_GetTagType(FITAG *tag);
DLL_API DWORD DLL_CALLCONV FreeImage_GetTagCount(FITAG *tag);
DLL_API DWORD DLL_CALLCONV FreeImage_GetTagLength(FITAG *tag);
DLL_API const void *DLL_CALLCONV FreeImage_GetTagValue(FITAG *tag);

DLL_API BOOL DLL_CALLCONV FreeImage_SetTagKey(FITAG *tag, const char *key);
DLL_API BOOL DLL_CALLCONV FreeImage_SetTagDescription(FITAG *tag, const char *description);
DLL_API BOOL DLL_CALLCONV FreeImage_SetTagID(FITAG *tag, WORD id);
DLL_API BOOL DLL_CALLCONV FreeImage_SetTagType(FITAG *tag, FREE_IMAGE_MDTYPE type);
DLL_API BOOL DLL_CALLCONV FreeImage_SetTagCount(FITAG *tag, DWORD count);
DLL_API BOOL DLL_CALLCONV FreeImage_SetTagLength(FITAG *tag, DWORD length);
DLL_API BOOL DLL_CALLCONV FreeImage_SetTagValue(FITAG *tag, const void *value);

// iterator
DLL_API FIMETADATA *DLL_CALLCONV FreeImage_FindFirstMetadata(FREE_IMAGE_MDMODEL model, FIBITMAP *dib, FITAG **tag);
DLL_API BOOL DLL_CALLCONV FreeImage_FindNextMetadata(FIMETADATA *mdhandle, FITAG **tag);
DLL_API void DLL_CALLCONV FreeImage_FindCloseMetadata(FIMETADATA *mdhandle);

// metadata setter and getter
DLL_API BOOL DLL_CALLCONV FreeImage_SetMetadata(FREE_IMAGE_MDMODEL model, FIBITMAP *dib, const char *key, FITAG *tag);
DLL_API BOOL DLL_CALLCONV FreeImage_GetMetadata(FREE_IMAGE_MDMODEL model, FIBITMAP *dib, const char *key, FITAG **tag);
DLL_API BOOL DLL_CALLCONV FreeImage_SetMetadataKeyValue(FREE_IMAGE_MDMODEL model, FIBITMAP *dib, const char *key, const char *value);

// helpers
DLL_API unsigned DLL_CALLCONV FreeImage_GetMetadataCount(FREE_IMAGE_MDMODEL model, FIBITMAP *dib);
DLL_API BOOL DLL_CALLCONV FreeImage_CloneMetadata(FIBITMAP *dst, FIBITMAP *src);

// tag to C string conversion
DLL_API const char* DLL_CALLCONV FreeImage_TagToString(FREE_IMAGE_MDMODEL model, FITAG *tag, char *Make FI_DEFAULT(NULL));

// --------------------------------------------------------------------------
// JPEG lossless transformation routines
// --------------------------------------------------------------------------

DLL_API BOOL DLL_CALLCONV FreeImage_JPEGTransform(const char *src_file, const char *dst_file, FREE_IMAGE_JPEG_OPERATION operation, BOOL perfect FI_DEFAULT(TRUE));
DLL_API BOOL DLL_CALLCONV FreeImage_JPEGTransformU(const wchar_t *src_file, const wchar_t *dst_file, FREE_IMAGE_JPEG_OPERATION operation, BOOL perfect FI_DEFAULT(TRUE));
DLL_API BOOL DLL_CALLCONV FreeImage_JPEGCrop(const char *src_file, const char *dst_file, int left, int top, int right, int bottom);
DLL_API BOOL DLL_CALLCONV FreeImage_JPEGCropU(const wchar_t *src_file, const wchar_t *dst_file, int left, int top, int right, int bottom);
DLL_API BOOL DLL_CALLCONV FreeImage_JPEGTransformFromHandle(FreeImageIO* src_io, fi_handle src_handle, FreeImageIO* dst_io, fi_handle dst_handle, FREE_IMAGE_JPEG_OPERATION operation, int* left, int* top, int* right, int* bottom, BOOL perfect FI_DEFAULT(TRUE));
DLL_API BOOL DLL_CALLCONV FreeImage_JPEGTransformCombined(const char *src_file, const char *dst_file, FREE_IMAGE_JPEG_OPERATION operation, int* left, int* top, int* right, int* bottom, BOOL perfect FI_DEFAULT(TRUE));
DLL_API BOOL DLL_CALLCONV FreeImage_JPEGTransformCombinedU(const wchar_t *src_file, const wchar_t *dst_file, FREE_IMAGE_JPEG_OPERATION operation, int* left, int* top, int* right, int* bottom, BOOL perfect FI_DEFAULT(TRUE));
DLL_API BOOL DLL_CALLCONV FreeImage_JPEGTransformCombinedFromMemory(FIMEMORY* src_stream, FIMEMORY* dst_stream, FREE_IMAGE_JPEG_OPERATION operation, int* left, int* top, int* right, int* bottom, BOOL perfect FI_DEFAULT(TRUE));


// --------------------------------------------------------------------------
// Image manipulation toolkit
// --------------------------------------------------------------------------

// rotation and flipping
/// @deprecated see FreeImage_Rotate
DLL_API FIBITMAP *DLL_CALLCONV FreeImage_RotateClassic(FIBITMAP *dib, double angle);
DLL_API FIBITMAP *DLL_CALLCONV FreeImage_Rotate(FIBITMAP *dib, double angle, const void *bkcolor FI_DEFAULT(NULL));
DLL_API FIBITMAP *DLL_CALLCONV FreeImage_RotateEx(FIBITMAP *dib, double angle, double x_shift, double y_shift, double x_origin, double y_origin, BOOL use_mask);
DLL_API BOOL DLL_CALLCONV FreeImage_FlipHorizontal(FIBITMAP *dib);
DLL_API BOOL DLL_CALLCONV FreeImage_FlipVertical(FIBITMAP *dib);

// upsampling / downsampling
DLL_API FIBITMAP *DLL_CALLCONV FreeImage_Rescale(FIBITMAP *dib, int dst_width, int dst_height, FREE_IMAGE_FILTER filter FI_DEFAULT(FILTER_CATMULLROM));
DLL_API FIBITMAP *DLL_CALLCONV FreeImage_MakeThumbnail(FIBITMAP *dib, int max_pixel_size, BOOL convert FI_DEFAULT(TRUE));
DLL_API FIBITMAP *DLL_CALLCONV FreeImage_RescaleRect(FIBITMAP *dib, int dst_width, int dst_height, int left, int top, int right, int bottom, FREE_IMAGE_FILTER filter FI_DEFAULT(FILTER_CATMULLROM), unsigned flags FI_DEFAULT(0));

// color manipulation routines (point operations)
DLL_API BOOL DLL_CALLCONV FreeImage_AdjustCurve(FIBITMAP *dib, BYTE *LUT, FREE_IMAGE_COLOR_CHANNEL channel);
DLL_API BOOL DLL_CALLCONV FreeImage_AdjustGamma(FIBITMAP *dib, double gamma);
DLL_API BOOL DLL_CALLCONV FreeImage_AdjustBrightness(FIBITMAP *dib, double percentage);
DLL_API BOOL DLL_CALLCONV FreeImage_AdjustContrast(FIBITMAP *dib, double percentage);
DLL_API BOOL DLL_CALLCONV FreeImage_Invert(FIBITMAP *dib);
DLL_API BOOL DLL_CALLCONV FreeImage_GetHistogram(FIBITMAP *dib, DWORD *histo, FREE_IMAGE_COLOR_CHANNEL channel FI_DEFAULT(FICC_BLACK));
DLL_API int DLL_CALLCONV FreeImage_GetAdjustColorsLookupTable(BYTE *LUT, double brightness, double contrast, double gamma, BOOL invert);
DLL_API BOOL DLL_CALLCONV FreeImage_AdjustColors(FIBITMAP *dib, double brightness, double contrast, double gamma, BOOL invert FI_DEFAULT(FALSE));
DLL_API unsigned DLL_CALLCONV FreeImage_ApplyColorMapping(FIBITMAP *dib, RGBQUAD *srccolors, RGBQUAD *dstcolors, unsigned count, BOOL ignore_alpha, BOOL swap);
DLL_API unsigned DLL_CALLCONV FreeImage_SwapColors(FIBITMAP *dib, RGBQUAD *color_a, RGBQUAD *color_b, BOOL ignore_alpha);
DLL_API unsigned DLL_CALLCONV FreeImage_ApplyPaletteIndexMapping(FIBITMAP *dib, BYTE *srcindices,	BYTE *dstindices, unsigned count, BOOL swap);
DLL_API unsigned DLL_CALLCONV FreeImage_SwapPaletteIndices(FIBITMAP *dib, BYTE *index_a, BYTE *index_b);

// channel processing routines
DLL_API FIBITMAP *DLL_CALLCONV FreeImage_GetChannel(FIBITMAP *dib, FREE_IMAGE_COLOR_CHANNEL channel);
DLL_API BOOL DLL_CALLCONV FreeImage_SetChannel(FIBITMAP *dst, FIBITMAP *src, FREE_IMAGE_COLOR_CHANNEL channel);
DLL_API FIBITMAP *DLL_CALLCONV FreeImage_GetComplexChannel(FIBITMAP *src, FREE_IMAGE_COLOR_CHANNEL channel);
DLL_API BOOL DLL_CALLCONV FreeImage_SetComplexChannel(FIBITMAP *dst, FIBITMAP *src, FREE_IMAGE_COLOR_CHANNEL channel);

// copy / paste / composite routines
DLL_API FIBITMAP *DLL_CALLCONV FreeImage_Copy(FIBITMAP *dib, int left, int top, int right, int bottom);
DLL_API BOOL DLL_CALLCONV FreeImage_Paste(FIBITMAP *dst, FIBITMAP *src, int left, int top, int alpha);
DLL_API FIBITMAP *DLL_CALLCONV FreeImage_CreateView(FIBITMAP *dib, unsigned left, unsigned top, unsigned right, unsigned bottom);

DLL_API FIBITMAP *DLL_CALLCONV FreeImage_Composite(FIBITMAP *fg, BOOL useFileBkg FI_DEFAULT(FALSE), RGBQUAD *appBkColor FI_DEFAULT(NULL), FIBITMAP *bg FI_DEFAULT(NULL));
DLL_API BOOL DLL_CALLCONV FreeImage_PreMultiplyWithAlpha(FIBITMAP *dib);

// background filling routines
DLL_API BOOL DLL_CALLCONV FreeImage_FillBackground(FIBITMAP *dib, const void *color, int options FI_DEFAULT(0));
DLL_API FIBITMAP *DLL_CALLCONV FreeImage_EnlargeCanvas(FIBITMAP *src, int left, int top, int right, int bottom, const void *color, int options FI_DEFAULT(0));
DLL_API FIBITMAP *DLL_CALLCONV FreeImage_AllocateEx(int width, int height, int bpp, const RGBQUAD *color, int options FI_DEFAULT(0), const RGBQUAD *palette FI_DEFAULT(NULL), unsigned red_mask FI_DEFAULT(0), unsigned green_mask FI_DEFAULT(0), unsigned blue_mask FI_DEFAULT(0));
DLL_API FIBITMAP *DLL_CALLCONV FreeImage_AllocateExT(FREE_IMAGE_TYPE type, int width, int height, int bpp, const void *color, int options FI_DEFAULT(0), const RGBQUAD *palette FI_DEFAULT(NULL), unsigned red_mask FI_DEFAULT(0), unsigned green_mask FI_DEFAULT(0), unsigned blue_mask FI_DEFAULT(0));

// miscellaneous algorithms
DLL_API FIBITMAP *DLL_CALLCONV FreeImage_MultigridPoissonSolver(FIBITMAP *Laplacian, int ncycle FI_DEFAULT(3));

// restore the borland-specific enum size option
#if defined(__BORLANDC__)
#pragma option pop
#endif

#ifdef __cplusplus
}
#endif

#endif // FREEIMAGE_H
