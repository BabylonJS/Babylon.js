/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxpropertydef.h
#ifndef _FBXSDK_CORE_PROPERTY_DEFINITION_H_
#define _FBXSDK_CORE_PROPERTY_DEFINITION_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/core/fbxpropertytypes.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

#define FBXSDK_PROPERTY_ID_NULL	-1
#define FBXSDK_PROPERTY_ID_ROOT 0

class FbxPropertyPage;

class FBXSDK_DLL FbxPropertyFlags
{
public:
	//! Property inherit types
	enum EInheritType
	{
		eOverride,	//!< Property override this flag from its reference property.
		eInherit,	//!< Property inherit this flag from its reference property.
		eDeleted	//!< Property has been deleted, so inheritance is invalid.
	};

	//! Property flags that affect their behaviors
	enum EFlags
	{
		eNone = 0,					//!< No flag.
		eStatic = 1 << 0,			//!< Property is defined in the class declaration, so it wasn't created dynamically.
		eAnimatable = 1 << 1,		//!< Property can be animated, thus is can have am animation curve node connected.
		eAnimated = 1 << 2,			//!< Property is animated, so it also has an animation curve node connected.
		eImported = 1 << 3,			//!< Property has been created during import process when reading FBX file.
		eUserDefined = 1 << 4,		//!< Property has been defined by user, not by the FBX SDK.
		eHidden = 1 << 5,			//!< Property should not be displayed on user interface.
		eNotSavable = 1 << 6,		//!< Property value must not be exported when writing FBX files.

        eLockedMember0 = 1 << 7,	//!< This property has its member #0 locked.
        eLockedMember1 = 1 << 8,	//!< This property has its member #1 locked.
        eLockedMember2 = 1 << 9,	//!< This property has its member #2 locked.
        eLockedMember3 = 1 << 10,	//!< This property has its member #3 locked.
        eLockedAll = eLockedMember0 | eLockedMember1 | eLockedMember2 | eLockedMember3,
        eMutedMember0 = 1 << 11,	//!< This property has its member #0 muted.
        eMutedMember1 = 1 << 12,	//!< This property has its member #1 muted.
        eMutedMember2 = 1 << 13,	//!< This property has its member #2 muted.
        eMutedMember3 = 1 << 14,	//!< This property has its member #3 muted.
        eMutedAll = eMutedMember0 | eMutedMember1 | eMutedMember2 | eMutedMember3,

		//Private flags
		eUIDisabled = 1 << 15,		//!< Private flag for dynamic UI in FBX plug-ins.
		eUIGroup = 1 << 16,			//!< Private flag for dynamic UI in FBX plug-ins.
		eUIBoolGroup = 1 << 17,		//!< Private flag for dynamic UI in FBX plug-ins.
		eUIExpanded = 1 << 18,		//!< Private flag for dynamic UI in FBX plug-ins.
		eUINoCaption = 1 << 19,		//!< Private flag for dynamic UI in FBX plug-ins.
		eUIPanel = 1 << 20,			//!< Private flag for dynamic UI in FBX plug-ins.
		eUILeftLabel = 1 << 21,		//!< Private flag for dynamic UI in FBX plug-ins.
		eUIHidden = 1 << 22,		//!< Private flag for dynamic UI in FBX plug-ins.

		eCtrlFlags = eStatic | eAnimatable | eAnimated | eImported | eUserDefined | eHidden | eNotSavable | eLockedAll | eMutedAll,
		eUIFlags = eUIDisabled | eUIGroup | eUIBoolGroup | eUIExpanded | eUINoCaption | eUIPanel | eUILeftLabel | eUIHidden,
		eAllFlags = eCtrlFlags | eUIFlags,

		eFlagCount = 23,
	};

	bool SetFlags(FbxPropertyFlags::EFlags pMask, FbxPropertyFlags::EFlags pFlags);
	FbxPropertyFlags::EFlags GetFlags() const;
	FbxPropertyFlags::EFlags GetMergedFlags(FbxPropertyFlags::EFlags pFlags) const;
	bool ModifyFlags(FbxPropertyFlags::EFlags pFlags, bool pValue);
	FbxPropertyFlags::EInheritType GetFlagsInheritType(FbxPropertyFlags::EFlags pFlags) const;

	bool SetMask(FbxPropertyFlags::EFlags pFlags);
	bool UnsetMask(FbxPropertyFlags::EFlags pFlags);
	FbxPropertyFlags::EFlags GetMask() const;

	bool Equal(const FbxPropertyFlags& pOther, FbxPropertyFlags::EFlags pFlags) const;

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
	FbxPropertyFlags();
	explicit FbxPropertyFlags(FbxPropertyFlags::EFlags pFlags);
	FbxPropertyFlags Clone(FbxPropertyPage* pPage);

    static const int sLockedMembersMax = 4;			//Maximum number of property sub-member that can be locked.
    static const int sLockedMembersBitOffset = 7;	//Number of bits to shift to get to the first locked member flag.
    static const int sMutedMembersMax = 4;			//Maximum number of property sub-member that can be muted.
    static const int sMutedMembersBitOffset = 11;	//Number of bits to shift to get to the first muted member flag.

private:
    FbxUInt32 mFlagData, mMaskData;

	FBX_ASSERT_STATIC(sizeof(FbxUInt32) * 8 >= FbxPropertyFlags::eFlagCount);
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

class FBXSDK_DLL FbxPropertyValue
{
public:
	static FbxPropertyValue* Create(void* pData, EFbxType pType);
	void Destroy();
	FbxPropertyValue* Clone(FbxPropertyPage*);

	bool Get(void* pValue, EFbxType pValueType);
	bool Set(const void* pValue, EFbxType pValueType);
	size_t GetSizeOf() const;
	size_t GetComponentCount() const;

	void IncRef();
	void DecRef();
	int GetRef();

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
	FbxPropertyValue();

private:
	FbxPropertyValue(void* pValue, EFbxType pType);
	~FbxPropertyValue();

	int			mRef;
	EFbxType	mType;
	void*		mValue;

	FBXSDK_FRIEND_NEW();
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_CORE_PROPERTY_DEFINITION_H_ */
