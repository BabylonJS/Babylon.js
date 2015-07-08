/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxiosettings.h
#ifndef _FBXSDK_FILEIO_IO_SETTINGS_H_
#define _FBXSDK_FILEIO_IO_SETTINGS_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/core/fbxobject.h>
#include <fbxsdk/fileio/fbxiosettingspath.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

//Undefine the macro mkdir, since it conflict with function mkdir in Qt\4.2.3\src\corelib\io\qdir.h
#if (defined(_MSC_VER) || defined(__MINGW32__)) && defined(mkdir)
	#undef mkdir
#endif

#define IOSVisible    true
#define IOSHidden     false

#define IOSSavable    true
#define IOSNotSavable false

#define IOSEnabled    true
#define IOSDisabled   false

#define IOSBinary     0
#define IOSASCII      1

class FbxManager;
class FbxIOSettings;

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
class FbxIOPropInfo
{
public:
	FbxIOPropInfo();
    ~FbxIOPropInfo();

	void*			UIWidget;            // UI widget for showing the property
	void*			cbValueChanged;      // call back when value changed
    void*			cbDirty;             // call back when value changed
    FbxStringList	labels;              // list of labels in many languages
};

class FBXSDK_DLL FbxIOInfo
{
public:
	enum EImpExp {eImport, eExport};

    FbxIOInfo();

    void Reset(EImpExp pImpExp);
    void SetTimeMode(FbxTime::EMode pTimeMode, double pCustomFrameRate = 0.0);
    FbxTime::EMode GetTimeMode(){ return mTimeMode; }
    FbxTime GetFramePeriod();
    void SetASFScene(FbxObject* pASFScene, bool pASFSceneOwned = false);
    FbxObject* GetASFScene(){ return mASFScene; }
	void Set_IOS(FbxIOSettings* pIOS){ios = pIOS;}
	void SetImportExportMode(EImpExp pImpExp){mImpExp = pImpExp;}

private: 
    FbxTime::EMode	mTimeMode;
    FbxObject*		mASFScene;
    EImpExp			mImpExp;
	FbxIOSettings*	ios;
};
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/

/** FbxIOSettings is a collection of properties, arranged as a tree, that 
  * can be used by FBX file readers and writers to represent import and export
  * options. 
  * It is primarily used by FBX importers (FbxImporter) and FBX exporter (FbxExporter) 
  * when reading or writing data from or to a disk. 
  * The FBX plugins of some Autodesk products expose a UI representing the content of those options
  * to let users see and choose options when an import or export operation is about to be done.
  * The tree of options is extensible.
  * 
  * Options can be saved or loaded from an XML file using the functions: 
  * ReadXMLFile(), WriteXMLFile(), WriteXmlPropToFile(). This functionality can be useful 
  * for plugins that use preset files. 
  *
  * An instance of FbxIOSettings must be created to be used before an import/export operation.
  * When a new FbxIOSettings instance is created, all options are created with default values.
  * The new instance of FbxIOSettings can be passed to the FbxManager, 
  * this way that instance will be used by all import/export operations.
  *
  * Ex: to set an instance of FbxIOSettings to the FbxManager
  *
  * \code
  * // First create a new instance of FbxIOSettings
  * FbxIOSettings * ios = FbxIOSettings::Create((FbxManager *) mManager, IOSROOT);
  * // then set the FbxManager
  * mManager->SetIOSettings(ios);
  * \endcode
  *
  * It's also possible for a developer to create another instance
  * of FbxIOSettings, set particular options and use it for import/export operation.
  *
  * Ex: to set an instance of FbxIOSettings to a FbxImporter/FbxExporter
  * \code
  * mImporter->SetIOSettings(ios); / mExporter->SetIOSettings(ios);
  * \endcode
  *
  * A schematic view of the FbxIOSettings tree :
  *
  * \verbatim
  
                                         OPTION_GROUP_ROOT (IOSROOT)
                                         |
                                         |
                     ________________________________________
                     |                                      |     
                     -OPTION_GROUP_EXPORT (IOSN_EXPORT)     -OPTION_GROUP_IMPORT (IOSN_IMPORT)
                          |                                      |
                          -OPTION_GROUP_A                        -OPTION_GROUP_A
                          |     |                                |     |
                          |     -OPTION_A                        |     -OPTION_A
                          |     -OPTION_B                        |     -OPTION_B
                          |                                      |
                          -OPTION_GROUP_B                        -OPTION_GROUP_B
                          |     |                                |     |
                          |     -OPTION_GROUP_A                  |     -OPTION_GROUP_A
                          |     |     |                          |     |     |
                          |     |     -OPTION_A                  |     |     -OPTION_A
                          |     |     -OPTION_B                  |     |     -OPTION_B
                          |     |                                |     |
                          |     -OPTION_GROUP_B                  |     -OPTION_GROUP_B
                          |           |                          |           |
                          |           -OPTION_A                  |           -OPTION_A
                          |           -OPTION_B                  |           -OPTION_B 
                          |                                      |
                          -OPTION_GROUP_C                        -OPTION_GROUP_C
                                |                                      |
                                -OPTION_A                              -OPTION_A
  
  \endverbatim
  *
  * Any group of options can contain sub options, or group of sub options.
  * To access an option value, we must pass the full path to the Get/Set functions
  * Ex: 
  * \code
  * ios->GetBoolProp("Import|IncludeGrp|Animation", true); // the root node name is not required
  * \endcode
  *
  * All options path are defined in the file kfbxiosettingspath.h to ease the access of any options.
  * Then "Import|IncludeGrp|Animation" == IMP_ANIMATION since IMP_ANIMATION is defined in kfbxiosettingspath.h
  * All options defined path start with "IMP_" for import branch or "EXP_" for export branch.
  *
  * We strongly encourage to use the defined path in kfbxiosettingspath.h, this way if the parent group of an option is changed
  * the change occur only in kfbxiosettingspath.h not in the code elsewhere.
  *
  * Ex: to get the boolean import "Animation" option
  * \code
  * bool anim = ios->GetBoolProp(IMP_ANIMATION, true); // will return true if not found, since we pass true as second param
  * \endcode
  *
  * Ex: to set the boolean import "Animation" option to false
  * \code
  * ios->SetBoolProp(IMP_ANIMATION, false);
  * \endcode
  *
  * Ex: to create a new option group under the "Import" branch
  * \code
  * // get the parent "Import" property
  * FbxProperty import_Group = ios->GetProperty( IOSN_IMPORT ); // IOSN_IMPORT is defined as "Import" in kfbxiosettingspath.h
  * if(import_Group.IsValid()) // check if we have found the IOSN_IMPORT parent option
  * {
  *     // add a new group of options "myOptionGroup"
  *		FbxProperty myOptionGrp = ios->AddPropertyGroup(import_Group, "myOptionGroup", FbxStringDT, "My Option Group UI Label");
  * }
  * \endcode
  *
  * Ex: to create a new boolean option under the "myOptionGroup"
  * \code
  * FbxProperty myOptionGrp = ios->GetProperty( "Import|myOptionGroup" ); // can also use IOSN_IMPORT|"myOptionGroup"
  * if(myOptionGrp.IsValid()) // check if we have found the "myOptionGroup"
  * {
  *     bool defaultValue = true;
  *		FbxProperty myOption = ios->AddProperty(myOptionGrp, "myOptionName", FbxBoolDT, "My Option UI label" , &defaultValue, eFbxBool);
  * }
  * \endcode
  *
  * Ex: to set some flags to myOption
  * \code
  * FbxProperty myOption = ios->GetProperty( "Import|myOptionGroup|myOptionName" );
  * if(myOption.IsValid())
  * {
  *		myOPtion.ModifyFlag(FbxPropertyFlags::eUIHidden, true);   // to make that option not visible to the UI
  *		myOPtion.ModifyFlag(FbxPropertyFlags::eNotSavable, true); // to avoid the read/save of that option in XML file
  * }
  * \endcode
  */
class FBXSDK_DLL FbxIOSettings : public FbxObject
{
	FBXSDK_OBJECT_DECLARE(FbxIOSettings, FbxObject);

public:
	//! Supported languages enumeration list
	enum ELanguage
	{
		eENU,			//!< 409 English - United States
		eDEU,			//!< 407 German - Germany
		eFRA,			//!< 40c French - France
		eJPN,			//!< 411 Japanese - Japan
		eKOR,			//!< 412 Korean(Extended Wansung) - Korea 
		eCHS,			//!< 804 Chinese - PRC
		eLanguageCount	//!< Total language count
	};

	/** Add a property group under the root prop to be a direct child of IOSROOT
	  * \param pName
	  * \param pDataType
	  * \param pLabel
	  * \return a new FbxProperty created
	  */
	FbxProperty AddPropertyGroup(const char* pName, const FbxDataType& pDataType=FbxDataType(), const char* pLabel="");

	/** Add a property group under another parent property
	  * \param pParentProperty
	  * \param pName
	  * \param pDataType
	  * \param pLabel   (optional, used by the UI as widget label)
	  * \param pVisible (used by the UI to show or not that property)
	  * \param pSavable (to enable a read & write to an XML file)
	  * \param pEnabled (used by the widget UI to show enabled or disabled)
	  * \return a new FbxProperty created
	  */
	FbxProperty AddPropertyGroup(const FbxProperty& pParentProperty, const char* pName, const FbxDataType& pDataType = FbxDataType(), 
								  const char* pLabel  = "", bool pVisible = true, bool pSavable = true, bool pEnabled = true );

	/** Add a property under another parent property with a value to set
	  * \param pParentProperty
	  * \param pName
	  * \param pDataType
	  * \param pLabel      (optional, used by the UI as widget label)
	  * \param pValue
	  * \param pVisible    (used by the UI to show or not that property)
	  * \param pSavable    (to enable a read & write to an XML file)
	  * \param pEnabled    (used by the widget UI to show enabled or disabled)
	  * \return a new FbxProperty created
	  */		  
	FbxProperty AddProperty(const FbxProperty& pParentProperty, const char* pName, const FbxDataType& pDataType = FbxDataType(), 
							 const char* pLabel = "", const void* pValue = NULL, bool pVisible = true,
							 bool pSavable = true, bool pEnabled = true );

		/** Add a property under another parent property with a value to set and a min max values
		  * \param pParentProperty
		  * \param pName
		  * \param pDataType
		  * \param pLabel     (optional, used by the UI as widget label)
		  * \param pValue
		  * \param pMinValue
		  * \param pMaxValue
		  * \param pVisible   (used by the UI to show or not that property)
		  * \param pSavable   (to enable a read & write to an XML file)
		  * \param pEnabled   (used by the widget UI to show enabled or disabled)
		  * \return a new FbxProperty created
		  * \remarks Normally used with numeric properties Ex: integer, float, double, etc.
		  */		  		  
	FbxProperty AddPropertyMinMax(const FbxProperty& pParentProperty, const char* pName, const FbxDataType& pDataType = FbxDataType(), 
								   const char* pLabel = "", const void* pValue = NULL, const double* pMinValue = NULL, const double* pMaxValue = NULL,
								   bool pVisible = true, bool pSavable = true, bool pEnabled = true );


		/** Get a property using the full path in the tree ex: "Export|IncludeGrp|Animation"
		  * \param pName
		  * \return a FbxProperty found
		  * \remarks We strongly encourage to use the defined path in kfbxiosettingspath.h
		  * ex: EXP_ANIMATION == "Export|IncludeGrp|Animation"
		  */
	FbxProperty GetProperty(const char* pName) const;

		/** Get a property using a short path found under the parent property.
		  * \param pParentProperty
		  * \param pName
		  * \return a FbxProperty found
		  * \remarks This is a faster way to access a property when the parent is known
		  */
	FbxProperty GetProperty(const FbxProperty& pParentProperty, const char* pName) const;

        /** Get a bool property value using the full path
		  * \param pName
		  * \param pDefValue  Value returned if the property is not found
		  * \return true or false
		  */
	bool GetBoolProp(const char* pName, bool pDefValue) const;

        /** set a bool property value using the full path
		  * \param pName
		  * \param pValue
		  */
	void SetBoolProp(const char* pName, bool pValue);

        /** Get a double property value using the full path
		  * \param pName
		  * \param pDefValue Value returned if the property is not found
		  * \return a double
		  */
	double GetDoubleProp(const char* pName, double pDefValue) const;

        /** Set a double property using the full path
		  * \param pName
		  * \param pValue
		  */
	void   SetDoubleProp(const char* pName, double pValue);

        /** Get a int property value using the full path
		  * \param pName
		  * \param pDefValue Value returned if the property is not found
		  * \return a int
		  */
	int    GetIntProp(const char* pName, int pDefValue) const;

        /** Set a int property value using the full path
		  * \param pName
		  * \param pValue
		  */
	void   SetIntProp(const char* pName, int pValue);

        /** Get a FbxTime property value using the full path
		  * \param pName 
		  * \param pDefValue  Value returned if the property is not found
		  */
	FbxTime  GetTimeProp(const char* pName, FbxTime pDefValue) const;

        /** Set a FbxTime property value using the full path
		  * \param pName 
		  * \param pValue
		  * \return a FbxTime
		  */
	void   SetTimeProp(const char* pName, FbxTime pValue);

		/** \name Enum Properties 
          * An enum property is a list of FbxString and integer pairs.
		  * A current index value is available to get the selected pair
		  * of FbxString+integer
		  *
		  * Ex: Content of an enum property
          * \code
		  *    0 -> (14, "Bird")
		  *    1 -> (17, "Horse")
		  *    2 -> (93, "Cat")
		  *    3 -> (45, "Dog")
		  * \endcode
          * 
		  *    If current index is 2: the current int value is 93, 
		  *    and the current FbxString value is "Cat"
		  */    		
    
    //@{
	
        /** Get the FbxString at current index of an enum property using the full path.
		  * \param pName
		  * \param pDefValue Value returned if the property is not found
		  * \return a FbxString
		  */
	FbxString GetEnumProp(const char* pName, FbxString pDefValue) const;

        /** Get the integer at current index of an enum property using the full path.
		  * \param pName
		  * \param pDefValue Value returned if the property is not found
		  * \return a int
		  */
	int     GetEnumProp(const char* pName, int pDefValue) const;

        /** Get the index of a FbxString from the enum property using the full path.
		  * \param pName
		  * \param pValue Return -1 if the FbxString is not found
		  * \return a int
		  */
	int     GetEnumIndex(const char* pName, FbxString pValue) const;

		/** Set the current index using an existing FbxString of an enum property using the full path.
		  * \param pName
		  * \param pValue
		  * \remarks The current index will not change if the FbxString is not found
		  */
	void    SetEnumProp(const char* pName, FbxString pValue);

		/** Set the current index of an enum property using the full path.
		  * \param pName
		  * \param pValue
		  * \remarks The current index will not change if the pValue is out of bound
		  */
	void    SetEnumProp(const char* pName, int pValue);

		/** Remove a pair of FbxString+integer from an enum property.
		  * \param pName
		  * \param pValue The FbxString to find
		  * \remarks The first FbxString found from 0 index will be removed only even 
		  * if the same FbxString exist in other index, if the current index was on the FbxString found
		  * the current index will be set to 0
		  */
	void    RemoveEnumPropValue(const char* pName, FbxString pValue);

		/** Empty all the FbxString+integer pair of the enum property
          * \param pName
		  */
	void    EmptyEnumProp(const char* pName);

		/** Check if a FbxString is present in the enum property.
		  * \param &pProp a ref to an enum prop
		  * \param &enumString ref to a FbxString to find
		  * \return \c true if found, \c false otherwise. 
		  */
	bool	IsEnumExist(FbxProperty& pProp, const FbxString& enumString) const;

		/** Get the enum index of a FbxString
		  * \param &pProp a ref to an enum prop
		  * \param &enumString ref to string to find
		  * \param pNoCase To match case sensitive or not
		  * \return the index found or -1 if not found
		  */
	int		GetEnumIndex(FbxProperty& pProp, const FbxString& enumString, bool pNoCase = false) const;
    //@}

		/** Set a specific flag value on a property using the full path
		  * \param pName
		  * \param propFlag
		  * \param pValue
		  * \return Always true
		  */
	bool    SetFlag(const char* pName, FbxPropertyFlags::EFlags propFlag, bool pValue);

        /** Get a FbxString property value using the full path.
		  * \param pName
		  * \param pDefValue  Value returned if the property is not found
		  * \return The FbxString value
		  */
	FbxString GetStringProp(const char* pName, FbxString pDefValue) const;

        /** Set a FbxString property value using the full path
		  * \param pName
		  * \param pValue
		  */
	void    SetStringProp(const char* pName, FbxString pValue);

    /** \name XML Serialization Functions */
    //@{
     
		/** Load the settings values from an XML file.
		  * \param path The path of the XML file.
		  * \return \c True on success, \c false otherwise.
		  */
	virtual bool ReadXMLFile(const FbxString& path);

		/** Write the settings values to an XML file.
		  * \param path The path of the XML file.
          * \return \c True on success, \c false otherwise.
		  * \remarks The flag of the property must be FbxPropertyFlags::eNotSavable == false
		  */
	virtual bool WriteXMLFile(const FbxString& path);

		/** Write the settings values to an XML file.
		  * \param pFullPath The path of the XML file.
		  * \param propPath a prop Path
          * \return \c True on success, \c false otherwise.
		  * \remarks To save only a branch of the settings ex: Import branch only
		  */
	bool WriteXmlPropToFile(const FbxString& pFullPath, const FbxString& propPath);
    //@}

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
	FbxIOPropInfo* GetPropInfo(FbxProperty &pProp);

	ELanguage UILanguage;
	FbxString GetLanguageLabel(FbxProperty& pProp);
	void SetLanguageLabel(FbxProperty& pProp, FbxString& pLabel);
	ELanguage Get_Max_Runtime_Language(FbxString pRegLocation);

	FbxIOInfo impInfo;
	FbxIOInfo expInfo;

	static FbxString GetUserMyDocumentDir();
	void SetPropVisible(FbxProperty& pProp, bool pWithChildren, bool pVisible);

			// Read an XML file from MyDocument dir
	bool ReadXmlPropFromMyDocument(const FbxString& subDir, const FbxString& filename);

			// Write property branch to an XML file in MyDocument dir
	bool WriteXmlPropToMyDocument(const FbxString& subDir, const FbxString& filename, const FbxString& propPath);

    static const char* GetFileMergeDescription(int pIndex);

    enum ELoadMode         
    { 
		eCreate,          /*!< Add to scene(duplicate the ones with the same name)    */  
		eMerge,           /*!< Add to scene and update animation                      */
        eExclusiveMerge  /*!< Update animation                                       */
    };


	enum EQuaternionMode   { eAsQuaternion, eAsEuler, eResample };
	enum EObjectDerivation { eByLayer, eByEntity, eByBlock }; 

	enum ESysUnits
	{
		eUnitsUser,
		eUnitsInches, 
		eUnitsFeet,
		eUnitYards,
		eUnitsMiles,
		eUnitsMillimeters,
		eUnitsCentimeters,
		eUnitsMeters,
		eUnitsKilometers
	};

	enum ESysFrameRate  
	{
		eFrameRateUser,
		eFrameRateHours,
		eFrameRateMinutes,
		eFrameRateSeconds,
		eFrameRateMilliseconds,
		eFrameRateGames15,
		eFrameRateFilm24,
		eFrameRatePAL25,
		eFrameRateNTSC30,
		eFrameRateShowScan48,
		eFrameRatePALField50,
		eFrameRateNTSCField60
	};
    
// Max
	enum EEnveloppeSystem
	{
		eSkinModifier,
		ePhysic,
		eBonePro,
		eEnveloppeSystemCount
	};

// Max
	enum EGeometryType
	{
		eTriangle,
		eSimplifiedPoly,
		ePolygon,
		eNurbs,
		ePatch,
		eGeometryTypeCount
	};

// Maya IK type
	enum EIKType
	{
		eNone,
		eFBIK,		
		eHumanIK
	};

protected:
	virtual void Construct(const FbxObject* pFrom);
	virtual void ConstructProperties(bool pForceSet);
	virtual void Destruct(bool pRecursive);

private:
	void AddNewPropInfo(FbxProperty& pProp);
	void DeletePropInfo(FbxProperty& pProp);
	void DeleteAllPropInfo(FbxProperty& pProp);
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_FILEIO_IO_SETTINGS_H_ */
