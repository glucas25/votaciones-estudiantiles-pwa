// src/services/migration.js
import databaseService, { DOC_TYPES, EDUCATION_LEVELS } from './database-indexeddb.js'

/**
 * Migration service to transfer data from localStorage to PouchDB
 * Handles automatic migration with validation and rollback capabilities
 */
class MigrationService {
  constructor() {
    this.migrationLog = []
    this.backupData = {}
    this.migrationStatus = {
      inProgress: false,
      completed: false,
      error: null,
      progress: 0
    }
  }

  /**
   * Check if migration is needed
   */
  async isMigrationNeeded() {
    try {
      // Check if migration already completed
      const migrationFlag = localStorage.getItem('pouchdb_migration_completed')
      if (migrationFlag === 'true') {
        return false
      }

      // Check if there's localStorage data to migrate
      const hasStudents = localStorage.getItem('students') !== null
      const hasCandidates = localStorage.getItem('candidates') !== null
      const hasVotes = localStorage.getItem('votes') !== null
      const hasConfig = localStorage.getItem('electionConfig') !== null

      return hasStudents || hasCandidates || hasVotes || hasConfig
    } catch (error) {
      console.error('Error checking migration status:', error)
      return false
    }
  }

  /**
   * Start automatic migration process
   */
  async startMigration() {
    if (this.migrationStatus.inProgress) {
      throw new Error('Migration already in progress')
    }

    try {
      this.migrationStatus.inProgress = true
      this.migrationStatus.error = null
      this.migrationStatus.progress = 0
      this.migrationLog = []

      this.log('🚀 Starting localStorage to PouchDB migration...')

      // Step 1: Backup existing localStorage data
      this.updateProgress(10)
      await this.backupLocalStorageData()

      // Step 2: Validate and prepare data
      this.updateProgress(20)
      const preparedData = await this.prepareDataForMigration()

      // Step 3: Migrate students
      this.updateProgress(30)
      await this.migrateStudents(preparedData.students)

      // Step 4: Migrate candidates
      this.updateProgress(50)
      await this.migrateCandidates(preparedData.candidates)

      // Step 5: Migrate votes
      this.updateProgress(70)
      await this.migrateVotes(preparedData.votes)

      // Step 6: Migrate election config
      this.updateProgress(80)
      await this.migrateElectionConfig(preparedData.config)

      // Step 7: Validate migration
      this.updateProgress(90)
      await this.validateMigration()

      // Step 8: Mark migration as completed
      this.updateProgress(100)
      this.completeMigration()

      this.log('✅ Migration completed successfully!')
      return { success: true, log: this.migrationLog }

    } catch (error) {
      this.log(`❌ Migration failed: ${error.message}`)
      this.migrationStatus.error = error.message
      
      // Attempt rollback
      await this.rollbackMigration()
      
      throw error
    } finally {
      this.migrationStatus.inProgress = false
    }
  }

  /**
   * Backup localStorage data before migration
   */
  async backupLocalStorageData() {
    try {
      this.log('📦 Creating backup of localStorage data...')

      this.backupData = {
        students: this.getLocalStorageData('students'),
        candidates: this.getLocalStorageData('candidates'),
        votes: this.getLocalStorageData('votes'),
        electionConfig: this.getLocalStorageData('electionConfig'),
        votingResults: this.getLocalStorageData('votingResults'),
        votingSessions: this.getLocalStorageData('votingSessions'),
        timestamp: new Date().toISOString()
      }

      // Store backup in localStorage with special key
      localStorage.setItem('migration_backup', JSON.stringify(this.backupData))
      
      this.log(`✅ Backup created with ${Object.keys(this.backupData).length} data types`)
    } catch (error) {
      throw new Error(`Failed to backup localStorage data: ${error.message}`)
    }
  }

  /**
   * Get and parse localStorage data safely
   */
  getLocalStorageData(key) {
    try {
      const data = localStorage.getItem(key)
      return data ? JSON.parse(data) : null
    } catch (error) {
      this.log(`⚠️ Failed to parse ${key} from localStorage: ${error.message}`)
      return null
    }
  }

  /**
   * Prepare and validate data for migration
   */
  async prepareDataForMigration() {
    this.log('🔍 Preparing and validating data for migration...')

    const preparedData = {
      students: this.prepareStudentsData(),
      candidates: this.prepareCandidatesData(),
      votes: this.prepareVotesData(),
      config: this.prepareConfigData()
    }

    this.log(`📊 Data prepared: ${preparedData.students?.length || 0} students, ${preparedData.candidates?.length || 0} candidates, ${preparedData.votes?.length || 0} votes`)
    
    return preparedData
  }

  /**
   * Prepare students data with validation
   */
  prepareStudentsData() {
    const studentsData = this.backupData.students
    if (!studentsData || !Array.isArray(studentsData)) {
      this.log('ℹ️ No students data found in localStorage')
      return []
    }

    return studentsData.map((student, index) => {
      // Validate required fields
      if (!student.cedula || !student.nombre) {
        this.log(`⚠️ Student at index ${index} missing required fields, skipping`)
        return null
      }

      // Normalize education level
      let level = student.nivel || student.level || 'BACHILLERATO'
      if (!Object.values(EDUCATION_LEVELS).includes(level)) {
        level = 'BACHILLERATO'
      }

      return {
        cedula: String(student.cedula).trim(),
        nombre: String(student.nombre || '').trim(),
        apellidos: String(student.apellidos || '').trim(),
        level: level,
        course: String(student.curso || student.course || '').trim(),
        numero: parseInt(student.numero || student.number || 0),
        votado: Boolean(student.votado || student.hasVoted || false),
        status: student.status || 'active',
        // Migration metadata
        migratedFrom: 'localStorage',
        originalData: student
      }
    }).filter(Boolean) // Remove null entries
  }

  /**
   * Prepare candidates data with validation
   */
  prepareCandidatesData() {
    const candidatesData = this.backupData.candidates
    if (!candidatesData || !Array.isArray(candidatesData)) {
      this.log('ℹ️ No candidates data found in localStorage')
      return []
    }

    return candidatesData.map((candidate, index) => {
      if (!candidate.nombre || !candidate.cargo) {
        this.log(`⚠️ Candidate at index ${index} missing required fields, skipping`)
        return null
      }

      // Normalize education level
      let level = candidate.nivel || candidate.level || 'BACHILLERATO'
      if (!Object.values(EDUCATION_LEVELS).includes(level)) {
        level = 'BACHILLERATO'
      }

      return {
        nombre: String(candidate.nombre).trim(),
        apellidos: String(candidate.apellidos || '').trim(),
        cargo: String(candidate.cargo).trim(),
        level: level,
        ticketId: candidate.ticketId || candidate.listaId || `ticket_${index}`,
        foto: candidate.foto || '',
        propuestas: candidate.propuestas || '',
        votos: parseInt(candidate.votos || 0),
        // Migration metadata
        migratedFrom: 'localStorage',
        originalData: candidate
      }
    }).filter(Boolean)
  }

  /**
   * Prepare votes data with validation
   */
  prepareVotesData() {
    const votesData = this.backupData.votes
    if (!votesData || !Array.isArray(votesData)) {
      this.log('ℹ️ No votes data found in localStorage')
      return []
    }

    return votesData.map((vote, index) => {
      if (!vote.studentId || !vote.candidateId) {
        this.log(`⚠️ Vote at index ${index} missing required fields, skipping`)
        return null
      }

      return {
        studentId: String(vote.studentId),
        candidateId: String(vote.candidateId),
        level: vote.level || 'BACHILLERATO',
        course: vote.course || '',
        timestamp: vote.timestamp || new Date().toISOString(),
        // Migration metadata
        migratedFrom: 'localStorage',
        originalData: vote
      }
    }).filter(Boolean)
  }

  /**
   * Prepare election config data
   */
  prepareConfigData() {
    const configData = this.backupData.electionConfig
    if (!configData) {
      this.log('ℹ️ No election config found in localStorage')
      return {}
    }

    return {
      ...configData,
      migratedFrom: 'localStorage',
      migrationTimestamp: new Date().toISOString()
    }
  }

  /**
   * Migrate students to PouchDB
   */
  async migrateStudents(studentsData) {
    if (!studentsData || studentsData.length === 0) {
      this.log('ℹ️ No students to migrate')
      return
    }

    this.log(`👥 Migrating ${studentsData.length} students...`)

    const result = await databaseService.bulkCreate('students', studentsData, DOC_TYPES.STUDENT)
    
    if (!result.success) {
      throw new Error(`Failed to migrate students: ${result.error}`)
    }

    this.log(`✅ Successfully migrated ${result.successful}/${studentsData.length} students`)
  }

  /**
   * Migrate candidates to PouchDB
   */
  async migrateCandidates(candidatesData) {
    if (!candidatesData || candidatesData.length === 0) {
      this.log('ℹ️ No candidates to migrate')
      return
    }

    this.log(`🗳️ Migrating ${candidatesData.length} candidates...`)

    const result = await databaseService.bulkCreate('candidates', candidatesData, DOC_TYPES.CANDIDATE)
    
    if (!result.success) {
      throw new Error(`Failed to migrate candidates: ${result.error}`)
    }

    this.log(`✅ Successfully migrated ${result.successful}/${candidatesData.length} candidates`)
  }

  /**
   * Migrate votes to PouchDB
   */
  async migrateVotes(votesData) {
    if (!votesData || votesData.length === 0) {
      this.log('ℹ️ No votes to migrate')
      return
    }

    this.log(`🗳️ Migrating ${votesData.length} votes...`)

    const result = await databaseService.bulkCreate('votes', votesData, DOC_TYPES.VOTE)
    
    if (!result.success) {
      throw new Error(`Failed to migrate votes: ${result.error}`)
    }

    this.log(`✅ Successfully migrated ${result.successful}/${votesData.length} votes`)
  }

  /**
   * Migrate election config to PouchDB
   */
  async migrateElectionConfig(configData) {
    if (!configData || Object.keys(configData).length === 0) {
      this.log('ℹ️ No election config to migrate')
      return
    }

    this.log('⚙️ Migrating election configuration...')

    const result = await databaseService.createDocument('election_config', configData, DOC_TYPES.CONFIG)
    
    if (!result.success) {
      throw new Error(`Failed to migrate election config: ${result.error}`)
    }

    this.log('✅ Successfully migrated election configuration')
  }

  /**
   * Validate migration integrity
   */
  async validateMigration() {
    this.log('🔍 Validating migration integrity...')

    const validationResults = {
      students: await this.validateStudentsMigration(),
      candidates: await this.validateCandidatesMigration(),
      votes: await this.validateVotesMigration(),
      config: await this.validateConfigMigration()
    }

    const hasErrors = Object.values(validationResults).some(result => !result.valid)
    
    if (hasErrors) {
      const errorDetails = Object.entries(validationResults)
        .filter(([, result]) => !result.valid)
        .map(([type, result]) => `${type}: ${result.error}`)
        .join(', ')
      
      throw new Error(`Migration validation failed: ${errorDetails}`)
    }

    this.log('✅ Migration validation passed')
  }

  /**
   * Validate students migration
   */
  async validateStudentsMigration() {
    try {
      const originalCount = this.backupData.students?.length || 0
      const migratedResult = await databaseService.findDocuments('students', {
        selector: { type: DOC_TYPES.STUDENT }
      })
      const migratedCount = migratedResult.docs?.length || 0

      return {
        valid: migratedCount >= originalCount,
        originalCount,
        migratedCount,
        error: migratedCount < originalCount ? `Expected ${originalCount}, got ${migratedCount}` : null
      }
    } catch (error) {
      return { valid: false, error: error.message }
    }
  }

  /**
   * Validate candidates migration
   */
  async validateCandidatesMigration() {
    try {
      const originalCount = this.backupData.candidates?.length || 0
      const migratedResult = await databaseService.findDocuments('candidates', {
        selector: { type: DOC_TYPES.CANDIDATE }
      })
      const migratedCount = migratedResult.docs?.length || 0

      return {
        valid: migratedCount >= originalCount,
        originalCount,
        migratedCount,
        error: migratedCount < originalCount ? `Expected ${originalCount}, got ${migratedCount}` : null
      }
    } catch (error) {
      return { valid: false, error: error.message }
    }
  }

  /**
   * Validate votes migration
   */
  async validateVotesMigration() {
    try {
      const originalCount = this.backupData.votes?.length || 0
      const migratedResult = await databaseService.findDocuments('votes', {
        selector: { type: DOC_TYPES.VOTE }
      })
      const migratedCount = migratedResult.docs?.length || 0

      return {
        valid: migratedCount >= originalCount,
        originalCount,
        migratedCount,
        error: migratedCount < originalCount ? `Expected ${originalCount}, got ${migratedCount}` : null
      }
    } catch (error) {
      return { valid: false, error: error.message }
    }
  }

  /**
   * Validate config migration
   */
  async validateConfigMigration() {
    try {
      const hasOriginalConfig = this.backupData.electionConfig && Object.keys(this.backupData.electionConfig).length > 0
      
      if (!hasOriginalConfig) {
        return { valid: true, note: 'No original config to validate' }
      }

      const migratedResult = await databaseService.findDocuments('election_config', {
        selector: { type: DOC_TYPES.CONFIG }
      })
      const hasMigratedConfig = migratedResult.docs?.length > 0

      return {
        valid: hasMigratedConfig,
        error: !hasMigratedConfig ? 'Config not found in PouchDB' : null
      }
    } catch (error) {
      return { valid: false, error: error.message }
    }
  }

  /**
   * Complete migration and mark as done
   */
  completeMigration() {
    // Mark migration as completed
    localStorage.setItem('pouchdb_migration_completed', 'true')
    localStorage.setItem('pouchdb_migration_date', new Date().toISOString())
    
    this.migrationStatus.completed = true
    this.migrationStatus.progress = 100
    
    this.log('✅ Migration marked as completed')
  }

  /**
   * Rollback migration in case of failure
   */
  async rollbackMigration() {
    try {
      this.log('🔄 Attempting migration rollback...')

      // Clear PouchDB data that was migrated
      const databasesToClear = ['students', 'candidates', 'votes', 'election_config']
      
      for (const dbName of databasesToClear) {
        try {
          const allDocs = await databaseService.dbs[dbName].allDocs()
          const docsToDelete = allDocs.rows
            .filter(row => !row.id.startsWith('_design/'))
            .map(row => ({
              _id: row.id,
              _rev: row.value.rev,
              _deleted: true
            }))
          
          if (docsToDelete.length > 0) {
            await databaseService.dbs[dbName].bulkDocs(docsToDelete)
            this.log(`🗑️ Cleared ${docsToDelete.length} documents from ${dbName}`)
          }
        } catch (error) {
          this.log(`⚠️ Failed to clear ${dbName}: ${error.message}`)
        }
      }

      this.log('✅ Rollback completed - localStorage data preserved')
    } catch (error) {
      this.log(`❌ Rollback failed: ${error.message}`)
    }
  }

  /**
   * Update migration progress
   */
  updateProgress(progress) {
    this.migrationStatus.progress = Math.min(progress, 100)
  }

  /**
   * Add entry to migration log
   */
  log(message) {
    const timestamp = new Date().toISOString()
    const logEntry = `[${timestamp}] ${message}`
    
    this.migrationLog.push(logEntry)
    console.log(logEntry)
  }

  /**
   * Get migration status
   */
  getStatus() {
    return {
      ...this.migrationStatus,
      log: this.migrationLog
    }
  }

  /**
   * Get migration log
   */
  getLog() {
    return this.migrationLog
  }

  /**
   * Check if data exists in localStorage
   */
  hasLocalStorageData() {
    const keys = ['students', 'candidates', 'votes', 'electionConfig']
    return keys.some(key => localStorage.getItem(key) !== null)
  }

  /**
   * Clean up localStorage after successful migration (optional)
   */
  async cleanupLocalStorage() {
    if (!this.migrationStatus.completed) {
      throw new Error('Cannot cleanup - migration not completed')
    }

    const keysToRemove = [
      'students', 'candidates', 'votes', 'electionConfig',
      'votingResults', 'votingSessions'
    ]

    keysToRemove.forEach(key => {
      localStorage.removeItem(key)
    })

    this.log(`🧹 Cleaned up ${keysToRemove.length} localStorage keys`)
  }
}

// Create singleton instance
const migrationService = new MigrationService()

export default migrationService
export { migrationService, MigrationService }