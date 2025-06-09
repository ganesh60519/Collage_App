const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixDuplicateColumns() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });
    
    //console.log('🔧 Fixing duplicate columns in resumes table...\n');
    
    // First, let's check current structure
    const [columns] = await connection.execute('DESCRIBE resumes');
    //console.log('Current columns:');
    columns.forEach((col, index) => {
      //console.log(`${index + 1}. ${col.Field}`);
    });
    
    // Step 1: Merge data from references_info into reference_info if needed
    //console.log('\n📋 Step 1: Merging reference data...');
    await connection.execute(`
      UPDATE resumes 
      SET reference_info = CASE 
        WHEN reference_info IS NULL OR reference_info = '' THEN references_info
        WHEN references_info IS NULL OR references_info = '' THEN reference_info
        ELSE CONCAT(reference_info, '\n\n', references_info)
      END
      WHERE references_info IS NOT NULL AND references_info != ''
    `);
    
    // Step 2: Merge education and skills data into educationskills if needed
    //console.log('📋 Step 2: Merging education and skills data...');
    await connection.execute(`
      UPDATE resumes 
      SET educationskills = CASE 
        WHEN educationskills IS NULL OR educationskills = '' THEN 
          CASE 
            WHEN education IS NOT NULL AND skills IS NOT NULL THEN CONCAT('Education:\n', education, '\n\nSkills:\n', skills)
            WHEN education IS NOT NULL THEN education
            WHEN skills IS NOT NULL THEN skills
            ELSE educationskills
          END
        ELSE educationskills
      END
      WHERE (education IS NOT NULL AND education != '') OR (skills IS NOT NULL AND skills != '')
    `);
    
    // Step 3: Drop duplicate columns
    //console.log('📋 Step 3: Dropping duplicate columns...');
    
    // Drop references_info (keeping reference_info)
    try {
      await connection.execute('ALTER TABLE resumes DROP COLUMN references_info');
      //console.log('✅ Dropped references_info column');
    } catch (error) {
      //console.log('⚠️  references_info column may not exist:', error.message);
    }
    
    // Drop education column (keeping educationskills)
    try {
      await connection.execute('ALTER TABLE resumes DROP COLUMN education');
      //console.log('✅ Dropped education column');
    } catch (error) {
      //console.log('⚠️  education column may not exist:', error.message);
    }
    
    // Drop skills column (keeping educationskills)
    try {
      await connection.execute('ALTER TABLE resumes DROP COLUMN skills');
      //console.log('✅ Dropped skills column');
    } catch (error) {
      //console.log('⚠️  skills column may not exist:', error.message);
    }
    
    // Step 4: Verify final structure
    //console.log('\n📋 Step 4: Verifying final structure...');
    const [finalColumns] = await connection.execute('DESCRIBE resumes');
    //console.log('\nFinal resume table columns:');
    finalColumns.forEach((col, index) => {
      //console.log(`${index + 1}. ${col.Field} (${col.Type})`);
    });
    
    //console.log('\n✅ Successfully cleaned up duplicate columns!');
    
  } catch (error) {
    //console.error('❌ Error fixing duplicate columns:', error.message);
  } finally {
    if (connection) await connection.end();
  }
}

fixDuplicateColumns();