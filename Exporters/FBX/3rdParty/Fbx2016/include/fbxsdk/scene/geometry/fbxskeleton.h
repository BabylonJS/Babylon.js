/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxskeleton.h
#ifndef _FBXSDK_SCENE_GEOMETRY_SKELETON_H_
#define _FBXSDK_SCENE_GEOMETRY_SKELETON_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/scene/geometry/fbxnodeattribute.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

/**	This class specializes a node attribute to represent the elements forming "bone" 
  * chains. The FbxSkeleton name of the class comes from the analogy with the human body
  * skeletal structure. In fact, an object of this type is nothing more than a transform
  * node with special properties that are useful for its graphical representation and during
  * IK/FK and skin deformation computations. Typically, a scene will contain chains of FbxSkeleton
  * node attributes that, together, form a skeleton segment. For instance, the representation of the
  * leg of a character can be achieved using one parent node with the attribute eRoot, followed by
  * one child (femur) of type eLimb, this child having a child also (tibia) of the same type. Finally,
  * terminated with a last node attribute of type eEffector (ankle).
  * 	
  * \nosubgrouping
  */
class FBXSDK_DLL FbxSkeleton : public FbxNodeAttribute
{
	FBXSDK_OBJECT_DECLARE(FbxSkeleton,FbxNodeAttribute);

public:
 	//! Return the type of node attribute (i.e: FbxNodeAttribute::EType::eSkeleton).
	virtual FbxNodeAttribute::EType GetAttributeType() const;

    //! Reset the skeleton to default values and type to \c eRoot.
	void Reset();

	/**
	  * \name Skeleton Properties
	  */
	//@{

	/** \enum EType Skeleton types.
	  * \remarks \e eEffector is synonymous to \e eRoot.
	  * \remarks The \e eLimbNode type is a bone defined uniquely by a transform and a size value while
	  * \remarks the \e eLimb type is a bone defined by a transform and a length.
	  */
    enum EType
    {
	    eRoot,			/*!< First element of a chain. */
	    eLimb,			/*!< Chain element. */
	    eLimbNode,		/*!< Chain element. */
	    eEffector		/*!< Last element of a chain. */
    };    

    /** Set the skeleton type.
	  * \param pSkeletonType Skeleton type identifier.
	  */
    void SetSkeletonType(EType pSkeletonType);

	/** Get the skeleton type.
	  * \return Skeleton type identifier.
	  */
    EType GetSkeletonType() const;

	/** Get a flag to know if the skeleton type was set.
	  * \return \c true if a call to SetSkeletonType() has been made.
	  * \remarks When the attribute is not set, the application can choose to ignore the attribute or use the default value.
	  * \remarks The flag is set back to \c false when Reset() is called.
      */
	bool GetSkeletonTypeIsSet() const;

	/** Get the default value for the skeleton type.
	  * \return \c eRoot
	  */
	EType GetSkeletonTypeDefaultValue() const;
		
	/** Get the default value for the limb length.
	  * \return 1.0
	  */
	double GetLimbLengthDefaultValue() const;
	
	/** Get the default value for the limb node size.
	  * \return 100.0
	  */
	double GetLimbNodeSizeDefaultValue() const;

	/** Set limb or limb node color.
	  * \param pColor RGB values for the limb color.
	  * \return \c true if skeleton type is \c eLimb or \c eLimbNode, \c false otherwise.
	  * \remarks Limb or limb node color is only set if skeleton type is \c eLimb or \c eLimbNode.
      */
	bool SetLimbNodeColor(const FbxColor& pColor);
	
	/** Get limb or limb node color.
	  * \return Currently set limb color.
	  * \remarks Limb or limb node color is only valid if skeleton type is \c eLimb or \c eLimbNode.
      */
	FbxColor GetLimbNodeColor() const;

	/** Get a flag to know if the limb node color was set.
	  * \return \c true if a call to SetLimbNodeColor() has been made.
	  * \remarks When the attribute is not set, the application can choose to ignore the attribute or use the default value.
	  * \remarks The flag is set back to \c false when Reset() is called.
      */
	bool GetLimbNodeColorIsSet() const;

	/** Get the default value for the limb node color.
	  * \return R=0.8, G=0.8, B=0.8
	  */
	FbxColor GetLimbNodeColorDefaultValue() const;

    /** To see if this skeleton is Root.
    * \return \c true if this is root of the skeleton, \c false otherwise.
    * \remarks if a skeleton node do not have a parent or its parent is not a skeleton node itself, then this 
	* skeleton is root in the hierarchy.
    */
    bool IsSkeletonRoot() const;

	//@}


	/**
	  * \name Property Names
	  */
	static const char*			sSize;
	static const char*			sLimbLength;

	/**
	  * \name Property Default Values
	  */
	//@{	
	static const FbxDouble		sDefaultSize;
	static const FbxDouble		sDefaultLimbLength;


	//////////////////////////////////////////////////////////////////////////
	//
	// Properties
	//
	//////////////////////////////////////////////////////////////////////////
	
	/** This property handles the limb node size.
	  *
      * To access this property do: Size.Get().
      * To set this property do: Size.Set(FbxDouble).
      *
	  * Default value is 100.0
	  */
	FbxPropertyT<FbxDouble>		Size;

	/** This property handles the skeleton limb length.
	*
	* To access this property do: LimbLength.Get().
	* To set this property do: LimbLength.Set(FbxDouble).
	*
	* FbxSkeleton is a node attribute and it will be attached to a FbxNode which represents the transform.
	* Given a chain of skeleton nodes the parent and child skeletons will be attached to a parent node and a child node.
	* The orientation of the limb is computed from the vector between the parent and child position (from parent to child). 
	* The LimbLength represents the proportion 
	* of the parent node's position to the child node's position which is used to compute the actual limb length.
	* The default value of 1.0 means the LimbLength is equal to the length between the parent and child node's position.
	* So if the value is 0.5, it means the LimbLength will be half of the length between the parent and child node's position.
	*/
	FbxPropertyT<FbxDouble>			LimbLength;

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
    virtual FbxObject& Copy(const FbxObject& pObject);

protected:
	virtual void Construct(const FbxObject* pFrom);
	virtual void ConstructProperties(bool pForceSet);

	void Reset( bool pResetProperties );

	virtual const char* GetTypeName() const;
	virtual FbxStringList GetTypeFlags() const;

    EType mSkeletonType;

	bool mLimbLengthIsSet;
	bool mLimbNodeSizeIsSet;
	bool mLimbNodeColorIsSet;
	bool mSkeletonTypeIsSet;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_SCENE_GEOMETRY_SKELETON_H_ */
