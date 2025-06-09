const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixResumeColumns() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });
    
    //console.log('🔧 Fixing resume table columns...');
    
    // Check current structure
    const [columns] = await connection.execute('DESCRIBE resumes');
    //console.log('Current columns:', columns.map(col => col.Field));
    
    // Check if we need to split educationskills into education and skills
    const hasEducationSkills = columns.some(col => col.Field === 'educationskills');
    const hasEducation = columns.some(col => col.Field === 'education');
    const hasSkills = columns.some(col => col.Field === 'skills');
    
    if (hasEducationSkills && (!hasEducation || !hasSkills)) {
      //console.log('📝 Splitting educationskills into education and skills columns...');
      
      // Add education column if it doesn't exist
      if (!hasEducation) {
        await connection.execute('ALTER TABLE resumes ADD COLUMN education TEXT AFTER objective');
        //console.log('✅ Added education column');
      }
      
      // Add skills column if it doesn't exist
      if (!hasSkills) {
        await connection.execute('ALTER TABLE resumes ADD COLUMN skills TEXT AFTER education');
        //console.log('✅ Added skills column');
      }
      
      // Migrate data from educationskills to education (if there's any data)
      const [resumeData] = await connection.execute('SELECT id, educationskills FROM resumes WHERE educationskills IS NOT NULL');
      
      if (resumeData.length > 0) {
        //console.log(`📦 Migrating data for ${resumeData.length} resumes...`);
        
        for (const resume of resumeData) {
          // For now, put the combined data in education field
          // In a real scenario, you'd want to parse and split this properly
          await connection.execute(
            'UPDATE resumes SET education = ? WHERE id = ?',
            [resume.educationskills, resume.id]
          );
        }
        //console.log('✅ Data migration completed');
      }
      
      // Drop the old educationskills column
      await connection.execute('ALTER TABLE resumes DROP COLUMN educationskills');
      //console.log('✅ Removed old educationskills column');
    }
    
    // Fix reference_info to references_info for consistency
    const hasReferenceInfo = columns.some(col => col.Field === 'reference_info');
    const hasReferencesInfo = columns.some(col => col.Field === 'references_info');
    
    if (hasReferenceInfo && !hasReferencesInfo) {
      //console.log('📝 Renaming reference_info to references_info...');
      await connection.execute('ALTER TABLE resumes CHANGE reference_info references_info TEXT');
      //console.log('✅ Renamed reference_info to references_info');
    }
    
    // Verify final structure
    const [finalColumns] = await connection.execute('DESCRIBE resumes');
    //console.log('\n✅ Final resume table structure:');
    finalColumns.forEach((col, index) => {
      //console.log(`${index + 1}. ${col.Field} (${col.Type})`);
    });
    
    //console.log('\n🎉 Resume table structure fixed successfully!');
    
  } catch (error) {
    //console.error('❌ Error fixing resume columns:', error.message);
  } finally {
    if (connection) await connection.end();
  }
}

fixResumeColumns();