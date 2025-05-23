# Performance Optimization Implementation

## Image Optimization

```javascript
/**
 * WanderWoll essentials - Image Optimization Script
 * 
 * This script optimizes all images in the theme to improve loading performance.
 * It implements lazy loading, responsive images, and WebP conversion.
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const glob = require('glob');
const imagemin = require('imagemin');
const imageminPngquant = require('imagemin-pngquant');
const imageminMozjpeg = require('imagemin-mozjpeg');
const imageminSvgo = require('imagemin-svgo');
const imageminWebp = require('imagemin-webp');

// Configuration
const config = {
  inputDir: '../shopify-theme/assets',
  outputDir: '../shopify-theme/assets/optimized',
  webpOutputDir: '../shopify-theme/assets/optimized/webp',
  responsiveSizes: [320, 640, 960, 1280, 1920],
  quality: 80,
  svgoPlugins: [
    { removeViewBox: false },
    { cleanupIDs: false },
    { removeUselessDefs: true },
    { removeEmptyAttrs: true }
  ]
};

// Create output directories if they don't exist
if (!fs.existsSync(config.outputDir)) {
  fs.mkdirSync(config.outputDir, { recursive: true });
}

if (!fs.existsSync(config.webpOutputDir)) {
  fs.mkdirSync(config.webpOutputDir, { recursive: true });
}

// Process all images
async function processImages() {
  try {
    // Get all image files
    const imageFiles = glob.sync(path.join(config.inputDir, '**/*.{jpg,jpeg,png,svg}'));
    console.log(`Found ${imageFiles.length} images to process`);

    // Process each image
    for (const file of imageFiles) {
      const filename = path.basename(file);
      const ext = path.extname(file).toLowerCase();
      const basename = path.basename(file, ext);
      
      console.log(`Processing ${filename}...`);

      // Skip already optimized images
      if (file.includes('/optimized/')) {
        console.log(`Skipping already optimized image: ${filename}`);
        continue;
      }

      // Optimize based on file type
      if (ext === '.svg') {
        // Optimize SVG
        await optimizeSvg(file, path.join(config.outputDir, filename));
      } else if (ext === '.jpg' || ext === '.jpeg' || ext === '.png') {
        // Optimize raster images
        await optimizeRaster(file, basename, ext);
        
        // Create WebP version
        await createWebP(file, basename);
        
        // Create responsive versions
        await createResponsiveImages(file, basename, ext);
      }
    }

    console.log('Image optimization complete!');
  } catch (error) {
    console.error('Error processing images:', error);
  }
}

// Optimize SVG files
async function optimizeSvg(inputFile, outputFile) {
  try {
    const result = await imagemin([inputFile], {
      destination: path.dirname(outputFile),
      plugins: [
        imageminSvgo({
          plugins: config.svgoPlugins
        })
      ]
    });
    
    console.log(`Optimized SVG: ${path.basename(outputFile)}`);
    return result;
  } catch (error) {
    console.error(`Error optimizing SVG ${inputFile}:`, error);
  }
}

// Optimize raster images (JPG, PNG)
async function optimizeRaster(inputFile, basename, ext) {
  try {
    const outputFile = path.join(config.outputDir, `${basename}${ext}`);
    
    const plugins = [];
    if (ext === '.jpg' || ext === '.jpeg') {
      plugins.push(imageminMozjpeg({ quality: config.quality }));
    } else if (ext === '.png') {
      plugins.push(imageminPngquant({ quality: [config.quality / 100, 0.9] }));
    }
    
    const result = await imagemin([inputFile], {
      destination: path.dirname(outputFile),
      plugins: plugins
    });
    
    console.log(`Optimized raster image: ${basename}${ext}`);
    return result;
  } catch (error) {
    console.error(`Error optimizing raster image ${inputFile}:`, error);
  }
}

// Create WebP version of image
async function createWebP(inputFile, basename) {
  try {
    const outputFile = path.join(config.webpOutputDir, `${basename}.webp`);
    
    const result = await imagemin([inputFile], {
      destination: path.dirname(outputFile),
      plugins: [
        imageminWebp({ quality: config.quality })
      ]
    });
    
    console.log(`Created WebP version: ${basename}.webp`);
    return result;
  } catch (error) {
    console.error(`Error creating WebP for ${inputFile}:`, error);
  }
}

// Create responsive versions of image
async function createResponsiveImages(inputFile, basename, ext) {
  try {
    const image = sharp(inputFile);
    const metadata = await image.metadata();
    
    // Only create responsive versions for images larger than the smallest size
    if (metadata.width <= config.responsiveSizes[0]) {
      console.log(`Skipping responsive versions for ${basename}${ext} (too small)`);
      return;
    }
    
    // Create each size
    for (const width of config.responsiveSizes) {
      // Skip sizes larger than the original
      if (width >= metadata.width) continue;
      
      const outputFile = path.join(config.outputDir, `${basename}_${width}${ext}`);
      
      await sharp(inputFile)
        .resize(width)
        .toFile(outputFile);
      
      // Also create WebP version
      const webpOutputFile = path.join(config.webpOutputDir, `${basename}_${width}.webp`);
      
      await sharp(inputFile)
        .resize(width)
        .webp({ quality: config.quality })
        .toFile(webpOutputFile);
      
      console.log(`Created responsive version: ${basename}_${width}${ext} and WebP`);
    }
  } catch (error) {
    console.error(`Error creating responsive versions for ${inputFile}:`, error);
  }
}

// Generate Liquid snippet for responsive images
function generateResponsiveImageSnippet() {
  const snippetContent = `{% comment %}
  WanderWoll essentials - Responsive Image Snippet
  
  Usage:
  {% render 'responsive-image' with image: image, alt: 'Alt text', class: 'optional-class' %}
{% endcomment %}

{% assign sizes = '320,640,960,1280,1920' | split: ',' %}
{% assign img_url = image | img_url: 'master' %}
{% assign img_base_url = image | img_url: 'master' | split: '?' | first %}
{% assign img_ext = img_base_url | split: '.' | last %}
{% assign supports_webp = true %}

<picture>
  {% if supports_webp %}
    <source
      type="image/webp"
      srcset="
        {% for size in sizes %}
          {% assign img_size = size | append: 'x' %}
          {% if image.width >= size %}
            {{ image | img_url: img_size, format: 'webp' }} {{ size }}w,
          {% endif %}
        {% endfor %}
        {{ image | img_url: 'master', format: 'webp' }} {{ image.width }}w
      "
      sizes="(max-width: {{ image.width }}px) 100vw, {{ image.width }}px"
    >
  {% endif %}
  
  <source
    type="image/{{ img_ext }}"
    srcset="
      {% for size in sizes %}
        {% assign img_size = size | append: 'x' %}
        {% if image.width >= size %}
          {{ image | img_url: img_size }} {{ size }}w,
        {% endif %}
      {% endfor %}
      {{ image | img_url: 'master' }} {{ image.width }}w
    "
    sizes="(max-width: {{ image.width }}px) 100vw, {{ image.width }}px"
  >
  
  <img
    src="{{ image | img_url: '1280x' }}"
    alt="{{ alt | escape }}"
    width="{{ image.width }}"
    height="{{ image.height }}"
    loading="lazy"
    class="{{ class }}"
  >
</picture>`;

  fs.writeFileSync('../shopify-theme/snippets/responsive-image.liquid', snippetContent);
  console.log('Generated responsive image snippet: snippets/responsive-image.liquid');
}

// Run the optimization
processImages().then(() => {
  generateResponsiveImageSnippet();
});
```

## CSS Optimization

```javascript
/**
 * WanderWoll essentials - CSS Optimization Script
 * 
 * This script optimizes CSS files by minifying, combining, and extracting critical CSS.
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');
const CleanCSS = require('clean-css');
const criticalCss = require('critical');
const postcss = require('postcss');
const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');
const purgecss = require('@fullhuman/postcss-purgecss');

// Configuration
const config = {
  inputDir: '../shopify-theme/assets',
  outputDir: '../shopify-theme/assets/optimized',
  htmlFiles: ['../shopify-theme/layout/theme.liquid', '../shopify-theme/templates/*.liquid'],
  criticalPages: [
    { template: '../shopify-theme/templates/index.liquid', output: 'critical-home.css' },
    { template: '../shopify-theme/templates/product.liquid', output: 'critical-product.css' },
    { template: '../shopify-theme/templates/collection.liquid', output: 'critical-collection.css' }
  ]
};

// Create output directory if it doesn't exist
if (!fs.existsSync(config.outputDir)) {
  fs.mkdirSync(config.outputDir, { recursive: true });
}

// Process all CSS files
async function processCssFiles() {
  try {
    // Get all CSS files
    const cssFiles = glob.sync(path.join(config.inputDir, '**/*.css'));
    console.log(`Found ${cssFiles.length} CSS files to process`);

    // Skip already optimized files
    const filesToProcess = cssFiles.filter(file => !file.includes('/optimized/'));
    console.log(`Processing ${filesToProcess.length} CSS files`);

    // Process each file
    for (const file of filesToProcess) {
      const filename = path.basename(file);
      console.log(`Processing ${filename}...`);
      
      // Read CSS content
      const css = fs.readFileSync(file, 'utf8');
      
      // Process with PostCSS
      const result = await postcss([
        autoprefixer,
        purgecss({
          content: config.htmlFiles,
          defaultExtractor: content => content.match(/[\w-/:]+(?<!:)/g) || []
        }),
        cssnano
      ]).process(css, { from: file });
      
      // Write optimized file
      const outputFile = path.join(config.outputDir, filename);
      fs.writeFileSync(outputFile, result.css);
      console.log(`Optimized CSS: ${filename}`);
    }

    // Combine CSS files
    await combineCssFiles(filesToProcess);
    
    // Extract critical CSS
    await extractCriticalCss();

    console.log('CSS optimization complete!');
  } catch (error) {
    console.error('Error processing CSS:', error);
  }
}

// Combine CSS files
async function combineCssFiles(files) {
  try {
    // Group files by purpose
    const themeFiles = files.filter(file => file.includes('theme') || file.includes('base'));
    const componentFiles = files.filter(file => !themeFiles.includes(file));
    
    // Combine theme CSS
    if (themeFiles.length > 0) {
      const themeContents = themeFiles.map(file => fs.readFileSync(file, 'utf8')).join('\n');
      const minified = new CleanCSS().minify(themeContents);
      fs.writeFileSync(path.join(config.outputDir, 'theme-combined.css'), minified.styles);
      console.log(`Combined ${themeFiles.length} theme CSS files into theme-combined.css`);
    }
    
    // Combine component CSS
    if (componentFiles.length > 0) {
      const componentContents = componentFiles.map(file => fs.readFileSync(file, 'utf8')).join('\n');
      const minified = new CleanCSS().minify(componentContents);
      fs.writeFileSync(path.join(config.outputDir, 'components-combined.css'), minified.styles);
      console.log(`Combined ${componentFiles.length} component CSS files into components-combined.css`);
    }
  } catch (error) {
    console.error('Error combining CSS files:', error);
  }
}

// Extract critical CSS
async function extractCriticalCss() {
  try {
    for (const page of config.criticalPages) {
      console.log(`Extracting critical CSS for ${page.template}...`);
      
      const result = await criticalCss.generate({
        src: page.template,
        target: path.join(config.outputDir, page.output),
        width: 1300,
        height: 900,
        minify: true
      });
      
      console.log(`Generated critical CSS: ${page.output}`);
    }
  } catch (error) {
    console.error('Error extracting critical CSS:', error);
  }
}

// Generate Liquid snippet for critical CSS
function generateCriticalCssSnippet() {
  const snippetContent = `{% comment %}
  WanderWoll essentials - Critical CSS Snippet
  
  This snippet loads critical CSS inline and defers non-critical CSS.
{% endcomment %}

{% assign template_name = template.name | default: 'index' %}

<style>
  {% case template_name %}
    {% when 'index' %}
      {% include 'critical-home.css' %}
    {% when 'product' %}
      {% include 'critical-product.css' %}
    {% when 'collection' %}
      {% include 'critical-collection.css' %}
    {% else %}
      {% include 'critical-home.css' %}
  {% endcase %}
</style>

<link rel="preload" href="{{ 'theme-combined.css' | asset_url }}" as="style" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="{{ 'theme-combined.css' | asset_url }}"></noscript>

<link rel="preload" href="{{ 'components-combined.css' | asset_url }}" as="style" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="{{ 'components-combined.css' | asset_url }}"></noscript>

<script>
  // Tiny script to load CSS asynchronously
  !function(n){"use strict";n.loadCSS||(n.loadCSS=function(){});var o=loadCSS.relpreload={};if(o.support=function(){var e;try{e=n.document.createElement("link").relList.supports("preload")}catch(t){e=!1}return function(){return e}}(),o.bindMediaToggle=function(t){var e=t.media||"all";function a(){t.addEventListener?t.removeEventListener("load",a):t.attachEvent&&t.detachEvent("onload",a),t.setAttribute("onload",null),t.media=e}t.addEventListener?t.addEventListener("load",a):t.attachEvent&&t.attachEvent("onload",a),setTimeout(function(){t.rel="stylesheet",t.media="only x"}),setTimeout(a,3e3)},o.poly=function(){if(!o.support())for(var t=n.document.getElementsByTagName("link"),e=0;e<t.length;e++){var a=t[e];"preload"!==a.rel||"style"!==a.getAttribute("as")||a.getAttribute("data-loadcss")||(a.setAttribute("data-loadcss",!0),o.bindMediaToggle(a))}},!o.support()){o.poly();var t=n.setInterval(o.poly,500);n.addEventListener?n.addEventListener("load",function(){o.poly(),n.clearInterval(t)}):n.attachEvent&&n.attachEvent("onload",function(){o.poly(),n.clearInterval(t)})}"undefined"!=typeof exports?exports.loadCSS=loadCSS:n.loadCSS=loadCSS}("undefined"!=typeof global?global:this);
</script>`;

  fs.writeFileSync('../shopify-theme/snippets/critical-css.liquid', snippetContent);
  console.log('Generated critical CSS snippet: snippets/critical-css.liquid');
}

// Run the optimization
processCssFiles().then(() => {
  generateCriticalCssSnippet();
});
```

## JavaScript Optimization

```javascript
/**
 * WanderWoll essentials - JavaScript Optimization Script
 * 
 * This script optimizes JavaScript files by minifying, combining, and deferring loading.
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');
const terser = require('terser');
const rollup = require('rollup');
const { nodeResolve } = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const { babel } = require('@rollup/plugin-babel');

// Configuration
const config = {
  inputDir: '../shopify-theme/assets',
  outputDir: '../shopify-theme/assets/optimized',
  vendorFiles: [
    // List vendor files that should be bundled separately
    '../shopify-theme/assets/jquery.min.js',
    '../shopify-theme/assets/slick.min.js'
  ],
  moduleGroups: {
    'core': [
      '../shopify-theme/assets/theme.js',
      '../shopify-theme/assets/cart.js',
      '../shopify-theme/assets/product.js'
    ],
    '3d-viewer': [
      '../shopify-theme/assets/3d-viewer.js',
      '../shopify-theme/assets/model-loader.js'
    ],
    'ar-viewer': [
      '../shopify-theme/assets/ar-viewer.js'
    ],
    'design-uploader': [
      '../shopify-theme/assets/design-upload-component.js',
      '../shopify-theme/assets/design-editor-component.js',
      '../shopify-theme/assets/design-3d-integration.js',
      '../sho
(Content truncated due to size limit. Use line ranges to read in chunks)