// ==========================================================
// FreeImagePlus 3
//
// Design and implementation by
// - Hervé Drolon (drolon@infonie.fr)
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

#ifndef FREEIMAGEPLUS_H
#define FREEIMAGEPLUS_H

#ifdef _WIN32
#include <windows.h>
#endif // _WIN32
#include "FreeImage.h"


// Compiler options ---------------------------------------------------------

#if defined(FREEIMAGE_LIB)
	#define FIP_API
	#define FIP_CALLCONV
#else
	#if defined(_WIN32) || defined(__WIN32__)
		#define WIN32_LEAN_AND_MEAN
		#define FIP_CALLCONV __stdcall
		// The following ifdef block is the standard way of creating macros which make exporting 
		// from a DLL simpler. All files within this DLL are compiled with the FIP_EXPORTS
		// symbol defined on the command line. this symbol should not be defined on any project
		// that uses this DLL. This way any other project whose source files include this file see 
		// FIP_API functions as being imported from a DLL, wheras this DLL sees symbols
		// defined with this macro as being exported.
		#ifdef FIP_EXPORTS
			#define FIP_API __declspec(dllexport)
		#else
			#define FIP_API __declspec(dllimport)
		#endif // FIP_EXPORTS
	#else
		// try the gcc visibility support (see http://gcc.gnu.org/wiki/Visibility)
		#if defined(__GNUC__) && ((__GNUC__ >= 4) || (__GNUC__ == 3 && __GNUC_MINOR__ >= 4))
			#ifndef GCC_HASCLASSVISIBILITY
				#define GCC_HASCLASSVISIBILITY
			#endif
		#endif	
		#define FIP_CALLCONV
		#if defined(GCC_HASCLASSVISIBILITY)
			#define FIP_API __attribute__ ((visibility("default")))
		#else
			#define FIP_API
		#endif
	#endif // WIN32 / !WIN32
#endif // FREEIMAGE_LIB

///////////////////////////////////////////////////////////////////////////////////////////

// ----------------------------------------------------------

/** Abstract base class for all objects used by the library.
	@version FreeImage 3
	@author Hervé Drolon
*/

class FIP_API fipObject
{
public:
	/// Destructor
	virtual ~fipObject(){};
	
	/**@name Information functions */
	//@{
	/// Returns TRUE if the object is allocated, FALSE otherwise
	virtual BOOL isValid() const = 0;
	//@}
};

// ----------------------------------------------------------

class fipMemoryIO;
class fipMultiPage;
class fipTag;

/** A class used to manage all photo related images and all image types used by the library.

	fipImage encapsulates the FIBITMAP format. It relies on the FreeImage library, especially for 
	loading / saving images and for bit depth conversion.
	@version FreeImage 3
	@author Hervé Drolon
*/

class FIP_API fipImage : public fipObject
{
protected:
	/// DIB data
	FIBITMAP *_dib;
	/// Original (or last saved) fif format if available, FIF_UNKNOWN otherwise
	FREE_IMAGE_FORMAT _fif;
	/// TRUE whenever the display need to be refreshed
	mutable BOOL _bHasChanged;

public:
	friend class fipMultiPage;

public:

	/**@name Creation & Destruction */
	//@{	
	/**
	Constructor
	@see FreeImage_AllocateT
	*/
	fipImage(FREE_IMAGE_TYPE image_type = FIT_BITMAP, unsigned width = 0, unsigned height = 0, unsigned bpp = 0);
	/// Destructor
	virtual ~fipImage();
	/**
	Image allocator
	@see FreeImage_AllocateT
	*/
	BOOL setSize(FREE_IMAGE_TYPE image_type, unsigned width, unsigned height, unsigned bpp, unsigned red_mask = 0, unsigned green_mask = 0, unsigned blue_mask = 0);
	/// Destroy image data
	virtual void clear();
	//@}

	/**@name Copying */
	//@{	
	/**
	Copy constructor
	@see FreeImage_Clone
	*/
	fipImage(const fipImage& src);
	/**
	Copy constructor
	@see FreeImage_Clone
	*/
	fipImage& operator=(const fipImage& src);
	/**
	<b>Assignement operator</b><br>
	Copy the input pointer and manage its destruction
	@see operator FIBITMAP*()
	*/
	fipImage& operator=(FIBITMAP *dib);


	/**
	@brief Copy a sub part of the current image and returns it as a fipImage object.
	
	This method works with any bitmap type.
	@param dst Output subimage
	@param left Specifies the left position of the cropped rectangle. 
	@param top Specifies the top position of the cropped rectangle. 
	@param right Specifies the right position of the cropped rectangle. 
	@param bottom Specifies the bottom position of the cropped rectangle. 
	@return Returns TRUE if successful, FALSE otherwise.
	@see FreeImage_Copy
	*/
	BOOL copySubImage(fipImage& dst, int left, int top, int right, int bottom) const;

	/**
	@brief Alpha blend or combine a sub part image with the current image.

    The bit depth of dst bitmap must be greater than or equal to the bit depth of src. 
	Upper promotion of src is done internally. Supported bit depth equals to 4, 8, 16, 24 or 32.
	@param src Source subimage
	@param left Specifies the left position of the sub image. 
	@param top Specifies the top position of the sub image. 
	@param alpha Alpha blend factor. The source and destination images are alpha blended if 
	alpha = 0..255. If alpha > 255, then the source image is combined to the destination image.
	@return Returns TRUE if successful, FALSE otherwise.
	@see FreeImage_Paste
	*/
	BOOL pasteSubImage(fipImage& src, int left, int top, int alpha = 256);

	/**
	@brief Crop a sub part of the current image and update it accordingly.
	
	This method works with any bitmap type.
	@param left Specifies the left position of the cropped rectangle. 
	@param top Specifies the top position of the cropped rectangle. 
	@param right Specifies the right position of the cropped rectangle. 
	@param bottom Specifies the bottom position of the cropped rectangle. 
	@return Returns TRUE if successful, FALSE otherwise.
	*/
	BOOL crop(int left, int top, int right, int bottom);

	//@}

	/** @name File type identification
	 */
	//@{	
	/**
	@brief Identifies an image from disk, given its file name
	@param lpszPathName Path and file name of the image to identify.
	@return Returns the found FreeImage format if successful, returns FIF_UNKNOWN otherwise.
	@see FreeImage_GetFileType, FreeImage_GetFIFFromFilename, FreeImage documentation
	*/
	static FREE_IMAGE_FORMAT identifyFIF(const char* lpszPathName);

	/**
	UNICODE version of identifyFIF (this function only works under WIN32 and does nothing on other OS)
	@see FreeImage_GetFileTypeU, FreeImage_GetFIFFromFilenameU, FreeImage documentation
	*/
	static FREE_IMAGE_FORMAT identifyFIFU(const wchar_t* lpszPathName);

	/**
	@brief Identifies an image using the specified FreeImageIO struct and fi_handle.
	@param io FreeImageIO structure
	@param handle FreeImage fi_handle
	@return Returns the found FreeImage format if successful, returns FIF_UNKNOWN otherwise.
	@see FreeImage_GetFileTypeFromHandle, FreeImage documentation
	*/
	static FREE_IMAGE_FORMAT identifyFIFFromHandle(FreeImageIO *io, fi_handle handle);

	/**
	@brief Identifies an image using the specified memory stream.
	@param hmem FreeImage memory stream
	@return Returns the found FreeImage format if successful, returns FIF_UNKNOWN otherwise.
	@see FreeImage_GetFileTypeFromMemory, FreeImage documentation
	*/
	static FREE_IMAGE_FORMAT identifyFIFFromMemory(FIMEMORY *hmem);

	//@}


	/** @name Loading & Saving
	 * Loading and saving is handled by the FreeImage library.
	 */
	//@{	
	/**
	@brief Loads an image from disk, given its file name and an optional flag.
	@param lpszPathName Path and file name of the image to load.
	@param flag The signification of this flag depends on the image to be read.
	@return Returns TRUE if successful, FALSE otherwise.
	@see FreeImage_Load, FreeImage documentation
	*/
	BOOL load(const char* lpszPathName, int flag = 0);

	/**
	UNICODE version of load (this function only works under WIN32 and does nothing on other OS)
	@see load
	*/
	BOOL loadU(const wchar_t* lpszPathName, int flag = 0);

	/**
	@brief Loads an image using the specified FreeImageIO struct and fi_handle, and an optional flag.
	@param io FreeImageIO structure
	@param handle FreeImage fi_handle
	@param flag The signification of this flag depends on the image to be read.
	@return Returns TRUE if successful, FALSE otherwise.
	@see FreeImage_LoadFromHandle, FreeImage documentation
	*/
	BOOL loadFromHandle(FreeImageIO *io, fi_handle handle, int flag = 0);

	/**
	@brief Loads an image using the specified memory stream and an optional flag.
	@param memIO FreeImage memory stream
	@param flag The signification of this flag depends on the image to be read.
	@return Returns TRUE if successful, FALSE otherwise.
	@see FreeImage_LoadFromMemory, FreeImage documentation
	*/
	BOOL loadFromMemory(fipMemoryIO& memIO, int flag = 0);

	/**
	@brief Saves an image to disk, given its file name and an optional flag.
	@param lpszPathName Path and file name of the image to save.
	@param flag The signification of this flag depends on the image to be saved.
	@return Returns TRUE if successful, FALSE otherwise.
	@see FreeImage_Save, FreeImage documentation
	*/
	BOOL save(const char* lpszPathName, int flag = 0) const;

	/**
	UNICODE version of save (this function only works under WIN32 and does nothing on other OS)
	@see save
	*/
	BOOL saveU(const wchar_t* lpszPathName, int flag = 0) const;

	/**
	@brief Saves an image using the specified FreeImageIO struct and fi_handle, and an optional flag.
	@param fif Format identifier (FreeImage format)
	@param io FreeImageIO structure
	@param handle FreeImage fi_handle
	@param flag The signification of this flag depends on the image to be saved.
	@return Returns TRUE if successful, FALSE otherwise.
	@see FreeImage_SaveToHandle, FreeImage documentation
	*/
	BOOL saveToHandle(FREE_IMAGE_FORMAT fif, FreeImageIO *io, fi_handle handle, int flag = 0) const;

	/**
	@brief Saves an image using the specified memory stream and an optional flag.
	@param fif Format identifier (FreeImage format)
	@param memIO FreeImage memory stream
	@param flag The signification of this flag depends on the image to be saved.
	@return Returns TRUE if successful, FALSE otherwise.
	@see FreeImage_SaveToMemory, FreeImage documentation
	*/
	BOOL saveToMemory(FREE_IMAGE_FORMAT fif, fipMemoryIO& memIO, int flag = 0) const;

	//@}

	/**	@name Information functions
	 *  Accessors to the DIB BITMAPINFO structure.
	 */
	//@{	

	/**
	Returns the data type of the image
	@see FreeImage_GetImageType
	*/
	FREE_IMAGE_TYPE getImageType() const;

	/**
	Returns the image width in pixels
	@see FreeImage_GetWidth
	*/
	unsigned getWidth() const;
	
	/**
	Returns the image height in pixels
	@see FreeImage_GetHeight
	*/
	unsigned getHeight() const;
	
	/**
	Returns the width of the bitmap in bytes rounded to the nearest DWORD.
	@see FreeImage_GetPitch
	*/
	unsigned getScanWidth() const;

	/**
	Returns a pointer to the FIBITMAP data. Used for direct access from FREEIMAGE functions 
	or from your own low level C functions.<br>
	<b>Sample use</b> : <br>
	<pre>
	fipImage src, dst;
	src.load("test.png");
	dst = FreeImage_ConvertTo8Bits(src);
	FreeImage_Save(FIF_TIFF, dst, "test.tif", 0);
	</pre>
	@see operator=(FIBITMAP *dib)
	*/
	operator FIBITMAP*() { 
		return _dib; 
	}

	/// Returns TRUE if the image is allocated, FALSE otherwise
	BOOL isValid() const;

	/**
	Returns a pointer to the bitmap's BITMAPINFO header. 
	@see FreeImage_GetInfo
	*/
	BITMAPINFO* getInfo() const;

	/**
	Returns a pointer to the bitmap's BITMAPINFOHEADER. 
	@see FreeImage_GetInfoHeader
	*/
    BITMAPINFOHEADER* getInfoHeader() const;

	/**
	Returns the size of the bitmap in bytes. 
	The size of the bitmap is the BITMAPINFOHEADER + the size of the palette + the size of the bitmap data. 
	@see FreeImage_GetDIBSize
	*/
	unsigned getImageSize() const;

	/**
	Returns the memory footprint of a bitmap, in bytes. 
	@see FreeImage_GetMemorySize
	*/
	unsigned getImageMemorySize() const;
	
	/**
	Returns the bitdepth of the bitmap. <br>
	When the image type is FIT_BITMAP, valid bitdepth can be 1, 4, 8, 16, 24 or 32.
	@see FreeImage_GetBPP, getImageType
	*/
	unsigned getBitsPerPixel() const;

	/**
	Returns the width of the bitmap in bytes.<br>
	<b>This is not the size of the scanline</b>.
	@see FreeImage_GetLine, getScanWidth
	*/
	unsigned getLine() const;

	/**
	Returns the bitmap resolution along the X axis, in pixels / cm
	@see FreeImage_GetDotsPerMeterX
	*/
	double getHorizontalResolution() const;
	
	/**
	Returns the bitmap resolution along the Y axis, in pixels / cm
	@see FreeImage_GetDotsPerMeterY
	*/
	double getVerticalResolution() const;

	/**
	set the bitmap resolution along the X axis, in pixels / cm
	@see FreeImage_GetInfoHeader
	*/
	void setHorizontalResolution(double value);
	
	/**
	set the bitmap resolution along the Y axis, in pixels / cm
	@see FreeImage_GetInfoHeader
	*/
	void setVerticalResolution(double value);

	//@}

	/**@name Palette operations */
	//@{
	/**
	Returns a pointer to the bitmap's palette. If the bitmap doesn't have a palette, getPalette returns NULL. 
	@see FreeImage_GetPalette
	*/
	RGBQUAD* getPalette() const;
	
	/**
	Returns the palette size in <b>bytes</b>.
	@see FreeImage_GetColorsUsed
	*/
	unsigned getPaletteSize() const;

	/**
	Retrieves the number of colours used in the bitmap. If the bitmap is non-palletised, 0 is returned. 
	@see FreeImage_GetColorsUsed
	*/
	unsigned getColorsUsed() const;

	/** 
	Investigates the colour type of the bitmap.
	@see FreeImage_GetColorType, FREE_IMAGE_COLOR_TYPE
	*/
	FREE_IMAGE_COLOR_TYPE getColorType() const;

	/**
	Returns TRUE if the bitmap is a 8-bit bitmap with a greyscale palette, FALSE otherwise
	@see FreeImage_GetBPP, FreeImage_GetColorType
	*/
	BOOL isGrayscale() const;
	//@}

	/**@name Thumbnail access */
	//@{

	/**
	Retrieves a copy the thumbnail possibly attached to the bitmap
	@return Returns TRUE if the thumbnail is present in the bitmap and successfuly retrieved, returns FALSE otherwise
	@see FreeImage_GetThumbnail
	*/
	BOOL getThumbnail(fipImage& image) const;

	/**
	Attach a thumbnail to the bitmap
	@return Returns TRUE if the thumbnail was successfuly set, returns FALSE otherwise
	@see FreeImage_SetThumbnail
	*/
	BOOL setThumbnail(const fipImage& image);

	/**
	Check if the image has an embedded thumbnail
	@return Returns TRUE if a thumbnail is present in the bitmap, returns FALSE otherwise
	@see FreeImage_GetThumbnail
	*/
	BOOL hasThumbnail() const;

	/**
	Clear the thumbnail possibly attached to the bitmap
	@return Returns TRUE if successful, returns FALSe otherwise
	@see FreeImage_SetThumbnail
	*/
	BOOL clearThumbnail();

	//@}

	/**@name Pixel access */
	//@{	

	/** @brief Returns a pointer to the bitmap bits.

	It is up to you to interpret these bytes correctly, 
	according to the results of FreeImage_GetBPP and 
	GetRedMask, FreeImage_GetGreenMask and FreeImage_GetBlueMask.<br>
	Use this function with getScanWidth to iterates through the pixels. 
	@see FreeImage_GetBits
	*/
	BYTE* accessPixels() const;

	/** @brief Returns a pointer to the start of the given scanline in the bitmap’s data-bits.
		This pointer can be cast according to the result returned by getImageType.<br>
		Use this function with getScanWidth to iterates through the pixels. 
		@see FreeImage_GetScanLine, FreeImage documentation
	*/
	BYTE* getScanLine(unsigned scanline) const;

	/** 
	Get the pixel index of a 1-, 4- or 8-bit palettized image at position (x, y), including range check (slow access). 
	@param x Pixel position in horizontal direction
	@param y Pixel position in vertical direction
	@param value Pixel index (returned value)
	@return Returns TRUE if successful, FALSE otherwise. 
	@see FreeImage_GetPixelIndex
	*/
	BOOL getPixelIndex(unsigned x, unsigned y, BYTE *value) const;

	/** 
	Get the pixel color of a 16-, 24- or 32-bit image at position (x, y), including range check (slow access). 
	@param x Pixel position in horizontal direction
	@param y Pixel position in vertical direction
	@param value Pixel color (returned value)
	@return Returns TRUE if successful, FALSE otherwise. 
	@see FreeImage_GetPixelColor
	*/
	BOOL getPixelColor(unsigned x, unsigned y, RGBQUAD *value) const;

	/** 
	Set the pixel index of a 1-, 4- or 8-bit palettized image at position (x, y), including range check (slow access). 
	@param x Pixel position in horizontal direction
	@param y Pixel position in vertical direction
	@param value Pixel index
	@return Returns TRUE if successful, FALSE otherwise. 
	@see FreeImage_SetPixelIndex
	*/
	BOOL setPixelIndex(unsigned x, unsigned y, BYTE *value);

	/** 
	Set the pixel color of a 16-, 24- or 32-bit image at position (x, y), including range check (slow access). 
	@param x Pixel position in horizontal direction
	@param y Pixel position in vertical direction
	@param value Pixel color
	@return Returns TRUE if successful, FALSE otherwise. 
	@see FreeImage_SetPixelColor
	*/
	BOOL setPixelColor(unsigned x, unsigned y, RGBQUAD *value);

	//@}

	/**	@name Conversion routines
	 *  Bitmaps are always loaded in their default bit depth. If you want the bitmap to be stored in another bit depth, the class provides several conversion functions.
	 */
	//@{	
	/** 
	Converts an image to a type supported by FreeImage.
	@param image_type New image type
	@param scale_linear TRUE if image pixels must be scaled linearly when converting to a standard bitmap
	@return Returns TRUE if successful, FALSE otherwise. 
	@see FreeImage_ConvertToType, FreeImage_ConvertToStandardType
	*/
	BOOL convertToType(FREE_IMAGE_TYPE image_type, BOOL scale_linear = TRUE);

	/** 
	Converts the bitmap to 1 bit using a threshold T.
	@param T Threshold value in [0..255]
	@return Returns TRUE if successful, FALSE otherwise. 
	@see FreeImage_Threshold
	*/
	BOOL threshold(BYTE T);
	
	/** 
	Converts a 8-bit image to a monochrome 1-bit image using a dithering algorithm.
	@param algorithm Dithering algorithm to use.
	@return Returns TRUE if successful, FALSE otherwise. 
	@see FreeImage_Dither, FREE_IMAGE_DITHER
	*/
	BOOL dither(FREE_IMAGE_DITHER algorithm);

	/** 
	Converts the bitmap to 4 bits. Unless the bitmap is a 1-bit palettized bitmap, colour values are converted to greyscale.
	@return Returns TRUE if successful, FALSE otherwise. 
	@see FreeImage_ConvertTo4Bits
	*/
	BOOL convertTo4Bits();

	/** 
	Converts the bitmap to 8 bits. If the bitmap is 24 or 32-bit RGB, the colour values are converted to greyscale.
	@return Returns TRUE if successful, FALSE otherwise. 
	@see FreeImage_ConvertTo8Bits
	*/
	BOOL convertTo8Bits();

	/** 
	Converts the bitmap to 8 bits.<br> 
	For palletized bitmaps, the color map is converted to a greyscale ramp.
	@see FreeImage_ConvertToGreyscale
	@return Returns TRUE if successful, FALSE otherwise. 
	*/
	BOOL convertToGrayscale();
	
	/** 
	Quantizes a full colour 24-bit bitmap to a palletised 8-bit bitmap.<br>
	The quantize parameter specifies which colour reduction algorithm should be used.
	@param algorithm Color quantization algorithm to use.
	@return Returns TRUE if successful, FALSE otherwise. 
	@see FreeImage_ColorQuantize, FREE_IMAGE_QUANTIZE
	*/
	BOOL colorQuantize(FREE_IMAGE_QUANTIZE algorithm);

	/** 
	Converts the bitmap to 16 bits. The resulting bitmap has a layout of 5 bits red, 5 bits green, 5 bits blue and 1 unused bit. 
	@return Returns TRUE if successful, FALSE otherwise. 
	@see FreeImage_ConvertTo16Bits555
	*/
	BOOL convertTo16Bits555();
	
	/** 
	Converts the bitmap to 16 bits. The resulting bitmap has a layout of 5 bits red, 6 bits green and 5 bits blue. 
	@return Returns TRUE if successful, FALSE otherwise. 
	@see FreeImage_ConvertTo16Bits565
	*/
	BOOL convertTo16Bits565();
	
	/** 
	Converts the bitmap to 24 bits. 
	@return Returns TRUE if successful, FALSE otherwise. 
	@see FreeImage_ConvertTo24Bits
	*/
	BOOL convertTo24Bits();
	
	/** 
	Converts the bitmap to 32 bits. 
	@return Returns TRUE if successful, FALSE otherwise. 
	@see FreeImage_ConvertTo32Bits
	*/
	BOOL convertTo32Bits();

	/** 
	Converts the bitmap to a 32-bit float image. 
	@return Returns TRUE if successful, FALSE otherwise. 
	@see FreeImage_ConvertToFloat
	*/
	BOOL convertToFloat();

	/** 
	Converts the bitmap to a 96-bit RGBF image. 
	@return Returns TRUE if successful, FALSE otherwise. 
	@see FreeImage_ConvertToRGBF
	*/
	BOOL convertToRGBF();

	/** 
	Converts the bitmap to a 128-bit RGBAF image. 
	@return Returns TRUE if successful, FALSE otherwise. 
	@see FreeImage_ConvertToRGBAF
	*/
	BOOL convertToRGBAF();

	/** 
	Converts the bitmap to a 16-bit unsigned short image. 
	@return Returns TRUE if successful, FALSE otherwise. 
	@see FreeImage_ConvertToUINT16
	*/
	BOOL convertToUINT16();

	/** 
	Converts the bitmap to a 48-bit RGB16 image. 
	@return Returns TRUE if successful, FALSE otherwise. 
	@see FreeImage_ConvertToRGB16
	*/
	BOOL convertToRGB16();

	/** 
	Converts the bitmap to a 64-bit RGBA16 image. 
	@return Returns TRUE if successful, FALSE otherwise. 
	@see FreeImage_ConvertToRGBA16
	*/
	BOOL convertToRGBA16();

	/**
	Converts a High Dynamic Range image (48-bit RGB or 96-bit RGB Float) to a 24-bit RGB image. 
	@param tmo Tone mapping operator
	@param first_param First tone mapping algorithm parameter (algorithm dependant)
	@param second_param Second tone mapping algorithm parameter (algorithm dependant)
	@param third_param Third tone mapping algorithm parameter (algorithm dependant)
	@param fourth_param Fourth tone mapping algorithm parameter (algorithm dependant)
	@return Returns TRUE if successful, FALSE otherwise. 
	@see FreeImage_ToneMapping, FreeImage_TmoReinhard05Ex
	*/
	BOOL toneMapping(FREE_IMAGE_TMO tmo, double first_param = 0, double second_param = 0, double third_param = 1, double fourth_param = 0);

	//@}

	/**	@name Transparency support: background colour and alpha channel */
	//@{

	/**
	Returns TRUE if the image is transparent, returns FALSE otherwise
	@see FreeImage_IsTransparent
	*/
	BOOL isTransparent() const;

	/**
	8-bit transparency : get the number of transparent colors.
	@return Returns the number of transparent colors in a palletised bitmap.
	@see FreeImage_GetTransparencyCount
	*/
	unsigned getTransparencyCount() const;

	/**
	8-bit transparency : get the bitmap’s transparency table.
	@return Returns a pointer to the bitmap’s transparency table.
	@see FreeImage_GetTransparencyTable
	*/
	BYTE* getTransparencyTable() const;

	/** 
	8-bit transparency : set the bitmap’s transparency table.
	@see FreeImage_SetTransparencyTable
	*/
	void setTransparencyTable(BYTE *table, int count);

	/**
	Returns TRUE when the image has a file background color, FALSE otherwise.
	@see FreeImage_HasBackgroundColor
	*/
	BOOL hasFileBkColor() const;

	/**
	@brief Retrieves the file background color of an image. 
	
	For 8-bit images, the color index 
	in the palette is returned in the rgbReserved member of the bkcolor parameter.
	@return Returns TRUE if successful, FALSE otherwise. 
	@see FreeImage_GetBackgroundColor
	*/
	BOOL getFileBkColor(RGBQUAD *bkcolor) const;

	/**
	@brief Set the file background color of an image. 
	
	When saving an image to PNG, this background color is transparently saved to the PNG file. 
	When the bkcolor parameter is NULL, the background color is removed from the image.
	@return Returns TRUE if successful, FALSE otherwise. 
	@see FreeImage_SetBackgroundColor
	*/
	BOOL setFileBkColor(RGBQUAD *bkcolor);
	//@}

	/**@name Channel processing support */
	//@{	
	/** @brief Retrieves the red, green, blue or alpha channel of a 24- or 32-bit BGR[A] image. 
	@param image Output image to be extracted
	@param channel Color channel to extract
	@return Returns TRUE if successful, FALSE otherwise.
	@see FreeImage_GetChannel, FREE_IMAGE_COLOR_CHANNEL
	*/
	BOOL getChannel(fipImage& image, FREE_IMAGE_COLOR_CHANNEL channel) const;

	/**
	@brief Insert a 8-bit dib into a 24- or 32-bit image. 
	@param image Input 8-bit image to insert
	@param channel Color channel to replace
	@return Returns TRUE if successful, FALSE otherwise.
	@see FreeImage_SetChannel, FREE_IMAGE_COLOR_CHANNEL
	*/
	BOOL setChannel(fipImage& image, FREE_IMAGE_COLOR_CHANNEL channel);

	/** @brief Split a 24-bit RGB image into 3 greyscale images corresponding to the red, green and blue channels.
	@param RedChannel Output red channel.
	@param GreenChannel Output green channel.
	@param BlueChannel Output blue channel.
	@return Returns FALSE if the dib isn't a valid image, if it's not a 24-bit image or if 
	one of the output channel can't be allocated. Returns TRUE otherwise.
	@see FreeImage_GetChannel
	*/
	BOOL splitChannels(fipImage& RedChannel, fipImage& GreenChannel, fipImage& BlueChannel);

	/** @brief Builds a 24-bit RGB image given its red, green and blue channel.
	@param red Input red channel.
	@param green Input green channel.
	@param blue Input blue channel.
	@return Returns FALSE if the dib can't be allocated, if the input channels are not 8-bit images. Returns TRUE otherwise.
	@see FreeImage_SetChannel
	*/
	BOOL combineChannels(fipImage& red, fipImage& green, fipImage& blue);
	//@}

	/**@name Rotation and flipping */
	//@{	
	/** 
	Image translation and rotation using B-Splines.
	@param angle Image rotation angle, in degree
	@param x_shift Image horizontal shift
	@param y_shift Image vertical shift
	@param x_origin Origin of the x-axis
	@param y_origin Origin of the y-axis
	@param use_mask Whether or not to mask the image. Image mirroring is applied when use_mask is set to FALSE
	@return Returns the translated & rotated dib if successful, returns NULL otherwise
	@see FreeImage_RotateEx
	*/
	BOOL rotateEx(double angle, double x_shift, double y_shift, double x_origin, double y_origin, BOOL use_mask);

	/** 
	Image rotation by means of three shears.
	@param angle Image rotation angle, in degree
	@param bkcolor Background color (image type dependent), default to black background
	@return Returns rotated dib if successful, returns NULL otherwise
	@see FreeImage_Rotate
	*/
	BOOL rotate(double angle, const void *bkcolor = NULL);

	/**
	Flip the image horizontally along the vertical axis
	@see FreeImage_FlipHorizontal
	*/
	BOOL flipHorizontal();

	/**
	Flip the image vertically along the horizontal axis
	@see FreeImage_FlipVertical
	*/
	BOOL flipVertical();
	//@}

	/**@name Color manipulation routines */
	//@{	
	/** 
	Inverts each pixel data.
	@return Returns TRUE if successful, FALSE otherwise.
	@see FreeImage_Invert
	*/
	BOOL invert();
	
	/** @brief Perfoms an histogram transformation on a 8, 24 or 32-bit image 
	according to the values of a lookup table (LUT).

	The transformation is done as follows.<br>
	Image 8-bit : if the image has a color palette, the LUT is applied to this palette, 
	otherwise, it is applied to the grey values.<br>
	Image 24-bit & 32-bit : if channel == IPL_CC_RGB, the same LUT is applied to each color
	plane (R,G, and B). Otherwise, the LUT is applied to the specified channel only.
	@param LUT Lookup table. <b>The size of 'LUT' is assumed to be 256.</b>
	@param channel The color channel to be processed (only used with 24 & 32-bit DIB).
	@return Returns TRUE if the operation was successful, FALSE otherwise
	@see FreeImage_AdjustCurve, FREE_IMAGE_COLOR_CHANNEL
	*/
	BOOL adjustCurve(BYTE *LUT, FREE_IMAGE_COLOR_CHANNEL channel);

	/** @brief Performs gamma correction on a 8, 24 or 32-bit image.
	@param gamma Gamma value to use. A value of 1.0 leaves the image alone, 
	less than one darkens it, and greater than one lightens it.
	@return Returns TRUE if the operation was successful, FALSE otherwise
	@see FreeImage_AdjustGamma, adjustCurve
	*/
	BOOL adjustGamma(double gamma);

	/** @brief Adjusts the brightness of a 8, 24 or 32-bit image by a certain amount.
	@param percentage Where -100 <= percentage <= 100<br>
	A value 0 means no change, less than 0 will make the image darker 
	and greater than 0 will make the image brighter.
	@return Returns TRUE if the operation was succesful, FALSE otherwise
	@see FreeImage_AdjustBrightness, adjustCurve
	*/
	BOOL adjustBrightness(double percentage);

	/** @brief Adjusts the contrast of a 8, 24 or 32-bit image by a certain amount.
	@param percentage Where -100 <= percentage <= 100<br>
	A value 0 means no change, less than 0 will decrease the contrast 
	and greater than 0 will increase the contrast of the image.
	@return Returns TRUE if the operation was succesfull, FALSE otherwise
	@see FreeImage_AdjustContrast, adjustCurve
	*/
	BOOL adjustContrast(double percentage);

	/**
	Adjusts an image's brightness, contrast and gamma within a single operation. 
	If more than one of these image display properties need to be adjusted, 
	using this function should be preferred over calling each adjustment function separately. 
	That's particularly true for huge images or if performance is an issue. 
	@see adjustBrightness
	@see adjustContrast
	@see adjustGamma
	@see FreeImage_AdjustColors
	*/
	BOOL adjustBrightnessContrastGamma(double brightness, double contrast, double gamma);

	/** @brief Computes image histogram
	
	For 24-bit and 32-bit images, histogram can be computed from red, green, blue and 
	black channels. For 8-bit images, histogram is computed from the black channel. Other 
	bit depth is not supported.
	@param histo pointer to an histogram array. <b>Size of this array is assumed to be 256</b>.
	@param channel Color channel to use
	@return Returns TRUE if the operation was succesfull, FALSE otherwise
	@see FreeImage_GetHistogram
	*/
	BOOL getHistogram(DWORD *histo, FREE_IMAGE_COLOR_CHANNEL channel = FICC_BLACK) const;
	//@}

	/**@name Upsampling / downsampling */
	//@{	

	/** @brief Rescale the image to a new width / height.

	@param new_width New image width
	@param new_height New image height
	@param filter The filter parameter specifies which resampling filter should be used.
	@return Returns TRUE if the operation was successful, FALSE otherwise
	@see FreeImage_Rescale, FREE_IMAGE_FILTER
	*/
	BOOL rescale(unsigned new_width, unsigned new_height, FREE_IMAGE_FILTER filter);

	/** @brief Creates a thumbnail image keeping aspect ratio

	@param max_size Maximum width or height in pixel units
	@param convert When set to TRUE, converts the image to a standard type
	@return Returns TRUE if the operation was successful, FALSE otherwise
	@see FreeImage_MakeThumbnail
	*/
	BOOL makeThumbnail(unsigned max_size, BOOL convert = TRUE);
	//@}

	/**@name Image status */
	//@{	
	/**
	Set the image status as 'modified'.<br>
	When using the fipWinImage class, the image status is used to refresh the display. 
	It is changed to FALSE whenever the display has just been refreshed. 
	@param bStatus TRUE if the image should be marked as modified, FALSE otherwise
	@see isModified
	*/
	void setModified(BOOL bStatus = TRUE) {
		_bHasChanged = bStatus;
	}

	/**
	Get the image status
	@return Returns TRUE if the image is marked as modified, FALSE otherwise
	@see setModified
	*/
	BOOL isModified() {
		return _bHasChanged;
	}
	//@}

	/**@name Metadata */
	//@{	
	/**
	Returns the number of tags contained in the <i>model</i> metadata model 
	attached to the dib
	@param model Metadata model to look for
	*/
	unsigned getMetadataCount(FREE_IMAGE_MDMODEL model) const;
	/**
	Retrieve a metadata attached to the dib
	@param model Metadata model to look for
	@param key Metadata field name 
	@param tag Returned tag
	@return Returns TRUE if the operation was succesfull, FALSE otherwise
	@see FreeImage_GetMetadata
	*/
	BOOL getMetadata(FREE_IMAGE_MDMODEL model, const char *key, fipTag& tag) const;
	/**
	Attach a new FreeImage tag to the dib.<br>
	<b>Sample use</b> : <br>
	<pre>
	fipImage image;
	// ...
	fipTag tag;
	tag.setKeyValue("Caption/Abstract", "my caption");
	image.setMetadata(FIMD_IPTC, tag.getKey(), tag);
	tag.setKeyValue("Keywords", "FreeImage;Library;Images;Compression");
	image.setMetadata(FIMD_IPTC, tag.getKey(), tag);
	</pre>

	@param model Metadata model used to store the tag
	@param key Tag field name 
	@param tag Tag to be attached
	@return Returns TRUE if the operation was succesfull, FALSE otherwise
	@see FreeImage_SetMetadata
	*/
	BOOL setMetadata(FREE_IMAGE_MDMODEL model, const char *key, fipTag& tag);
	//@}


  protected:
	/**@name Internal use */
	//@{
	  BOOL replace(FIBITMAP *new_dib);
	//@}

};

// ----------------------------------------------------------

/** A class designed for MS Windows (TM) platforms.

    fipWinImage provides methods used to :
	<ul>
	<li>Display a DIB on the screen
	<li>Copy / Paste a DIB to/from Windows devices (HANDLE, HBITMAP, Clipboard)
	<li>Capture a window (HWND) and convert it to an image
	</ul>
	@version FreeImage 3
	@author Hervé Drolon
*/
#ifdef _WIN32

class FIP_API fipWinImage : public fipImage
{
public:
	/**@name Creation & Destruction */
	//@{	
	/// Constructor
	fipWinImage(FREE_IMAGE_TYPE image_type = FIT_BITMAP, unsigned width = 0, unsigned height = 0, unsigned bpp = 0);

	/// Destructor
	virtual ~fipWinImage();

	/// Destroy image data
	virtual void clear();

	/// Returns TRUE if the image is allocated, FALSE otherwise
	BOOL isValid() const;
	//@}

	/**@name Copying */
	//@{	

	/**
	Copy constructor. 
	Delete internal _display_dib data and copy the base class image data. 
	Tone mapping parameters are left unchanged. 
	@see FreeImage_Clone
	*/
	fipWinImage& operator=(const fipImage& src);

	/**
	Copy constructor
	Delete internal _display_dib data and copy tone mapping parameters. 
	Copy also the base class image data. 
	@see FreeImage_Clone
	*/
	fipWinImage& operator=(const fipWinImage& src);

	/** Clone function used for clipboard copy.<br>
	Convert the FIBITMAP image to a DIB, 
	and transfer the DIB in a global bitmap handle.<br>
	For non standard bitmaps, the BITMAPINFOHEADER->biCompression field is set to 0xFF + FreeImage_GetImageType(_dib), 
	in order to recognize the bitmap as non standard. 
	*/
	HANDLE copyToHandle() const;

	/** Copy constructor used for clipboard paste.<br>
	Converts a global object to a FIBITMAP. The clipboard format must be CF_DIB.<br>
	When the BITMAPINFOHEADER->biCompression field is set to 0xFF + [one of the predefined FREE_IMAGE_TYPE], 
	the bitmap is recognized as non standard and correctly copied. 
	@return Returns TRUE if successful, returns FALSE otherwise
	*/
	BOOL copyFromHandle(HANDLE hMem);

	/** Copy constructor.<br>
	Converts a HBITMAP object to a FIBITMAP.
	@return Returns TRUE if successful, returns FALSE otherwise
	*/
	BOOL copyFromBitmap(HBITMAP hbmp);
	//@}

	/**@name Clipboard operations */
	//@{	
	/**
	Clipboard copy.
	@param hWndNewOwner Handle to the window to be associated with the open clipboard. 
	In MFC, you can use AfxGetApp()->m_pMainWnd->GetSafeHwnd().
	@return Returns TRUE if successful, returns FALSE otherwise
	*/
	BOOL copyToClipboard(HWND hWndNewOwner) const;

	/**
	Retrieves data from the clipboard. The clipboard format must be CF_DIB.
	@return Returns TRUE if successful, returns FALSE otherwise
	*/
	BOOL pasteFromClipboard();
	//@}

	/**@name Screen capture */
	//@{	
	/** Capture a window and convert it to an image
	@param hWndApplicationWindow Handle to the application main window
	@param hWndSelectedWindow Handle to the window to be captured
	@return Returns TRUE if successful, returns FALSE otherwise
	*/
	BOOL captureWindow(HWND hWndApplicationWindow, HWND hWndSelectedWindow);
	//@}


	/**@name Painting operations */
	//@{	

	/** @brief Draw (stretch) the image on a HDC, using StretchDIBits.

    When the image is transparent or has a file background, this function composite 
	the foreground image against a checkerboard background image.
	@param hDC Handle to the device context
	@param rcDest Destination rectangle
	@see FreeImage_Composite
	*/
	void draw(HDC hDC, RECT& rcDest) const {
		drawEx(hDC, rcDest, FALSE, NULL, NULL);
	}

	/** @brief Draw (stretch) the image on a HDC, using StretchDIBits.

    When the image is transparent or has a file background, this function can composite 
	the foreground image against a checkerboard background image, against a single background color or 
	against a user background image.<br>
	When the image is a High Dynamic Range image (48-bit or RGB float), this function will apply a 
	tone mapping operator before drawing the image.<br>
	The original image (located in the fipImage class) will not be affected by any of the operations 
	that could be done in order to display it. 
	@param hDC Handle to the device context
	@param rcDest Destination rectangle
	@param useFileBkg When set to TRUE, the function uses the file color background if there is one
	@param appBkColor When a color is given, the function uses it as the background color
	@param bg When a FIBITMAP is given, the function uses it as the background image
	@see FreeImage_Composite
	@see setToneMappingOperator
	*/
	void drawEx(HDC hDC, RECT& rcDest, BOOL useFileBkg = FALSE, RGBQUAD *appBkColor = NULL, FIBITMAP *bg = NULL) const;

	/**
	Select a tone mapping algorithm used for drawing and set the image as modified 
	so that the display will be refreshed.
	@param tmo Tone mapping operator
	@param first_param First tone mapping algorithm parameter
	@param second_param Second tone mapping algorithm parameter
	@param third_param Third tone mapping algorithm parameter
	@param fourth_param Fourth tone mapping algorithm parameter
	@see FreeImage_ToneMapping
	*/
	void setToneMappingOperator(FREE_IMAGE_TMO tmo, double first_param = 0, double second_param = 0, double third_param = 1, double fourth_param = 0);

	/**
	Get the tone mapping algorithm used for drawing, with its parameters.
	@param tmo Tone mapping operator
	@param first_param First tone mapping algorithm parameter
	@param second_param Second tone mapping algorithm parameter
	@param third_param Third tone mapping algorithm parameter
	@param fourth_param Fourth tone mapping algorithm parameter
	@see FreeImage_ToneMapping
	*/
	void getToneMappingOperator(FREE_IMAGE_TMO *tmo, double *first_param, double *second_param, double *third_param, double *fourth_param) const;

	//@}

protected:
	/// DIB used for display (this allow to display non-standard bitmaps)
	mutable FIBITMAP *_display_dib;
	/// remember to delete _display_dib
	mutable BOOL _bDeleteMe;
	/// tone mapping operator
	FREE_IMAGE_TMO _tmo;
	/// first tone mapping algorithm parameter
	double _tmo_param_1;
	/// second tone mapping algorithm parameter
	double _tmo_param_2;
	/// third tone mapping algorithm parameter
	double _tmo_param_3;
	/// fourth tone mapping algorithm parameter
	double _tmo_param_4;
};

#endif // _WIN32

// ----------------------------------------------------------

/** Memory handle
	
	fipMemoryIO is a class that allows you to load / save images from / to a memory stream.
	@version FreeImage 3
	@author Hervé Drolon
*/
class FIP_API fipMemoryIO : public fipObject
{
protected:
	/// Pointer to a memory stream
	FIMEMORY *_hmem;

public :
	/** Constructor.
	Wrap a memory buffer containing image data.<br>
	The memory buffer is read only and has to be freed by the user 
	when no longer in use.<br>
	When default arguments are used, open a memory file as read/write. 
	@param data Pointer to the memory buffer
	@param size_in_bytes Buffer size in bytes
	@see FreeImage_OpenMemory
	*/
    fipMemoryIO(BYTE *data = NULL, DWORD size_in_bytes = 0);

	/** Destructor.
	Free any allocated memory
	@see FreeImage_CloseMemory
	*/
	virtual ~fipMemoryIO();

	/** Destructor.
	Free any allocated memory and invalidate the stream
	@see FreeImage_CloseMemory
	*/
	void close();

	/** Returns TRUE if the internal memory buffer is a valid buffer, returns FALSE otherwise
	*/
	BOOL isValid() const;

	/** Returns the buffer image format
	@see FreeImage_GetFileTypeFromMemory
	*/
	FREE_IMAGE_FORMAT getFileType() const;

	/**
	Returns a pointer to the FIMEMORY data. Used for direct access from FREEIMAGE functions 
	or from your own low level C functions.
	*/
	operator FIMEMORY*() { 
		return _hmem; 
	}

	/**@name Memory IO routines */
	//@{	
	/**
	Loads a dib from a memory stream
	@param fif Format identifier (FreeImage format)
	@param flags The signification of this flag depends on the image to be loaded.
	@return Returns the loaded dib if successful, returns NULL otherwise
	@see FreeImage_LoadFromMemory
	*/
	FIBITMAP* load(FREE_IMAGE_FORMAT fif, int flags = 0) const;
	/**
	Loads a multi-page bitmap from a memory stream
	@param fif Format identifier (FreeImage format)
	@param flags The signification of this flag depends on the multi-page to be loaded.
	@return Returns the loaded multi-page if successful, returns NULL otherwise
	@see FreeImage_LoadMultiBitmapFromMemory
	*/
	FIMULTIBITMAP* loadMultiPage(FREE_IMAGE_FORMAT fif, int flags = 0) const;
	/**
	Saves a dib to a memory stream
	@param fif Format identifier (FreeImage format)
	@param dib Image to be saved
	@param flags The signification of this flag depends on the image to be saved.
	@return Returns TRUE if successful, returns FALSE otherwise
	@see FreeImage_SaveToMemory
	*/
	BOOL save(FREE_IMAGE_FORMAT fif, FIBITMAP *dib, int flags = 0);
	/**
	Saves a multi-page bitmap to a memory stream
	@param fif Format identifier (FreeImage format)
	@param bitmap Multi-page image to be saved
	@param flags The signification of this flag depends on the image to be saved.
	@return Returns TRUE if successful, returns FALSE otherwise
	@see FreeImage_SaveMultiBitmapToMemory
	*/
	BOOL saveMultiPage(FREE_IMAGE_FORMAT fif, FIMULTIBITMAP *bitmap, int flags = 0);
	/**
	Reads data from a memory stream
	@param buffer Storage location for data
	@param size Item size in bytes
	@param count Maximum number of items to be read
	@return Returns the number of full items actually read, which may be less than count if an error occurs
	@see FreeImage_ReadMemory
	*/
	unsigned read(void *buffer, unsigned size, unsigned count) const;
	/**
	Writes data to a memory stream
	@param buffer Pointer to data to be written
	@param size Item size in bytes
	@param count Maximum number of items to be written
	@return Returns the number of full items actually written, which may be less than count if an error occurs
	@see FreeImage_WriteMemory
	*/
	unsigned write(const void *buffer, unsigned size, unsigned count);
	/**
	Gets the current position of a memory pointer
	@see FreeImage_TellMemory
	*/
	long tell() const;
	/**
	Moves the memory pointer to a specified location
	@see FreeImage_SeekMemory
	*/
	BOOL seek(long offset, int origin);
	/**
	Provides a direct buffer access to a memory stream
	@param data Pointer to the memory buffer (returned value)
	@param size_in_bytes Buffer size in bytes (returned value)
	@see FreeImage_AcquireMemory
	*/
	BOOL acquire(BYTE **data, DWORD *size_in_bytes);
	//@}

private:
	/// Disable copy
	fipMemoryIO(const fipMemoryIO& src);
	/// Disable copy
	fipMemoryIO& operator=(const fipMemoryIO& src);

};

// ----------------------------------------------------------

/** Multi-page file stream

	fipMultiPage encapsulates the multi-page API. It supports reading/writing 
	multi-page TIFF, ICO and GIF files. 
*/
class FIP_API fipMultiPage : public fipObject 
{
protected:
	/// Pointer to a multi-page file stream
	FIMULTIBITMAP *_mpage;
	/// TRUE when using a memory cache, FALSE otherwise
	BOOL _bMemoryCache;

public:
	/**
	Constructor
	@param keep_cache_in_memory When it is TRUE, all gathered bitmap data in the page manipulation process is kept in memory, otherwise it is lazily flushed to a temporary file on the hard disk in 64 Kb blocks.
	*/
	fipMultiPage(BOOL keep_cache_in_memory = FALSE);

	/**
	Destructor
	Close the file stream if not already done. 
	*/
	virtual ~fipMultiPage();

	/// Returns TRUE if the multi-page stream is opened
	BOOL isValid() const;

	/**
	Returns a pointer to the FIMULTIBITMAP data. Used for direct access from FREEIMAGE functions 
	or from your own low level C functions.
	*/
	operator FIMULTIBITMAP*() { 
		return _mpage; 
	}

	/**
	Open a multi-page file stream
	@param lpszPathName Name of the multi-page bitmap file
	@param create_new When TRUE, it means that a new bitmap will be created rather than an existing one being opened
	@param read_only When TRUE the bitmap is opened read-only
	@param flags Load flags. The signification of this flag depends on the image to be loaded.
	@return Returns TRUE if successful, returns FALSE otherwise
	@see FreeImage_OpenMultiBitmap
	*/
	BOOL open(const char* lpszPathName, BOOL create_new, BOOL read_only, int flags = 0);

	/**
	Open a multi-page memory stream as read/write. 
	@param memIO Memory stream. The memory stream MUST BE a wrapped user buffer. 
	@param flags Load flags. The signification of this flag depends on the image to be loaded.
	@return Returns TRUE if successful, returns FALSE otherwise
	@see FreeImage_LoadMultiBitmapFromMemory
	*/
	BOOL open(fipMemoryIO& memIO, int flags = 0);

	/**
	Open a multi-page image as read/write, using the specified FreeImageIO struct and fi_handle, and an optional flag.
	@param io FreeImageIO structure
	@param handle FreeImage fi_handle
	@param flag The signification of this flag depends on the image to be read.
	@return Returns TRUE if successful, FALSE otherwise.
	@see FreeImage_OpenMultiBitmapFromHandle
	*/
	BOOL open(FreeImageIO *io, fi_handle handle, int flags = 0);

	/**
	Close a file stream
	@param flags Save flags. The signification of this flag depends on the image to be saved.
	@return Returns TRUE if successful, returns FALSE otherwise
	@see FreeImage_CloseMultiBitmap
	*/
	BOOL close(int flags = 0);

	/**
	Saves a multi-page image using the specified FreeImageIO struct and fi_handle, and an optional flag.
	@param fif Format identifier (FreeImage format)
	@param io FreeImageIO structure
	@param handle FreeImage fi_handle
	@param flag The signification of this flag depends on the multi-page image to be saved.
	@return Returns TRUE if successful, FALSE otherwise.
	@see FreeImage_SaveMultiBitmapToHandle, FreeImage documentation
	*/
	BOOL saveToHandle(FREE_IMAGE_FORMAT fif, FreeImageIO *io, fi_handle handle, int flags = 0) const;

	/**
	Saves a multi-page image using the specified memory stream and an optional flag.
	@param fif Format identifier (FreeImage format)
	@param memIO FreeImage memory stream
	@param flag The signification of this flag depends on the image to be saved.
	@return Returns TRUE if successful, FALSE otherwise.
	@see FreeImage_SaveMultiBitmapToMemory, FreeImage documentation
	*/
	BOOL saveToMemory(FREE_IMAGE_FORMAT fif, fipMemoryIO& memIO, int flags = 0) const;

	/**
	Returns the number of pages currently available in the multi-paged bitmap
	@see FreeImage_GetPageCount
	*/
	int getPageCount() const;

	/**
	Appends a new page to the end of the bitmap
	@param image Image to append
	@see FreeImage_AppendPage
	*/
	void appendPage(fipImage& image);

	/**
	Inserts a new page before the given position in the bitmap
	@param page Page number. Page has to be a number smaller than the current number of pages available in the bitmap.
	@param image Image to insert
	@see FreeImage_InsertPage
	*/
	void insertPage(int page, fipImage& image);

	/**
	Deletes the page on the given position
	@param page Page number
	@see FreeImage_DeletePage
	*/
	void deletePage(int page);

	/**
	Moves the source page to the position of the target page. 
	@param target Target page position
	@param source Source page position
	@return Returns TRUE if successful, returns FALSE otherwise
	@see FreeImage_MovePage
	*/
	BOOL movePage(int target, int source);

	/**
	Locks a page in memory for editing. You must call unlockPage to free the page<br>
	<b>Usage : </b><br>
	<pre>
	fipMultiPage mpage;
	// ...
	fipImage image;		// You must declare this before
	image = mpage.lockPage(2);
	if(image.isValid()) {
	  // ...
	  mpage.unlockPage(image, TRUE);
	}
	</pre>
	@param page Page number
	@return Returns the page if successful, returns NULL otherwise
	@see FreeImage_LockPage
	*/
	FIBITMAP* lockPage(int page);

	/**
	Unlocks a previously locked page and gives it back to the multi-page engine
	@param image Page to unlock
	@param changed When TRUE, the page is marked changed and the new page data is applied in the multi-page bitmap.
	@see FreeImage_UnlockPage
	*/
	void unlockPage(fipImage& image, BOOL changed);

	/**
	Returns an array of page-numbers that are currently locked in memory. 
	When the pages parameter is NULL, the size of the array is returned in the count variable. 
	You can then allocate the array of the desired size and call 
	getLockedPageNumbers again to populate the array.
	@return Returns TRUE if successful, returns FALSE otherwise
	@see FreeImage_GetLockedPageNumbers
	*/
	BOOL getLockedPageNumbers(int *pages, int *count) const;
};

// ----------------------------------------------------------

/**
FreeImage Tag

FreeImage uses this structure to store metadata information. 
*/
class FIP_API fipTag : public fipObject
{
protected:
	/// Pointer to a FreeImage tag
	FITAG *_tag;

public:
	/**@name Creation & Destruction */
	//@{	
	/**
	Constructor
	@see FreeImage_CreateTag
	*/
	fipTag();
	/** 
	Destructor
	@see FreeImage_DeleteTag
	*/
	virtual ~fipTag();
	/**
	Construct a FIDT_ASCII tag (ASCII string).<br>
	This method is useful to store comments or IPTC tags. 
	@param name Field name
	@param value Field value
	@return Returns TRUE if successful, returns FALSE otherwise
	@see FreeImage_CreateTag
	*/
	BOOL setKeyValue(const char *key, const char *value);

	//@}

	/**@name Copying */
	//@{	
	/**
	Copy constructor
	@see FreeImage_CloneTag
	*/
	fipTag(const fipTag& tag);
	/**
	Copy constructor
	@see FreeImage_CloneTag
	*/
	fipTag& operator=(const fipTag& tag);
	/**
	<b>Assignement operator</b><br>
	Copy the input pointer and manage its destruction
	@see operator FITAG*()
	*/
	fipTag& operator=(FITAG *tag);
	//@}

	/**
	Returns a pointer to the FITAG data. Used for direct access from FREEIMAGE functions 
	or from your own low level C functions.
	@see operator=(FITAG *tag)
	*/
	operator FITAG*() { 
		return _tag; 
	}

	/// Returns TRUE if the tag is allocated, FALSE otherwise
	BOOL isValid() const;

	/**@name Tag accessors */
	//@{	
	/**
	Returns the tag field name (unique inside a metadata model).
	@see FreeImage_GetTagKey
	*/
	const char *getKey() const;
	/**
	Returns the tag description if available, returns NULL otherwise
	@see FreeImage_GetTagDescription
	*/
	const char *getDescription() const;
	/**
	Returns the tag ID if available, returns 0 otherwise
	@see FreeImage_GetTagID
	*/
	WORD getID() const;
	/**
	Returns the tag data type 
	@see FreeImage_GetTagType
	*/
	FREE_IMAGE_MDTYPE getType() const;
	/**
	Returns the number of components in the tag (in tag type units)
	@see FreeImage_GetTagCount
	*/
	DWORD getCount() const;
	/**
	Returns the length of the tag value in bytes
	@see FreeImage_GetTagLength
	*/
	DWORD getLength() const;
	/**
	Returns the tag value
	@see FreeImage_GetTagValue
	*/
	const void *getValue() const;
	/**
	Set the tag field name 
	@return Returns TRUE if successful, returns FALSE otherwise
	@see FreeImage_SetTagKey
	*/
	BOOL setKey(const char *key);
	/**
	Set the (usually optional) tag description
	@return Returns TRUE if successful, returns FALSE otherwise
	@see FreeImage_SetTagDescription
	*/
	BOOL setDescription(const char *description);
	/**
	Set the (usually optional) tad ID
	@return Returns TRUE if successful, returns FALSE otherwise
	@see FreeImage_SetTagID
	*/
	BOOL setID(WORD id);
	/**
	Set the tag data type 
	@return Returns TRUE if successful, returns FALSE otherwise
	@see FreeImage_SetTagType
	*/
	BOOL setType(FREE_IMAGE_MDTYPE type);
	/**
	Set the number of data in the tag 
	@return Returns TRUE if successful, returns FALSE otherwise
	@see FreeImage_SetTagCount
	*/
	BOOL setCount(DWORD count);
	/**
	Set the length of the tag value, in bytes 
	@return Returns TRUE if successful, returns FALSE otherwise
	@see FreeImage_SetTagLength
	*/
	BOOL setLength(DWORD length);
	/**
	Set the tag value 
	@return Returns TRUE if successful, returns FALSE otherwise
	@see FreeImage_SetTagValue
	*/
	BOOL setValue(const void *value);

	//@}

	/**
	Converts a FreeImage tag structure to a string that represents the interpreted tag value
	@param model Metadata model specification (metadata model from which the tag was extracted)
	@param Make Camera model (not used yet)
	*/
	const char* toString(FREE_IMAGE_MDMODEL model, char *Make = NULL) const;

};

/**
Metadata iterator

<b>Usage : </b><br>
<pre>
fipImage image;
// ...
fipTag tag;
fipMetadataFind finder;
if( finder.findFirstMetadata(FIMD_EXIF_MAIN, image, tag) ) {
  do {
    // process the tag
	cout << tag.getKey() << "\n";

  } while( finder.findNextMetadata(tag) );
}
// the class can be called again with another metadata model
if( finder.findFirstMetadata(FIMD_EXIF_EXIF, image, tag) ) {
  do {
    // process the tag
	cout << tag.getKey() << "\n";

  } while( finder.findNextMetadata(tag) );
}
</pre>
*/
class FIP_API fipMetadataFind : public fipObject
{
protected:
	/// Pointer to a search handle
	FIMETADATA *_mdhandle;

public:
	/// Returns TRUE if the search handle is allocated, FALSE otherwise
	BOOL isValid() const;

	/// Constructor
	fipMetadataFind();
	/**
	Destructor
	@see FreeImage_FindCloseMetadata
	*/
	virtual ~fipMetadataFind();
	/**
	Provides information about the first instance of a tag that matches 
	the metadata model specified in the <i>model</i> argument. 
	@param model Metadata model
	@param image Input image
	@param tag Returned tag
	@return Returns TRUE if successful, returns FALSE otherwise
	@see FreeImage_FindFirstMetadata
	*/
	BOOL findFirstMetadata(FREE_IMAGE_MDMODEL model, fipImage& image, fipTag& tag);
	/**
	Find the next tag, if any, that matches the metadata model argument 
	in a previous call to findFirstMetadata
	@param tag Returned tag
	@return Returns TRUE if successful, returns FALSE otherwise, indicating that no more matching tags could be found
	@see FreeImage_FindNextMetadata
	*/
	BOOL findNextMetadata(fipTag& tag);

};

#endif	// FREEIMAGEPLUS_H
