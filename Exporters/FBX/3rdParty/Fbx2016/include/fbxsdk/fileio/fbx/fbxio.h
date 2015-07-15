/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxio.h
#ifndef _FBXSDK_FILEIO_FBX_IO_H_
#define _FBXSDK_FILEIO_FBX_IO_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/core/base/fbxstring.h>
#include <fbxsdk/core/base/fbxtime.h>
#include <fbxsdk/core/base/fbxstatus.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

class FbxIO;
class FbxReader;
class FbxWriter;
class FbxFile;
class FbxStream;
class FbxXRefManager;

/** 
    Defines the current FBX file version number in four digits. The first digit is the 
    major version number a the last three digits are the minor version number (e.g. 7100 = 7.1).
    The following is the version history of FBX: 
    
    \li Version 2000 - New KFCurve and embedded FBX, no FCurve/FCurve node storing.
    No more .takf file like in earlier version, no history.
    
    \li Version 2001 - Version incremented to support FbxTime save in native (integer, not double) 
    format.
    
    \li Version 3000 - FiLMBOX 3.0 version, nothing changed in current class since version 2001.
    FBX SDK 3.0 and 3.6
    
    \li Version 3001 - FiLMBOX 3.0 encrypted version, only a trial. Encrypted files could only 
    be written in debug versions. Cannot switch to a higher version number now because any
    file with a version number >= 3001 is read as encrypted.
    Hence, this value now only gives file type. (3000 or less -> binary, 3001 or more -> encrypted)
    FiLMBOX 3.2, FiLMBOX 3.5 and "Online" 3.51 have been released with version 3000.
    
    \li Version 4000 - MotionBuilder 4.0, new type in KFCurve tangents, supported in FiLMBOX 3.5 
    but not by earlier versions. Version number is now stored in section footer.
    Before September 3rd 2002, the version number was always 3000 in main section footer.
    Now the main section footer has version number 4000. The minimum version number in footer of 
    an extension section is 4000.
    
    \li Version 4001 - ASCII Header is 4.1. MotionBuilder 4.01, to fix FCurveNode problem with 
    layer types in version 4000 the main section footer has version number 4001.
    Now the footer for extension sections has version number 4001.
    
    \li Version 4050 - ASCII Header is 4.5. MotionBuilder 4.1 or 4.5 before 
    January 22nd 2003. This is because EvaluationProperties now have color. Now the main section footer 
    has version number 4050.
    Now the footer for extension sections has version number 4050.

    \li Version 5000 - ASCII Header is not compatible anymore with MotionBuilder 4.0, 4.01 and 4.02 and FBX SDK 3.6 and 3.7
    MotionBuilder 4.03 and 4.1 or 4.5 from January 22nd 2003
    FBX SDK 3.6.1. New extended header to improve FBX file version management. Now the extended header and 
    the main section footer have version number 5000. Now the footer for extension sections has version number 5000.
    
    \li Version 5800 - This was a temporary version while waiting for version 6000 renders the previous versions 
    incompatible with MotionBuilder 6.0. For now, however, this format is needed to allow
    some tools/plugins (For example Maya) to correctly detect that the file has some features that are not
    completely backward compatible (For example: pivots defined with _pre/_post nodes which require a special
    processing). By incrementing only the minor version we do not compromise the integrity of the
    files.
    
    \li Version 6000 - Header version is now 6.0.
    Extended header now contain a creation time stamp
    that can be retrieve without parsing the main section of the file.
    A creator tag (string) is now stored in the Extended header. This contain the originator (MB/FBXSDK)
    of the file and the build number of the originator.
    First release of the file format using the KProperties to store/retrieve information.
    
    \li Version 6100 - Added support for multiple attributes (mainly multiple geometry) at the node level.
    The pointer to the node attribute have been replaced by a connection between the node and its attribute(s).
    
    \li Version 7000 -
    First version of the 7.0 series; most likely very short-lived, developed for Protein, before ADP.
    Supports reference cloning, external documents, blobs, unique IDs (per file), property templates.
    So many changes that it was decided to break from 6.0 to keep Motion Builder intact.
    
    \li Version 7099 - Temporary version for FBX 2011 alpha releases.
    
    \li Version 7100
    Official file version for FBX 2011, add support for animation to FBX 7.
    First version of FBX SDK with FBX 7 files as the default file format.

	\li Version 7200
	Added support for multiple blend shape deformers and In-Between blend-shapes on each geometry.
	Moved shape(FbxShape) to its own section other than as a part of geometry section.
	Add support to store blend shape deformer(FbxBlendShape), blend shape channel(FbxBlendShapeChannel), 
	Substance(FbxProceduralTexture) and Lines(FbxLine).
	Add support to store 3 different smooth binding modes of FbxSkin, including classic linear, dual quaternion 
	and blended mode of previous two modes.
    Added the CLAMP_PROGRESSIVE tangent mode.
    The KFCurve::KeyAttrDataFloat data array now stores as integer values (ASCII mode) to to eliminate float to int precision errors.        
    FbxLayeredTexture now stores alphas for its sub textures.
	
	\li Version 7300
	Changed the way the CharacterPoses are written.
	Changed light property name HotSpot and ConeAngle to InnerAngle and OuterAngle

 	\li Version 7400
	Normals, tangents and binormals save the 4th component into a separate array	

	\li Version 7500
	Added support for large files (>2GB). NOTE: This breaks forward compatibility (i.e. older products won't be able to open these files!!)
   
 */

//File version numbers
#define FBX_FILE_VERSION_2000		2000	//FBX 2.0
#define FBX_FILE_VERSION_2001		2001	//FBX 2.01
#define FBX_FILE_VERSION_3000		3000	//FBX 3.0
#define FBX_FILE_VERSION_3001		3001	//FBX 3.01
#define FBX_FILE_VERSION_4000		4000	//FBX 4.0
#define FBX_FILE_VERSION_4001		4001	//FBX 4.01
#define FBX_FILE_VERSION_4050		4050	//FBX 4.5
#define FBX_FILE_VERSION_5000		5000	//FBX 5.0
#define FBX_FILE_VERSION_5800		5800	//FBX 5.8
#define FBX_FILE_VERSION_6000		6000	//FBX 6.0
#define FBX_FILE_VERSION_6100		6100	//FBX 6.1 (guarantee compatibility with Autodesk 2010 products)
#define FBX_FILE_VERSION_7000		7000	//Compatible with 7.1, and taken as such
#define FBX_FILE_VERSION_7099		7099	//Compatible with 7.1, and taken as such
#define FBX_FILE_VERSION_7100		7100	//FBX 7.1 (guarantee compatibility with Autodesk 2011 products)
#define FBX_FILE_VERSION_7200		7200	//FBX 7.2 (guarantee compatibility with Autodesk 2012 products)
#define FBX_FILE_VERSION_7300		7300	//FBX 7.3 (guarantee compatibility with Autodesk 2013 products)
#define FBX_FILE_VERSION_7400		7400	//FBX 7.4 (guarantee compatibility with Autodesk 2014/2015 products)
#define FBX_FILE_VERSION_7500		7500	//FBX 7.5 (guarantee compatibility with Autodesk 2016 products)

//File version compatibility strings
#define FBX_53_MB55_COMPATIBLE		"FBX53_MB55"
#define FBX_60_COMPATIBLE			"FBX60_MB60"
#define FBX_2005_08_COMPATIBLE		"FBX200508_MB70"
#define FBX_2006_02_COMPATIBLE		"FBX200602_MB75"
#define FBX_2006_08_COMPATIBLE		"FBX200608"
#define FBX_2006_11_COMPATIBLE		"FBX200611"
#define FBX_2009_00_COMPATIBLE		"FBX200900"
#define FBX_2009_00_V7_COMPATIBLE	"FBX200900v7"
#define FBX_2010_00_COMPATIBLE		"FBX201000"
#define FBX_2011_00_COMPATIBLE		"FBX201100"
#define FBX_2012_00_COMPATIBLE		"FBX201200"
#define FBX_2013_00_COMPATIBLE		"FBX201300"
#define FBX_2014_00_COMPATIBLE		"FBX201400"
#define FBX_2016_00_COMPATIBLE		"FBX201600"

//Default file version number used when writing new FBX files
#define FBX_DEFAULT_FILE_VERSION		FBX_FILE_VERSION_7500
#define FBX_DEFAULT_FILE_COMPATIBILITY	FBX_2016_00_COMPATIBLE

/** Convert the FBX file version string to an integral number for <= or >= tests purposes.
  * \param pFileVersion File version string.
  * Some examples:
  * \code
  *     int version;
  *         version = FileVersionStrToInt(FBX2012_00_COMPATIBLE);    // version = 201200
  *         version = FileVersionStrToInt(FBX60_COMPATIBLE);         // version = 6000
  *         version = FileVersionStrToInt("FBX200900");              // version = 200900
  *         version = FileVersionStrToInt("Toto");                   // version = 0
  *         version = FileVersionStrToInt("");                       // version = -1
  * \endcode
  * \returns the file version number or 0 if an unsupported string value is passed.
  */
FBXSDK_DLL int FbxFileVersionStrToInt(const char* pFileVersion);

/** \internal Used internally by readers to evaluate what is the current section */
enum
{
	FBX_NO_SECTION = -1,	//!< indicate not in a valid section
	FBX_MAIN_SECTION,		//!< indicate currently in the main section
	FBX_EXTENSION_SECTION_0	//!< indicate currently in the extention section 0
};

/** Render and resolution information.
* \nosubgrouping 
*/
class FBXSDK_DLL FbxIODefaultRenderResolution
{
public:
    /** If the resolution data is ready. */
    bool    mIsOK;
    /** camera name. */
    FbxString mCameraName;
    /** resolution mode. ex: "Fixed Resolution","Fixed Ratio","Fixed Width","Fixed Height","Window Size"*/
	FbxString mResolutionMode;
    /** resolution width. */
    double mResolutionW;
    /** resolution height. */
    double mResolutionH;

    /**
    * \name Constructors and Destructor
    */
    //@{
    //! Default constructor.
    FbxIODefaultRenderResolution();
    //@}

    /**
    * \name Member Access
    */
    //@{
    //! Reset values to default.
    void Reset();
    //@}
};

/** FBX header information used at beginning of the FBX file
* to get or set important values like the file format version number (mFileVersion).
* The file version number will be used to select a particular Reader or Writer.
* \nosubgrouping */
class FBXSDK_DLL FbxIOFileHeaderInfo
{
public:
    /**
    * \name Constructors and Destructor
    */
    //@{
    //! Default constructor.
    FbxIOFileHeaderInfo();

    //! Destructor.
    virtual ~FbxIOFileHeaderInfo();
    //@}

    /**
    * \name Public Member
    */
    //@{

	//! Reset values to default.
	virtual void				Reset();

    /** A derived class can override this function to read additional information from the file header.
    *   \return false in case of failure that should stop loading the file.
    */
    virtual bool				ReadExtendedHeaderInformation(FbxIO*);
    //@}

	//! FbxIODefaultRenderResolution to handle default resolution values
    FbxIODefaultRenderResolution    mDefaultRenderResolution;

	//!Read only properties (not used for file write)
	
	//@{
	/** File version ex; 5000, 6000, 6100, 7000, 7099, 7100 
	*   the major part is the first digit, the minor part, 3 other digits
	*   ex: 7100 means version 7.1
	*/
    int                         mFileVersion;

	/** Indicates whether a creation time stamp is preset */
    bool                        mCreationTimeStampPresent;

	/** Indicates whether the mCreationTimeStamp member variable contains the actual creation time of the file. */
    FbxLocalTime                  mCreationTimeStamp;

    /** Indicates who is the creator of the file
	*   Ex: "FBX SDK/FBX Plugins version 2011.2" 
	*/
    FbxString                     mCreator;				

	/** Indicates whether the file is created by a genuine Autodesk plug-in or not */
	bool						mIOPlugin;

	/** The flag indicates that the header was created by a personal learning edition (PLE) of FBX. */
    bool                        mPLE;
	//@}
};

/** FbxIO represents an FBX file. 
  * It is primarily used by FBX importers (FbxImporter) and exporter (FbxExporter) 
  * when reading or writing data from or to a disk or memory. 
  * Most users will not use the FbxIO class directly 
  * but will use an instance of either FbxImporter or FbxExporter 
  * to read or write FBX files.
  *
  * An FBX file may contain binary data or ASCII data.
  * A good way to learn the internal structure of a FBX file 
  * is to open a FBX file saved in ASCII in a text editor.
  *
  * Ex: to read a FBX file content using FbxIO class directly
  * \code
  * // Create a FbxIO object with FbxIO::Create()
  * // Open the file with ProjectOpen( ... ) a NULL pointer can be passed for (FbxReader)* param
  * // ProjectOpen_xxx_Section() to open a particular section
  * int nbSec = FieldGetCount(); // to get the number of fields of the current section opened
  *	for(int i=0; i < nbSec; i++) // read all fields
  *	{
  *		// check if the field is a block
  *		if(FieldReadIsBlock()){ } ... Read sub fields recursively ... may contain other blocks and fields
  *		else
  *		{
  *			FieldReadBegin();	// navigate on the field
  *			char fieldType = FieldReadGetType(); // get the data type
  *
  *			// According to the Field data type, call the appropriate read functions
  *
  *			     if(fieldType == 'S') FieldReadS(...) to read a string
  *			else if(fieldType == 'B') FieldReadB(...) to read a bool
  *			else if(fieldType == 'I') FieldReadI(...) to read a int
  *		    ... 
  *			FieldReadEnd(); // navigate to next field
  *		}
  *	}
  *
  * ProjectCloseSection() // close the section opened
  * // repeat for another section ...
  * // finally close the Project
  * ProjectClose(); // or delete the FbxIO object created.
  * \endcode
  */
class FBXSDK_DLL FbxIO
{
public:

    /** \internal Exception-safe way of setting/resetting the xref manager in a FbxIO object.
	*/
    struct FbxAutoResetXRefManager
    {
        FbxIO*                   mFbx;
        const FbxXRefManager*  mXRefManager;

		/** Default constructor */
        FbxAutoResetXRefManager(FbxIO* pFbx, FbxXRefManager& pXRefManager)
        : mFbx(pFbx)
        , mXRefManager(NULL)
        {
            if( mFbx )
            {
                mXRefManager = mFbx->ProjectGetXRefManager();
                mFbx->ProjectSetXRefManager(&pXRefManager);
            }
        }

		/** Destructor */
        ~FbxAutoResetXRefManager()
        {
            if( mFbx )
            {
                mFbx->ProjectSetXRefManager(mXRefManager);
            }
        }
    };

	enum BinaryType
	{
		BinaryNormal,	//<! Standard FBX file field alignment using 32bit values, used by all file format version 7.4.0 or lower
		BinaryLarge		//<! New FBX file field alignment using 64bit values, used by all file format version 7.5.0 or higher
	};

	/** Creation function for this FbxIO class
      * \param pStatus  The FbxStatus object to hold error codes.
	  * \return a new FbxIO object pointer
	  */
    static FbxIO* Create(BinaryType pBinaryType, FbxStatus& pStatus){ return FbxNew< FbxIO >(pBinaryType, pStatus); }

	/** Default constructor */
    FbxIO(BinaryType pBinaryType, FbxStatus& pStatus);

	/** Destructor */
    virtual ~FbxIO();

    /**
    * \name Project Global
	* The term "Project" here is an abstract name chosen to represent a group of data
	* ex: a file, a stream, a memory buffer, etc.
    */
    //@{

    /** Open a project already in Memory 
      * \param pAddress
      * \param pMaxLength
      * \param pReader
      * \param pCheckCRC
      * \param pOpenMainSection
      * \param pFileHeaderInfo
      * \return \c true on success, \c false otherwise.
      */
    bool ProjectOpen(void* pAddress, FbxULong pMaxLength, FbxReader* pReader, bool pCheckCRC = false, bool pOpenMainSection = true, FbxIOFileHeaderInfo* pFileHeaderInfo = NULL);

    /** Open a project. 
      * \param pName
      * \param pReader
      * \param pCheckCRC
      * \param pOpenMainSection
      * \param pFileHeaderInfo
      * \return \c true on success, \c false otherwise.
      */
    bool ProjectOpen(const char* pName, FbxReader* pReader, bool pCheckCRC = false, bool pOpenMainSection = true, FbxIOFileHeaderInfo* pFileHeaderInfo = NULL);

	/** Open a project. 
      * \param pStream
      * \param pStreamData
      * \param pReader
      * \param pCheckCRC
      * \param pOpenMainSection
      * \param pFileHeaderInfo
      * \return \c true on success, \c false otherwise.
      */
    bool ProjectOpen(FbxStream* pStream, void* pStreamData, FbxReader* pReader, bool pCheckCRC = false, bool pOpenMainSection = true, FbxIOFileHeaderInfo* pFileHeaderInfo = NULL);

    /** Open project file without necessarily an .fbx extension. 
      * \param pName
      * \param pReader
      * \param pCheckCRC
      * \param pOpenMainSection
      * \param pFileHeaderInfo
      * \return \c true on success, \c false otherwise.
      */
    bool ProjectOpenDirect(const char* pName, FbxReader* pReader, bool pCheckCRC = false, bool pOpenMainSection = true, FbxIOFileHeaderInfo* pFileHeaderInfo = NULL);

    /** Create a project in Memory 
      * \param pAddress
      * \param pSize
      * \param pWriter
      * \param pBinary
      * \param pEncrypted
      * \param pFileHeaderInfo
      * \return \c true on success, \c false otherwise.
      */
    bool ProjectCreate(void* pAddress, FbxUInt pSize, FbxWriter* pWriter, bool pBinary, bool pEncrypted, FbxIOFileHeaderInfo* pFileHeaderInfo = NULL);

    /** Create a project. 
      * \param pName
      * \param pWriter
      * \param pBinary
      * \param pEncrypted
      * \param pFileHeaderInfo
      * \return \c true on success, \c false otherwise.
      */
    bool ProjectCreate(const char* pName, FbxWriter* pWriter, bool pBinary, bool pEncrypted, FbxIOFileHeaderInfo* pFileHeaderInfo = NULL);

    /** Create a project. 
      * \param pStream
      * \param pStreamData
      * \param pWriter
      * \param pBinary
      * \param pEncrypted
      * \param pFileHeaderInfo
      * \return \c true on success, \c false otherwise.
      */
    bool ProjectCreate(FbxStream* pStream, void* pStreamData, FbxWriter* pWriter, bool pBinary, bool pEncrypted, FbxIOFileHeaderInfo* pFileHeaderInfo = NULL);

    /** Create a project without necessary an .fbx extension.
      * \param pName
      * \param pWriter
      * \param pBinary
      * \param pEncrypted
      * \param pFileHeaderInfo
      * \return \c true on success, \c false otherwise.
      */
    bool ProjectCreateDirect(const char* pName, FbxWriter* pWriter, bool pBinary, bool pEncrypted, FbxIOFileHeaderInfo* pFileHeaderInfo = NULL);

    /** Create a project, without writing out the header (yet)
      * \param pName
      * \param pWriter
      * \param pVersion
      * \param pBinary
      * \param pEncrypted
      * \return \c true on success, \c false otherwise.
      */
    bool ProjectCreateEmpty(const char* pName, FbxWriter* pWriter, int pVersion, bool pBinary, bool pEncrypted);

    /** Create a project, without writing out the header (yet)
      * \param pStream
      * \param pStreamData
      * \param pWriter
      * \param pVersion
      * \param pBinary
      * \param pEncrypted
      * \return \c true on success, \c false otherwise.
      */
    bool ProjectCreateEmpty(FbxStream* pStream, void* pStreamData, FbxWriter* pWriter, int pVersion, bool pBinary, bool pEncrypted);

    /** Write FBX signature at the top of the file, prepare file for writing header information 
      * \return \c true on success, \c false otherwise.
      */
    bool ProjectWrite_BeginFileHeader();

    /** Open up the 'extended header' 
      * \return \c true on success, \c false otherwise.
      */
    bool ProjectWrite_BeginExtendedHeader();

    /** Write the contents of the extended header 
      * \param pExtendedHeader
      * \return \c true on success, \c false otherwise.
      */
    bool ProjectWrite_WriteExtendedHeader(const FbxIOFileHeaderInfo* pExtendedHeader);

    /** Close the extended header 
      * \return \c true on success, \c false otherwise.
      */
    bool ProjectWrite_EndExtendedHeader();

    /** Close up the header, prepare file for payload write. 
      * \return \c true on success, \c false otherwise.
      */
    bool ProjectWrite_EndFileHeader();

    /** Close the project. 
      * \param pData
      * \param pSize
      * \return \c true on success, \c false otherwise.
      */
    bool ProjectClose(void** pData=0, size_t* pSize=0);

    /** Provide the XRef Manager to use to create the .fbm folder. 
     * \remarks If NULL is used, the old behavior (using the .fbx's folder) is used instead. 
     */
    void ProjectSetXRefManager(const FbxXRefManager*);

    /** Get the XRef Manager to use. 
     * \return NULL if no XRef manager has been set. 
     */
    const FbxXRefManager* ProjectGetXRefManager() const;

    /** Select (and create) a folder to store embedded files (the .fbm 
      *   file folder).  Takes into account the settings from the XRef Manager. 
      * \param pXRefManager
      * \param pCreatedFolder
      * \param pUserDefinedFolder User defined "working folder"
      * \return \c true on success, \c false otherwise.
      * \remarks If this already been called successfully, uses the path
      * previously created.
      *  
      * Client application is responsible for cleaning up this folder.
      *  
      * This will be automatically called if ProjectSetXRefManager()
      * has been called before the .fbm folder needs to be created. 
      */
    bool ProjectCreateEmbeddedFolder(const FbxXRefManager& pXRefManager, FbxString& pCreatedFolder, const char* pUserDefinedFolder = NULL); 

    /** On store event, use this function to tell if we are embedding. 
      * \param pValue
      */
    void SetEmbedded(bool pValue);

    /** Explicitly set the embedding extraction folder. If this is never called, the FBX SDK will determine the best folder to extract embedded files.
      * \param pExtractionFolder The file path name where the embedded files should be extracted.
      */
    void SetEmbeddingExtractionFolder(const char* pExtractionFolder);

    /** Retrieve the current folder destination where the embedded files will be extracted. This might not be initialized until file I/O is performed.
      */
    const char* GetEmbeddingExtractionFolder();

    /** Check if file is embedded or not. 
      * \return \c true if file is embedded, false otherwise.
      */
    bool IsEmbedded() const;

    /** Check if file is binary or ASCII 
      * \return \c true if file is binary, false otherwise.
      */
    bool IsBinary() const;

    /** Return if binary file is encrypted 
      * \return \c true if file is encrypted, false otherwise.
      */
    bool IsEncrypted () const;

    /** Check CRC code. File must be open, binary and encrypted.
    *   \return \c true if CRC code is valid or file is not open, binary and encrypted.
    */
    bool CheckCRC();

    /** Return the file version number 
      * \return the file version number
      */
    FbxUInt32 GetFileVersionNumber() const; 

    /** Set the cache size for accelerated IO 
    * \param pCacheSize cache size to set (Kilo Byte)
    */
    void CacheSize(FbxUInt32 pCacheSize);

    /** Return the current cache size
      * \return the current cache size
      */
    FbxUInt32 CacheSize() const; 

    //@}

    /**
      * \name FBX 7 Format specific functions.

	   The FBX 7 format can compress internal arrays to make the file smaller.
       The writer may decide not to compress all arrays, or it may even decide
       not to compress anyway.  Flags are written in the file to help the FBX7 reader
       to know if a decompression is required, on a per-array basis.
	   The following functions address specific topics of the FBX 7 file format.
      */
    //@{

    //! \return Current state of the flag.
    bool Fbx7Support() const;

    /** Set the flag state to tell the parser to handle FBX7 files.
      * \param pSupport New flag state.
      */
    void Fbx7Support(bool pSupport);

    //! \return Current State of the flag.
    bool CompressArrays() const;

    /** Set the flag state. 
      * \param pCompress New flag state.
      */
    void CompressArrays(bool pCompress);

    //! \return Current compression minimum size.
    int  CompressMinimumSize() const;

    /** Set the compression minimum size.
      * \param pSize Threshold at which compression may embark.
      */
    void CompressMinimumSize(int pSize);

    //! \return Current compression level.
    int  CompressLevel() const;

    /** Set the compression level.
      * \param pLevel Value of the desired compression.
      * \remarks The allowed range for pLevel is [0-9] where 0 equals no compression and
      * 9 is as-much-as-we-can.
      */
    void CompressLevel(int pLevel);
    //@}

    /**
    * \name Project related functions used to navigate on particular
	*       sections.
    */
    //@{

    /** Open the main section of a project. 
      * \return \c true on success, \c false otherwise.
      */
    bool ProjectOpenMainSection();

    /** Get the number of extension sections of a project.
      * \return the number of extension sections of a project.
      */
    int ProjectGetExtensionSectionCount() const;

    /** Open an extension section of a project. 
      * \param pExtensionSectionIndex
      * \return \c true on success, \c false otherwise.
      */
    bool ProjectOpenExtensionSection(int pExtensionSectionIndex);

    /** Create an extension section in a project, not allowed in ASCII and encrypted modes.
      * \param pOverwriteLastExtensionSection
      * \return \c true on success, \c false otherwise.
      */
    bool ProjectCreateExtensionSection(bool pOverwriteLastExtensionSection = false);

    /** Close current section. 
      */
    void ProjectCloseSection();

    /** Get current section. 
      * \return the current section.
      */
    int ProjectGetCurrentSection() const;

    /** Get current section mode. 
      * \return the current section mode. 
      */
    int ProjectGetCurrentSectionMode() const;

    /** Get current section version. 
      * \return the current section version. 
      */
    int ProjectGetCurrentSectionVersion() const;

    /** Get the version number of a section.
    * \param pSection
    * \return the version number of a section.
    * \remarks For main section it can be either 1000, 2000, 2001, 3000, 3001, 4000, 4001 or 4050.
    *  For the extension section it can be either 4000, 4001 or 4050.
    *  Returns 0 if section number does not exist.
    */
    int ProjectGetSectionVersion(int pSection) const;

    /** Split a version number into major, minor and revision numbers.
    * \param pVersion Version number to split.
    * \param pMajor Integer to receive major version number.
    * \param pMinor Integer to receive minor version number.
    * \param pRevision Integer to receive revision version number.
    */
    static void ProjectConvertVersionNumber(int pVersion, int& pMajor, int& pMinor, int& pRevision);

    /** Check the password protection flag.
    * \return \c true if the current section has a password, \c false otherwise.
    */
    bool IsPasswordProtected() const;

    /** Set password protection flag to \c false if the argument matches the password stored in the section.
    * \param pPassword
    * \return \c true if the argument matches the password stored in the section, \c false otherwise.
    * \remarks This function only works in read mode.
    */
    bool CheckPassword(const char* pPassword);

    /** Encrypt and store password in a section.
    * \param pPassword
    * \return \c true on success, \c false otherwise.
    * \remarks This function only works in write mode and out of any enclosing block.
    * \remarks This function must not be called more than once per section.
    */
    bool WritePassword(const char* pPassword);

    //@}

    /**
    * \name Directory related functions used to get or set file path information.
    */
    //@{

    /** Get project file name. 
      * \return project file name.
      */
    const char* GetFilename() const;

    /** Get project data directory name. 
      * \param pAutoCreate
      * \return project data directory name.
      */
    FbxString GetDataDirectory(bool pAutoCreate = true);

    /** Get the current embedded folder used by this object.  
      * \param pCreate  Whether create the media or not if no such folder is found
      * \param pUserDefinedFolder   User define working folder
      * \return the current embedded folder used by this object.
      * \remarks If ProjectCreateEmbeddedFolder has never been called this will
      *  return an empty string, unless we're explicitly asked to
      *  create it.
      */
    FbxString GetMediaDirectory(bool pCreate = false, const char* pUserDefinedFolder = NULL);

    /** Get the full path of the directory to extract the template file. 
      * \param pTemplateName
      * \param pCreate
      * \return the full path of the directory to extract the template file.
      */
    FbxString GetContainerTemplateDirectory(const char* pTemplateName, bool pCreate);

    /** Get the path relative to project directory. 
      * \param pPath
      * \return the path relative to project directory.
      */
    char* GetRelativePath(const char* pPath);

    /** Get the file path relative to project directory. 
      * \param pFilePath
      * \return the file path relative to project directory.
      */
    char* GetRelativeFilePath(const char* pFilePath);

    /** Get the full path of path relative to project directory. 
      * \param pRelativePath
      * \return the full path of path relative to project directory.
      */
    char* GetFullPath(const char* pRelativePath);

    /** Get the full file path of path relative to project directory. 
      * \param pRelativeFilePath
      * \return the full file path of path relative to project directory.
      */
    char* GetFullFilePath(const char* pRelativeFilePath);

    /** Get the temporary project name. 
      * \param pName
      * \return the temporary project name.
      */
    char* GetTmpProjectName(const char* pName) const;

    /** Swap from temporary project. 
      * \param pName
      * \param pError
      * \param pErrorSize 
      * \return \c true on success, \c false otherwise.
      */
    bool SwapFromTmpProject(const char* pName, char* pError=NULL, int pErrorSize=0);

    //@}

    /**
    * \name Read related functions used to get information of a field or a group of fields.
	*       Can be used to get the field content data or to navigate from field to field.
    */
    //@{

    /** Reset the field read position. 
      */
    void FieldReadResetPosition();

    /** Get the number of fields. 
      * \return the number of fields.
      */
    int FieldGetCount() const;

    /** Get the name of field indexed pFieldIndex. 
      * \param pFieldIndex
      * \return the name of field indexed pFieldIndex.
      */
    const char* FieldGetName(int pFieldIndex) const;

    /** Get number of instance field pFieldName has. 
      * \param pFieldName
      * \return the number of instance field pFieldName has.
      */
    int FieldGetInstanceCount(const char* pFieldName) const;

    /** Start to read field instance referred by field indexed pFieldIndex, instance indexed pInstance. 
      * \param pFieldIndex
      * \param pInstance
      * \return \c true on success, \c false otherwise.
      */
    bool FieldReadBegin(int pFieldIndex, int pInstance);

    /** Start to read field pFieldName. 
      * \param pFieldName
      * \return \c true on success, \c false otherwise.
      */
    bool FieldReadBegin(const char* pFieldName);

    /** Start to read field instance referred field pFieldName, instance indexed pInstance. 
      * \param pFieldName
      * \param pInstance
      * \return \c true on success, \c false otherwise.
      */
    bool FieldReadBegin(const char* pFieldName, int pInstance);

    //! Stop to read the current field.
    void FieldReadEnd();

    //! Return if current field is a block.
    bool FieldReadIsBlock();

    //! Start to read a field block.
    bool FieldReadBlockBegin();

    //! Stop to read a field block.
    void FieldReadBlockEnd();

    //! Return the number of read field.
    int FieldReadGetCount() const;

    //! Return the number of field remaining to be read.
    int FieldReadGetRemain() const;

    //! Return current field value type.
    char FieldReadGetType() const;

    //! Return current field value as a char.
    char FieldReadCH();

    /** Return field pFieldName's value as a char. 
      * \param pFieldName
      * \param pDefault
      */
    char FieldReadCH(const char* pFieldName, char pDefault=0);

    //! Return current field value as a char pointer.
    const char* FieldReadC();

    /** Return field pFieldName's value as a char pointer. 
      * \param pFieldName
      * \param pDefault
      */
    const char* FieldReadC(const char* pFieldName, const char* pDefault="");

    //! Return current field value as a string (a char pointer).
    const char* FieldReadS();

    /** Return field pFieldName's value as a char pointer. 
      * \param pFieldName
      * \param pDefault
      */
    const char* FieldReadS(const char* pFieldName, const char* pDefault="");

    //! Return current field value as an bool.
    bool FieldReadB();

    /** Return field pFieldName's value as an integer. 
      * \param pFieldName
      * \param pDefault
      */
    bool FieldReadB(const char* pFieldName, bool pDefault = false);

    //! Return current field value as an integer.
    int FieldReadI();

    /** Return field pFieldName's value as an integer. 
      * \param pFieldName
      * \param pDefault
      */int FieldReadI(const char* pFieldName, int pDefault=0);

    //! Return current field value as an integer.
    FbxLongLong FieldReadLL();

    /** Return field pFieldName's value as an integer. 
      * \param pFieldName
      * \param pDefault
      */
    FbxLongLong FieldReadLL(const char* pFieldName, FbxLongLong pDefault=0);

    //! Return current field value as a float.
    float FieldReadF();

    /** Return field pFieldName's value as a float. 
      * \param pFieldName
      * \param pDefault
      */
    float FieldReadF(const char* pFieldName, float pDefault=0);

    //! Return current field value as a double.
    double FieldReadD();

    /** Return field pFieldName's value as a double. 
      * \param pFieldName
      * \param pDefault
      */
    double FieldReadD(const char* pFieldName, double pDefault=0);

    /** Return field pFieldName's value as a time value. 
      * \param pFieldName
      */
    FbxTime FieldReadT(const char* pFieldName);

    //! Return field pFieldName's value as a time value.
    FbxTime FieldReadT();

    /** Return field pFieldName's value as a timespan value. 
      * \param pFieldName
      */
    FbxTimeSpan FieldReadTS(const char* pFieldName);

    //! Return field pFieldName's value as a timespan value.
    FbxTimeSpan FieldReadTS();

    /** Return current field value as a n floats array. 
      * \param pValue
      * \param pn
      */
    void FieldReadFn(float* pValue, FbxUInt pn);

    /** Return current field value as a 3 floats array. 
      * \param pValue
      */
    void FieldRead3F(float* pValue);

    /** Return current field value as a 4 floats array. 
      * \param pValue
      */
    void FieldRead4F(float* pValue);

    /** Return field pFieldName's value as n floats array. 
      * \param pFieldName
      * \param pValue
      * \param pDefault
      * \param pn
      */
    void FieldReadFn(const char* pFieldName, float* pValue, const float *pDefault, FbxUInt pn);

    /** Return field pFieldName's value as 4 floats array. 
      * \param pFieldName
      * \param pValue
      * \param pDefault
      */
    void FieldRead3F(const char* pFieldName, float* pValue, const float* pDefault=NULL);

    /** Return field pFieldName's value as 3 floats array. 
      * \param pFieldName
      * \param pValue
      * \param pDefault
      */
    void FieldRead4F(const char* pFieldName, float* pValue, const float* pDefault=NULL);

    /** Return current field value as a n doubles array. 
      * \param pValue
      * \param pn
      */
    void FieldReadDn(double* pValue, FbxUInt pn);

    /** Return current field value as a 3 doubles array. 
      * \param pValue
      */
    void FieldRead3D(double* pValue);

    /** Return current field value as a 4 doubles array. 
      * \param pValue
      */
    void FieldRead4D(double* pValue);

    /** Return field pFieldName's value as n doubles array. 
      * \param pFieldName
      * \param pValue
      * \param pDefault
      * \param pn
      */
    void FieldReadDn(const char* pFieldName, double* pValue, const double *pDefault, FbxUInt pn);

    /** Return field pFieldName's value as 4 doubles array. 
      * \param pFieldName
      * \param pValue
      * \param pDefault
      */
    void FieldRead3D(const char* pFieldName, double* pValue, const double* pDefault=NULL);

    /** Return field pFieldName's value as 3 doubles array. 
      * \param pFieldName
      * \param pValue
      * \param pDefault
      */
    void FieldRead4D(const char* pFieldName, double* pValue, const double* pDefault=NULL);

    /** Return current field value as raw data. 
      * \param pByteSize
      */
    void* FieldReadR(int* pByteSize);

    /** Return field pFieldName's value as raw data. 
      * \param pFieldName
      * \param pByteSize
      */
    void* FieldReadR(const char* pFieldName,int* pByteSize);

	/**
	  * \name FBX SDK 2009.3 and later
	  */
	//@{
    //! Return field pFieldName's value as byte.
    FbxChar FieldReadByte();

    /** Return field pFieldName's value as a byte value. 
      * \param pFieldName
      * \param pDefault
      */
    FbxChar FieldReadByte(const char* pFieldName, FbxChar pDefault=0);

    //! Return field pFieldName's value as unsigned byte.
    FbxUChar FieldReadUByte();

    /** Return field pFieldName's value as an unsigned byte value. 
      * \param pFieldName
      * \param pDefault
      */
    FbxUChar FieldReadUByte(const char* pFieldName, FbxUChar pDefault=0);

    //! Return field pFieldName's value as short.
    FbxShort FieldReadShort();

    /** Return field pFieldName's value as a short value. 
      * \param pFieldName
      * \param pDefault
      */
    FbxShort FieldReadShort(const char* pFieldName, FbxShort pDefault=0);

    //! Return field pFieldName's value as unsigned short.
    FbxUShort FieldReadUShort();

    /** Return field pFieldName's value as an unsigned short value. 
      * \param pFieldName
      * \param pDefault
      */
    FbxUShort FieldReadUShort(const char* pFieldName, FbxUShort pDefault=0);

	//! Return field pFieldName's value as unsigned integer.
    unsigned int FieldReadUI();
	
    /** Return field pFieldName's value as an unsigned int as a value. 
      * \param pFieldName
      * \param pDefault
      */
    unsigned int FieldReadUI(const char* pFieldName, unsigned int pDefault=0);

    //! Return field pFieldName's value as 64 bit unsigned integer.
    FbxULongLong FieldReadULL();

    /** Return field pFieldName's value as an 64 bit unsigned int as a value. 
      * \param pFieldName
      * \param pDefault
      */
    FbxULongLong FieldReadULL(const char* pFieldName, FbxULongLong pDefault=0);

    /** Read the whole array and return the pointer to it.
      * \param pCount Nb of items in the array.
      */
	const FbxChar*		FieldReadArraySBytes( int &pCount );
    /** Read the whole array and return the pointer to it.
      * \param pCount Nb of items in the array.
      */
	const FbxShort*		FieldReadArrayShort	( int &pCount );
    /** Read the whole array and return the pointer to it.
      * \param pCount Nb of items in the array.
      */
	const FbxUShort*		FieldReadArrayUShort( int &pCount );
    /** Read the whole array and return the pointer to it.
      * \param pCount Nb of items in the array.
      */
	const unsigned int*	FieldReadArrayUI	( int &pCount );
    /** Read the whole array and return the pointer to it.
      * \param pCount Nb of items in the array.
      */
	const FbxULongLong*	FieldReadArrayULL	( int &pCount );

    /** Read the whole array and return the pointer to it.
      * \param pCount Nb of items in the array.
      */
	const FbxChar*        FieldReadArray(int &pCount, const FbxChar*);
    /** Read the whole array and return the pointer to it.
      * \param pCount Nb of items in the array.
      */
    /** Read the whole array and return the pointer to it.
      * \param pCount Nb of items in the array.
      */
	const FbxShort*		FieldReadArray(int &pCount, const FbxShort*);
    /** Read the whole array and return the pointer to it.
      * \param pCount Nb of items in the array.
      */
	const FbxUShort*		FieldReadArray(int &pCount, const FbxUShort*);
    /** Read the whole array and return the pointer to it.
      * \param pCount Nb of items in the array.
      */
	const unsigned int* FieldReadArray(int &pCount, const unsigned int*);
    /** Read the whole array and return the pointer to it.
      * \param pCount Nb of items in the array.
      */
	const FbxULongLong*	FieldReadArray(int &pCount, const FbxULongLong*);
	//@}

    /** Read field and copy it into a file.
    * \param pFileName Embedded file full path+name.
    *\param pRelativeFileName Relative path+name of the embedded file.
    * \param pEmbeddedMediaDirectory Directory of the embedded media.
    * \param pIsFileCreated Status of the extraction of the embedded data. Set to \c true if the embedded media is correctly extracted in the media directory.
    * \remarks Only works when file is binary. This function is not related to flag mEmbedded.
    * \return \c false if operation failed.
    */
    virtual bool FieldReadEmbeddedFile (FbxString& pFileName, FbxString& pRelativeFileName, const char* pEmbeddedMediaDirectory = "", bool *pIsFileCreated=NULL);

    /** Read the whole array and return the pointer to it.
      * \param pCount Nb of items in the array.
      */
    const double*   FieldReadArrayD( int &pCount );
    /** Read the whole array and return the pointer to it.
      * \param pCount Nb of items in the array.
      */
    const float*    FieldReadArrayF( int &pCount );
    /** Read the whole array and return the pointer to it.
      * \param pCount Nb of items in the array.
      */
    const int*      FieldReadArrayI( int &pCount );
    /** Read the whole array and return the pointer to it.
      * \param pCount Nb of items in the array.
      */
    const FbxLongLong*FieldReadArrayLL(int &pCount );
    /** Read the whole array and return the pointer to it.
      * \param pCount Nb of items in the array.
      */
    const bool*     FieldReadArrayB( int &pCount );
    /** Read the whole array and return the pointer to it.
      * \param pCount Nb of items in the array.
      */
    const FbxUChar*   FieldReadArrayBytes( int &pCount );

    /** Read the whole array and return the pointer to it.
      * \param pCount Nb of items in the array.
      */
    const int*    FieldReadArray(int& pCount, const int*);
    /** Read the whole array and return the pointer to it.
      * \param pCount Nb of items in the array.
      */
    const float*  FieldReadArray(int& pCount, const float*);
    /** Read the whole array and return the pointer to it.
      * \param pCount Nb of items in the array.
      */
    const double* FieldReadArray(int& pCount, const double*);
    /** Read the whole array and return the pointer to it.
      * \param pCount Nb of items in the array.
      */
    const FbxLongLong* FieldReadArray(int& pCount, const FbxLongLong*);
    /** Read the whole array and return the pointer to it.
      * \param pCount Nb of items in the array.
      */
    const bool* FieldReadArray(int& pCount, const bool*);
    /** Read the whole array and return the pointer to it.
      * \param pCount Nb of items in the array.
      */
    const FbxUChar* FieldReadArray(int& pCount, const FbxUChar*);

    //@}

    /**
    * \name Write related functions used to write information of a field or a group of fields.
	*       Can be used to write the field content data or to navigate from field to field.
    */
    //@{

    /** Start to write a field called pFieldName. 
      * \param pFieldName
      */
    void FieldWriteBegin(const char* pFieldName);

    //! Stop to write the current field.
    void FieldWriteEnd();

    //! Start to write a field block.
    void FieldWriteBlockBegin();

    /** Start to write an object reference field. 
      * \param pObjectType
      * \param pName
      * \param pSubType
      */
    void FieldWriteObjectBegin(const char* pObjectType, const char* pName, const char* pSubType=NULL);

    //! Stop to write an object reference field.
    void FieldWriteObjectEnd();

    /** Start to write a field block in file pFileName. 
      * \param pFileName
      * \remarks This function is disabled but kept accessible for the FBX SDK.
      */
    void FieldWriteBlockBegin(const char* pFileName);

    //! Stop to write a block of field.
    void FieldWriteBlockEnd ();

    /** Write field value as a char. 
      * \param pValue
      */
    void FieldWriteCH(char pValue);

    /** Write field pFieldName field with a char as a value. 
      * \param pFieldName
      * \param pValue
      */
    void FieldWriteCH(const char* pFieldName, char pValue);

    /** Write field value as char pointer pValue. 
      * \param pValue
      */
    void FieldWriteC(const char* pValue);

    /** Write field pFieldName with a char pointer as a value. 
      * \param pFieldName
      * \param pValue
      */
    void FieldWriteC(const char* pFieldName, const char* pValue);

    /** Write field value as FbxString pValue. 
      * \param pValue
      */
    void FieldWriteS(const char* pValue);

    /** Write field value as FbxString pValue. 
      * \param pValue
      */
    void FieldWriteS(const FbxString& pValue);

    /** Write field pFieldName field with a FbxString as a value. 
      * \param pFieldName
      * \param pValue
      */
    void FieldWriteS(const char* pFieldName, const char* pValue);

    /** Write field pFieldName field with a FbxString as a value. 
      * \param pFieldName
      * \param pValue
      */
    void FieldWriteS(const char* pFieldName, const FbxString& pValue);

    /** Write field value as bool. 
      * \param pValue
      */
    void FieldWriteB(bool pValue);

    /** Write field pFieldName field with a bool value. 
      * \param pFieldName
      * \param pValue
      */
    void FieldWriteB(const char* pFieldName, bool pValue);

    /** Write field value as integer. 
      * \param pValue
      */
    void FieldWriteI(int pValue);

    /** Write field pFieldName field with an int as a value. 
      * \param pFieldName
      * \param pValue
      */
    void FieldWriteI(const char* pFieldName, int pValue);

    /** Write field value as 64 bit integer. 
      * \param pValue
      */
    void FieldWriteLL(FbxLongLong pValue);

    /** Write field pFieldName field with an 64 bit int as a value.
                     * \param pFieldName 
                     * \param pValue
                     */
    void FieldWriteLL(const char* pFieldName, FbxLongLong pValue);

    /** Write field value as float.
    * \param pValue
    * \remarks Only compatible with 1) MotionBuilder 4.0 and later 2) FBX SDK 3.6.1 and later.
    */
    void FieldWriteF(float pValue);

    /** Write field pFieldName field with a float as a value.
    * \param pFieldName
    * \param pValue
    * \remarks Only compatible with 1) MotionBuilder 4.0 and later 2) FBX SDK 3.6.1 and later.
    */
    void FieldWriteF(const char* pFieldName, float pValue);

    /** Write field value as double. 
      * \param pValue
      */
    void FieldWriteD(double  pValue);

    /** Write field pFieldName field with a double as a value. 
      * \param pFieldName
      * \param pValue
      */
    void FieldWriteD(const char* pFieldName, double pValue);

    /** Write field value as time value. 
      * \param pTime
      */
    void FieldWriteT(FbxTime pTime);

    /** Write field pFieldName field with a time as a value. 
      * \param pFieldName
      * \param pValue
      */
    void FieldWriteT(const char* pFieldName,FbxTime pValue);

    /** Write field value as timespan value. 
      * \param pTimeSpan
      */
    void FieldWriteTS(FbxTimeSpan pTimeSpan);

    /** Write field pFieldName field with a timespan as a value. 
      * \param pFieldName
      * \param pValue
      */
    void FieldWriteTS(const char* pFieldName,FbxTimeSpan pValue);

    /** Write field value as an array of n floats (nF vector). 
      * \param pValue
      * \param pn
      */
    void FieldWriteFn(const float* pValue, FbxUInt pn);

    /** Write field pFieldName field with a array of n floats as a value. 
      * \param pFieldName
      * \param pValue
      * \param pn
      */
    void FieldWriteFn(const char* pFieldName, const float* pValue, FbxUInt pn);

    /** Write field value as an array of 3 floats (3F vector). 
      * \param pValue
      */
    void FieldWrite3F(const float* pValue);

    /** Write field pFieldName field with a array of 3 floats as a value. 
      * \param pFieldName
      * \param pValue
      */
    void FieldWrite3F(const char* pFieldName, const float* pValue);

    /** Write field value as an array of 4 floats (4F vector). 
      * \param pValue
      */
    void FieldWrite4F(const float* pValue);

    /** Write field pFieldName field with a array of 4 floats as a value. 
      * \param pFieldName
      * \param pValue
      */
    void FieldWrite4F(const char* pFieldName, const float* pValue);

    /** Write field value as an array of n doubles (nD vector). 
      * \param pValue
      * \param pn
      */
    void FieldWriteDn(const double* pValue, FbxUInt pn);

    /** Write field pFieldName field with a array of n doubles as a value. 
      * \param pFieldName
      * \param pValue
      * \param pn
      */
    void FieldWriteDn(const char* pFieldName, const double* pValue, FbxUInt pn);

    /** Write field value as an array of 3 doubles (3D vector). 
      * \param pValue
      */
    void FieldWrite3D(const double* pValue);

    /** Write field pFieldName field with a array of 3 doubles as a value. 
      * \param pFieldName
      * \param pValue
      */
    void FieldWrite3D(const char* pFieldName, const double* pValue);

    /** Write field value as an array of 4 doubles (4D vector). 
      * \param pValue
      */
    void FieldWrite4D(const double* pValue);

    /** Write field pFieldName field with a array of 4 doubles as a value. 
      * \param pFieldName
      * \param pValue
      */
    void FieldWrite4D(const char* pFieldName, const double* pValue);

    // The maximum number of value entries is, in theory, 2**32.  In practice it should be a lot less than that.
    // pSize is the number of values to write from each pointer location, and stride is how much we 
    // advance to get to the next value; if the stride is zero, values are tighly packed together.
    // So in total we'll write n * pSize items.

    /** Write array to file.
      * \param n Nb of items in the array.
      * \param pValue Pointer to the data.
      * \param pSize Size of each item in the array.
      * \param pStride Array stride.
      */
    void FieldWriteArrayD( int n, const double*     pValue, int pSize = 1, int pStride = 0 );
    /** Write array to file.
      * \param n Nb of items in the array.
      * \param pValue Pointer to the data.
      * \param pSize Size of each item in the array.
      * \param pStride Array stride.
      */
    void FieldWriteArrayF( int n, const float*      pValue, int pSize = 1, int pStride = 0 );
    /** Write array to file.
      * \param n Nb of items in the array.
      * \param pValue Pointer to the data.
      * \param pSize Size of each item in the array.
      * \param pStride Array stride.
      */
    void FieldWriteArrayI( int n, const int*        pValue, int pSize = 1, int pStride = 0 );
    /** Write array to file.
      * \param n Nb of items in the array.
      * \param pValue Pointer to the data.
      * \param pSize Size of each item in the array.
      * \param pStride Array stride.
      */
    void FieldWriteArrayLL(int n, const FbxLongLong*  pValue, int pSize = 1, int pStride = 0 );
    /** Write array to file.
      * \param n Nb of items in the array.
      * \param pValue Pointer to the data.
      * \param pSize Size of each item in the array.
      * \param pStride Array stride.
      */
    void FieldWriteArrayB( int n, const bool*       pValue, int pSize = 1, int pStride = 0 );
    /** Write array to file.
      * \param n Nb of items in the array.
      * \param pValue Pointer to the data.
      * \param pSize Size of each item in the array.
      * \param pStride Array stride.
      */
    void FieldWriteArrayBytes( int n, const FbxUChar* pValue, int pSize = 1, int pStride = 0 );

    /** Write field value as a raw data. 
      * \param pRawData
      * \param pByteSize
      */
    void FieldWriteR(const void* pRawData, int pByteSize);

    /** Write field pFieldName field with raw data as a value. 
      * \param pFieldName
      * \param pRawData
      * \param pByteSize
      */
    void FieldWriteR(const char* pFieldName, const void* pRawData, int pByteSize);

	/**
	  * \name FBX SDK 2009.3 and later
	  */
	//@{

    /** Write field value as byte. 
      * \param pValue
      */
    void FieldWriteByte(FbxChar pValue);

    /** Write field pFieldName field with a byte value. 
      * \param pFieldName
      * \param pValue
      */
    void FieldWriteByte(const char* pFieldName, FbxChar pValue);

    /** Write field value as unsigned byte. 
      * \param pValue
      */
    void FieldWriteUByte(FbxUChar pValue);

    /** Write field pFieldName field with an unsigned byte value. 
      * \param pFieldName
      * \param pValue
      */
    void FieldWriteUByte(const char* pFieldName, FbxUChar pValue);

    /** Write field value as short. 
      * \param pValue
      */
    void FieldWriteShort(FbxShort pValue);

    /** Write field pFieldName field with a short value. 
      * \param pFieldName
      * \param pValue
      */
    void FieldWriteShort(const char* pFieldName, FbxShort pValue);

    /** Write field value as unsigned short. 
      * \param pValue
      */
    void FieldWriteUShort(FbxUShort pValue);

    /** Write field pFieldName field with an unsigned short value. 
      * \param pFieldName
      * \param pValue
      */
    void FieldWriteUShort(const char* pFieldName, FbxUShort pValue);

    /** Write field value as an unsigned integer. 
      * \param pValue
      */
    void FieldWriteUI(unsigned int pValue);

    /** Write field pFieldName field with an unsigned int as a value. 
      * \param pFieldName
      * \param pValue
      */
    void FieldWriteUI(const char* pFieldName, unsigned int pValue);

    /** Write field value as 64 bit unsigned integer. 
      * \param pValue
      */
    void FieldWriteULL(FbxULongLong pValue);

    /** Write field pFieldName field with an 64 bit unsigned int as a value. 
      * \param pFieldName
      * \param pValue
      * \return void
      */
    void FieldWriteULL(const char* pFieldName, FbxULongLong pValue);

    /** Write array to file.
      * \param n Nb of items in the array.
      * \param pValue Pointer to the data.
      * \param pSize Size of each item in the array.
      * \param pStride Array stride.
      */
	void FieldWriteArraySBytes( int n, const FbxChar* pValue, int pSize = 1, int pStride = 0 );
    /** Write array to file.
      * \param n Nb of items in the array.
      * \param pValue Pointer to the data.
      * \param pSize Size of each item in the array.
      * \param pStride Array stride.
      */
	void FieldWriteArrayShort( int n, const FbxShort* pValue, int pSize = 1, int pStride = 0 );
    /** Write array to file.
      * \param n Nb of items in the array.
      * \param pValue Pointer to the data.
      * \param pSize Size of each item in the array.
      * \param pStride Array stride.
      */
	void FieldWriteArrayUShort( int n, const FbxUShort* pValue, int pSize = 1, int pStride = 0 );
    /** Write array to file.
      * \param n Nb of items in the array.
      * \param pValue Pointer to the data.
      * \param pSize Size of each item in the array.
      * \param pStride Array stride.
      */
    void FieldWriteArrayUI( int n, const unsigned int*        pValue, int pSize = 1, int pStride = 0 );
    /** Write array to file.
      * \param n Nb of items in the array.
      * \param pValue Pointer to the data.
      * \param pSize Size of each item in the array.
      * \param pStride Array stride.
      */
    void FieldWriteArrayULL(int n, const FbxULongLong*  pValue, int pSize = 1, int pStride = 0 );
	//@}

    /** ASCII files may limit how big you can write your raw data, forcing you to break it down into chunks. 
      * \return int
      */
    int GetFieldRMaxChunkSize() const;

    /** Write object reference pName in the current field. 
      * \param pName
      */
    void FieldWriteObjectReference(const char* pName);

    /** Write object reference pName in field pFieldName. 
      * \param pFieldName
      * \param pName
      */
    void FieldWriteObjectReference(const char* pFieldName, const char* pName);

    /** Write field with file content as a value.
    * \param pFileName
    * \param pRelativeFileName
    * \remarks Only works when file is binary. This function is not related to flag mEmbedded.
    * \return \c false if operation failed.
    */
    bool FieldWriteEmbeddedFile (FbxString pFileName, FbxString pRelativeFileName);

    /** Write comments, only effective in ASCII mode. 
      * \param pFieldName
      */
    void WriteComments(const char* pFieldName);

    //@}

#ifdef _DEBUG
    // Dump function for debugging purpose only
    void StdoutDump();
#endif

	/** Get if the embedded file is currently loaded
	* \return true if loaded, false otherwise
	* \remarks  An embedded file is a file like a JPEG image used for texture or an AVI file for video.
	*           When files are embedded, the size of the FBX file can be very large since other files are embedded in it.
	*           FBX Version 6 and lower cannot embed files when saved in ASCII.
	*			FBX Version 7 and over can embed files even when saved in ASCII mode.
	*/
    bool GetHaveLoadedEmbededFile() const;

	/** Get the maximum byte count written
	* \param pMemPtr The address of the memory file
	* \param[out] pSize Stores the maximum byte count written
	*/
    void GetMemoryFileInfo(void** pMemPtr, size_t& pSize) const;

	/** Get a internal flag to manage pre FBX version 6 data format
	*   Used for backwards compatibility
	*/
    bool    IsBeforeVersion6() const;

	/** Set a internal flag to manage pre FBX version 6 data format
	*   Used for backwards compatibility
	*/
    void    SetIsBeforeVersion6(bool pIsBeforeVersion6);

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
    bool ProjectOpen (FbxFile * pFile, FbxReader* pReader, bool pCheckCRC = false, bool pOpenMainSection = true, FbxIOFileHeaderInfo* pFileHeaderInfo = NULL);

private:
    // to resolve warning C4512: 'class' : assignment operator could not be generated
    FbxIO& operator=(const FbxIO& pOther);

    FbxStatus& mStatus;

    struct InternalImpl;
	struct InternalImpl32;
	struct InternalImpl64;
    InternalImpl* mImpl;

    //! Project Global

    void ProjectClear();
    void ProjectReset();

    bool ProjectReadHeader(bool pCheckASCIIHeader, bool pCheckCRC, bool pOpenMainSection, FbxIOFileHeaderInfo* pFileHeaderInfo);
    bool ProjectReadExtendedHeader(FbxInt64& pExtendedHeaderEnd, FbxIOFileHeaderInfo* pFileHeaderInfo);
    bool BinaryReadHeader();
    bool BinaryReadSectionPosition();
    bool ASCIIReadHeader();
    bool ASCIIReadSectionPosition();

    bool ProjectWriteHeader(FbxIOFileHeaderInfo* pFileHeaderInfo);
    bool ProjectWriteExtendedHeader(FbxIOFileHeaderInfo* pFileHeaderInfo);
    void BinaryWriteHeader();
    void ASCIIWriteHeader();

    void ReadEncryptionKey(char* pEncryptionKey);
    void WriteEncryptionKey(char* pEncryptionKey);

    //! Project Section

    bool ProjectClearSection();
    bool ProjectOpenSection(int pSection);
    bool BinaryReadSectionHeader();
    FbxInt64 BinaryReadSectionFooter(char* pSourceCheck);
    bool BinaryReadExtensionCode(FbxInt64 pFollowingSectionStart, FbxInt64& pSectionStart, FbxUInt32& pSectionVersion);
    void BinaryReadSectionPassword();

    bool ProjectWriteSectionHeader();
    void BinaryWriteSectionFooter();
    bool BinaryWriteExtensionCode(FbxInt64 pSectionStart, FbxUInt32 pSectionVersion);

    FbxString GetCreationTime() const;
    void SetCreationTime(FbxString pCreationTime);
    void CreateSourceCheck(char* lSourceCheck);
    bool TestSourceCheck(char* pSourceCheck, char* pSourceCompany);
    FbxString GetMangledCreationTime();
    void EncryptSourceCheck(char* pSourceCheck, char* pEncryptionData);
    void DecryptSourceCheck(char* pSourceCheck, const char* pEncryptionData);

    void EncryptPasswordV1(FbxString pOriginalPassword, FbxString &pEncryptedPassword);
    void DecryptPasswordV1(FbxString pEncryptedPassword, FbxString &pDecryptedPassword);

    //! Read

    void CheckValidityOfFieldName(const char* pFieldName);
    void GetUnusedEmbeddedName(const FbxString& pDirectory, const FbxString& pName, FbxString& pResult, bool pCreateSubdirectory);

    //! Get project media directory name
    FbxString GetDirectory(bool pAutoCreate, const char* pExtension);
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_FILEIO_FBX_IO_H_ */
