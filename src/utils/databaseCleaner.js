// src/utils/databaseCleaner.js
// Utility for completely cleaning database

import databaseService from '../services/database-indexeddb.js';

/**
 * Completely clear all data from the database
 */
export const clearAllDatabaseData = async () => {
  try {
    console.log('🧹 Starting complete database cleanup...');
    
    const collections = ['students', 'candidates', 'votes', 'sessions', 'election_config'];
    let totalDeleted = 0;
    
    for (const collection of collections) {
      try {
        const result = await databaseService.findDocuments(collection, {
          selector: {}
        });
        
        if (result.docs && result.docs.length > 0) {
          console.log(`🗑️ Deleting ${result.docs.length} documents from ${collection}...`);
          
          for (const doc of result.docs) {
            if (doc._id && doc._rev) {
              await databaseService.deleteDocument(collection, doc._id, doc._rev);
              totalDeleted++;
            }
          }
        }
      } catch (error) {
        console.error(`❌ Error cleaning ${collection}:`, error);
      }
    }
    
    console.log(`✅ Database cleanup complete. Deleted ${totalDeleted} documents.`);
    return { success: true, deleted: totalDeleted };
    
  } catch (error) {
    console.error('❌ Database cleanup failed:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Clear only student data
 */
export const clearStudentData = async () => {
  try {
    console.log('🧹 Clearing student data...');
    
    const result = await databaseService.findDocuments('students', {
      selector: {}
    });
    
    let deleted = 0;
    if (result.docs && result.docs.length > 0) {
      for (const doc of result.docs) {
        if (doc._id && doc._rev) {
          await databaseService.deleteDocument('students', doc._id, doc._rev);
          deleted++;
        }
      }
    }
    
    console.log(`✅ Cleared ${deleted} student records.`);
    return { success: true, deleted };
    
  } catch (error) {
    console.error('❌ Failed to clear student data:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Check for duplicate or orphaned data
 */
export const checkDataIntegrity = async () => {
  try {
    console.log('🔍 Checking data integrity...');
    
    const studentsResult = await databaseService.findDocuments('students', {
      selector: {}
    });
    
    const students = studentsResult.docs || [];
    const cedulaMap = new Map();
    const duplicates = [];
    
    students.forEach(student => {
      const cedula = student.cedula;
      if (cedulaMap.has(cedula)) {
        duplicates.push({
          cedula,
          original: cedulaMap.get(cedula),
          duplicate: student
        });
      } else {
        cedulaMap.set(cedula, student);
      }
    });
    
    const report = {
      totalStudents: students.length,
      duplicateCedulas: duplicates.length,
      duplicates: duplicates.map(d => d.cedula),
      integrityIssues: []
    };
    
    if (duplicates.length > 0) {
      report.integrityIssues.push(`Found ${duplicates.length} duplicate cédulas`);
    }
    
    console.log('📊 Data integrity report:', report);
    return report;
    
  } catch (error) {
    console.error('❌ Data integrity check failed:', error);
    return { error: error.message };
  }
};