// ==========================================================
// Load From Memory Example
//
// Design and implementation by Floris van den Berg
//
// This file is part of FreeImage 3
//
// Use at own risk!
// ==========================================================
//
//  This example shows how to load a bitmap from memory
//  rather than from a file. To do this we make use of the
//  FreeImage_LoadFromHandle functions where we override
//  the i/o functions to simulate FILE* access in memory.
//
//  For seeking purposes the fi_handle passed to the i/o
//  functions contain the start of the data block where the
//  bitmap is stored.
//
// ==========================================================

#include <assert.h>
#include <stdio.h>
#include <stdlib.h>

#include "FreeImage.h"

// ----------------------------------------------------------

fi_handle g_load_address;

// ----------------------------------------------------------

inline unsigned _stdcall
_ReadProc(void *buffer, unsigned size, unsigned count, fi_handle handle) {
	BYTE *tmp = (BYTE *)buffer;

	for (unsigned c = 0; c < count; c++) {
		memcpy(tmp, g_load_address, size);

		g_load_address = (BYTE *)g_load_address + size;

		tmp += size;
	}

	return count;
}

inline unsigned _stdcall
_WriteProc(void *buffer, unsigned size, unsigned count, fi_handle handle) {
	// there's not much use for saving the bitmap into memory now, is there?

	return size;
}

inline int _stdcall
_SeekProc(fi_handle handle, long offset, int origin) {
	assert(origin != SEEK_END);

	if (origin == SEEK_SET) {
		g_load_address = (BYTE *)handle + offset;
	} else {
		g_load_address = (BYTE *)g_load_address + offset;
	}

	return 0;
}

inline long _stdcall
_TellProc(fi_handle handle) {
	assert((int)handle > (int)g_load_address);

	return ((int)g_load_address - (int)handle);
}

// ----------------------------------------------------------

int 
main(int argc, char *argv[]) {
	FreeImageIO io;

	io.read_proc  = _ReadProc;
	io.write_proc = _WriteProc;
	io.tell_proc  = _TellProc;
	io.seek_proc  = _SeekProc;

	// allocate some memory for the bitmap

	BYTE *test = new BYTE[159744];

	if (test != NULL) {
		// load the bitmap into memory. ofcourse you can do this any way you want

		FILE *file = fopen("e:\\projects\\images\\money-256.tif", "rb");
		fread(test, 159744, 1, file);
		fclose(file);

		// we store the load address of the bitmap for internal reasons

		g_load_address = test;

		// convert the bitmap
		
		FIBITMAP *dib = FreeImage_LoadFromHandle(FIF_TIFF, &io, (fi_handle)test);

		// don't forget to free the dib !
		FreeImage_Unload(dib);

		delete [] test;
	}

	return 0;
}