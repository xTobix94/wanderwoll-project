# 3D Models for WanderWoll essentials

This directory will contain the 3D models for the WanderWoll essentials product lineup.

## Priority Models (MVP)

1. **Unisex Merino T-shirt**
   - Format: glTF (.glb)
   - Max file size: 2MB
   - Texture resolution: 1024x1024
   - Polygon count target: <10,000

2. **Merino Hoodie**
   - Format: glTF (.glb)
   - Max file size: 2MB
   - Texture resolution: 1024x1024
   - Polygon count target: <15,000

## Phase 2 Models

1. **Merino Socks**
2. **Merino Shorts**
3. **Merino Beanie**

## Model Requirements

- All models must be optimized for web performance
- Models should include proper UV mapping for texture application
- Realistic fabric draping and folds should be included
- Models should be centered at origin with proper scaling
- All models should be compatible with the WanderWoll 3D viewer

## Texture Maps

Each model should include the following texture maps:
- Diffuse/Albedo
- Normal
- Roughness (for PBR rendering)

## Color Variants

Each model should support the following color variants:
- Forest Green (#2E8B57)
- Beige (#F5DEB3)
- Black (#000000)

## Optimization Guidelines

1. Use appropriate LOD (Level of Detail) for different device capabilities
2. Compress textures using appropriate formats (WebP where supported)
3. Simplify geometry where possible without sacrificing visual quality
4. Ensure smooth animation and interaction on mobile devices
