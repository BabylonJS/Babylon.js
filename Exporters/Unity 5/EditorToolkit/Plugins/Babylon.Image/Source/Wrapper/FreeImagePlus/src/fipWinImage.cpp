// ==========================================================
// fipWinImage class implementation
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

#include "FreeImagePlus.h"

#ifdef _WIN32

// marker used for clipboard copy / paste

static inline void 
SET_FREEIMAGE_MARKER(BITMAPINFOHEADER *bmih, FIBITMAP *dib) {
	// Windows constants goes from 0L to 5L
	// Add 0xFF to avoid conflicts
	bmih->biCompression = 0xFF + FreeImage_GetImageType(dib);
}

static inline FREE_IMAGE_TYPE 
GET_FREEIMAGE_MARKER(BITMAPINFOHEADER *bmih) {
	return (FREE_IMAGE_TYPE)(bmih->biCompression - 0xFF);
}

///////////////////////////////////////////////////////////////////
// Construction / Destruction

fipWinImage::fipWinImage(FREE_IMAGE_TYPE image_type, unsigned width, unsigned height, unsigned bpp) : fipImage(image_type, width, height, bpp) {
	_display_dib = NULL;
	_bDeleteMe = FALSE;
	// default tone mapping operator
	_tmo = FITMO_DRAGO03;
	_tmo_param_1 = 0;
	_tmo_param_2 = 0;
	_tmo_param_3 = 1;
	_tmo_param_4 = 0;
}

fipWinImage::~fipWinImage() { 
	if(_bDeleteMe) {
		FreeImage_Unload(_display_dib);
	}
}

void fipWinImage::clear() {
	// delete _display_dib
	if(_bDeleteMe) {
		FreeImage_Unload(_display_dib);
	}
	_display_dib = NULL;
	_bDeleteMe = FALSE;
	// delete base class data
	fipImage::clear();
}

BOOL fipWinImage::isValid() const {
	return fipImage::isValid();
}

///////////////////////////////////////////////////////////////////
// Copying

fipWinImage& fipWinImage::operator=(const fipImage& Image) {
	// delete _display_dib
	if(_bDeleteMe) {
		FreeImage_Unload(_display_dib);
	}
	_display_dib = NULL;
	_bDeleteMe = FALSE;
	// clone the base class
	fipImage::operator=(Image);

	return *this;
}

fipWinImage& fipWinImage::operator=(const fipWinImage& Image) {
	if(this != &Image) {
		// delete _display_dib
		if(_bDeleteMe) {
			FreeImage_Unload(_display_dib);
		}
		_display_dib = NULL;
		_bDeleteMe = FALSE;
		// copy tmo data
		_tmo = Image._tmo;
		_tmo_param_1 = Image._tmo_param_1;
		_tmo_param_2 = Image._tmo_param_2;
		_tmo_param_3 = Image._tmo_param_3;
		_tmo_param_4 = Image._tmo_param_4;

		// clone the base class
		fipImage::operator=(Image);
	}
	return *this;
}

HANDLE fipWinImage::copyToHandle() const {
	HANDLE hMem = NULL;

	if(_dib) {

		// Get equivalent DIB size
		long dib_size = sizeof(BITMAPINFOHEADER);
		dib_size += FreeImage_GetColorsUsed(_dib) * sizeof(RGBQUAD);
		dib_size += FreeImage_GetPitch(_dib) * FreeImage_GetHeight(_dib);

		// Allocate a DIB
		hMem = GlobalAlloc(GHND, dib_size);
		BYTE *dib = (BYTE*)GlobalLock(hMem);

		memset(dib, 0, dib_size);

		BYTE *p_dib = (BYTE*)dib;

		// Copy the BITMAPINFOHEADER

		BITMAPINFOHEADER *bih = FreeImage_GetInfoHeader(_dib);
		memcpy(p_dib, bih, sizeof(BITMAPINFOHEADER));
		if(FreeImage_GetImageType(_dib) != FIT_BITMAP) {
			// this hack is used to store the bitmap type in the biCompression member of the BITMAPINFOHEADER
			SET_FREEIMAGE_MARKER((BITMAPINFOHEADER*)p_dib, _dib);
		}
		p_dib += sizeof(BITMAPINFOHEADER);

		// Copy the palette

		RGBQUAD *pal = FreeImage_GetPalette(_dib);
		memcpy(p_dib, pal, FreeImage_GetColorsUsed(_dib) * sizeof(RGBQUAD));
		p_dib += FreeImage_GetColorsUsed(_dib) * sizeof(RGBQUAD);

		// Copy the bitmap

		BYTE *bits = FreeImage_GetBits(_dib);
		memcpy(p_dib, bits, FreeImage_GetPitch(_dib) * FreeImage_GetHeight(_dib));

		GlobalUnlock(hMem);
	}

	return hMem;
}

BOOL fipWinImage::copyFromHandle(HANDLE hMem) {
	BYTE *lpVoid = NULL;
	BITMAPINFOHEADER *pHead = NULL;
	RGBQUAD *pPalette = NULL;
	BYTE *bits = NULL;
	DWORD bitfields[3] = {0, 0, 0};

	// Get a pointer to the bitmap
	lpVoid = (BYTE *)GlobalLock(hMem);

	// Get a pointer to the bitmap header
	pHead = (BITMAPINFOHEADER *)lpVoid;

	// Get a pointer to the palette
	if(pHead->biBitCount < 16)
		pPalette = (RGBQUAD *)(((BYTE *)pHead) + sizeof(BITMAPINFOHEADER));

	// Get a pointer to the pixels
	bits = ((BYTE*)pHead + sizeof(BITMAPINFOHEADER) + sizeof(RGBQUAD) * pHead->biClrUsed);

	if(pHead->biCompression == BI_BITFIELDS) {
		// Take into account the color masks that specify the red, green, and blue components (16- and 32-bit)
		unsigned mask_size = 3 * sizeof(DWORD);
		memcpy(&bitfields[0], bits, mask_size);
		bits += mask_size;
	} 

	if(lpVoid) {

		// Allocate a new FIBITMAP

		FREE_IMAGE_TYPE image_type = FIT_BITMAP;
		// Use a hack to decide if the clipboard contains non standard bitmaps ...
		switch(GET_FREEIMAGE_MARKER(pHead)) {
			case FIT_UINT16:
			case FIT_INT16:
			case FIT_UINT32:
			case FIT_INT32:
			case FIT_FLOAT:
			case FIT_DOUBLE:
			case FIT_COMPLEX:
			case FIT_RGB16:
			case FIT_RGBA16:
			case FIT_RGBF:
			case FIT_RGBAF:
				image_type = GET_FREEIMAGE_MARKER(pHead);
				break;
		}
		if(!setSize(image_type, (WORD)pHead->biWidth, (WORD)pHead->biHeight, pHead->biBitCount, bitfields[2], bitfields[1], bitfields[0])) {
			GlobalUnlock(lpVoid);
			return FALSE;
		}

		// Copy the bitmap header
		memcpy(FreeImage_GetInfoHeader(_dib), pHead, sizeof(BITMAPINFOHEADER));


		// Copy the palette
		memcpy(FreeImage_GetPalette(_dib), pPalette, pHead->biClrUsed * sizeof(RGBQUAD));

		// Copy the bitmap
		memcpy(FreeImage_GetBits(_dib), bits, FreeImage_GetPitch(_dib) * FreeImage_GetHeight(_dib));

		GlobalUnlock(lpVoid);

		return TRUE;
	}

	return FALSE;
}

BOOL fipWinImage::copyFromBitmap(HBITMAP hbmp) {
	if(hbmp) { 
		int Success;
        BITMAP bm;
		// Get informations about the bitmap
        GetObject(hbmp, sizeof(BITMAP), (LPSTR) &bm);
		// Create the image
        setSize(FIT_BITMAP, (WORD)bm.bmWidth, (WORD)bm.bmHeight, (WORD)bm.bmBitsPixel);

		// The GetDIBits function clears the biClrUsed and biClrImportant BITMAPINFO members (dont't know why) 
		// So we save these infos below. This is needed for palettized images only. 
		int nColors = FreeImage_GetColorsUsed(_dib);

		// Create a device context for the bitmap
        HDC dc = GetDC(NULL);
		// Copy the pixels
		Success = GetDIBits(dc,								// handle to DC
								hbmp,						// handle to bitmap
								0,							// first scan line to set
								FreeImage_GetHeight(_dib),	// number of scan lines to copy
								FreeImage_GetBits(_dib),	// array for bitmap bits
								FreeImage_GetInfo(_dib),	// bitmap data buffer
								DIB_RGB_COLORS				// RGB 
								);
		if(Success == 0) {
			FreeImage_OutputMessageProc(FIF_UNKNOWN, "Error : GetDIBits failed");
			ReleaseDC(NULL, dc);
			return FALSE;
        }
        ReleaseDC(NULL, dc);

		// restore BITMAPINFO members
		
		FreeImage_GetInfoHeader(_dib)->biClrUsed = nColors;
		FreeImage_GetInfoHeader(_dib)->biClrImportant = nColors;

		return TRUE;
    }

	return FALSE;
}

BOOL fipWinImage::copyToClipboard(HWND hWndNewOwner) const {
	HANDLE hDIB = copyToHandle();

	if(OpenClipboard(hWndNewOwner)) {
		if(EmptyClipboard()) {
			if(SetClipboardData(CF_DIB, hDIB) == NULL) {
				MessageBox(hWndNewOwner, "Unable to set Clipboard data", "FreeImage", MB_ICONERROR);
				CloseClipboard();
				return FALSE;
			}
		}
	}
	CloseClipboard();

	return TRUE;
}

BOOL fipWinImage::pasteFromClipboard() {
	if(!IsClipboardFormatAvailable(CF_DIB))
		return FALSE;

	if(OpenClipboard(NULL)) {
		HANDLE hDIB = GetClipboardData(CF_DIB);
		copyFromHandle(hDIB);
		CloseClipboard();
		return TRUE;
	}
	CloseClipboard();

	return FALSE;
}

///////////////////////////////////////////////////////////////////
// Screen capture

BOOL fipWinImage::captureWindow(HWND hWndApplicationWindow, HWND hWndSelectedWindow) {
	int xScreen, yScreen, xshift, yshift;
	RECT r;

	// Get window size
	GetWindowRect(hWndSelectedWindow, &r);

	// Check if the window is out of the screen or maximixed
	xshift = 0;
	yshift = 0;
	xScreen = GetSystemMetrics(SM_CXSCREEN);
	yScreen = GetSystemMetrics(SM_CYSCREEN);
	if(r.right > xScreen)
		   r.right = xScreen;
	if(r.bottom > yScreen)
		   r.bottom = yScreen;
	if(r.left < 0) {
		   xshift = -r.left;
		   r.left = 0;
	}
	if(r.top < 0){
		   yshift = -r.top;
		   r.top = 0;
	}
	
	int width  = r.right  - r.left;
	int height = r.bottom - r.top;

	if(width <= 0 || height <= 0)
		return FALSE;

	// Hide the application window. 
	ShowWindow(hWndApplicationWindow, SW_HIDE); 
	// Bring the window at the top most level
	SetWindowPos(hWndSelectedWindow, HWND_TOPMOST, 0, 0, 0, 0, SWP_NOMOVE|SWP_NOSIZE);
	// Give enough time to refresh the window
	Sleep(500);

	// Prepare the DCs
	HDC dstDC = GetDC(NULL);
    HDC srcDC = GetWindowDC(hWndSelectedWindow); // full window (GetDC(hWndSelectedWindow) = clientarea)
	HDC memDC = CreateCompatibleDC(dstDC);
	
	// Copy the screen to the bitmap
	HBITMAP bm = CreateCompatibleBitmap(dstDC, width, height);
	HBITMAP oldbm = (HBITMAP)SelectObject(memDC, bm);
	BitBlt(memDC, 0, 0, width, height, srcDC, xshift, yshift, SRCCOPY);

	// Redraw the application window. 
	ShowWindow(hWndApplicationWindow, SW_SHOW); 

	// Restore the position
	SetWindowPos(hWndSelectedWindow, HWND_NOTOPMOST, 0, 0, 0, 0, SWP_NOMOVE|SWP_NOSIZE);
	SetWindowPos(hWndApplicationWindow, HWND_TOP, 0, 0, 0, 0, SWP_NOMOVE|SWP_NOSIZE);
	
	// Convert the HBITMAP to a FIBITMAP
	copyFromBitmap(bm);

	// Free objects
	DeleteObject(SelectObject(memDC, oldbm));
	DeleteDC(memDC);

	// Convert 32-bit images to 24-bit
	if(getBitsPerPixel() == 32) {
		convertTo24Bits();
	}

	return TRUE;
}


///////////////////////////////////////////////////////////////////
// Painting operations

void fipWinImage::drawEx(HDC hDC, RECT& rcDest, BOOL useFileBkg, RGBQUAD *appBkColor, FIBITMAP *bg) const {
	// Convert to a standard bitmap if needed
	if(_bHasChanged) {
		if(_bDeleteMe) {
			FreeImage_Unload(_display_dib);
			_display_dib = NULL;
			_bDeleteMe = FALSE;
		}

		FREE_IMAGE_TYPE image_type = getImageType();
		if(image_type == FIT_BITMAP) {
			BOOL bHasBackground = FreeImage_HasBackgroundColor(_dib);
			BOOL bIsTransparent = FreeImage_IsTransparent(_dib);

			if(!bIsTransparent && (!bHasBackground || !useFileBkg)) {
				// Copy pointer
				_display_dib = _dib;
			}
			else {
				// Create the transparent / alpha blended image
				_display_dib = FreeImage_Composite(_dib, useFileBkg, appBkColor, bg);
				if(_display_dib) {
					// Remember to delete _display_dib
					_bDeleteMe = TRUE;
				} else {
					// Something failed: copy pointers
					_display_dib = _dib;
				}
			}
		} else {
			// Convert to a standard dib for display

			if(image_type == FIT_COMPLEX) {
				// Convert to type FIT_DOUBLE
				FIBITMAP *dib_double = FreeImage_GetComplexChannel(_dib, FICC_MAG);
				// Convert to a standard bitmap (linear scaling)
				_display_dib = FreeImage_ConvertToStandardType(dib_double, TRUE);
				// Free image of type FIT_DOUBLE
				FreeImage_Unload(dib_double);
			} else if((image_type == FIT_RGBF) || (image_type == FIT_RGBAF) || (image_type == FIT_RGB16)) {
				// Apply a tone mapping algorithm and convert to 24-bit 
				switch(_tmo) {
					case FITMO_REINHARD05:
						_display_dib = FreeImage_TmoReinhard05Ex(_dib, _tmo_param_1, _tmo_param_2, _tmo_param_3, _tmo_param_4);
						break;
					default:
						_display_dib = FreeImage_ToneMapping(_dib, _tmo, _tmo_param_1, _tmo_param_2);
						break;
				}
			} else if(image_type == FIT_RGBA16) {
				// Convert to 32-bit
				FIBITMAP *dib32 = FreeImage_ConvertTo32Bits(_dib);
				if(dib32) {
					// Create the transparent / alpha blended image
					_display_dib = FreeImage_Composite(dib32, useFileBkg, appBkColor, bg);
					FreeImage_Unload(dib32);
				}
			} else {
				// Other cases: convert to a standard bitmap (linear scaling)
				_display_dib = FreeImage_ConvertToStandardType(_dib, TRUE);
			}
			// Remember to delete _display_dib
			_bDeleteMe = TRUE;
		}

		_bHasChanged = FALSE;
	}

	// Draw the dib
	SetStretchBltMode(hDC, COLORONCOLOR);	
	StretchDIBits(hDC, rcDest.left, rcDest.top, 
		rcDest.right-rcDest.left, rcDest.bottom-rcDest.top, 
		0, 0, FreeImage_GetWidth(_display_dib), FreeImage_GetHeight(_display_dib),
		FreeImage_GetBits(_display_dib), FreeImage_GetInfo(_display_dib), DIB_RGB_COLORS, SRCCOPY);

}

void fipWinImage::setToneMappingOperator(FREE_IMAGE_TMO tmo, double first_param, double second_param, double third_param, double fourth_param) {
	// avoid costly operations if possible ...
	if((_tmo != tmo) || (_tmo_param_1 != first_param) || (_tmo_param_2 != second_param) || (_tmo_param_3 != third_param) || (_tmo_param_4 != fourth_param)) {
		_tmo = tmo;
		_tmo_param_1 = first_param;
		_tmo_param_2 = second_param;
		_tmo_param_3 = third_param;
		_tmo_param_4 = fourth_param;

		FREE_IMAGE_TYPE image_type = getImageType();
		switch(image_type) {
			case FIT_RGBF:
			case FIT_RGBAF:
			case FIT_RGB16:
			case FIT_RGBA16:
				_bHasChanged = TRUE;
				break;
			default:
				break;
		}
	}
}

void fipWinImage::getToneMappingOperator(FREE_IMAGE_TMO *tmo, double *first_param, double *second_param, double *third_param, double *fourth_param) const {
	*tmo = _tmo;
	*first_param = _tmo_param_1;
	*second_param = _tmo_param_2;
	*third_param = _tmo_param_3;
	*fourth_param = _tmo_param_4;
}


#endif // _WIN32
