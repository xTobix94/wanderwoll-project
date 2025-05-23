# WanderWoll essentials 3D Viewer Integration Guide

## Overview

This document provides instructions for integrating the WanderWoll essentials 3D product viewer into the Shopify theme. The 3D viewer allows customers to interact with product models in 360 degrees, view different color variants, and examine product details.

## Prerequisites

Before integration, ensure you have:

1. Access to the Shopify theme code
2. 3D models in glTF (.glb) format for your products
3. Product textures for different color variants
4. Basic understanding of Liquid templating language

## File Structure

The 3D viewer system consists of the following components:

```
assets/
├── three.min.js           # Three.js library
├── OrbitControls.js       # Camera controls
├── GLTFLoader.js          # Model loader
├── three-viewer.js        # WanderWoll 3D viewer component
├── model-loader.js        # Optimized model loading
└── product-models.js      # Product model configurations

snippets/
└── 3d-viewer.liquid       # Reusable viewer snippet
```

## Integration Steps

### 1. Upload JavaScript Assets

Upload all JavaScript files to your theme's assets directory:

```
three.min.js
OrbitControls.js
GLTFLoader.js
three-viewer.js
model-loader.js
product-models.js
```

### 2. Add 3D Viewer Snippet

Create a new snippet file called `3d-viewer.liquid` with the provided code.

### 3. Add Product Metafields

For each product that should have a 3D model:

1. Go to the product in your Shopify admin
2. Add the following metafields:
   - Namespace: `wanderwoll`
   - Key: `has_3d_model`
   - Value: `true`
   - Type: `Boolean`

   - Namespace: `wanderwoll`
   - Key: `model_url`
   - Value: URL to the 3D model file (e.g., `https://cdn.shopify.com/s/files/1/0000/0000/products/merino-tshirt.glb`)
   - Type: `Single line text`

### 4. Update Product Template

Modify your product template to include the 3D viewer:

```liquid
{% if product.metafields.wanderwoll.has_3d_model %}
  <div class="product-3d-viewer-container">
    {% render '3d-viewer', product: product %}
  </div>
{% else %}
  <!-- Standard product images -->
  <div class="product-image-gallery">
    {% for image in product.images %}
      <img src="{{ image | img_url: 'large' }}" alt="{{ image.alt | escape }}">
    {% endfor %}
  </div>
{% endif %}
```

### 5. Add Styling

Add the following CSS to your theme's stylesheet:

```css
.product-3d-viewer-container {
  width: 100%;
  height: 500px;
  margin-bottom: 2rem;
}

@media (max-width: 768px) {
  .product-3d-viewer-container {
    height: 350px;
  }
}
```

### 6. Configure Product Models

Update the `product-models.js` file with your specific product configurations:

```javascript
const WANDERWOLL_PRODUCT_MODELS = {
  'merino-tshirt': {
    name: 'Unisex Merino T-Shirt',
    modelPath: '/3d-assets/models/merino-tshirt.glb',
    // Additional configuration...
  },
  // Add more products...
};
```

## Testing

After integration, test the 3D viewer with the following checklist:

1. Verify the 3D model loads correctly
2. Test rotation and zoom functionality
3. Ensure color variants work properly
4. Test on mobile devices
5. Verify performance metrics (loading time, frame rate)

## Troubleshooting

### Model Not Loading

- Check that the model URL is correct and accessible
- Verify that the metafields are set correctly
- Check browser console for JavaScript errors

### Performance Issues

- Ensure models are optimized (under 2MB)
- Reduce polygon count if necessary
- Optimize textures to appropriate sizes

### Mobile Compatibility

- Test on various mobile devices
- Ensure touch controls work properly
- Verify responsive design adapts correctly

## Advanced Customization

### Custom Controls

You can customize the controls by modifying the `three-viewer.js` file:

```javascript
// Example: Change rotation speed
this.rotationSpeed = options.rotationSpeed || 0.01;
```

### Additional Features

To add features like annotations or hotspots:

1. Modify the `WanderWollProductViewer` class in `three-viewer.js`
2. Add methods for the new functionality
3. Update the snippet to expose the new options

## Support

For additional support or custom development needs, contact the development team.
