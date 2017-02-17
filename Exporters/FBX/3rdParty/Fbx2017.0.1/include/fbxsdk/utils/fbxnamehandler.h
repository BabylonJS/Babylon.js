/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxnamehandler.h
#ifndef _FBXSDK_UTILS_NAMEHANDLER_H_
#define _FBXSDK_UTILS_NAMEHANDLER_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/core/base/fbxarray.h>
#include <fbxsdk/core/base/fbxstring.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

/** A name is a case-sensitive string ID of a property, a node, a node attribute, a texture, etc. The characters constituting a name has no specific limitation.
  * An initial name is the original name (from importing a file, for example), which is saved up for reversible renaming.
  * A current name is the name used in FBX.
  * A namespace is a simple grouping of objects under a given name. Namespaces are primarily used to resolve
  * name-clash issues in FBX, where a new object has the same name as an existing object.
  *
  * For example, Maya only accepts names with letters, digits, or underscores. And when a user import FBX into Maya,
  * a node whose name contains whitespace will be renamed. But the connections and references to this node in FBX
  * scene graph still use the original name, so users have to use the initial name to retrieve related information.
  * \nosubgrouping
  */
class FBXSDK_DLL FbxNameHandler
{
public:
    /** Constructor.
      * \param pInitialName Name string used to initialize both members (initialName and currentName)
      * of this class.
      */
    FbxNameHandler(const char* pInitialName = "");

    /** Copy constructor.
      * \param pName A FbxNameHandler copied to this one.
      */
    FbxNameHandler(FbxNameHandler const& pName);

    // !Destructor
    ~FbxNameHandler();

    /** Set the initial name.
      * \param pInitialName New string for the initial name.
      * \remarks The current name will also be changed to this value.
      */
    void SetInitialName(const char* pInitialName);

    /** Get the initial name.
      * \return Pointer to the InitialName string buffer.
      */
    const char* GetInitialName() const;

    /** Set the current name.
      * \param pNewName New string for the current name.
      * \remarks The initial name is not affected.
      */
    void SetCurrentName(const char* pNewName);

    /** Get the current name.
      * \return Pointer to the CurrentName string buffer.
      */
    const char* GetCurrentName() const;

    /** Set the namespace.
      * \param pNameSpace New string for the namespace.
      * \remarks The initial name is not affected.
      */
    void SetNameSpace(const char* pNameSpace);

    /** Get the namespace.
      * \return Pointer to the namespace string buffer.
      */
    const char* GetNameSpace() const;

    /** Check if the current name and initial name match.
      * \return \c true if the current name isn't identical to the initial name.
      */
    bool IsRenamed() const;
    
    /** Assignment operator
      * \param pName FbxNameHandler assigned to this one.
      */
    FbxNameHandler& operator= (FbxNameHandler const& pName);

    /**
    * \name Private use for the renaming strategies classes.
    *
    * Some renaming strategies classes need to store the parent name to successfully apply the renaming algorithms. 
    * The methods in this section allow them to do so.
    * \remark Because of the very specific use of the mParentName string, 
    * callers of the FbxNameHandler class should never assume that mParentName is correctly initialized 
    * nor contains a meaningful value outside the scope of the renaming strategy class that used it.
    */
    //@{

    /** Set the parent name.
    * \param pParentName New string for the parent name.
    * \remarks The parent name here could combine several hierarchy name.
    * The full name should be "ParentName + CurrentName".
    *   A
    *   |_B
    *     |_C
    * For the above hierarchy, the parent name of C is "AB".
    * The full name of C is "ABC".
    */
    void SetParentName(const char* pParentName);

    /** Get the parent name.
    * \return Pointer to the ParentName string buffer.
    */
    const char* GetParentName() const;

    //@}

    /** Get the namespaces in a string pointer array format.
    * \return FbxArray<FbxString*> .
    */
    FbxArray<FbxString*> GetNameSpaceArray(char identifier);

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
private:
    FbxString mParentName;
    FbxString mInitialName;
    FbxString mCurrentName;
    FbxString mNameSpace;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_UTILS_NAMEHANDLER_H_ */
