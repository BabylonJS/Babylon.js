/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxiopluginregistry.h
#ifndef _FBXSDK_FILEIO_IO_PLUGIN_REGISTRY_H_
#define _FBXSDK_FILEIO_IO_PLUGIN_REGISTRY_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/fileio/fbxreader.h>
#include <fbxsdk/fileio/fbxwriter.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

/**	\brief This class serves as the registrar for file formats.
  * A file format must be registered when it is used by the FBX SDK.
  *
  * This class also lets you create and read formats other than FBX SDK native formats.
  * Users of FBX SDK can write their own plug-ins to read or write arbitrary file formats.
  * Once their plug-ins are registered in this class, FBX SDK is able to read or write
  * these file formats.
  *
  * Each FbxManager has a unique FbxIOPluginRegistry. To get an instance of this class:
  * \code
  * FbxIOPluginRegistry* registry = manager->GetIOPluginRegistry();
  * \endcode
  * \see FbxManager::GetIOPluginRegistry()
  */
class FBXSDK_DLL FbxIOPluginRegistry
{
public:

    /** Constructor.
      */
    FbxIOPluginRegistry();

    /** Destructor.
      */
	virtual ~FbxIOPluginRegistry();

#ifndef FBXSDK_ENV_WINSTORE
	/** Registers a Reader from a plug-in path.
	  *	\param pPluginPath          The plug-in path.
	  * \param pFirstPluginID       Contains the ID of the first plug-in found.
	  * \param pRegisteredCount     Contains the number of registered Readers.
	  * \param pOverride			Override any existing writer that is using the same extension. 
	  */
	void RegisterReader(const char* pPluginPath,
						int& pFirstPluginID,
						int& pRegisteredCount,
						bool pOverride = false);
#endif /* !FBXSDK_ENV_WINSTORE */

	/** Registers a Reader.
	  *	\param pCreateF             The function that creates the Reader to be registered.
	  * \param pInfoF               The function that provides information about the Reader file format, such as the file extension and description. 
	  * \param pFirstPluginID       Contains the ID of the first plug-in found.
	  * \param pRegisteredCount     Contains the number of registered Readers.
	  * \param pIOSettingsFillerF   The function that fills the IO settings for the Reader. 
	  * \param pOverride			Override any existing writer that is using the same extension. 
	  */
	void RegisterReader(FbxReader::CreateFuncType pCreateF, 
						FbxReader::GetInfoFuncType pInfoF,
						int& pFirstPluginID,
						int& pRegisteredCount,
						FbxReader::IOSettingsFillerFuncType pIOSettingsFillerF = NULL,
						bool pOverride = false);

#ifndef FBXSDK_ENV_WINSTORE
	/** Registers a Writer from a plug-in path
	  *	\param pPluginPath          The plug-in path.
	  * \param pFirstPluginID       Contains the ID of the first plug-in found.
	  * \param pRegisteredCount     Contains the number of registered Writers.
	  * \param pOverride			Override any existing writer that is using the same extension. 
	  */
	void RegisterWriter(const char* pPluginPath,
						int& pFirstPluginID,
						int& pRegisteredCount,
						bool pOverride = false);
#endif /* !FBXSDK_ENV_WINSTORE */

	/** Registers a Writer.
	  *	\param pCreateF             The function that creates the Writer to be registered. 
	  * \param pInfoF               The function that provides information about the Writer file format, such as the file extension, description and version. 
	  * \param pFirstPluginID       Contains the ID of the first plug-in found.
	  * \param pRegisteredCount     Contains the number of registered Writers.
	  * \param pIOSettingsFillerF   The function that fills the IO settings for the Writer. 
	  * \param pOverride			Override any existing writer that is using the same extension. 
	  */
	void RegisterWriter(FbxWriter::CreateFuncType pCreateF, 
						FbxWriter::GetInfoFuncType pInfoF,
						int& pFirstPluginID,
						int& pRegisteredCount,
						FbxWriter::IOSettingsFillerFuncType pIOSettingsFillerF = NULL,
						bool pOverride = false);

	/** Creates a Reader.
	*	\param pManager         The SDK Manager where the Reader is created.
	  *	\param pImporter        The importer that holds the created Reader.
	  * \param pPluginID        The Reader ID.
	  */
	FbxReader* CreateReader(FbxManager& pManager, 
							 FbxImporter& pImporter, 
							 int pPluginID) const;

	/** Creates a Writer.
	  * \param pManager         The SDK Manager where the Writer is created.
	  *	\param pExporter        The exporter that holds the created Writer.
	  * \param pPluginID        The Writer ID.
	  */
	FbxWriter* CreateWriter(FbxManager& pManager, 
							 FbxExporter& pExporter,
							 int pPluginID) const;

	/** Searches for the Reader ID by the file extension.
	  * \param pExt             The file extension.
	  *	\return                 The Reader ID if found, if not found, returns -1
	  */
	int FindReaderIDByExtension(const char* pExt) const;

	/** Searches for the Writer ID by the file extension.
	  * \param pExt             The file extension.	  
	  *	\return                 The Writer ID if found, if not found, returns -1
	  */
	int FindWriterIDByExtension(const char* pExt) const;
	
	/** Searches for the Reader ID by the file format description.
	  * \param pDesc            The file format description.	  
	  *	\return                 The Reader ID if found, if not found, returns -1
	  */
	int FindReaderIDByDescription(const char* pDesc) const;

	/** Searches for the Writer ID by the file format description.
	  * \param pDesc            The file format description.	  
	  *	\return                 The Writer ID if found, if not found, returns -1.
	  */
	int FindWriterIDByDescription(const char* pDesc) const;
	
	/** Verifies if the file format of the Reader is FBX.
	  * \param pFileFormat      The file format identifier.
	  *	\return                 \c True if the file format of the Reader is FBX, return \c false otherwise..
	  */
	bool ReaderIsFBX(int pFileFormat) const;

	/** Verifies if the file format of the Writer is FBX.
	  * \param pFileFormat      The file format identifier.
	  *	\return                 \c True if the file format of the Writer is FBX, return \c false otherwise.
	  */
	bool WriterIsFBX(int pFileFormat) const;

	/** Verifies if the file format of the Reader is genuine (internal).
      * \param pFileFormat      The file format identifier.
	  *	\return                 \c True if the file format of the Reader is FBX, DXF, 3DS, OBJ and DAE, return \c false otherwise.
	  */
	bool ReaderIsGenuine(int pFileFormat) const;

	/** Verifies if the file format of the Writer is genuine (internal).
      * \param pFileFormat      The file format identifier.
	  *	\return                 \c True if the file format of the Writer is FBX, DXF, 3DS, OBJ and DAE, return \c false otherwise.
	  */
	bool WriterIsGenuine(int pFileFormat) const;

	/** Returns the number of file formats that can be imported. 
	  *	\return     The number of importable formats.
	  */
	int GetReaderFormatCount() const;

	/** Returns the number of file formats that can be exported.
	  *	\return      The number of exportable formats.
	  * \remarks     Multiple identifiers for the same format count as 
	  *              different file formats. For example, eFBX_BINARY, eFBX_ASCII and eFBX_ENCRYPTED
	  *              are counted as three separate file formats.
	  */
	int GetWriterFormatCount() const;

	/** Returns the description of an importable file format.
	  *	\param pFileFormat     The file format identifier.
	  *	\return                A pointer to the character representation of the description.
	  */
	const char* GetReaderFormatDescription(int pFileFormat) const;

	/** Returns the description of an exportable file format.
	  *	\param pFileFormat     The file format identifier.
	  *	\return                A pointer to the character representation of the description.
	  */
	const char* GetWriterFormatDescription(int pFileFormat) const;

	/** Returns an importable file format's file extension.
	  *	\param pFileFormat     The file format identifier.
	  *	\return                A pointer to the character representation of the file extension.
	  */
	const char* GetReaderFormatExtension(int pFileFormat) const;
	
	/** Returns an exportable file format's file extension.
	  *	\param pFileFormat     The file format identifier.
	  *	\return                A pointer to the character representation of the file extension.
	  */
	const char* GetWriterFormatExtension(int pFileFormat) const;

	/** Returns a list of the writable file format versions.
	  *	\param pFileFormat     The file format identifier.
	  *	\return                A pointer to a list of user-readable strings that represent the versions.
	  */
	char const* const* GetWritableVersions(int pFileFormat) const;

	/** Detects the import (reader) file format specified for the file.
	  * \param pFileName       The file whose file format is to be determined.
	  * \param pFileFormat     It equals the file format identifier if this function returns \c true. If this function returns \c false, it is unmodified.
	  * \return                \c True if the file has been determined successfully, 
	  *                        returns \c false otherwise.
	  * \remarks               This function attempts to detect the specified file's file format based on the file extension and, 
	  *                        in some cases, its content. This function may not be able to determine all file formats.
	  *                        Use this function as a helper before calling \c SetFileFormat().
	  * \note                  The file must be unlocked (already open) for this function to succeed.
	  */
	bool DetectReaderFileFormat(const char* pFileName, int& pFileFormat) const;

	/** Detects the export (writer) file format specified for the file.
	  * \param pFileName       The file whose file format is to be determined.
	  * \param pFileFormat     It equals the file format identifier if this function returns \c true. If this function returns \c false, it is unmodified.
	  * \return                \c True if the file has been determined successfully, 
	  *                        returns \c false otherwise.
	  * \remarks               This function attempts to detect the specified file's file format based on the file extension and, 
	  *                        in some cases, its content. This function may not be able to determine all file formats.
	  *                        Use this function as a helper before calling \c SetFileFormat().
	  * \note                  The file must be unlocked (already open) for this function to succeed.
	  */
	bool DetectWriterFileFormat(const char* pFileName, int& pFileFormat) const;
	
	/** Returns the file format of the native Reader.
	  *	\return     The ID of the native Reader's file format.
	  */
	int GetNativeReaderFormat();

	/** Returns the file format of the native Writer.
	  *	\return     The ID of the native Writer's file format.
	  */
	int GetNativeWriterFormat();

	/** Fills the IO Settings for all registered readers.
	  *	\param pIOS			   The IO settings to be filled.
	  */
	void FillIOSettingsForReadersRegistered(FbxIOSettings & pIOS);

    /** Fills the IO Settings for all registered writers.
	  *	\param pIOS			   The IO settings to be filled.
	  */
	void FillIOSettingsForWritersRegistered(FbxIOSettings & pIOS);


/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
private:
	void RegisterInternalIOPlugins();

	struct ReaderPluginEntry
	{
		ReaderPluginEntry(const char* pExtension, const char* pDescription, FbxReader::CreateFuncType pCreatorFunction, int pBaseID,
			FbxReader::IOSettingsFillerFuncType pIOSettingsFillerFunction=NULL);
		
		const char*								mExtension;
		const char*								mDescription;
		FbxReader::CreateFuncType				mCreatorFunction;
		FbxReader::IOSettingsFillerFuncType	mIOSettingsFillerFunction;
		int										mBaseID;
		bool									mIsFBX;
		bool									mIsInternalPlugin;
	};
	
	struct WriterPluginEntry
	{
		WriterPluginEntry(const char* pExtension, const char* pDescription, char const* const* pVersions, FbxWriter::CreateFuncType pCreatorFunction, int pBaseID,
			FbxWriter::IOSettingsFillerFuncType pIOSettingsFillerFunction=NULL);
		
		const char*								mExtension;
		const char*								mDescription;
		char const* const*						mVersions;
		FbxWriter::CreateFuncType				mCreatorFunction;
		FbxWriter::IOSettingsFillerFuncType	mIOSettingsFillerFunction;
		int										mBaseID;
		bool									mIsFBX;
		bool									mIsInternalPlugin;
	};

	FbxArray<ReaderPluginEntry*>	mReaders;
	FbxArray<WriterPluginEntry*>	mWriters;
	int									mNativeReaderFormat;
	int									mNativeWriterFormat;
	bool								mInternalPluginMode;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_FILEIO_IO_PLUGIN_REGISTRY_H_ */
