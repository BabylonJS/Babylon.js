// ==========================================================
// FreeImageIO.Net 
//
// Design and implementation by
// - Marcos Pernambuco Motta (marcos.pernambuco@gmail.com)
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

#pragma once
#include <vcclr.h>
#include "FreeImage.h"

using namespace System;
using namespace System::IO;
using namespace System::Runtime::InteropServices;

extern "C" {
	// forward decls
	unsigned __stdcall ReadProc (void *buffer, unsigned size, unsigned count, fi_handle handle);
	unsigned __stdcall WriteProc (void *buffer, unsigned size, unsigned count, fi_handle handle);
	int      __stdcall SeekProc (fi_handle handle, long offset, int origin);
	long     __stdcall TellProc(fi_handle handle);	

	#pragma pack(push, 1)
	__nogc struct UNMANAGED_HANDLER {
		UNMANAGED_HANDLER() {
			read_proc  = &ReadProc;
			write_proc = WriteProc;
			seek_proc  = SeekProc;
			tell_proc  = TellProc;
		}
		FI_ReadProc  read_proc;     // pointer to the function used to read data
		FI_WriteProc write_proc;    // pointer to the function used to write data
		FI_SeekProc  seek_proc;     // pointer to the function used to seek
		FI_TellProc  tell_proc;     // pointer to the function used to aquire the current position
		gcroot<System::IO::Stream*> _stream;
	};
	#pragma pack(pop)
}

#define FREEIMAGE_DLL "freeimaged.dll"

namespace FreeImageIODotNet
{
	__gc public class FreeImageStream
	{	
	private:
		struct UNMANAGED_HANDLER* _pUnmanaged;
	public:			
		FreeImageStream(System::IO::Stream* stream)
		{
			FreeImage_SaveToHandle((FREE_IMAGE_FORMAT) 1,0,0,0,0);
			_pUnmanaged = new struct UNMANAGED_HANDLER;
			_pUnmanaged->_stream = stream;			
		}		
		~FreeImageStream() 
		{ 
			_pUnmanaged->_stream = NULL;
			delete _pUnmanaged;
		}

		bool SaveImage(FREE_IMAGE_FORMAT fif, unsigned int dib, int flags) {
			return (bool)FreeImage_SaveToHandle(fif,(FIBITMAP*) dib,(FreeImageIO*)_pUnmanaged,(fi_handle)_pUnmanaged,flags);
		}

		unsigned int LoadImage(FREE_IMAGE_FORMAT fif, int flags) {
			return (unsigned int)FreeImage_LoadFromHandle(fif,(FreeImageIO*)_pUnmanaged,(fi_handle)_pUnmanaged,flags);
		}		
	};
}
