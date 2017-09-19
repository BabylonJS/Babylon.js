// ==========================================================
// fipMemoryIO class implementation
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
#include <stdlib.h>
#include <string.h>
#include <assert.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <stdio.h>

fipMemoryIO::fipMemoryIO(BYTE *data, DWORD size_in_bytes) {
	_hmem = FreeImage_OpenMemory(data, size_in_bytes);
}

fipMemoryIO::~fipMemoryIO() { 
	if(_hmem != NULL) {
		FreeImage_CloseMemory(_hmem);
	}
}

void fipMemoryIO::close() { 
	if(_hmem != NULL) {
		FreeImage_CloseMemory(_hmem);
		_hmem = NULL;
	}
}

BOOL fipMemoryIO::isValid() const {
	return (_hmem != NULL);
}

FREE_IMAGE_FORMAT fipMemoryIO::getFileType() const {
	if(_hmem != NULL) {
		return FreeImage_GetFileTypeFromMemory(_hmem, 0);
	}

	return FIF_UNKNOWN;
}

FIBITMAP* fipMemoryIO::load(FREE_IMAGE_FORMAT fif, int flags) const {
	return FreeImage_LoadFromMemory(fif, _hmem, flags);
}

FIMULTIBITMAP* fipMemoryIO::loadMultiPage(FREE_IMAGE_FORMAT fif, int flags) const {
	return FreeImage_LoadMultiBitmapFromMemory(fif, _hmem, flags);
}

BOOL fipMemoryIO::save(FREE_IMAGE_FORMAT fif, FIBITMAP *dib, int flags) {
	return FreeImage_SaveToMemory(fif, dib, _hmem, flags);
}

BOOL fipMemoryIO::saveMultiPage(FREE_IMAGE_FORMAT fif, FIMULTIBITMAP *bitmap, int flags) {
	return FreeImage_SaveMultiBitmapToMemory(fif, bitmap, _hmem, flags);
}

unsigned fipMemoryIO::read(void *buffer, unsigned size, unsigned count) const {
	return FreeImage_ReadMemory(buffer, size, count, _hmem);
}

unsigned fipMemoryIO::write(const void *buffer, unsigned size, unsigned count) {
	return FreeImage_WriteMemory(buffer, size, count, _hmem);
}

long fipMemoryIO::tell() const {
	return FreeImage_TellMemory(_hmem);
}

BOOL fipMemoryIO::seek(long offset, int origin) {
	return FreeImage_SeekMemory(_hmem, offset, origin);
}

BOOL fipMemoryIO::acquire(BYTE **data, DWORD *size_in_bytes) {
	return FreeImage_AcquireMemory(_hmem, data, size_in_bytes);
}


