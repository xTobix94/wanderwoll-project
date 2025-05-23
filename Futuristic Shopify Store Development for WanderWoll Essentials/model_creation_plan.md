# 3D Model Creation Plan for WanderWoll essentials

## Overview

This document outlines the approach for creating the 3D models needed for the WanderWoll essentials Shopify store, focusing on the priority products for the MVP launch.

## Priority Models

### 1. Unisex Merino T-shirt
- **Complexity**: Medium
- **Key Features**: Natural fabric draping, collar detail, sleeve cuffs
- **Estimated Development Time**: 3-4 days

### 2. Merino Hoodie
- **Complexity**: High
- **Key Features**: Hood, pocket details, drawstrings, zipper (if applicable)
- **Estimated Development Time**: 4-5 days

## Creation Methodology

### 1. Reference Gathering
- Collect high-quality reference images of merino products
- Document key measurements and proportions
- Identify distinctive features for each product

### 2. Base Mesh Creation
- Create low-poly base mesh for each garment
- Establish proper topology for natural deformation
- Set up UV coordinates for texture mapping

### 3. Detail Modeling
- Add product-specific details (collars, cuffs, seams)
- Model fabric folds and draping
- Create variations for different sizes if needed

### 4. UV Mapping & Texturing
- Create efficient UV layouts
- Develop base color textures for each variant
- Create normal maps for fabric detail
- Develop roughness maps for realistic material properties

### 5. Rigging (if needed)
- Simple rig for basic pose adjustments
- Set up blend shapes for fabric movement

### 6. Optimization
- Reduce polygon count while maintaining visual quality
- Optimize texture sizes
- Create LOD (Level of Detail) versions for mobile

### 7. Export & Integration
- Export to glTF (.glb) format
- Test in Three.js environment
- Integrate with WanderWoll 3D viewer

## Technical Specifications

### Polygon Budget
- T-shirt: 8,000-10,000 polygons
- Hoodie: 12,000-15,000 polygons

### Texture Maps
- Diffuse/Albedo: 1024x1024px
- Normal: 1024x1024px
- Roughness: 512x512px

### File Size Targets
- T-shirt: < 1.5MB
- Hoodie: < 2MB

## Color Variants

Each model will support three color variants:
1. Forest Green (#2E8B57)
2. Beige (#F5DEB3)
3. Black (#000000)

## Tools & Software

- **Modeling**: Blender (open-source)
- **Texturing**: Substance Painter or Blender
- **UV Mapping**: Blender
- **Optimization**: Blender + custom scripts
- **Format Conversion**: glTF tools

## Quality Assurance

Each model will undergo the following QA process:
1. Visual inspection against reference images
2. Technical validation (polygon count, UV efficiency)
3. Performance testing in Three.js
4. Cross-device compatibility testing
5. Integration testing with the 3D viewer

## Timeline

1. **Reference Gathering & Planning**: 1 day
2. **T-shirt Model Creation**: 3-4 days
3. **Hoodie Model Creation**: 4-5 days
4. **Testing & Optimization**: 2-3 days
5. **Integration & Final Validation**: 1-2 days

Total estimated time: 11-15 days

## Next Steps

1. Begin reference gathering for the Merino T-shirt
2. Set up Blender environment with export plugins
3. Create base mesh for T-shirt model
4. Develop initial texture tests for merino wool material
