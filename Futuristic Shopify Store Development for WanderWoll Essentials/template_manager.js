/**
 * WanderWoll essentials - Mockey.ai Template Manager
 * 
 * This script handles the creation and management of branded templates
 * in Mockey.ai for the WanderWoll essentials Shopify store.
 */

const MockeyClient = require('./api_client');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  apiKey: process.env.MOCKEY_API_KEY || 'YOUR_API_KEY_HERE',
  outputDir: path.resolve(__dirname, '../assets/mockups'),
  metadataFile: path.resolve(__dirname, '../assets/template_metadata.json'),
  branding: {
    logoUrl: 'https://cdn.shopify.com/s/files/1/wanderwoll-logo.svg',
    primaryColor: '#2E8B57', // Forest Green
    secondaryColor: '#F5DEB3', // Beige
    accentColor: '#000000', // Black
    font: 'Montserrat'
  }
};

// Initialize Mockey.ai client
const mockeyClient = new MockeyClient(CONFIG.apiKey, {
  cacheEnabled: true,
  cacheExpiry: 7 * 24 * 60 * 60 * 1000 // 7 days
});

// Ensure output directory exists
function ensureOutputDirectory() {
  if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
    console.log(`Created output directory: ${CONFIG.outputDir}`);
  }
}

// Initialize metadata file if it doesn't exist
function initializeMetadata() {
  if (!fs.existsSync(CONFIG.metadataFile)) {
    const initialMetadata = {
      templates: [],
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
    return { templates: [], lastUpdated: new Date().toISOString() };
  }
}

// Save metadata
function saveMetadata(metadata) {
  metadata.lastUpdated = new Date().toISOString();
  fs.writeFileSync(CONFIG.metadataFile, JSON.stringify(metadata, null, 2));
}

// Create branded templates for WanderWoll products
async function createBrandedTemplates() {
  console.log('Creating branded templates for WanderWoll products...');
  
  // Define product templates to create
  const productTemplates = [
    {
      name: 'WanderWoll T-Shirt Front',
      productType: 'tshirt',
      view: 'front',
      background: CONFIG.branding.secondaryColor
    },
    {
      name: 'WanderWoll T-Shirt Back',
      productType: 'tshirt',
      view: 'back',
      background: CONFIG.branding.secondaryColor
    },
    {
      name: 'WanderWoll Hoodie Front',
      productType: 'hoodie',
      view: 'front',
      background: CONFIG.branding.secondaryColor
    },
    {
      name: 'WanderWoll Hoodie Back',
      productType: 'hoodie',
      view: 'back',
      background: CONFIG.branding.secondaryColor
    },
    {
      name: 'WanderWoll Socks',
      productType: 'socks',
      view: 'front',
      background: CONFIG.branding.secondaryColor
    },
    {
      name: 'WanderWoll Shorts',
      productType: 'shorts',
      view: 'front',
      background: CONFIG.branding.secondaryColor
    },
    {
      name: 'WanderWoll Beanie',
      productType: 'beanie',
      view: 'front',
      background: CONFIG.branding.secondaryColor
    }
  ];
  
  // Load existing metadata
  const metadata = loadMetadata();
  
  // Create each template
  for (const template of productTemplates) {
    try {
      console.log(`Creating template: ${template.name}`);
      
      // Check if template already exists in metadata
      const existingTemplate = metadata.templates.find(t => 
        t.name === template.name && t.productType === template.productType
      );
      
      if (existingTemplate) {
        console.log(`Template ${template.name} already exists with ID: ${existingTemplate.id}`);
        continue;
      }
      
      // Create template in Mockey.ai
      const createdTemplate = await mockeyClient.createBrandedTemplate({
        name: template.name,
        productType: template.productType,
        background: template.background,
        logoUrl: CONFIG.branding.logoUrl,
        primaryColor: CONFIG.branding.primaryColor,
        secondaryColor: CONFIG.branding.accentColor,
        font: CONFIG.branding.font,
        removeBackground: true,
        addShadows: true,
        enhanceQuality: true
      });
      
      console.log(`Created template: ${template.name} with ID: ${createdTemplate.id}`);
      
      // Add to metadata
      metadata.templates.push({
        id: createdTemplate.id,
        name: template.name,
        productType: template.productType,
        view: template.view,
        dateCreated: new Date().toISOString()
      });
    } catch (error) {
      console.error(`Error creating template ${template.name}: ${error.message}`);
    }
  }
  
  // Save updated metadata
  saveMetadata(metadata);
  console.log('Template creation complete');
}

// Get template ID by product type and view
function getTemplateId(productType, view = 'front') {
  const metadata = loadMetadata();
  
  const template = metadata.templates.find(t => 
    t.productType === productType && t.view === view
  );
  
  return template ? template.id : null;
}

// Generate mockup for a product
async function generateProductMockup(designUrl, productType, view = 'front') {
  console.log(`Generating mockup for ${productType} (${view} view)...`);
  
  // Get template ID
  const templateId = getTemplateId(productType, view);
  if (!templateId) {
    throw new Error(`No template found for ${productType} (${view} view)`);
  }
  
  try {
    // Generate mockup
    const mockup = await mockeyClient.generateMockup({
      designUrl,
      templateId,
      outputFormat: 'png',
      resolution: 'high'
    });
    
    console.log(`Mockup generation initiated with ID: ${mockup.id}`);
    
    // Poll for completion
    const mockupUrl = await mockeyClient.pollMockupCompletion(mockup.id);
    
    console.log(`Mockup generated successfully: ${mockupUrl}`);
    
    // Download mockup
    const fileName = `${productType}_${view}_${Date.now()}.png`;
    const filePath = path.join(CONFIG.outputDir, fileName);
    
    // Download file (simplified for example)
    // In a real implementation, you would download the file from mockupUrl
    
    return {
      success: true,
      mockupUrl,
      filePath
    };
  } catch (error) {
    console.error(`Error generating mockup: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

// Batch generate mockups for a product in all views
async function batchGenerateProductMockups(designUrl, productType) {
  console.log(`Batch generating mockups for ${productType}...`);
  
  const views = ['front', 'back'];
  const results = {};
  
  for (const view of views) {
    try {
      const result = await generateProductMockup(designUrl, productType, view);
      results[view] = result;
    } catch (error) {
      results[view] = {
        success: false,
        error: error.message
      };
    }
  }
  
  return results;
}

// Main function
async function main() {
  // Ensure output directory and metadata file exist
  ensureOutputDirectory();
  initializeMetadata();
  
  // Create branded templates
  await createBrandedTemplates();
  
  // Example: Generate mockup for a T-shirt
  const designUrl = 'https://example.com/path/to/design.png'; // Replace with actual URL
  const result = await generateProductMockup(designUrl, 'tshirt', 'front');
  
  if (result.success) {
    console.log(`Mockup generated successfully: ${result.mockupUrl}`);
  } else {
    console.error(`Failed to generate mockup: ${result.error}`);
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
  createBrandedTemplates,
  generateProductMockup,
  batchGenerateProductMockups,
  getTemplateId,
  loadMetadata,
  saveMetadata
};
