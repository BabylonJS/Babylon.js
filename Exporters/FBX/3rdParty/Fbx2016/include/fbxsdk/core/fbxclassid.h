/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxclassid.h
#ifndef _FBXSDK_CORE_CLASSID_H_
#define _FBXSDK_CORE_CLASSID_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

class FbxClassIdInfo;
class FbxObject;
class FbxPropertyHandle;
class FbxManager;

//! The function pointer type for object constructor functions.
typedef FbxObject* (*FbxObjectCreateProc)(FbxManager& pManager, const char* pName, const FbxObject* pFrom);

/** Internal class used to differentiate objects during run-time. Essentially, each class has an unique ClassId, that the
* system can request in order to test if the class match the description. This class implement the necessary tools to be able
* to perform hierarchic class testing. This means that a class B that inherits from the class A will answer yes to a "Is A"
* query of type A or B, but will answer no to a class C that can still inherit from A. All class must inherit from FbxObject
* before they can have their own ClassId. When using the standard macros to create new types of objects in the FBX SDK, a
* static ClassId will automatically be generated for that new class.
*
* When objects are exported to an FBX file, their class type is maintained using 3 sort of strings. They are the Object Type
* string, the Object Sub Type string and the Object Type Prefix. There is no good or bad way to choose the value of these
* identifiers, but it is preferable to use meaningful values to keep the ASCII version of FBX readable and easy to understand.
* \see FbxObject */
class FBXSDK_DLL FbxClassId
{
public:
	//! Constructor.
	FbxClassId();

	/** Advanced constructor were we can specify the general parameters for this ClassId.
	* \param pClassName The name of the class represented.
	* \param pParentClassId The parent ClassId of this class.
	* \param pConstructor A function pointer to a construction method for this ClassId.
	* \param pFBXType The FBX file Object Type string associated to this class.
	* \param pFBXSubType The FBX file Object Sub Type string associated to this class. */
	FbxClassId(const char* pClassName, const FbxClassId& pParentClassId, FbxObjectCreateProc pConstructor=0, const char* pFBXType=NULL, const char* pFBXSubType=NULL);

	//! Destructor.
	void Destroy();

	/** Retrieve the class name.
	* \return The class identification string name. */
	const char* GetName() const;

    /** Retrieve the parent ClassId.
	* \return The parent ClassId. */
	FbxClassId GetParent() const;

	/** Create an instance of this class.
	* \param pManager The FBX SDK Manager to be used to instantiate this object. This allow the object to use the same memory manager as the provided manager.
	* \param pName The name to assign to this new object instance.
	* \param pFrom An object to clone if it matches the same ClassId. This is an optional parameter.
	* \return The newly created instance of this class. */
	FbxObject* Create(FbxManager& pManager, const char* pName, const FbxObject* pFrom);

	/** Override the function pointer method to construct this object.
	* \param pConstructor A newly defined function pointer to a construction method to replace the existing one.
	* \return True if the operation was successful. */
	bool Override(FbxObjectCreateProc pConstructor);

	/** Test if this class is a hierarchical children of the specified class type. This is the standard method to differentiate object classes.
	* \param pId The class type to test against self.
	* \return True if the object is a hierarchical children of the type specified.
	* \remark This function will perform a complete search until it reaches the top level class, but it will stop as soon as one ClassId matches the test. */
	bool Is(const FbxClassId& pId) const;

	/** Equivalence operator.
	* \param pClassId The class type to test against self.
	* \return \c true if the ClassId is exactly the same, \c false otherwise.
	* \remark This function only perform direct equality test, and doesn't test hierarchic children. */
	bool operator==(const FbxClassId& pClassId) const;

	/** Inequivalence operator.
	* \param pClassId The class type to test against self.
	* \return \c true if the ClassId is not the same, \c false otherwise.
	* \remark This function only perform direct inequality test, and doesn't test hierarchic children. */
	bool operator!=(const FbxClassId& pClassId) const;

	/** Retrieve the FBX file Object Type string associated to this class.
	* \param pAskParent If \c true, retrieve the parent ClassId, but only if self ClassId is not valid.
	* \return The FBX file Object Type string associated to this class. */
	const char* GetFbxFileTypeName(bool pAskParent=false) const;

	/** Retrieve the FBX file Object Sub Type string associated to this class.
	* \return The FBX file Object Sub Type string associated to this class. */
	const char* GetFbxFileSubTypeName() const;

	/** Find out if self ClassId is valid or not.
	* \return \c true if self ClassId is valid, \c false otherwise. */
	inline bool IsValid() const { return mClassInfo ? true : false; }
    
	/** Set the Object Type Prefix string associated to this class. This will change the "ObjectTypePrefix::" found in front
	* of object name in the FBX file. This is useful to differentiate objects by their name without using the Object Type or
	* Sub Type strings in the file.
	* \param pObjectTypePrefix The Object Type prefix string. */
	void SetObjectTypePrefix(const char* pObjectTypePrefix);

	/** Retrieve the Object Type Prefix string associated to this class.
	* \return The Object Type Prefix string. */
	const char* GetObjectTypePrefix();
   
	/** Retrieve the root property handle of this class. This is useful to access the default property hierarchy for this
	* class. This allow users to retrieve information such as the default value for all properties of this class.
	* \return The root property handle for this class. */
	FbxPropertyHandle* GetRootClassDefaultPropertyHandle();

	/** Increase the instance reference count for this class type.
	* \return the new count of reference to this class after increment. */
	int ClassInstanceIncRef();

	/** Decrease the instance reference count for this class type.
	* \return the new count of reference to this class after decrement. */
	int ClassInstanceDecRef();
	 
	/** Retrieve the instance reference count for this class type.
	* \return The reference count of this class type. */
	int GetInstanceRef();

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
	inline FbxClassIdInfo* GetClassIdInfo() { return mClassInfo; }
    inline const FbxClassIdInfo* GetClassIdInfo() const { return mClassInfo; }

private:
	FbxClassId(FbxClassIdInfo* mClassInfo);

	bool SetFbxFileTypeName(const char* pName);
	bool SetFbxFileSubTypeName(const char* pName);

	FbxClassIdInfo* mClassInfo;

	friend class FbxManager;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

//! Functor to compare FbxClassId
struct FbxClassIdCompare
{
	inline int operator()(const FbxClassId& pKeyA, const FbxClassId& pKeyB) const
	{
		const FbxClassIdInfo* lKeyA = pKeyA.GetClassIdInfo();
		const FbxClassIdInfo* lKeyB = pKeyB.GetClassIdInfo();
		return lKeyA < lKeyB ? -1 : (lKeyA > lKeyB ? 1 : 0);
	}
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_CORE_CLASSID_H_ */
