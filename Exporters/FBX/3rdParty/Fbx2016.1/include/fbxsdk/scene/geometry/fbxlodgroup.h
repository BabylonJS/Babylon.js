/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxlodgroup.h
#ifndef _FBXSDK_SCENE_GEOMETRY_LOD_GROUP_H_
#define _FBXSDK_SCENE_GEOMETRY_LOD_GROUP_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/scene/geometry/fbxnodeattribute.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

/** Defines a LOD (Level of Detail) group.
  * This LodGroup node is a group node that can be used to detect how
  * close a group of objects is to a camera. Typically this node is
  * used for controlling "Level of Detail" visibility.
  *
  * Properties in the class are designed according to Maya implementation.
  * So these properties may be incompatible with other software, like 3ds Max.
  *
  * In Maya, with "Level of Detail",the visibility of the children of this 
  * transform are controlled by the distance of a group to the camera and the
  * threshold values.
  *
  * For example, under a LOD group node, there are three children:
  * ship_detailed, ship_medium, and ship_rough. There are 2 threshold 
  * values: 5, 10.  When the camera is less than 5 units away of the group 
  * bounding box, only ship_detailed is visible. When the view is zoomed out and
  * the camera is between 5 and 10 units away from the group, only ship_medium is
  * visible. Finally, when the view is zoomed out more and the camera is 10 or 
  * more units away from the group, only ship_rough is visible.
  *
  * This node attribute contains the properties of a null node.
  *
  * Example code to create LODGroup:
  *	\code
  * FbxNode *lLodGroup = FbxNode::Create(pScene, "LODNode");
  * FbxLODGroup *lLodGroupAttr = FbxLODGroup::Create(pScene, "LODGroup1");
  * // Array lChildNodes contains geometries of all LOD levels
  * for (int j = 0; j < lChildNodes.GetCount(); j++)
  * {
  *    lLodGroup->AddChild(lChildNodes.GetAt(j));
  * }
  * \endcode
  *
  * This object can also be configured to define thresholds as percentage values.
  * Typically, these percentage values represent the ratio between the group bounding
  * box height (in screen space) and the viewing screen height.
  *
  * To switch to this mode, the client application must set the value of the 
  * ThresholdsUsedAsPercentage property to "true" before the calls to the AddThreshold/
  * SetThreshold methods. Client applications should always check the return value of
  * these methods to validate that the action was successful. 
  * 
  * Note that, for backward compatibility, the data is always stored as FbxDistance type.
  * The client application should always check the return value of this method to validate
  * that the argument contains a meaningful value (see GetThreshold for more details).
  *
  * Example code to create LODGroup that store percentage values:
  *	\code
  * FbxNode *lLodGroup = FbxNode::Create(pScene, "LODNode");
  * FbxLODGroup *lLodGroupAttr = FbxLODGroup::Create(pScene, "LODGroup1");
  * lLodGroupAttr->ThresholdsUsedAsPercentage.Set(true);
  * FBX_ASSERT(lLodGroupAttr->AddThreshold(33.3)) == true);
  * FBX_ASSERT(lLodGroupAttr->AddThreshold(66.6)) == true);
  * FBX_ASSERT(lLodGroupAttr->AddThreshold(FbxDistance(0.6f, "cm")) == false);
  *
  * FbxDistance dval;
  * FbxDouble val = 0.0;
  * bool res;
  * res = lLodGroupAttr->GetThreshold(0, val);  // res = true, val = 33.3
  * res = lLodGroupAttr->GetThreshold(0, dval); // res = false, dval.value()=33.3
  * res = lLodGroupAttr->GetThreshold(2, val);  // res = false, val = 1.0
  * \nosubgrouping
  */
class FBXSDK_DLL FbxLODGroup : public FbxNodeAttribute
{
    FBXSDK_OBJECT_DECLARE(FbxLODGroup, FbxNodeAttribute);

public:
    //! Return the type of node attribute which is EType::eLODGroup.
    virtual FbxNodeAttribute::EType GetAttributeType() const;

    /** \enum EDisplayLevel types to determine how to display nodes in LODGroup.
      * - \e eUseLOD Display the node according LOD threshold
      * - \e eShow Always show this node
	  * - \e eHide Always hide this node
      */
	enum EDisplayLevel
	{
		eUseLOD,
		eShow,
		eHide
	};

    //////////////////////////////////////////////////////////////////////////
    //
    // Properties
    //
    //////////////////////////////////////////////////////////////////////////
	/** Specifies if the threshold values stored by this LOD object are defining
	  * a distance to the camera (by default) or a percentage value.
	  *
	  * \remarks This property needs to be set before any call to the Add\SetThreshold
	  *          methods since its value is used to validate that the correct method is
	  *          called.
	  *
      * To access this property do: ThresholdsUsedAsPercentage.Get().
      * To set this property do: ThresholdsUsedAsPercentage.Set(bool).
      *
      * Default value is false
	  */
	FbxPropertyT<FbxBool>  ThresholdsUsedAsPercentage;

	/**
	  * \name Distance Mode
	  * The properties in this block are meaningful only if ThresholdsUsedAsPercentage
	  * is set to false and should be ignored otherwise.
	  */
	//@{
		/** This property handles the use of the Min/Max distances.
		  * Enables the minimum and maximum distance to take effect.
		  * For example, if the distance between the group and the camera is smaller 
		  * than the minimum distance, then the whole group disappears.
		  *
		  * To access this property do: MinMaxDistance.Get().
		  * To set this property do: MinMaxDistance.Set(bool).
		  *
		  * Default value is false.
		  */
		FbxPropertyT<FbxBool>       MinMaxDistance;

		/** The minimum distance at which the group is displayed.
		  *
		  * To access this property do: MinDistance.Get().
		  * To set this property do: MinDistance.Set(double).
		  *
		  * Default value is -100
		  */
		FbxPropertyT<FbxDouble>     MinDistance;

		/** The maximum distance at which the group is displayed. 
		  *
		  * To access this property do: MaxDistance.Get().
		  * To set this property do: MaxDistance.Set(double).
		  *
		  * Default value is 100
		  */
		FbxPropertyT<FbxDouble>     MaxDistance;

		/** Work in world space of transform or local space If true, 
		  * the camera distance to the LOD group will be computed in world space.
		  * This means it is possible to parent the LOD transform below other transforms 
		  * and still have it work as expected. If this attribute is set to false,
		  * the distance computation ignores any parent transforms of the LOD transform. 
		  *
		  * To access this property do: WorldSpace.Get().
		  * To set this property do: WorldSpace.Set(bool).
		  *
		  * Default value is false
		  */
		FbxPropertyT<FbxBool>       WorldSpace;
	//@}

    //////////////////////////////////////////////////////////////////////////
    //
    // Methods
    //
    //////////////////////////////////////////////////////////////////////////

	/** Get the number of elements in the threshold list.
	  * In correct situations, the size of this list is one less than the LOD node
	  * children objects count.
	  * \return The current size of the threshold list.
	  */
	int GetNumThresholds() const;

	/** Add a new threshold. 
	  * \param pThreshValue Threshold value (distance).
	  * \return true if successful and false otherwise.
	  * \remarks The thresholds list can only expand. Removing items is not
	  *          possible unless a new FbxLODGroup is created to replace this one.
	  * \remarks This method does not check the received value and blindly adds it
	  *          to the list. Identical values can exist in different positions in
	  *          the list.
	  * \remarks This method will fail if ThresholdsUsedAsPercentage=true.
	  */
	bool AddThreshold(const FbxDistance& pThreshValue);

	/** Add a new threshold. 
	  * \param pThreshValue Threshold value (percentage).
	  * \return true if successful and false otherwise.
	  * \remarks The thresholds list can only expand. Removing items is not
	  *          possible unless a new FbxLODGroup is created to replace this one.
	  * \remarks This method does not check the received value and blindly adds it
	  *          to the list. Identical values can exist in different positions in
	  *          the list.
	  * \remarks This method will fail if ThresholdsUsedAsPercentage=false.
	  */
	bool AddThreshold(FbxDouble pThreshValue);

	/** Replace the value of the specified threshold.
	  * \param pEl Element index in the thresholds list.
	  * \param pThreshValue New threshold value (distance).
	  * \return true if successful and false otherwise.
	  * \remarks This method will fail if ThresholdsUsedAsPercentage=true.
	  */
	bool SetThreshold(int pEl, const FbxDistance& pThreshValue);

	/** Replace the value of the specified threshold.
	  * \param pEl Element index in the thresholds list.
	  * \param pThreshValue New threshold value (percentage).
	  * \return true if successful and false otherwise.
	  * \remarks This method will fail if ThresholdsUsedAsPercentage=false.
	  */
	bool SetThreshold(int pEl, FbxDouble pThreshValue);

	/** Get the value of the specified threshold.
      * \param pEl Element index in the thresholds list.
	  * \param pThreshValue The current threshold value.
	  * \return true if successful and false otherwise.  
	  * \remarks pThreshValue is left unchanged if a bad index is provided, 
	  *          else the value stored in the list is returned in pThreshValue
	  *          but may be irrelevant if ThresholdsUsedAsPercentage=true. In
      *          this case, the return of this function will also be \c false.
	  */
	bool GetThreshold(int pEl, FbxDistance& pThreshValue) const;

	/** Get the value of the specified threshold.
      * \param pEl Element index in the thresholds list.
	  * \param pThreshValue The current threshold value.
	  * \return true if successful and false otherwise.
	  * \remarks pThreshValue is left unchanged if a bad index is provided, 
	  *          else the value stored in the list is returned in pThreshValue
	  *          but may be irrelevant if ThresholdsUsedAsPercentage=false. In
      *          this case, the return of this function will also be \c false.
	  */
	bool GetThreshold(int pEl, FbxDouble& pThreshValue) const;

	/** Get the number of elements in the displayLevel list.
	  * In correct situations, the size of this list equals the LOD node
	  * children objects count.
	  * \return The current size of the displayLevel list.
	  */
	int GetNumDisplayLevels() const;

	/** Add a new displayLevel value to the current list.
	  *
	  * The value overrides the display of any level and can force it to hide 
	  * or show the object at that level. For example, if the distance between
	  * the group and the camera is smaller than the first threshold, then the 
	  * object at level 0 is visible. If the display level for the object at 
	  * level 2 is changed to eShow, ie. if the attribute displayLevel[2] is 
	  * set to eShow, then the object at level 2 will show regardless of
	  * the current active level. 
	  *
	  * \param pValue Display level value
	  * \return true if successful and false if any error occurred.
	  * \remarks Removing items is not possible unless a new FbxLODGroup is 
	  *          created to replace this one.
	  * \remarks This method does not check the received value and blindly adds it
	  *          to the list. Identical values can exist in different positions in
	  *          the list.
	  */
	bool AddDisplayLevel(FbxLODGroup::EDisplayLevel pValue);

	/** Set the display level value for the specified child object.
	  * \param pEl The index of the object.
	  * \param pValue New display level value.
	  * \return true if successful and false otherwise.
	  */
	bool SetDisplayLevel(int pEl, FbxLODGroup::EDisplayLevel pValue);

	/** Get the display level value for the specified child object.
      * \param pEl The index of the object.
	  * \param pValue the current display level value.
	  * \return true if successful and false otherwise.
	  * \remarks In case of failure, the pValue is left unchanged.
	  */
	bool GetDisplayLevel(int pEl, FbxLODGroup::EDisplayLevel& pValue) const;
	
/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
    virtual FbxObject& Copy(const FbxObject& pObject);

protected:
	virtual void Construct(const FbxObject* pFrom);
    virtual void ConstructProperties(bool pForceSet);

private:
	int mNbThresholds;
	FbxProperty mThresholds;

	bool RetrieveThreshold(int pEl, FbxDistance& pThreshValue) const;
	bool StoreThreshold(int pEl, const FbxDistance& pThreshValue);

	int mNbDisplayLevels;
	FbxProperty mDisplayLevels;

	bool DisplayLevel(int pEl, FbxLODGroup::EDisplayLevel pValue);

public:
    virtual FbxStringList GetTypeFlags() const;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

inline EFbxType FbxTypeOf(const FbxLODGroup::EDisplayLevel&){ return eFbxEnum; }

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_SCENE_GEOMETRY_LOD_GROUP_H_ */
