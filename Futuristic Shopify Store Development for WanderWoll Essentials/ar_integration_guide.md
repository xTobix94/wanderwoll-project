# WanderWoll essentials AR Integration Guide

## Overview

This guide provides comprehensive instructions for integrating the Augmented Reality (AR) try-on functionality into the WanderWoll essentials Shopify store. The AR feature allows customers to virtually try on merino products before purchasing, enhancing the shopping experience and potentially increasing conversion rates.

## Architecture

The AR integration consists of several key components:

1. **AR Integration Module** (`ar_integration_module.js`)
   - Core functionality for AR features
   - Handles communication with VirtualThreads.io API
   - Provides fallback mechanisms for unsupported devices
   - Manages AR sessions and body tracking

2. **AR Viewer Component** (`ar_viewer_component.js`)
   - User interface for AR experience
   - Handles user interactions and events
   - Displays 3D models and AR content
   - Provides size recommendations

3. **Shopify Integration** (`shopify_integration.js`)
   - Connects AR functionality to Shopify store
   - Extracts product information from Shopify
   - Handles variant changes and updates
   - Provides Liquid snippets for theme integration

4. **Liquid Snippet** (`wanderwoll-ar-viewer.liquid`)
   - Embeds AR viewer in product pages
   - Configures AR functionality based on product metafields
   - Loads necessary scripts and resources

## Installation

### 1. Upload JavaScript Files

Upload the following files to your Shopify theme's assets directory:

- `ar_integration_module.js`
- `ar_viewer_component.js`
- `shopify_integration.js`
- `virtualthreads-ar.js` (download from VirtualThreads.io)

### 2. Add Liquid Snippet

Create a new snippet file called `wanderwoll-ar-viewer.liquid` in your theme's snippets directory with the following content:

```liquid
{% comment %}
  WanderWoll essentials AR Viewer Snippet
  
  This snippet adds the AR viewer to product pages.
  Include this in your product template.
{% endcomment %}

<div id="wanderwoll-ar-viewer-container" class="wanderwoll-ar-viewer-container">
  {% if product.metafields.wanderwoll.ar_enabled %}
    <div id="wanderwoll-ar-viewer" class="wanderwoll-ar-viewer"></div>
    
    <script>
      document.addEventListener('DOMContentLoaded', function() {
        // Initialize AR integration when scripts are loaded
        if (typeof ARShopifyIntegration !== 'undefined') {
          new ARShopifyIntegration({
            apiKey: '{{ shop.metafields.wanderwoll.ar_api_key }}',
            scriptUrl: '{{ 'virtualthreads-ar.js' | asset_url }}',
            arModuleUrl: '{{ 'ar_integration_module.js' | asset_url }}',
            arViewerComponentUrl: '{{ 'ar_viewer_component.js' | asset_url }}'
          });
        } else {
          console.error('ARShopifyIntegration not loaded');
        }
      });
    </script>
  {% endif %}
</div>
```

### 3. Include Snippet in Product Template

Add the following line to your product template (usually `product-template.liquid` or `product.liquid`):

```liquid
{% include 'wanderwoll-ar-viewer' %}
```

Add it just after the product description or where you want the AR viewer to appear.

### 4. Add Metafields

Add the following metafields to your shop:

- Namespace: `wanderwoll`
- Key: `ar_api_key`
- Value: Your VirtualThreads API key

For each product that should have AR:

- Namespace: `wanderwoll`
- Key: `ar_enabled`
- Value: `true`

## Configuration

### AR Module Configuration

The AR Integration Module can be configured with the following options:

```javascript
const arModule = new ARIntegrationModule({
  apiKey: 'your-api-key',           // VirtualThreads API key
  arEndpoint: 'https://...',        // API endpoint (optional)
  fallbackEnabled: true,            // Enable fallback for unsupported devices
  logLevel: 'info',                 // Logging level: error, warn, info, debug
  cacheEnabled: true                // Enable caching for better performance
});
```

### AR Viewer Component Configuration

The AR Viewer Component can be configured with the following options:

```javascript
const arViewer = new ARViewerComponent({
  containerId: 'ar-viewer-container',  // DOM element ID to mount the AR viewer
  productType: 'tshirt',               // Product type: tshirt, hoodie, shorts, etc.
  colorVariant: 'forest-green',        // Color variant: forest-green, beige, black, etc.
  showSizeRecommendation: true,        // Show size recommendation
  showScreenshotButton: true,          // Show screenshot button
  showShareButton: true,               // Show share button
  arModule: arModule,                  // AR module instance
  onReady: () => { console.log('AR viewer ready'); },  // Callback when viewer is ready
  onError: (error) => { console.error(error); }        // Callback when error occurs
});
```

### Shopify Integration Configuration

The Shopify Integration can be configured with the following options:

```javascript
const arShopifyIntegration = new ARShopifyIntegration({
  apiKey: 'your-api-key',                // VirtualThreads API key
  scriptUrl: '/path/to/virtualthreads-ar.js',  // VirtualThreads script URL
  arModuleUrl: '/path/to/ar_integration_module.js',  // AR module script URL
  arViewerComponentUrl: '/path/to/ar_viewer_component.js',  // AR viewer component script URL
  productSelector: '.product-single__media',  // Selector for product media container
  buttonContainerSelector: '.product-single__description',  // Selector for button container
  addToCartSelector: '.product-form__cart-submit'  // Selector for add to cart button
});
```

## Usage

### Basic Usage

Once installed and configured, the AR viewer will automatically appear on product pages where the `ar_enabled` metafield is set to `true`. Customers can click the "Try On AR" button to start the AR experience.

### Changing Product Variants

The AR viewer will automatically update when customers change product variants (e.g., color, size). The appropriate 3D model and color will be loaded based on the selected variant.

### Size Recommendations

When customers use the AR try-on feature, they will receive personalized size recommendations based on their body measurements. This can help reduce returns and improve customer satisfaction.

### Screenshots and Sharing

Customers can take screenshots of their AR experience and share them on social media or with friends. This can help increase brand awareness and engagement.

## Troubleshooting

### AR Not Working on Some Devices

The AR functionality requires WebXR support and camera access. If a device doesn't support these features, a fallback 3D viewer will be shown instead. Make sure fallback is enabled in the configuration.

### 3D Models Not Loading

If 3D models are not loading, check the following:

1. Ensure the product type and color variant are correctly set
2. Check if the VirtualThreads API key is valid
3. Verify that the necessary scripts are loaded
4. Check the browser console for error messages

### Performance Issues

If the AR experience is slow or laggy, consider the following optimizations:

1. Reduce the polygon count of 3D models
2. Optimize textures for web use
3. Enable caching in the configuration
4. Use level-of-detail (LOD) models for different devices

## Testing

A comprehensive test suite is included to validate the AR functionality. Use the test runner to ensure everything is working correctly:

1. Open `test_runner.html` in a browser
2. Click "Run All Tests" to run the complete test suite
3. Check the test results and fix any issues

## Browser Compatibility

The AR functionality is compatible with the following browsers:

- Chrome 79+ on Android
- Safari 13+ on iOS
- Chrome 79+ on desktop
- Edge 79+ on desktop
- Firefox 76+ on desktop

## Performance Metrics

The AR integration is optimized to meet the following performance targets:

- Initial load time: < 3 seconds on fast connection
- AR session start time: < 2 seconds on fast connection
- Memory usage: < 300MB during AR session
- Frame rate: > 30 FPS on mid-range devices

## Security Considerations

The AR functionality requires camera access, which may raise privacy concerns for some users. Make sure to:

1. Only request camera access when necessary
2. Clearly explain why camera access is needed
3. Provide a privacy policy that addresses AR functionality
4. Do not store or transmit camera data without user consent

## Maintenance

### Updating VirtualThreads Integration

When new versions of the VirtualThreads API are released:

1. Download the latest `virtualthreads-ar.js` file
2. Upload it to your Shopify theme's assets directory
3. Test the AR functionality to ensure compatibility
4. Update the integration code if necessary

### Adding New Product Types

To add support for new product types:

1. Create 3D models for the new product type
2. Add the product type to the size recommendation algorithm
3. Update the product type mapping in the Shopify integration
4. Test the AR functionality with the new product type

## Support

For technical support or questions about the AR integration, contact:

- Email: support@wanderwoll.de
- Documentation: https://docs.wanderwoll.de/ar-integration
- VirtualThreads Support: https://support.virtualthreads.io

## Conclusion

The AR try-on functionality enhances the WanderWoll essentials shopping experience by allowing customers to virtually try on products before purchasing. This can lead to increased conversion rates, reduced returns, and improved customer satisfaction.
