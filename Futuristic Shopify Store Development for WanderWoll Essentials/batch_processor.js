#!/usr/bin/env node

/**
 * WanderWoll essentials - Blender Batch Processor
 * 
 * This script handles batch processing of 3D models using Blender
 * for the WanderWoll essentials Shopify store.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

// Configuration
const CONFIG = {
  blenderPath: process.env.BLENDER_PATH || 'blender',
  scriptPath: path.resolve(__dirname, './blender_automation.py'),
  maxWorkers: process.env.MAX_WORKERS || 4,
  colors: {
    'forest-green': '#2E8B57',
    'beige': '#F5DEB3',
    'black': '#000000'
  }
};

/**
 * Process a single model with Blender
 * @param {Object} job - Job configuration
 * @returns {Promise<Object>} - Processing result
 */
function processModel(job) {
  return new Promise((resolve, reject) => {
    const { inputFile, outputFile, color, mode } = job;
    
    console.log(`Processing ${inputFile} in ${mode} mode with color ${color}...`);
    
    // Ensure output directory exists
    const outputDir = path.dirname(outputFile);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Build command
    const cmd = [
      CONFIG.blenderPath,
      '--background',
      '--python', CONFIG.scriptPath,
      '--',
      '--input', inputFile,
      '--output', outputFile,
      '--color', color,
      '--mode', mode
    ].join(' ');
    
    try {
      // Execute command
      const output = execSync(cmd, { encoding: 'utf8' });
      
      resolve({
        success: true,
        job,
        output
      });
    } catch (error) {
      reject({
        success: false,
        job,
        error: error.message
      });
    }
  });
}

/**
 * Worker thread function
 */
function workerFunction() {
  const job = workerData;
  
  processModel(job)
    .then(result => {
      parentPort.postMessage({ success: true, result });
    })
    .catch(error => {
      parentPort.postMessage({ success: false, error });
    });
}

/**
 * Process multiple models in parallel
 * @param {Array} jobs - Array of job configurations
 * @returns {Promise<Array>} - Array of processing results
 */
async function batchProcessModels(jobs) {
  if (!isMainThread) {
    return workerFunction();
  }
  
  console.log(`Batch processing ${jobs.length} models with ${CONFIG.maxWorkers} workers...`);
  
  return new Promise((resolve, reject) => {
    const results = [];
    let completedJobs = 0;
    let activeWorkers = 0;
    let currentJobIndex = 0;
    
    // Function to start a worker
    const startWorker = () => {
      if (currentJobIndex >= jobs.length) return;
      
      const job = jobs[currentJobIndex++];
      activeWorkers++;
      
      const worker = new Worker(__filename, { workerData: job });
      
      worker.on('message', message => {
        if (message.success) {
          results.push(message.result);
        } else {
          results.push(message.error);
        }
        
        completedJobs++;
        activeWorkers--;
        
        // Start next worker if there are more jobs
        if (currentJobIndex < jobs.length) {
          startWorker();
        }
        
        // Resolve when all jobs are completed
        if (completedJobs === jobs.length) {
          resolve(results);
        }
      });
      
      worker.on('error', error => {
        results.push({
          success: false,
          job,
          error: error.message
        });
        
        completedJobs++;
        activeWorkers--;
        
        // Start next worker if there are more jobs
        if (currentJobIndex < jobs.length) {
          startWorker();
        }
        
        // Resolve when all jobs are completed
        if (completedJobs === jobs.length) {
          resolve(results);
        }
      });
    };
    
    // Start initial workers
    const initialWorkers = Math.min(CONFIG.maxWorkers, jobs.length);
    for (let i = 0; i < initialWorkers; i++) {
      startWorker();
    }
  });
}

/**
 * Process a model in all color variants
 * @param {Object} options - Processing options
 * @returns {Promise<Array>} - Array of processing results
 */
async function processModelInAllColors(options) {
  const { inputFile, outputDir, baseName, mode } = options;
  
  const jobs = [];
  
  // Create a job for each color
  for (const [colorName, colorHex] of Object.entries(CONFIG.colors)) {
    const outputFile = path.join(outputDir, `${baseName}_${colorName}.${mode === 'render' ? 'png' : 'glb'}`);
    
    jobs.push({
      inputFile,
      outputFile,
      color: colorHex,
      mode,
      colorName
    });
  }
  
  return batchProcessModels(jobs);
}

/**
 * Process a configuration file
 * @param {string} configFile - Path to configuration file
 * @returns {Promise<Array>} - Array of processing results
 */
async function processConfigFile(configFile) {
  // Load configuration
  const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
  
  const jobs = [];
  
  // Create jobs from configuration
  for (const model of config.models) {
    const inputFile = model.input;
    const outputFile = model.output;
    const color = model.color || '#2E8B57';
    const mode = model.mode || 'render';
    
    jobs.push({
      inputFile,
      outputFile,
      color,
      mode
    });
  }
  
  return batchProcessModels(jobs);
}

/**
 * Main function
 */
async function main() {
  // Check if Blender is installed
  try {
    execSync(`${CONFIG.blenderPath} --version`, { encoding: 'utf8' });
  } catch (error) {
    console.error(`Error: Blender not found at ${CONFIG.blenderPath}`);
    process.exit(1);
  }
  
  // Example usage
  if (process.argv.length > 2) {
    const command = process.argv[2];
    
    if (command === '--config' && process.argv.length > 3) {
      // Process configuration file
      const configFile = process.argv[3];
      const results = await processConfigFile(configFile);
      
      console.log(`Batch processing complete. Processed ${results.length} models.`);
    } else if (command === '--all-colors' && process.argv.length > 5) {
      // Process model in all colors
      const inputFile = process.argv[3];
      const outputDir = process.argv[4];
      const baseName = process.argv[5];
      const mode = process.argv.length > 6 ? process.argv[6] : 'render';
      
      const results = await processModelInAllColors({
        inputFile,
        outputDir,
        baseName,
        mode
      });
      
      console.log(`Color variant processing complete. Processed ${results.length} variants.`);
    } else {
      console.log(`
Usage:
  node batch_processor.js --config <config_file>
  node batch_processor.js --all-colors <input_file> <output_dir> <base_name> [mode]
      `);
    }
  } else {
    console.log(`
Usage:
  node batch_processor.js --config <config_file>
  node batch_processor.js --all-colors <input_file> <output_dir> <base_name> [mode]
    `);
  }
}

// Run the script if called directly
if (isMainThread && require.main === module) {
  main().catch(error => {
    console.error(`Unhandled error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  processModel,
  batchProcessModels,
  processModelInAllColors,
  processConfigFile
};
