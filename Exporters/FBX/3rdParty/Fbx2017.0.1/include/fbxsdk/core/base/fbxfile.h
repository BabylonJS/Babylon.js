/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxfile.h
#ifndef _FBXSDK_CORE_BASE_FILE_H_
#define _FBXSDK_CORE_BASE_FILE_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/core/base/fbxstring.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

class FbxStream;

/**
    Class for interfacing with files, providing a similar interface for files independant of the OS or filesystem.
*/
class FBXSDK_DLL FbxFile
{
public:
	enum EMode {eNone, eReadOnly, eReadWrite, eCreateWriteOnly, eCreateReadWrite, eCreateAppend};
	enum ESeekPos {eBegin, eCurrent, eEnd};

    FbxFile();
    virtual ~FbxFile();

	/** Opens a file on disk using the specified read/write mode.
	  * \param pFileName_UTF8 Filename in UTF8 (compatible with ASCII)
      * \param pMode Mode in which to open the file, e.g. eReadOnly, eCreateReadWrite, etc.
      * \param pBinary Whether the file is to be opened in binary or text mode.
	  * \return True if opening is successful.
	  */
    virtual bool        Open(const char* pFileName_UTF8, const EMode pMode=eCreateReadWrite, const bool pBinary=true);

	/** Opens a file from a data stream using the specified read/write mode.
	  * \param pStream Stream instance with which the file will be read/written
      * \param pStreamData User-defined data to pass as a parameter to the stream's Open() method.
      * \param pMode Deprecated/Unused.
	  * \return True if opening is successful.
	  */
    virtual bool        Open(FbxStream* pStream, void* pStreamData, const char* pMode);

	/** Closes a file, freeing its handle.
	  * \return True if closing is successful.
	  */
    virtual bool        Close();

    /** Seek to a specific position in the file, starting from either beginning, current position or end
	  * \param pOffset Offset to seek to (advance the file position cursor) starting from pSeekPos
      * \param pSeekPos Starting position from which to seek to.  Beginning, current position or end.
	  */
    virtual void		Seek(const FbxInt64 pOffset, const ESeekPos pSeekPos=eBegin);

	/** Returns the position at which the file cursor currently is.  For example, will be ==0 for beginning and ==FileSize for end.
	  * \return The position at which the file cursor currently is.
	  */
    virtual FbxInt64	Tell() const;

	/** Read a part of the file into a buffer
      * \param pDstBuf Pre-allocated buffer in which to read data
      * \param pSize Size of the data chunk to be read in bytes
	  * \return Number of bytes read.
	  */
    virtual	size_t		Read(void* pDstBuf, const size_t pSize);

	/** Read a part of the file as a string into a buffer
      * \param pDstBuf Pre-allocated buffer in which to read the string
      * \param pDstSize Size of the data chunk to be read in characters
      * \param pStopAtFirstWhiteSpace If true, will stop reading at first white space, otherwise it will stop at the first line feed (\n)
	  * \return Pointer on the data read.  Equivalent to parameter pDstBuf
	  */
	virtual char*		ReadString(char* pDstBuf, const size_t pDstSize, bool pStopAtFirstWhiteSpace=false);

	/** Write a buffer to an opened file
      * \param pSrcBuf Pre-allocated buffer from which to write data
      * \param pSize Size of the data chunk to be written in bytes
	  * \return Number of bytes written.
	  */
    virtual size_t		Write(const void* pSrcBuf, const size_t pSize);

	/** Write a formatted string to an opened file
      * \param pFormat Pre-allocated format buffer from which to write data
      * \param ... Variable number of arguments describing the values in the previous parameter. 
	  * \return True if data was successfully written
	  */
    virtual bool		WriteFormat(const char* pFormat, ...);

	/** Modify the size of a file. Null characters ('\0') are appended if the file is extended. 
      * If the file is truncated, all data from the end of the shortened file to the original length of the file is lost.
      * Please note that this function considers the current file cursor as the beginning of the file.
      * It is therefore required to use Seek(0) prior to calling it if we want the size specified by the
      * pSize parameter to be absolute.
      * \param pSize New desired file size
	  * \return True if file was successfully truncated
	  */
    virtual bool		Truncate(const FbxInt64 pSize);

	/** Checks whether the current file cursor position is at the end of file.
	  * \return True if the cursor is at the end of file, false otherwise.
	  */
    virtual bool		EndOfFile() const;

	/** Gets the size of the currently opened file.
	  * \return File size
	  */
	virtual FbxInt64	GetSize();

    /** Unused function in this default implementation.  Must be implemented by memory files.       
      * \param pMemPtr Unused
	  * \param pSize Unused
	  */
	virtual void		GetMemoryFileInfo(void** pMemPtr, size_t pSize);

	/** Checks whether the file is currently opened.
	  * \return True if file is opened, false otherwise
	  */
    bool                IsOpen() const;

	/** Checks whether the file is currently opened with a user-provided streaming interface instead of just the file name
	  * \return True if file has been opened with a stream interface, false otherwise
	  */
    bool                IsStream() const;

	/** Returns the full file path name, as provided when opening it.
	  * \return File full path
	  */
    const char*			GetFilePathName() const;

	/** Returns the mode with which the file was opened, when calling the Open() method.
	  * \return Mode with which the file was opened
	  */
    EMode				GetFileMode() const;

	/** Returns last encountered error when performing any operation on the file.
	  * \return Last error code
	  */
    int                 GetLastError();

	/** Resets the current error code and the end of file indicator of the opened file
	  */
    void                ClearError();

protected:
	FILE*				mFilePtr;
    FbxStream*          mStreamPtr;
	bool                mIsOpen;
	bool                mIsStream;
	EMode				mMode;
	FbxString			mFileName;
};

class FBXSDK_DLL FbxFileUtils
{
public:
	/** Delete a file from disk.
	  * \param pFileName_UTF8 The file to be deleted.
	  * \return True if delete is successful.
	  */
    static bool Delete(const char* pFileName_UTF8);

	/** Rename a file on disk.
	  * \param pFileName_UTF8 The file to be renamed.
	  * \param pNewName_UTF8 The new file name upon rename.
	  * \return True if rename is successful.
	  */
    static bool Rename(const char* pFileName_UTF8, const char* pNewName_UTF8);

	/** Copy one file's content to another file (if the destination file not exist, it will be created).
	  * \param pDestination_UTF8 The destination file path
	  * \param pSource_UTF8 The source file path
	  * \return Return true if copy is successfully.
	  */
	static bool Copy(const char* pDestination_UTF8, const char* pSource_UTF8);

	//! Get given file's size.
	static FbxInt64 Size(const char* pFilePath_UTF8);

	/** Find if the specified file exist.
	  * \param pFilePath_UTF8 The file path to test against.
	  * \return Returns true if the file exist.
	  */
	static bool Exist(const char* pFilePath_UTF8);

	/** Find if the specified file is in read-only mode.
	  * \param pFilePath_UTF8 The file path to test against.
	  * \return Returns true if the file is in read-only mode.
	  */
	static bool IsReadOnly(const char* pFilePath_UTF8);

	// We return a KLong that in fact is a cast of a time_t.
	//! Get given file's last date.
	static FbxLong GetLastDate(const char* pPath_UTF8);

	//! Set the given file's last date as the given date.
	static bool SetLastDate(const char* pPath_UTF8, FbxLong pTime);

	/** Get some content of a file.
	  * \param pStr The content get from file.
	  * \param pSize The size of content.
	  * \param pStream The opened stream of file.
	  */
	static char* FGets(char* pStr, int pSize, FILE* pStream);
};

template<class T> inline const T FbxSwab(const T x)
{
	switch( sizeof(x) )
	{
		case 2:
		{
			FbxUInt8 t[2];
			t[0] = ((FbxUInt8*)&x)[1];
			t[1] = ((FbxUInt8*)&x)[0];
			return *(T*)&t;
		}

		case 4:
		{
			FbxUInt8 t[4];
			t[0] = ((FbxUInt8*)&x)[3];
			t[1] = ((FbxUInt8*)&x)[2];
			t[2] = ((FbxUInt8*)&x)[1];
			t[3] = ((FbxUInt8*)&x)[0];
			return *(T*)&t;
		}

		case 8:
		{
			FbxUInt8 t[8];
			t[0] = ((FbxUInt8*)&x)[7];
			t[1] = ((FbxUInt8*)&x)[6];
			t[2] = ((FbxUInt8*)&x)[5];
			t[3] = ((FbxUInt8*)&x)[4];
			t[4] = ((FbxUInt8*)&x)[3];
			t[5] = ((FbxUInt8*)&x)[2];
			t[6] = ((FbxUInt8*)&x)[1];
			t[7] = ((FbxUInt8*)&x)[0];
			return *(T*)&t;
		}

		default:
			return x;
	}
}

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_CORE_BASE_FILE_H_ */
