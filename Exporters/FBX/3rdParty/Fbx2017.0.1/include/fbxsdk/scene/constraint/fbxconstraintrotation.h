/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxconstraintrotation.h
#ifndef _FBXSDK_SCENE_CONSTRAINT_ROTATION_H_
#define _FBXSDK_SCENE_CONSTRAINT_ROTATION_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/scene/constraint/fbxconstraint.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

/** \brief This constraint class contains methods for accessing the properties of a rotation constraint.
  * A rotation constraint lets you constrain the rotation of an object based on the rotation of one or more sources.
  * \nosubgrouping
  */
class FBXSDK_DLL FbxConstraintRotation : public FbxConstraint
{
	FBXSDK_OBJECT_DECLARE(FbxConstraintRotation, FbxConstraint);

public:
		/**
		  * \name Properties
		  */
		//@{
			/** This property handles whether to affect x axis.
              * Default value is true.
              */
			FbxPropertyT<FbxBool>		AffectX;
		    /** This property handles whether to affect y axis.
              * Default value is true.
              */
			FbxPropertyT<FbxBool>		AffectY;
			
            /** This property handles whether to affect z axis.
              * Default value is true.
              */
			FbxPropertyT<FbxBool>		AffectZ;

            /** This property handles rotation offset.
              * Default value is (0, 0, 0).
              */
			FbxPropertyT<FbxDouble3>	Rotation;

            /** This property handles constraint source objects.
              */
			FbxPropertyT<FbxReference> ConstraintSources;

			/** This property handles constraint target objects.
              */
			FbxPropertyT<FbxReference> ConstrainedObject;	
		//@}

	/** Add a source to the constraint.
	  * \param pObject New source object.
	  * \param pWeight Weight of the source object.
	  */
	void AddConstraintSource(FbxObject* pObject, double pWeight = 100);

	/** Retrieve the constraint source count.
	  * \return Current constraint source count.
	  */
	int GetConstraintSourceCount() const;

	/** Retrieve a constraint source object.
	  * \param pIndex Index of the source object
	  * \return Current source at the specified index.
	  */
	FbxObject* GetConstraintSource(int pIndex) const;

	/** Set the constrained object.
	  * \param pObject The constrained object.
	  */
	void SetConstrainedObject(FbxObject* pObject);

	/** Retrieve the constrained object.
	  * \return Current constrained object.
	  */
	FbxObject* GetConstrainedObject() const;

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
protected:
	virtual void ConstructProperties(bool pForceSet);
	virtual EType GetConstraintType() const;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_SCENE_CONSTRAINT_ROTATION_H_ */
