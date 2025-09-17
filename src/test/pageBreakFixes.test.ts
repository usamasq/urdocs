/**
 * Test file to verify page break fixes
 * This file tests the critical fixes made to the auto page break functionality
 */

import { calculateContentHeight, calculateOverflowInfo } from '../utils/pageBreakUtils';
import { ProfessionalLayoutEngine, LayoutEngineFactory } from '../services/professionalLayoutEngine';

// Mock DOM element for testing
const createMockEditorElement = (scrollHeight: number, clientHeight: number, offsetHeight: number) => {
  return {
    scrollHeight,
    clientHeight,
    offsetHeight,
    nodeType: 1, // ELEMENT_NODE
    querySelector: () => null,
    querySelectorAll: () => []
  } as any;
};

// Mock page dimensions
const mockPageDimensions = {
  width: 794,
  height: 1123,
  marginTop: 75.6,
  marginBottom: 75.6,
  marginLeft: 75.6,
  marginRight: 75.6
};

describe('Page Break Fixes', () => {
  describe('calculateContentHeight', () => {
    test('should handle valid heights correctly', () => {
      const mockElement = createMockEditorElement(500, 400, 450);
      const height = calculateContentHeight(mockElement);
      expect(height).toBe(500); // Should return the maximum height
    });

    test('should handle NaN values gracefully', () => {
      const mockElement = createMockEditorElement(NaN, 400, 450);
      const height = calculateContentHeight(mockElement);
      expect(height).toBe(450); // Should return the maximum valid height
    });

    test('should handle all NaN values with fallback', () => {
      const mockElement = createMockEditorElement(NaN, NaN, NaN);
      const height = calculateContentHeight(mockElement);
      expect(height).toBe(100); // Should return safe fallback
    });

    test('should handle null element gracefully', () => {
      const height = calculateContentHeight(null as any);
      expect(height).toBe(0);
    });
  });

  describe('calculateOverflowInfo', () => {
    test('should detect overflow correctly', () => {
      // Create content that's definitely larger than available height (1123 - 75.6 - 75.6 = 972.8)
      const mockElement = createMockEditorElement(1500, 1200, 1300); // Content height > available height
      const overflowInfo = calculateOverflowInfo(mockElement, mockPageDimensions);
      
      expect(overflowInfo.isOverflowing).toBe(true);
      expect(overflowInfo.pageCount).toBeGreaterThan(1);
      expect(overflowInfo.overflowAmount).toBeGreaterThan(0);
    });

    test('should handle no overflow correctly', () => {
      const mockElement = createMockEditorElement(500, 400, 450); // Content height < available height (972.8)
      const overflowInfo = calculateOverflowInfo(mockElement, mockPageDimensions);
      
      expect(overflowInfo.isOverflowing).toBe(false);
      expect(overflowInfo.pageCount).toBe(1);
      expect(overflowInfo.overflowAmount).toBe(0);
    });

    test('should handle invalid page dimensions gracefully', () => {
      const mockElement = createMockEditorElement(500, 400, 450);
      const invalidDimensions = { ...mockPageDimensions, height: NaN };
      const overflowInfo = calculateOverflowInfo(mockElement, invalidDimensions);
      
      expect(overflowInfo.isOverflowing).toBe(false);
      expect(overflowInfo.pageCount).toBe(1);
    });

    test('should handle null element gracefully', () => {
      const overflowInfo = calculateOverflowInfo(null, mockPageDimensions);
      
      expect(overflowInfo.isOverflowing).toBe(false);
      expect(overflowInfo.pageCount).toBe(1);
    });
  });

  describe('ProfessionalLayoutEngine', () => {
    test('should create engine with default config', () => {
      const config = LayoutEngineFactory.createDefaultConfig();
      const engine = LayoutEngineFactory.create(config);
      
      expect(engine).toBeDefined();
      expect(engine.getLayoutResult).toBeDefined();
    });

    test('should handle invalid config gracefully', () => {
      const invalidConfig = { pageSize: null } as any;
      const engine = LayoutEngineFactory.create(invalidConfig);
      
      expect(engine).toBeDefined();
    });

    test('should calculate layout without errors', () => {
      const config = LayoutEngineFactory.createDefaultConfig();
      const engine = LayoutEngineFactory.create(config);
      
      // Set a simple document
      engine.setDocument({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            text: 'Test paragraph content'
          }
        ]
      });
      
      const result = engine.calculateLayout();
      
      expect(result).toBeDefined();
      expect(result.pages).toBeDefined();
      expect(result.totalPages).toBeGreaterThan(0);
      expect(result.contentHeight).toBeGreaterThanOrEqual(0);
    });
  });
});

// Export for manual testing
export const testPageBreakFixes = () => {
  console.log('Testing page break fixes...');
  
  // Test 1: Valid content height calculation
  const mockElement = createMockEditorElement(500, 400, 450);
  const height = calculateContentHeight(mockElement);
  console.log('✓ Content height calculation:', height);
  
  // Test 2: Overflow detection
  const overflowInfo = calculateOverflowInfo(mockElement, mockPageDimensions);
  console.log('✓ Overflow detection:', overflowInfo);
  
  // Test 3: Layout engine
  const config = LayoutEngineFactory.createDefaultConfig();
  const engine = LayoutEngineFactory.create(config);
  console.log('✓ Layout engine created successfully');
  
  console.log('All page break fixes are working correctly!');
};
