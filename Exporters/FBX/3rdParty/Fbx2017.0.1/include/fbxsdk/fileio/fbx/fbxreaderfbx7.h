/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxreaderfbx7.h
#ifndef _FBXSDK_FILEIO_FBX_READER_FBX7_H_
#define _FBXSDK_FILEIO_FBX_READER_FBX7_H_

#include <fbxsdk.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

struct FbxReaderFbx7_Impl;

/**	\brief This class is the FBX v7 reader.
* The reader provide you the ability to read the global settings, objects and animation information from file.
*
*/
class FbxReaderFbx7 : public FbxReader
{
public:
    /** \enum EImportMode File import mode.
    *
    */
    typedef enum
    {
        eASCII,     /**< Plain text mode */
        eBINARY,    /**< Binary mode */
        eENCRYPTED  /**< Encrypted mode */
    } EImportMode;

    /** Constructor
      *	\param pManager        the FbxManager Object
      * \param pImporter       the FbxImporter to import the SDK objects
      * \param pID             id for current reader
      * \param pStatus         the FbxStatus object to hold error codes
      */
    FbxReaderFbx7(FbxManager& pManager, FbxImporter& pImporter, int pID, FbxStatus& pStatus);

    /** Destructor
      *
      */
    virtual ~FbxReaderFbx7();

    /** Open file with certain EFileOpenSpecialFlags
      * \param pFileName     name of the File to open
      * \param pFlags        the EFileOpenSpecialFlags to open with
      * \return if the file is open successfully return true, otherwise return false
      */
    virtual bool FileOpen(char* pFileName, EFileOpenSpecialFlags pFlags);

    /** Open file with default flag
      *	\param pFileName     name of the File to open
      * \return if the file is open successfully return \c true, otherwise return \c false
      */
    virtual bool FileOpen(char* pFileName);

    /** Open file with default flag
      */
    virtual bool FileOpen(FbxFile* pFile);

    /** Open file from stream
      */
	virtual bool FileOpen(FbxStream * pStream, void* pStreamData);

    /** Close the file stream
      * \return if the file is closed successfully return \c true, otherwise return \c false
      */
    virtual bool FileClose();

    /** Check whether the file stream is open.
      *	\return if the file stream is open return \c true, otherwise return \c false.
      */
    virtual bool IsFileOpen();

    /** Get current Import mode
      *	
      */
    EImportMode GetImportMode();

    /** Get file version
      *	\param pMajor       Major version
      *	\param pMinor       Minor version
      *	\param pRevision    Revision version
      */
    virtual void GetVersion(int& pMajor, int& pMinor, int& pRevision);

    /** Get axis system information from file
      *	\param pAxisSystem      axis system in file
      * \param pSystemUnits     system unit in file
      * \return if either pAxisSystem or pSystemUnits is \c NULL return \c false, otherwise return \c true.
      */
    virtual bool GetAxisInfo(FbxAxisSystem* pAxisSystem, FbxSystemUnit* pSystemUnits);

	/** Get FBX file time mode read from GlobalSettings in FBX 6.n and FBX 7.n
	  *	\param pTimeMode  ref to a FbxTime::EMode enum	
	  *	\return     \c true on success, \c false otherwise.
	  *	\remarks    This function must be called after FbxImporter::Initialize().
	  *             Can be used for statistics (via GlobalSettings) before loading the whole scene from the file.
	  */
	virtual bool GetFrameRate(FbxTime::EMode &pTimeMode);

    /** Get the statistics from file
      *	\param pStats statistics in file
      *	\return if fetching statistics is successfully return \c true, otherwise return \c false.
      */
    virtual bool GetStatistics(FbxStatistics* pStats);

     /** Get the file stream options
      *	\param pParseFileAsNeeded       Whether to parse file as read options
      * \return true on success, otherwise return false.
      */
    virtual bool GetReadOptions(bool pParseFileAsNeeded = true);

    /** Read file with stream options
      *	\param pDocument        FbxDocument to store the file data
      *	\return if fetching statistics is successful return \c true, otherwise return \c false.
      */
    virtual bool Read(FbxDocument *pDocument);

	/** Reads extension plug-ins name, version and parameters, so that we can remember if a plug-in was used during export.
	  * This is especially useful for extension plug-ins that modify the scene and also to warn users during import if an
	  * extension plug-in was used that could be missing.
      * \param pParams The parameters of the extension plug-in. The properties of the objects are used
	  * as the parameters of the extension plug-in.
      */
	virtual void PluginReadParameters(FbxObject& pParams);

    /** Get the file options
      * \param pFbx                     file object to read options
      *	\param pParseFileAsNeeded       Whether to parse file as read options
      * \return true on success, otherwise return false.
      */
    virtual bool GetReadOptions(FbxIO* pFbx, bool pParseFileAsNeeded = true);

    /** Read file with stream options
      *	\param pDocument        FbxDocument to store the file data
      * \param pFbx             file object to read from
      *	\return if reading the file is successful return \c true, otherwise return \c false.
      */
    virtual bool Read(FbxDocument *pDocument, FbxIO* pFbx);

    /** Returns the scene info from the file.
      * \return The pointer to file scene info defined by this reader.
      */
    virtual FbxDocumentInfo*  GetSceneInfo();

    /** Returns the pointer to the list of TakeInfo from the file.
      * \return NULL
      */
    virtual FbxArray<FbxTakeInfo*>* GetTakeInfo();

    /** Pass a progress handler to the reader
      * \param pProgress     FbxProgress to store the progress information.
      */
    virtual void SetProgressHandler(FbxProgress *pProgress);

	virtual void SetEmbeddingExtractionFolder(const char* pExtractFolder);

	virtual bool SupportsStreams() const { return true; }

private:
    // Declared, not defined.
    FbxReaderFbx7(const FbxReaderFbx7&);
    FbxReaderFbx7& operator=(FbxReaderFbx7 const&);

private:
    FbxReaderFbx7_Impl* mImpl;
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_FILEIO_FBX_READER_FBX7_H_ */
