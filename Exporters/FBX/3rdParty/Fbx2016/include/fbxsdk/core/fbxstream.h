/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxstream.h
#ifndef _FBXSDK_CORE_STREAM_H_
#define _FBXSDK_CORE_STREAM_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/core/base/fbxfile.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

/** Abstract class for implementing I/O operations through a stream of data.
* For instance, it can be used to read data from a memory source, thus making it possible to import files from memory. However, 
* for the time being, the FbxStream class is only supported with FBX files. 
*/
class FBXSDK_DLL FbxStream
{
public:
	/** Current stream state. */
	enum EState
	{
		eClosed,	//!< The stream is closed.
		eOpen,		//!< The stream is open.
		eEmpty		//!< The stream is empty.
	};

	/** Query the current state of the stream. */
	virtual EState GetState() = 0;

	/** Open the stream.
	* \return True if successful.
	* \remark Each time the stream is open or closed, the stream position must be reset to zero. */
	virtual bool Open(void* pStreamData) = 0;

	/** Close the stream.
	* \return True if successful.
	* \remark Each time the stream is open or closed, the stream position must be reset to zero. */
	virtual bool Close() = 0;

	/** Empties the internal data of the stream.
	* \return True if successful. */
	virtual bool Flush() = 0;

	/** Writes a memory block.
	* \param pData Pointer to the memory block to write.
	* \param pSize Size (in bytes) of the memory block to write.
	* \return The number of bytes written in the stream. */
	virtual int Write(const void* /*pData*/, int /*pSize*/) = 0;

	/** Read bytes from the stream and store them in the memory block.
	* \param pData Pointer to the memory block where the read bytes are stored.
	* \param pSize Number of bytes read from the stream.
	* \return The actual number of bytes successfully read from the stream. */
	virtual int Read(void* /*pData*/, int /*pSize*/) const = 0;

	/** Read a string from the stream.
	* The default implementation is written in terms of Read() but does not cope with DOS line endings.
	* Subclasses may need to override this if DOS line endings are to be supported.
	* \param pBuffer Pointer to the memory block where the read bytes are stored.
	* \param pMaxSize Maximum number of bytes to be read from the stream.
	* \param pStopAtFirstWhiteSpace Stop reading when any whitespace is encountered. Otherwise read to end of line (like fgets()).
	* \return pBuffer, if successful, else NULL.
	* \remark The default implementation terminates the \e pBuffer with a null character and assumes there is enough room for it.
	* For example, a call with \e pMaxSize = 1 will fill \e pBuffer with the null character only. */
	virtual char* ReadString(char* pBuffer, int pMaxSize, bool pStopAtFirstWhiteSpace=false);

	/** If not specified by KFbxImporter::Initialize(), the importer will ask
	* the stream to select an appropriate reader ID to associate with the stream.
	* FbxIOPluginRegistry can be used to locate id by extension or description.
	* Return -1 to allow FBX to select an appropriate default. */
	virtual int GetReaderID() const = 0;

	/** If not specified by KFbxExporter::Initialize(), the exporter will ask
	* the stream to select an appropriate writer ID to associate with the stream.
	* KFbxIOPluginRegistry can be used to locate id by extension or description.
	* Return -1 to allow FBX to select an appropriate default. */
	virtual int GetWriterID() const = 0;

	/** Adjust the current stream position.
	* \param pSeekPos Pre-defined position where offset is added (FbxFile::eBegin, FbxFile::eCurrent:, FbxFile::eEnd)
	* \param pOffset Number of bytes to offset from pSeekPos. */
	virtual void Seek(const FbxInt64& pOffset, const FbxFile::ESeekPos& pSeekPos)=0;

	/** Get the current stream position.
	* \return Current number of bytes from the beginning of the stream. */
	virtual long GetPosition() const = 0;

	/** Set the current stream position.
	* \param pPosition Number of bytes from the beginning of the stream to seek to. */
	virtual void SetPosition(long pPosition)=0;

	/** Return 0 if no errors occurred. Otherwise, return 1 to indicate
	* an error. This method will be invoked whenever FBX needs to verify
	* that the last operation succeeded. */
	virtual int GetError() const = 0;

	/** Clear current error condition by setting the current error value to 0. */
	virtual void ClearError() = 0;

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
	FbxStream(){};
	virtual ~FbxStream(){};

	int Write(const char* pData, int pSize){ return Write((void*)pData, pSize); }
	int Write(const int* pData, int pSize){ return Write((void*)pData, pSize); }
	int Read(char* pData, int pSize) const { return Read((void*)pData, pSize); }
	int Read(int* pData, int pSize) const { return Read((void*)pData, pSize); }
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_CORE_STREAM_H_ */
