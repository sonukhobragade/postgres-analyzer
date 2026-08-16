/**
 * ClaudeAnalysis component - A modular PostgreSQL analyzer for PostgreSQL databases
 * 
 * This file re-exports the modular Claude analysis component.
 * The component has been refactored into smaller, more maintainable pieces
 * located in the claude/ directory.
 * 
 * @module ClaudeAnalysis
 */
import ClaudeAnalysis from './claude';

// Re-export the modular component as default
export default ClaudeAnalysis;