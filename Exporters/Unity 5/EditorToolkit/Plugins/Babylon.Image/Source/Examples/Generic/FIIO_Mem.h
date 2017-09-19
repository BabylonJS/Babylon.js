/*--------------------------------------------------------------------------*\
|| fiio_mem.h by Ryan Rubley <ryan@lostreality.org>                         ||
||                                                                          ||
|| (v1.02) 4-28-2004                                                        ||
|| FreeImageIO to memory                                                    ||
||                                                                          ||
\*--------------------------------------------------------------------------*/

#ifndef _FIIO_MEM_H_
#define _FIIO_MEM_H_

#include "freeimage.h"

#ifdef __cplusplus
extern "C" {
#endif

typedef struct fiio_mem_handle_s {
	long filelen,datalen,curpos;
	void *data;
} fiio_mem_handle;

/* it is up to the user to create a fiio_mem_handle and init datalen and data
 * filelen will be pre-set to 0 by SaveToMem
 * curpos will be pre-set to 0 by SaveToMem and LoadFromMem
 * IMPORTANT: data should be set to NULL and datalen to 0,
 *            unless the user wants to manually malloc a larger buffer
 */
FIBITMAP *FreeImage_LoadFromMem(FREE_IMAGE_FORMAT fif, fiio_mem_handle *handle, int flags);
BOOL FreeImage_SaveToMem(FREE_IMAGE_FORMAT fif, FIBITMAP *dib, fiio_mem_handle *handle, int flags);

void SetMemIO(FreeImageIO *io);
unsigned fiio_mem_ReadProc(void *buffer, unsigned size, unsigned count, fi_handle handle);
unsigned fiio_mem_WriteProc(void *buffer, unsigned size, unsigned count, fi_handle handle);
int fiio_mem_SeekProc(fi_handle handle, long offset, int origin);
long fiio_mem_TellProc(fi_handle handle);

/*** Example Usage ***

//variables
FIBITMAP *bitmap, *bitmap2;
fiio_mem_handle fmh;

//important initialization
fmh.data = NULL;
fmh.datalen = 0;

//load a regular file
bitmap = FreeImage_Load(FIF_PNG, "sample.png");

//save the file to memory
FreeImage_SaveToMem(FIF_PNG, bitmap, &fmh, 0);

//at this point, fmh.data contains the entire PNG data in memory
//fmh.datalen is the amount of space malloc'd for the image in memory,
//but only fmh.filelen amount of that space is actually used.

//its easy load an image from memory as well
bitmap2 = FreeImage_LoadFromMem(FIF_PNG, &fmh, 0);
//you could also have image data in memory via some other method, and just set
//fmh.data to point to it, and set both fmh.datalen and fmh.filelen to the
//size of that data, then FreeImage_LoadFromMem could load the image from that
//memory

//make sure to free the data since SaveToMem will cause it to be malloc'd
free(fmh.data);

*/

#ifdef __cplusplus
}
#endif

#endif
