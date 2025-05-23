    }
  }
  
  /**
   * Test fallback mechanisms
   * @param {Object} orchestrator - Pipeline orchestrator
   * @returns {Object} - Test result
   */
  async testFallbackMechanisms(orchestrator) {
    this.logger.info('Testing fallback mechanisms');
    
    try {
      // Get VirtualThreads connector and temporarily break it
      const vtConnector = orchestrator.getConnector('virtualthreads');
      const originalGenerateMockup = vtConnector.generateMockup;
      
      // Replace with a function that throws an error
      vtConnector.generateMockup = async () => {
        throw new Error('Simulated VirtualThreads failure');
      };
      
      // Try to process a design upload, which should fall back to Mockey
      const result = await orchestrator.processDesignUpload({
        designFile: 'https://example.com/test-design.png',
        productType: 'tshirt',
        colorVariant: 'forest-green'
      });
      
      // Restore original function
      vtConnector.generateMockup = originalGenerateMockup;
      
      return {
        success: result.usedFallback === true,
        result,
        message: result.usedFallback ? 'Fallback mechanism worked correctly' : 'Fallback was not triggered'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Test caching functionality
   * @param {Object} orchestrator - Pipeline orchestrator
   * @returns {Object} - Test result
   */
  async testCaching(orchestrator) {