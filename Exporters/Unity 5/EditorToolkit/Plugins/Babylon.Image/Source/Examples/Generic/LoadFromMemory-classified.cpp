// ==========================================================
// Classified FreeImageIO handler
//
// Design and implementation by
// - schickb (schickb@hotmail.com)
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

class MemIO : public FreeImageIO {
public :
    MemIO( BYTE *data ) : _start(data), _cp(data) {
        read_proc  = _ReadProc;
        write_proc = _WriteProc;
        tell_proc  = _TellProc;
        seek_proc  = _SeekProc;
    }

    void Reset() {
		_cp = _start;
	}

    static unsigned _ReadProc(void *buffer, unsigned size, unsigned count, fi_handle handle);
    static unsigned _WriteProc(void *buffer, unsigned size, unsigned count, fi_handle handle);
    static int _SeekProc(fi_handle handle, long offset, int origin);
	static long _TellProc(fi_handle handle);

private:
    BYTE * const _start;
    BYTE *_cp;
};


unsigned
MemIO::_ReadProc(void *buffer, unsigned size, unsigned count, fi_handle handle) {
    MemIO *memIO = (MemIO*)handle;
    
    BYTE *tmp = (BYTE *)buffer;

    for (unsigned c = 0; c < count; c++) {
        memcpy(tmp, memIO->_cp, size);

        memIO->_cp = memIO->_cp + size;

        tmp += size;
    }

    return count;
}

unsigned
MemIO::_WriteProc(void *buffer, unsigned size, unsigned count, fi_handle handle) {
    ASSERT( false );
    return size;
}

int
MemIO::_SeekProc(fi_handle handle, long offset, int origin) {
    ASSERT(origin != SEEK_END);

    MemIO *memIO = (MemIO*)handle;

    if (origin == SEEK_SET) 
        memIO->_cp = memIO->_start + offset;
    else
        memIO->_cp = memIO->_cp + offset;

    return 0;
}

long
MemIO::_TellProc(fi_handle handle) {
    MemIO *memIO = (MemIO*)handle;

    return memIO->_cp - memIO->_start;
}

// ----------------------------------------------------------
// PSEUDOCODE... HELPS TO UNDERSTAND HOW THE MEMIO CLASS WORKS
// ----------------------------------------------------------

int
main(int argc, char *argv[]) {
	BYTE *data = loadimagesomehow();

	MemIO memIO(data);

	FIBITMAP *fbmp = FreeImage_LoadFromHandle( fif, &memIO, (fi_handle)&memIO );
}