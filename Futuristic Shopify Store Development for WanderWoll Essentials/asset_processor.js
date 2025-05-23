/**
 * WanderWoll essentials - CGTrader Asset Processor
 * 
 * This script handles the downloading, processing, and optimization of
 * 3D models from CGTrader for the WanderWoll essentials Shopify store.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

// Configuration
const CONFIG = {
  assetDir: path.resolve(__dirname, '../assets'),
  rawDir: path.resolve(__dirname, '../assets/raw'),
  processedDir: path.resolve(__dirname, '../assets/processed'),
  optimizedDir: path.resolve(__dirname, '../assets/optimized'),
  metadataFile: path.resolve(__dirname, '../assets/asset_metadata.json'),
  blenderPath: 'blender', // Assumes blender is in PATH
  colors: {
    'forest-green': '#2E8B57',
    'beige': '#F5DEB3',
    'black': '#000000'
  }
};

// Ensure directories exist
function ensureDirectories() {
  [CONFIG.assetDir, CONFIG.rawDir, CONFIG.processedDir, CONFIG.optimizedDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }
  });
}

// Initialize metadata file if it doesn't exist
function initializeMetadata() {
  if (!fs.existsSync(CONFIG.metadataFile)) {
    const initialMetadata = {
      assets: [],
      lastUpdated: new Date().toISOString()
    };
    
    fs.writeFileSync(CONFIG.metadataFile, JSON.stringify(initialMetadata, null, 2));
    console.log(`Initialized metadata file: ${CONFIG.metadataFile}`);
  }
}

// Load metadata
function loadMetadata() {
  try {
    const data = fs.readFileSync(CONFIG.metadataFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error loading metadata: ${error.message}`);
    return { assets: [], lastUpdated: new Date().toISOString() };
  }
}

// Save metadata
function saveMetadata(metadata) {
  metadata.lastUpdated = new Date().toISOString();
  fs.writeFileSync(CONFIG.metadataFile, JSON.stringify(metadata, null, 2));
}

// Download a file from URL
function downloadFile(url, destination) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destination);
    
    https.get(url, response => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download file: ${response.statusCode} ${response.statusMessage}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve(destination);
      });
    }).on('error', error => {
      fs.unlink(destination, () => {}); // Delete the file on error
      reject(error);
    });
  });
}

// Convert model to glTF format using Blender
function convertToGltf(inputFile, outputFile) {
  const ext = path.extname(inputFile).toLowerCase();
  let importCommand;
  
  // Determine import command based on file extension
  if (ext === '.fbx') {
    importCommand = `bpy.ops.import_scene.fbx(filepath='${inputFile.replace(/\\/g, '\\\\')}')`;
  } else if (ext === '.obj') {
    importCommand = `bpy.ops.import_scene.obj(filepath='${inputFile.replace(/\\/g, '\\\\')}')`;
  } else if (ext === '.blend') {
    importCommand = `bpy.ops.wm.open_mainfile(filepath='${inputFile.replace(/\\/g, '\\\\')}')`;
  } else {
    throw new Error(`Unsupported format: ${ext}`);
  }
  
  // Create Python script for Blender
  const scriptContent = `
import bpy
import os
import sys

# Clear existing scene
bpy.ops.wm.read_factory_settings(use_empty=True)

# Import model
${importCommand}

# Export as glTF
bpy.ops.export_scene.gltf(
    filepath='${outputFile.replace(/\\/g, '\\\\')}',
    export_format='GLB',
    export_textures=True,
    export_normals=True,
    export_draco_mesh_compression_enable=True
)

print(f"Successfully converted {os.path.basename('${inputFile}')} to {os.path.basename('${outputFile}')}")
`;
  
  // Write script to temporary file
  const scriptPath = path.join(os.tmpdir(), `convert_${Date.now()}.py`);
  fs.writeFileSync(scriptPath, scriptContent);
  
  try {
    // Run Blender with script
    const result = execSync(`${CONFIG.blenderPath} --background --python "${scriptPath}"`, { encoding: 'utf8' });
    console.log(result);
    return true;
  } catch (error) {
    console.error(`Error converting model: ${error.message}`);
    return false;
  } finally {
    // Clean up temporary script
    fs.unlinkSync(scriptPath);
  }
}

// Optimize glTF model using gltf-pipeline
function optimizeGltf(inputFile, outputFile) {
  try {
    // Ensure gltf-pipeline is installed
    execSync('npx gltf-pipeline --version', { encoding: 'utf8' });
    
    // Run optimization
    const result = execSync(
      `npx gltf-pipeline -i "${inputFile}" -o "${outputFile}" --draco.compressionLevel 7`,
      { encoding: 'utf8' }
    );
    
    console.log(result);
    return true;
  } catch (error) {
    console.error(`Error optimizing model: ${error.message}`);
    return false;
  }
}

// Process a single asset
async function processAsset(assetInfo) {
  const { name, url, type } = assetInfo;
  console.log(`Processing asset: ${name}`);
  
  // Create asset-specific directories
  const assetRawDir = path.join(CONFIG.rawDir, name);
  const assetProcessedDir = path.join(CONFIG.processedDir, name);
  const assetOptimizedDir = path.join(CONFIG.optimizedDir, name);
  
  [assetRawDir, assetProcessedDir, assetOptimizedDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
  
  // Load metadata
  const metadata = loadMetadata();
  
  // Check if asset already exists in metadata
  const existingAsset = metadata.assets.find(a => a.name === name);
  if (existingAsset) {
    console.log(`Asset ${name} already exists in metadata. Updating...`);
  }
  
  // Create or update asset metadata
  const assetMetadata = existingAsset || {
    name,
    type,
    source: url,
    dateAdded: new Date().toISOString(),
    files: {},
    colors: {}
  };
  
  // Download raw asset if URL provided
  if (url) {
    const fileName = path.basename(url);
    const rawFilePath = path.join(assetRawDir, fileName);
    
    try {
      await downloadFile(url, rawFilePath);
      console.log(`Downloaded ${url} to ${rawFilePath}`);
      
      assetMetadata.files.raw = rawFilePath;
      assetMetadata.dateDownloaded = new Date().toISOString();
    } catch (error) {
      console.error(`Error downloading asset: ${error.message}`);
      return false;
    }
  } else if (!assetMetadata.files.raw) {
    console.error(`No URL provided and no existing raw file for asset ${name}`);
    return false;
  }
  
  // Convert to glTF
  const rawFilePath = assetMetadata.files.raw;
  const processedFilePath = path.join(assetProcessedDir, `${name}.glb`);
  
  const conversionSuccess = convertToGltf(rawFilePath, processedFilePath);
  if (conversionSuccess) {
    assetMetadata.files.processed = processedFilePath;
    assetMetadata.dateProcessed = new Date().toISOString();
  } else {
    console.error(`Failed to convert ${rawFilePath} to glTF`);
    return false;
  }
  
  // Optimize glTF
  const optimizedFilePath = path.join(assetOptimizedDir, `${name}.glb`);
  
  const optimizationSuccess = optimizeGltf(processedFilePath, optimizedFilePath);
  if (optimizationSuccess) {
    assetMetadata.files.optimized = optimizedFilePath;
    assetMetadata.dateOptimized = new Date().toISOString();
    
    // Get file size
    const stats = fs.statSync(optimizedFilePath);
    assetMetadata.optimizedSize = stats.size;
  } else {
    console.error(`Failed to optimize ${processedFilePath}`);
    return false;
  }
  
  // Create color variants
  assetMetadata.colors = {};
  
  for (const [colorName, colorHex] of Object.entries(CONFIG.colors)) {
    const colorVariantPath = path.join(assetOptimizedDir, `${name}_${colorName}.glb`);
    
    // For now, just copy the optimized file for each color variant
    // In a real implementation, we would modify the textures for each color
    fs.copyFileSync(optimizedFilePath, colorVariantPath);
    
    assetMetadata.colors[colorName] = {
      file: colorVariantPath,
      hex: colorHex,
      dateCreated: new Date().toISOString()
    };
    
    console.log(`Created color variant: ${colorName} (${colorHex})`);
  }
  
  // Update metadata
  if (existingAsset) {
    const index = metadata.assets.findIndex(a => a.name === name);
    metadata.assets[index] = assetMetadata;
  } else {
    metadata.assets.push(assetMetadata);
  }
  
  saveMetadata(metadata);
  console.log(`Asset processing complete: ${name}`);
  
  return true;
}

// Main function
async function main() {
  // Ensure directories and metadata file exist
  ensureDirectories();
  initializeMetadata();
  
  // Example asset to process
  const assetInfo = {
    name: 'merino-tshirt',
    url: 'https://example.com/path/to/tshirt.fbx', // Replace with actual URL
    type: 'clothing'
  };
  
  try {
    const success = await processAsset(assetInfo);
    if (success) {
      console.log(`Successfully processed asset: ${assetInfo.name}`);
    } else {
      console.error(`Failed to process asset: ${assetInfo.name}`);
    }
  } catch (error) {
    console.error(`Error processing asset: ${error.message}`);
  }
}

// Run the script if called directly
if (require.main === module) {
  main().catch(error => {
    console.error(`Unhandled error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  processAsset,
  loadMetadata,
  saveMetadata,
  ensureDirectories,
  initializeMetadata
};
