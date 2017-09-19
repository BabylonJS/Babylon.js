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

#include "stdafx.h"
#include "FreeImageIO.Net.h"


extern "C" static unsigned __stdcall ReadProc (void *buffer, unsigned size, unsigned count, fi_handle handle)
{
	int total_read = 0;
	struct UNMANAGED_HANDLER* puh = (struct UNMANAGED_HANDLER*)handle;				
	gcroot<unsigned char __gc []> mbuffer = new unsigned char __gc[size];		
	try
	{							
		total_read = puh->_stream->Read(mbuffer,0,size);
		Marshal::Copy(mbuffer,0,buffer,total_read);
	} __finally {
		mbuffer=NULL;
	}		
	return (unsigned)total_read;
}

extern "C" static unsigned __stdcall WriteProc (void *buffer, unsigned size, unsigned count, fi_handle handle)
{
	struct UNMANAGED_HANDLER* puh = (struct UNMANAGED_HANDLER*)handle;				
	gcroot<unsigned char __gc []> mbuffer = new unsigned char __gc[size*count];		
	try
	{	

		unsigned char __pin* pbuffer = &mbuffer[0];
		memcpy(pbuffer,buffer,size*count);
		puh->_stream->Write(mbuffer,0,size);			
	} __finally {
		mbuffer=NULL;
	}		
	return count;
}

extern "C" static int __stdcall SeekProc (fi_handle handle, long offset, int origin)
{
	struct UNMANAGED_HANDLER* puh = (struct UNMANAGED_HANDLER*)handle;
	return (int)puh->_stream->Seek(offset,(SeekOrigin) origin);
	
}

extern "C" static long __stdcall TellProc(fi_handle handle)
{
	struct UNMANAGED_HANDLER* puh = (struct UNMANAGED_HANDLER*)handle;
	return (long)puh->_stream->Position;
}

