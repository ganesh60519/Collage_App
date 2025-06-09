const PDFDocument = require('pdfkit');

/**
 * Generates a PDF resume from the provided data
 * @param {Object} resumeData - The resume data
 * @param {Object} studentInfo - The student information
 * @param {Stream} stream - The stream to write the PDF to
 * @param {String} template - The template to use (modern-pro, executive, technical-expert, creative-director, corporate, consultant, research, startup, international)
 * @param {String} layout - The layout to use (single-column, two-column)
 */
function generateResumePDF(resumeData, studentInfo, stream, template = 'modern-pro', layout = 'single-column') {
  // Normalize the template parameter
  const normalizedTemplate = (template || 'modern-pro').toLowerCase().trim();
  
  // Normalize the layout parameter
  const normalizedLayout = (layout || 'single-column').toLowerCase().trim();
  
  // Log the template and layout being used for debugging
  //console.log(`PDF Generator: Using template "${normalizedTemplate}" with layout "${normalizedLayout}"`);
  
  // Debug log to see what fields are available in the resumeData
  //console.log('Resume Data Fields:', Object.keys(resumeData));
  
  // Check if resumeData is properly structured
  if (!resumeData || typeof resumeData !== 'object') {
    //console.error('Invalid resume data format:', resumeData);
    resumeData = {}; // Provide empty object as fallback
  }
  
  // Check if studentInfo is properly structured
  if (!studentInfo || typeof studentInfo !== 'object') {
    //console.error('Invalid student info format:', studentInfo);
    studentInfo = {}; // Provide empty object as fallback
  }
  
  // Ensure resumeData has all required fields with proper string values
  const safeResumeData = {
    objective: typeof resumeData.objective === 'string' ? resumeData.objective : '',
    education: typeof resumeData.education === 'string' ? resumeData.education : '',
    skills: typeof resumeData.skills === 'string' ? resumeData.skills : '',
    languages: typeof resumeData.languages === 'string' ? resumeData.languages : '',
    experience: typeof resumeData.experience === 'string' ? resumeData.experience : '',
    projects: typeof resumeData.projects === 'string' ? resumeData.projects : '',
    certifications: typeof resumeData.certifications === 'string' ? resumeData.certifications : '',
    achievements: typeof resumeData.achievements === 'string' ? resumeData.achievements : '',
    references_info: typeof resumeData.references_info === 'string' ? resumeData.references_info : '',
    additional_info: typeof resumeData.additional_info === 'string' ? resumeData.additional_info : ''
  };
  
  // Ensure studentInfo has all required fields with proper string values
  const safeStudentInfo = {
    name: typeof studentInfo.name === 'string' ? studentInfo.name : 'Student',
    email: typeof studentInfo.email === 'string' ? studentInfo.email : '',
    branch: typeof studentInfo.branch === 'string' ? studentInfo.branch : ''
  };
  
  //console.log('PDF Generator: Resume data and student info validated and sanitized');
  
  // Select the appropriate template function
  try {
    switch (normalizedTemplate) {
      case 'modern':
        //console.log(`Generating Modern template with blue accents using ${normalizedLayout} layout`);
        generateModernTemplate(safeResumeData, safeStudentInfo, stream, normalizedLayout);
        break;
      case 'classic':
        //console.log(`Generating Classic template with black and white styling using ${normalizedLayout} layout`);
        generateClassicTemplate(safeResumeData, safeStudentInfo, stream, normalizedLayout);
        break;
      case 'executive':
        //console.log(`Generating Executive template with dark blue header using ${normalizedLayout} layout`);
        generateExecutiveTemplate(safeResumeData, safeStudentInfo, stream, normalizedLayout);
        break;
      case 'minimalist':
        //console.log(`Generating Minimalist template with green accents using ${normalizedLayout} layout`);
        generateMinimalistTemplate(safeResumeData, safeStudentInfo, stream, normalizedLayout);
        break;
      case 'creative':
        //console.log(`Generating Creative template with purple styling using ${normalizedLayout} layout`);
        generateCreativeTemplate(safeResumeData, safeStudentInfo, stream, normalizedLayout);
        break;
      case 'technical':
        //console.log(`Generating Technical template with code-like formatting using ${normalizedLayout} layout`);
        generateTechnicalTemplate(safeResumeData, safeStudentInfo, stream, normalizedLayout);
        break;
      case 'professional':
        //console.log(`Generating Professional template with dark gray and orange accents using ${normalizedLayout} layout`);
        generateProfessionalTemplate(safeResumeData, safeStudentInfo, stream, normalizedLayout);
        break;
      case 'academic':
        //console.log(`Generating Academic template with formal maroon styling using ${normalizedLayout} layout`);
        generateAcademicTemplate(safeResumeData, safeStudentInfo, stream, normalizedLayout);
        break;
      case 'elegant':
            //console.log(`Generating Elegant template with light blue and gold accents using ${normalizedLayout} layout`);
            generateElegantTemplate(safeResumeData, safeStudentInfo, stream, normalizedLayout);
            break;
          case 'newTemplate1Name': // Give your new template a unique name
            //console.log(`Generating New Template 1 with [description] using ${normalizedLayout} layout`);
            generateNewTemplate1(safeResumeData, safeStudentInfo, stream, normalizedLayout); // Call your new function
            break;
          case 'newTemplate2Name':
            //console.log(`Generating New Template 2 with [description] using ${normalizedLayout} layout`);
            generateNewTemplate2(safeResumeData, safeStudentInfo, stream, normalizedLayout);
            break;
          default:
            //console.log(`Unknown template "${normalizedTemplate}", falling back to Modern template with ${normalizedLayout} layout`);
            generateModernTemplate(safeResumeData, safeStudentInfo, stream, normalizedLayout);
    }
    //console.log('PDF generation completed successfully');
  } catch (error) {
    //console.error('Error generating PDF:', error);
    
    // Create a simple error PDF
    const doc = new PDFDocument();
    doc.pipe(stream);
    
    doc.fontSize(20).text('Error Generating Resume PDF', {
      align: 'center',
      y: 200
    });
    
    doc.fontSize(12).text(`There was an error generating your resume: ${error.message}`, {
      align: 'center',
      y: 250
    });
    
    doc.end();
  }
}

/**
 * Modern template - Sleek sidebar design with blue accents and asymmetric layout
 * @param {Object} resumeData - The resume data
 * @param {Object} studentInfo - The student information
 * @param {Stream} stream - The stream to write the PDF to
 * @param {String} layout - The layout to use (single-column, two-column)
 */
function generateModernTemplate(resumeData, studentInfo, stream, layout = 'two-column') {
  const doc = new PDFDocument({
    margins: { top: 0, bottom: 0, left: 0, right: 0 },
    size: 'A4',
  });

  doc.pipe(stream);

  // Modern color palette
  const primaryBlue = '#3b82f6';
  const lightBlue = '#eff6ff';
  const darkBlue = '#1e40af';
  const darkText = '#1e293b';
  const mediumText = '#475569';
  const lightText = '#64748b';

  // MODERN SIDEBAR DESIGN
  // Left sidebar with blue gradient
  const sidebarWidth = 180;
  doc.rect(0, 0, sidebarWidth, doc.page.height)
     .fill(primaryBlue);

  // Add diagonal accent
  doc.polygon([sidebarWidth, 0], [sidebarWidth + 30, 0], [sidebarWidth, 100])
     .fill(darkBlue);

  // Name in modern vertical layout
  doc.fontSize(28)
     .font('Helvetica-Bold')
     .fillColor('#ffffff')
     .text(studentInfo.name.toUpperCase(), 30, 50, { 
       width: sidebarWidth - 60,
       characterSpacing: 1,
       lineGap: 5
     });

  // Contact info with icons
  let sidebarY = doc.y + 30;
  
  if (studentInfo.email) {
    doc.fontSize(10)
       .font('Helvetica')
       .fillColor('#e0f2fe')
       .text('✉ ' + studentInfo.email, 30, sidebarY, { width: sidebarWidth - 60 });
    sidebarY += 20;
  }

  if (studentInfo.branch) {
    doc.fontSize(10)
       .font('Helvetica')
       .fillColor('#e0f2fe')
       .text('🎓 ' + studentInfo.branch, 30, sidebarY, { width: sidebarWidth - 60 });
    sidebarY += 30;
  }

  // SIDEBAR CONTENT - Skills & Personal Info
  sidebarY += 20;
  
  // Skills in sidebar with modern tags
  if (resumeData.skills) {
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor('#ffffff')
       .text('SKILLS', 30, sidebarY);
    
    sidebarY += 25;
    
    const skillsLines = resumeData.skills.split('\n');
    skillsLines.forEach(line => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return;
      
      let skill = trimmedLine;
      if (skill.startsWith('•') || skill.startsWith('-')) {
        skill = skill.substring(1).trim();
      }
      
      // Skill tag in sidebar
      doc.rect(30, sidebarY, sidebarWidth - 60, 18)
         .fill('#ffffff')
         .fillOpacity(0.2);
      
      doc.fontSize(9)
         .font('Helvetica')
         .fillColor('#ffffff')
         .text(skill, 35, sidebarY + 5, { width: sidebarWidth - 70 });
      
      sidebarY += 22;
    });
    
    sidebarY += 15;
  }

  // Languages in sidebar
  if (resumeData.languages) {
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor('#ffffff')
       .text('LANGUAGES', 30, sidebarY);
    
    sidebarY += 25;
    
    const languageLines = resumeData.languages.split('\n');
    languageLines.forEach(line => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return;
      
      let language = trimmedLine;
      if (language.startsWith('•') || language.startsWith('-')) {
        language = language.substring(1).trim();
      }
      
      doc.fontSize(9)
         .font('Helvetica')
         .fillColor('#e0f2fe')
         .text('• ' + language, 30, sidebarY, { width: sidebarWidth - 60 });
      sidebarY += 15;
    });
  }

  // MAIN CONTENT AREA - Right side
  const mainContentX = sidebarWidth + 40;
  const mainContentWidth = doc.page.width - mainContentX - 40;
  let mainY = 60;

  // Professional Summary with modern card design
  if (resumeData.objective) {
    // Modern section header with line accent
    doc.rect(mainContentX, mainY, 4, 20)
       .fill(primaryBlue);
    
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .fillColor(darkText)
       .text('PROFESSIONAL SUMMARY', mainContentX + 15, mainY + 2);
    
    mainY += 35;
    
    // Content in modern card
    doc.rect(mainContentX, mainY, mainContentWidth, 2)
       .fill(lightBlue);
    
    mainY += 15;
    
    doc.fontSize(11)
       .font('Helvetica')
       .fillColor(mediumText)
       .text(resumeData.objective, mainContentX, mainY, {
         width: mainContentWidth,
         align: 'justify',
         lineGap: 4
       });
    
    mainY = doc.y + 30;
  }

  // Education with timeline design
  if (resumeData.education) {
    // Modern section header
    doc.rect(mainContentX, mainY, 4, 20)
       .fill(primaryBlue);
    
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .fillColor(darkText)
       .text('EDUCATION', mainContentX + 15, mainY + 2);
    
    mainY += 35;
    
    // Timeline line
    doc.rect(mainContentX + 10, mainY, 2, 100)
       .fill(lightBlue);
    
    const educationLines = resumeData.education.split('\n');
    let timelineY = mainY;
    
    educationLines.forEach(line => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return;
      
      if (trimmedLine.includes('University') || trimmedLine.includes('College') || trimmedLine.includes('Institute')) {
        // Timeline dot
        doc.circle(mainContentX + 11, timelineY + 8, 4)
           .fill(primaryBlue);
        
        doc.fontSize(12)
           .font('Helvetica-Bold')
           .fillColor(darkText)
           .text(trimmedLine, mainContentX + 25, timelineY, { width: mainContentWidth - 35 });
        timelineY += 20;
      } else {
        doc.fontSize(10)
           .font('Helvetica')
           .fillColor(mediumText)
           .text(trimmedLine, mainContentX + 25, timelineY, { width: mainContentWidth - 35 });
        timelineY += 15;
      }
    });
    
    mainY = timelineY + 20;
  }

  // Experience with modern card design
  if (resumeData.experience) {
    // Modern section header
    doc.rect(mainContentX, mainY, 4, 20)
       .fill(primaryBlue);
    
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .fillColor(darkText)
       .text('PROFESSIONAL EXPERIENCE', mainContentX + 15, mainY + 2);
    
    mainY += 35;
    
    const experienceLines = resumeData.experience.split('\n');
    let isCompany = true;
    
    experienceLines.forEach(line => {
      const trimmedLine = line.trim();
      if (!trimmedLine) {
        mainY += 8;
        return;
      }
      
      if (isCompany && !trimmedLine.startsWith('•') && !trimmedLine.startsWith('-')) {
        // Company card background
        doc.rect(mainContentX, mainY, mainContentWidth, 25)
           .fill(lightBlue);
        
        doc.fontSize(13)
           .font('Helvetica-Bold')
           .fillColor(darkText)
           .text(trimmedLine, mainContentX + 15, mainY + 8, { width: mainContentWidth - 30 });
        mainY += 30;
        isCompany = false;
      } else if (trimmedLine.includes('20') && !trimmedLine.startsWith('•') && !trimmedLine.startsWith('-')) {
        // Date range
        doc.fontSize(10)
           .font('Helvetica-Oblique')
           .fillColor(primaryBlue)
           .text(trimmedLine, mainContentX, mainY, { width: mainContentWidth });
        mainY += 18;
      } else {
        // Responsibility
        let responsibility = trimmedLine;
        if (responsibility.startsWith('•') || responsibility.startsWith('-')) {
          responsibility = responsibility.substring(1).trim();
        }
        
        doc.fontSize(10)
           .font('Helvetica')
           .fillColor(mediumText)
           .text('• ' + responsibility, mainContentX + 15, mainY, { width: mainContentWidth - 30 });
        mainY = doc.y + 5;
      }
    });
    
    mainY += 20;
  }

  // Projects with modern grid design
  if (resumeData.projects) {
    // Modern section header
    doc.rect(mainContentX, mainY, 4, 20)
       .fill(primaryBlue);
    
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .fillColor(darkText)
       .text('PROJECTS', mainContentX + 15, mainY + 2);
    
    mainY += 35;
    
    const projectLines = resumeData.projects.split('\n');
    let isProjectTitle = true;
    
    projectLines.forEach(line => {
      const trimmedLine = line.trim();
      if (!trimmedLine) {
        mainY += 8;
        return;
      }
      
      if (isProjectTitle && !trimmedLine.startsWith('•') && !trimmedLine.startsWith('-')) {
        // Project title with accent
        doc.rect(mainContentX, mainY, 3, 15)
           .fill(primaryBlue);
        
        doc.fontSize(12)
           .font('Helvetica-Bold')
           .fillColor(darkText)
           .text(trimmedLine, mainContentX + 10, mainY + 2, { width: mainContentWidth - 20 });
        mainY += 20;
        isProjectTitle = false;
      } else {
        // Project detail
        let detail = trimmedLine;
        if (detail.startsWith('•') || detail.startsWith('-')) {
          detail = detail.substring(1).trim();
        }
        
        doc.fontSize(10)
           .font('Helvetica')
           .fillColor(mediumText)
           .text('• ' + detail, mainContentX + 10, mainY, { width: mainContentWidth - 20 });
        mainY = doc.y + 5;
      }
    });
    
    mainY += 20;
  }

  // Additional sections with modern styling
  const additionalSections = [
    { title: 'CERTIFICATIONS', content: resumeData.certifications },
    { title: 'ACHIEVEMENTS', content: resumeData.achievements },
    { title: 'ADDITIONAL INFO', content: resumeData.additional_info }
  ];

  additionalSections.forEach(section => {
    if (!section.content) return;

    // Modern section header
    doc.rect(mainContentX, mainY, 4, 20)
       .fill(primaryBlue);
    
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .fillColor(darkText)
       .text(section.title, mainContentX + 15, mainY + 2);
    
    mainY += 35;
    
    // Content with modern styling
    doc.fontSize(10)
       .font('Helvetica')
       .fillColor(mediumText)
       .text(section.content, mainContentX, mainY, { 
         width: mainContentWidth,
         lineGap: 3
       });
    
    mainY = doc.y + 25;
  });

  // Modern footer
  doc.rect(0, doc.page.height - 40, doc.page.width, 40)
     .fill('#f8fafc');

  doc.fontSize(8)
     .font('Helvetica')
     .fillColor(lightText)
     .text(`${studentInfo.name} • Modern Resume • Generated ${new Date().toLocaleDateString()}`, 
           0, doc.page.height - 25, { align: 'center' });

  doc.end();
}

/**
 * Classic template - Distinct: Top header, horizontal section dividers, serif fonts, no sidebar, gold accents
 */
function generateClassicTemplate(resumeData, studentInfo, stream, layout = 'single-column') {
  // Classic: Left vertical section titles, subtle watermark, two-column education/experience
  const doc = new PDFDocument({
    margins: { top: 0, bottom: 0, left: 0, right: 0 },
    size: 'A4',
  });
  doc.pipe(stream);

  // Classic color palette
  const gold = '#bfa14a';
  const dark = '#222';
  const light = '#f9f6f2';
  const watermark = '#f5ecd7';
  const sectionLine = '#e0c97f';

  // Watermark background
  doc.save();
  doc.fontSize(100).fillColor(watermark).opacity(0.2)
    .text('RESUME', 80, 250, { angle: 30, align: 'center', width: doc.page.width - 160 });
  doc.restore();

  // Left vertical section titles
  const sections = [
    { key: 'objective', label: 'OBJECTIVE' },
    { key: 'education', label: 'EDUCATION' },
    { key: 'experience', label: 'EXPERIENCE' },
    { key: 'skills', label: 'SKILLS' },
    { key: 'projects', label: 'PROJECTS' },
    { key: 'certifications', label: 'CERTIFICATIONS' },
    { key: 'achievements', label: 'ACHIEVEMENTS' },
    { key: 'languages', label: 'LANGUAGES' },
    { key: 'additional_info', label: 'INFO' },
  ];
  let sectionY = 120;
  doc.fontSize(12).font('Times-Bold').fillColor(gold);
  sections.forEach(section => {
    doc.save();
    doc.rotate(-90, { origin: [40, sectionY] });
    doc.text(section.label, 20, sectionY - 8, { width: 60, align: 'center' });
    doc.restore();
    sectionY += 48;
  });

  // Top header (centered)
  doc.rect(0, 0, doc.page.width, 80).fill(gold);
  doc.fontSize(28)
     .font('Times-Bold')
     .fillColor(dark)
     .text(studentInfo.name.toUpperCase(), 0, 22, { align: 'center' });
  doc.fontSize(12)
     .font('Times-Roman')
     .fillColor(dark)
     .text(studentInfo.email || '', 0, 54, { align: 'center' });
  doc.fontSize(12)
     .font('Times-Roman')
     .fillColor(dark)
     .text(studentInfo.branch || '', 0, 68, { align: 'center' });

  // Two-column layout for education/experience
  let col1x = 100, col2x = doc.page.width / 2 + 10, colWidth = doc.page.width / 2 - 120;
  let colY = 110;
  doc.fontSize(15).font('Times-Bold').fillColor(gold).text('EDUCATION', col1x, colY);
  doc.fontSize(15).font('Times-Bold').fillColor(gold).text('EXPERIENCE', col2x, colY);
  colY += 22;
  doc.fontSize(11).font('Times-Roman').fillColor(dark)
    .text(resumeData.education || '', col1x, colY, { width: colWidth, lineGap: 3 });
  doc.fontSize(11).font('Times-Roman').fillColor(dark)
    .text(resumeData.experience || '', col2x, colY, { width: colWidth, lineGap: 3 });
  let y = Math.max(doc.y, colY + 80);

  // Horizontal divider
  doc.moveTo(100, y).lineTo(doc.page.width - 100, y).strokeColor(sectionLine).lineWidth(2).stroke();
  y += 16;

  // Remaining sections, single column
  function section(title, content) {
    if (!content) return;
    doc.fontSize(15).font('Times-Bold').fillColor(gold).text(title, 100, y);
    y = doc.y + 4;
    doc.fontSize(11).font('Times-Roman').fillColor(dark).text(content, 100, y, { width: doc.page.width - 200, lineGap: 3 });
    y = doc.y + 18;
  }
  section('OBJECTIVE', resumeData.objective);
  section('SKILLS', resumeData.skills);
  section('PROJECTS', resumeData.projects);
  section('CERTIFICATIONS', resumeData.certifications);
  section('ACHIEVEMENTS', resumeData.achievements);
  section('LANGUAGES', resumeData.languages);
  section('ADDITIONAL INFO', resumeData.additional_info);

  // Classic footer
  doc.moveTo(100, doc.page.height - 50).lineTo(doc.page.width - 100, doc.page.height - 50).strokeColor(sectionLine).lineWidth(1).stroke();
  doc.fontSize(9)
     .font('Times-Italic')
     .fillColor(gold)
     .text(`${studentInfo.name} - Classic Resume - ${new Date().toLocaleDateString()}`, 0, doc.page.height - 40, { align: 'center' });
  doc.end();
}

/**
 * Executive template - Professional with dark blue accents
 */
function generateExecutiveTemplate(resumeData, studentInfo, stream, layout = 'single-column') {
  // Executive: Teal sidebar, geometric accent, timeline, chips, unique structure
  const doc = new PDFDocument({
    margins: { top: 0, bottom: 0, left: 0, right: 0 },
    size: 'A4',
  });
  doc.pipe(stream);

  // Executive color palette
  const teal = '#009688';
  const emerald = '#26a69a';
  const sidebarBg = '#e0f7fa';
  const white = '#ffffff';
  const darkText = '#263238';
  const lightText = '#607d8b';
  const chipBg = '#b2dfdb';
  const chipText = '#00695c';

  // Sidebar dimensions
  const sidebarWidth = 180;
  const pageW = doc.page.width;
  const pageH = doc.page.height;

  // Sidebar background with geometric accent
  doc.save();
  doc.rect(0, 0, sidebarWidth, pageH).fill(teal);
  doc.moveTo(sidebarWidth, 0).lineTo(sidebarWidth + 40, 0).lineTo(sidebarWidth, 120).closePath().fill(emerald);
  doc.restore();

  // Name and contact in sidebar
  let sidebarY = 40;
  doc.fontSize(22).font('Helvetica-Bold').fillColor(white)
    .text(studentInfo.name, 30, sidebarY, { width: sidebarWidth - 60, align: 'left' });
  sidebarY = doc.y + 10;
  if (studentInfo.email) {
    doc.fontSize(10).font('Helvetica').fillColor(sidebarBg)
      .text('✉ ' + studentInfo.email, 30, sidebarY, { width: sidebarWidth - 60 });
    sidebarY += 18;
  }
  if (studentInfo.branch) {
    doc.fontSize(10).font('Helvetica').fillColor(sidebarBg)
      .text('🎓 ' + studentInfo.branch, 30, sidebarY, { width: sidebarWidth - 60 });
    sidebarY += 22;
  }
  sidebarY += 10;

  // Skills as chips
  if (resumeData.skills) {
    doc.fontSize(12).font('Helvetica-Bold').fillColor(emerald)
      .text('SKILLS', 30, sidebarY);
    sidebarY += 20;
    const skills = resumeData.skills.split(/\n|,|;/).map(s => s.trim()).filter(Boolean);
    let chipX = 30, chipY = sidebarY;
    skills.forEach(skill => {
      const chipW = doc.widthOfString(skill, { font: 'Helvetica', size: 9 }) + 18;
      if (chipX + chipW > sidebarWidth - 20) {
        chipX = 30;
        chipY += 22;
      }
      doc.roundedRect(chipX, chipY, chipW, 18, 8).fill(chipBg);
      doc.fontSize(9).font('Helvetica-Bold').fillColor(chipText)
        .text(skill, chipX + 8, chipY + 4, { width: chipW - 16, align: 'center' });
      chipX += chipW + 8;
    });
    sidebarY = chipY + 26;
  }

  // Languages as chips
  if (resumeData.languages) {
    doc.fontSize(12).font('Helvetica-Bold').fillColor(emerald)
      .text('LANGUAGES', 30, sidebarY);
    sidebarY += 20;
    const langs = resumeData.languages.split(/\n|,|;/).map(l => l.trim()).filter(Boolean);
    let chipX = 30, chipY = sidebarY;
    langs.forEach(lang => {
      const chipW = doc.widthOfString(lang, { font: 'Helvetica', size: 9 }) + 18;
      if (chipX + chipW > sidebarWidth - 20) {
        chipX = 30;
        chipY += 22;
      }
      doc.roundedRect(chipX, chipY, chipW, 18, 8).fill('#80cbc4');
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#004d40')
        .text(lang, chipX + 8, chipY + 4, { width: chipW - 16, align: 'center' });
      chipX += chipW + 8;
    });
    sidebarY = chipY + 26;
  }

  // Main content area
  const mainX = sidebarWidth + 40;
  const mainW = pageW - mainX - 40;
  let mainY = 50;

  // Executive Summary
  if (resumeData.objective) {
    doc.fontSize(18).font('Helvetica-Bold').fillColor(teal)
      .text('EXECUTIVE SUMMARY', mainX, mainY);
    mainY = doc.y + 6;
    doc.fontSize(11).font('Helvetica').fillColor(darkText)
      .text(resumeData.objective, mainX, mainY, { width: mainW, align: 'justify', lineGap: 4 });
    mainY = doc.y + 18;
  }

  // Timeline section helper
  function timelineSection(title, content) {
    if (!content) return;
    doc.fontSize(15).font('Helvetica-Bold').fillColor(teal)
      .text(title, mainX, mainY);
    mainY = doc.y + 8;
    const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
    let tY = mainY;
    lines.forEach((line, idx) => {
      // Dot for each entry
      doc.circle(mainX + 6, tY + 7, 5).fill(emerald);
      // Vertical line (except last)
      if (idx < lines.length - 1) {
        doc.moveTo(mainX + 6, tY + 12).lineTo(mainX + 6, tY + 32).strokeColor(emerald).lineWidth(2).stroke();
      }
      // Entry text
      doc.fontSize(11).font('Helvetica').fillColor(darkText)
        .text(line, mainX + 20, tY, { width: mainW - 30, lineGap: 2 });
      tY += 30;
    });
    mainY = tY + 8;
  }

  // Experience and Education as timelines
  timelineSection('PROFESSIONAL EXPERIENCE', resumeData.experience);
  timelineSection('EDUCATION', resumeData.education);

  // Other sections as cards
  function cardSection(title, content) {
    if (!content) return;
    doc.rect(mainX, mainY, mainW, 38).fill(sidebarBg);
    doc.fontSize(13).font('Helvetica-Bold').fillColor(teal)
      .text(title, mainX + 12, mainY + 6);
    doc.fontSize(10).font('Helvetica').fillColor(darkText)
      .text(content, mainX + 12, mainY + 22, { width: mainW - 24, lineGap: 2 });
    mainY += 50;
  }
  cardSection('PROJECTS', resumeData.projects);
  cardSection('CERTIFICATIONS', resumeData.certifications);
  cardSection('ACHIEVEMENTS', resumeData.achievements);
  cardSection('ADDITIONAL INFO', resumeData.additional_info);

  // Executive footer
  doc.rect(0, pageH - 36, pageW, 36).fill(emerald);
  doc.fontSize(10).font('Helvetica').fillColor(white)
    .text(`${studentInfo.name} • Executive Resume • ${new Date().toLocaleDateString()}`,
      0, pageH - 26, { align: 'center' });
  doc.end();
}

/**
 * Minimalist template - Clean and simple layout with green accents
 * @param {Object} resumeData - The resume data
 * @param {Object} studentInfo - The student information
 * @param {Stream} stream - The stream to write the PDF to
 * @param {String} layout - The layout to use (single-column, two-column)
 */
function generateMinimalistTemplate(resumeData, studentInfo, stream, layout = 'single-column') {
  // Minimalist: right sidebar, orange accent, vertical section titles, whitespace, unique structure
  const doc = new PDFDocument({
    margins: { top: 0, bottom: 0, left: 0, right: 0 },
    size: 'A4',
  });
  doc.pipe(stream);

  // Minimalist color palette
  const orange = '#ff9800';
  const lightOrange = '#fff3e0';
  const darkText = '#222';
  const gray = '#bdbdbd';
  const white = '#fff';

  // Sidebar dimensions (right side)
  const sidebarWidth = 120;
  const pageW = doc.page.width;
  const pageH = doc.page.height;
  const sidebarX = pageW - sidebarWidth;

  // Sidebar background
  doc.save();
  doc.rect(sidebarX, 0, sidebarWidth, pageH).fill(lightOrange);
  // Orange vertical bar accent
  doc.rect(sidebarX, 0, 8, pageH).fill(orange);
  doc.restore();

  // Sidebar: vertical section titles
  const sections = [
    { key: 'objective', label: 'OBJECTIVE' },
    { key: 'education', label: 'EDUCATION' },
    { key: 'experience', label: 'EXPERIENCE' },
    { key: 'skills', label: 'SKILLS' },
    { key: 'projects', label: 'PROJECTS' },
    { key: 'certifications', label: 'CERTIFICATIONS' },
    { key: 'achievements', label: 'ACHIEVEMENTS' },
    { key: 'languages', label: 'LANGUAGES' },
    { key: 'additional_info', label: 'INFO' },
  ];
  let sidebarY = 60;
  doc.fontSize(12).font('Helvetica-Bold').fillColor(orange);
  sections.forEach(section => {
    doc.save();
    doc.rotate(-90, { origin: [sidebarX + sidebarWidth / 2, sidebarY] });
    doc.text(section.label, sidebarX + sidebarWidth / 2 - 30, sidebarY - 8, { width: 60, align: 'center' });
    doc.restore();
    sidebarY += 48;
  });

  // Name and contact at top left
  let mainY = 40;
  doc.fontSize(26).font('Helvetica-Bold').fillColor(orange)
    .text(studentInfo.name, 50, mainY, { align: 'left' });
  mainY = doc.y + 4;
  doc.fontSize(11).font('Helvetica').fillColor(gray)
    .text(studentInfo.email || '', 50, mainY, { align: 'left' });
  if (studentInfo.branch) {
    mainY = doc.y + 2;
    doc.fontSize(11).font('Helvetica').fillColor(gray)
      .text(studentInfo.branch, 50, mainY, { align: 'left' });
  }
  mainY = doc.y + 18;

  // Main content area (left, lots of whitespace)
  const mainW = pageW - sidebarWidth - 80;
  function sectionContent(key) {
    const content = resumeData[key];
    if (!content) return;
    doc.moveDown(0.5);
    doc.fontSize(12).font('Helvetica').fillColor(darkText)
      .text(content, 50, mainY, { width: mainW, align: 'left', lineGap: 5 });
    mainY = doc.y + 30;
  }
  // Render each section in order, matching sidebar
  sections.forEach(section => sectionContent(section.key));

  // Minimalist footer, right-aligned
  doc.fontSize(8).font('Helvetica').fillColor(gray)
    .text(`${studentInfo.name} • Minimalist Resume • ${new Date().toLocaleDateString()}`,
      0, pageH - 30, { align: 'right' });
  doc.end();
}

/**
 * Creative template - Artistic design with bold colors and unique layout
 */
function generateCreativeTemplate(resumeData, studentInfo, stream, layout = 'single-column') {
  const doc = new PDFDocument({
    margins: { top: 0, bottom: 0, left: 0, right: 0 },
    size: 'A4',
  });
  doc.pipe(stream);

  // Creative color palette
  const purple = '#a21caf';
  const pink = '#f472b6';
  const yellow = '#fde68a';
  const darkText = '#2d033b';
  const lightText = '#a78bfa';

  // Top banner with angled bottom
  doc.save();
  doc.moveTo(0, 0).lineTo(doc.page.width, 0).lineTo(doc.page.width, 100).lineTo(0, 70).closePath().fill(purple);
  doc.restore();

  // Name and contact in banner
  doc.fontSize(28)
     .font('Helvetica-Bold')
     .fillColor('#fff')
     .text(studentInfo.name, 40, 30, { align: 'left' });
  doc.fontSize(12)
     .font('Helvetica')
     .fillColor(lightText)
     .text(studentInfo.email || '', 40, 65, { align: 'left' });
  doc.fontSize(12)
     .font('Helvetica')
     .fillColor(lightText)
     .text(studentInfo.branch || '', 250, 65, { align: 'left' });

  let y = 120;
  // Angled divider
  doc.save();
  doc.moveTo(0, y).lineTo(doc.page.width, y + 20).lineTo(doc.page.width, y + 30).lineTo(0, y + 10).closePath().fill(pink);
  doc.restore();
  y += 40;

  // Profile section
  doc.fontSize(16).font('Helvetica-Bold').fillColor(purple).text('Profile', 50, y);
  y = doc.y + 5;
  doc.fontSize(10).font('Helvetica').fillColor(darkText).text(resumeData.objective || '', 60, y, { width: doc.page.width - 120, lineGap: 3 });
  y = doc.y + 18;

  // Two-column section for Skills and Projects
  const col1x = 50, col2x = doc.page.width / 2 + 10, colWidth = doc.page.width / 2 - 70;
  let colY = y + 10;
  doc.fontSize(14).font('Helvetica-Bold').fillColor(purple).text('Skills', col1x, colY);
  doc.fontSize(14).font('Helvetica-Bold').fillColor(purple).text('Projects', col2x, colY);
  colY += 20;
  doc.fontSize(10).font('Helvetica').fillColor(darkText).text(resumeData.skills || '', col1x, colY, { width: colWidth });
  doc.fontSize(10).font('Helvetica').fillColor(darkText).text(resumeData.projects || '', col2x, colY, { width: colWidth });
  y = Math.max(doc.y, colY + 60);

  // Angled divider for next section
  doc.save();
  doc.moveTo(0, y).lineTo(doc.page.width, y + 20).lineTo(doc.page.width, y + 30).lineTo(0, y + 10).closePath().fill(yellow);
  doc.restore();
  y += 40;

  // Other sections, single column
  function section(title, content) {
    if (!content) return;
    doc.fontSize(15).font('Helvetica-Bold').fillColor(purple).text(title, 50, y);
    y = doc.y + 5;
    doc.fontSize(10).font('Helvetica').fillColor(darkText).text(content, 60, y, { width: doc.page.width - 120, lineGap: 3 });
    y = doc.y + 18;
  }
  section('Education', resumeData.education);
  section('Experience', resumeData.experience);
  section('Certifications', resumeData.certifications);
  section('Achievements', resumeData.achievements);
  section('Languages', resumeData.languages);
  section('Additional Info', resumeData.additional_info);

  // Footer with playful accent
  doc.rect(0, doc.page.height - 30, doc.page.width, 30).fill(pink);
  doc.fontSize(9)
     .font('Helvetica')
     .fillColor(purple)
     .text(`${studentInfo.name} • Creative Resume • ${new Date().toLocaleDateString()}`, 0, doc.page.height - 22, { align: 'center' });
  doc.end();
}

/**
 * Technical template - Unique terminal window style, neon colors, single column, terminal header, code block sections, ASCII/circuit background
 */
function generateTechnicalTemplate(resumeData, studentInfo, stream, layout = 'single-column') {
  // Terminal: single column, dark background, terminal header, neon green/yellow, code block, ASCII/circuit pattern
  const doc = new PDFDocument({
    margins: { top: 0, bottom: 0, left: 0, right: 0 },
    size: 'A4',
  });
  doc.pipe(stream);

  // Terminal color palette
  const termBg = '#181a20';
  const neonGreen = '#39ff14';
  const neonYellow = '#ffe600';
  const neonCyan = '#00fff7';
  const termText = '#e0e0e0';
  const windowRed = '#ff5f56';
  const windowYellow = '#ffbd2e';
  const windowGreen = '#27c93f';
  const faintCircuit = '#23272e';

  const pageW = doc.page.width;
  const pageH = doc.page.height;

  // Terminal window background
  doc.save();
  doc.roundedRect(30, 30, pageW - 60, pageH - 80, 18).fill(termBg);
  doc.restore();

  // Terminal header bar with window controls
  doc.save();
  doc.roundedRect(30, 30, pageW - 60, 38, 18).fill('#23272e');
  // Window control dots
  doc.circle(50, 49, 6).fill(windowRed);
  doc.circle(70, 49, 6).fill(windowYellow);
  doc.circle(90, 49, 6).fill(windowGreen);
  doc.restore();

  // Subtle ASCII/circuit pattern background inside terminal
  for (let x = 50; x < pageW - 60; x += 60) {
    for (let y = 80; y < pageH - 60; y += 40) {
      doc.font('Courier').fontSize(8).fillColor(faintCircuit)
        .text('~#', x, y, { lineBreak: false });
      doc.font('Courier').fontSize(8).fillColor(faintCircuit)
        .text('||', x + 20, y + 10, { lineBreak: false });
      doc.font('Courier').fontSize(8).fillColor(faintCircuit)
        .text('==', x + 40, y + 20, { lineBreak: false });
    }
  }

  // Name and contact in terminal header
  doc.fontSize(18).font('Courier-Bold').fillColor(neonGreen)
    .text(studentInfo.name, 120, 44, { align: 'left', lineBreak: false });
  doc.fontSize(10).font('Courier').fillColor(neonCyan)
    .text(studentInfo.email || '', 120, 62, { align: 'left', lineBreak: false });
  if (studentInfo.branch) {
    doc.fontSize(10).font('Courier').fillColor(neonYellow)
      .text(studentInfo.branch, 320, 62, { align: 'left', lineBreak: false });
  }

  // Content area inside terminal
  let y = 90;
  const x = 60;
  const contentW = pageW - 120;

  // Section helper: terminal command style
  function terminalHeader(cmd, color, y) {
    doc.fontSize(13).font('Courier-Bold').fillColor(color)
      .text(`$ ${cmd}`, x, y);
    return doc.y + 2;
  }
  // Section helper: code block style
  function codeBlock(text, color, y) {
    if (!text) return y;
    doc.save();
    doc.roundedRect(x, y, contentW, doc.heightOfString(text, { width: contentW, font: 'Courier', size: 10 }) + 16, 8).fill('#22242a');
    doc.fontSize(10).font('Courier').fillColor(color)
      .text(text, x + 12, y + 8, { width: contentW - 24, lineGap: 3 });
    doc.restore();
    return y + doc.heightOfString(text, { width: contentW - 24, font: 'Courier', size: 10 }) + 24;
  }

  // Objective
  if (resumeData.objective) {
    y = terminalHeader('profile', neonGreen, y);
    y = codeBlock(resumeData.objective, neonGreen, y);
    y += 8;
  }
  // Experience
  if (resumeData.experience) {
    y = terminalHeader('experience', neonYellow, y);
    y = codeBlock(resumeData.experience, neonYellow, y);
    y += 8;
  }
  // Education
  if (resumeData.education) {
    y = terminalHeader('education', neonCyan, y);
    y = codeBlock(resumeData.education, neonCyan, y);
    y += 8;
  }
  // Skills
  if (resumeData.skills) {
    y = terminalHeader('skills', neonGreen, y);
    y = codeBlock(resumeData.skills, neonGreen, y);
    y += 8;
  }
  // Projects
  if (resumeData.projects) {
    y = terminalHeader('projects', neonYellow, y);
    y = codeBlock(resumeData.projects, neonYellow, y);
    y += 8;
  }
  // Certifications
  if (resumeData.certifications) {
    y = terminalHeader('certifications', neonCyan, y);
    y = codeBlock(resumeData.certifications, neonCyan, y);
    y += 8;
  }
  // Achievements
  if (resumeData.achievements) {
    y = terminalHeader('achievements', neonGreen, y);
    y = codeBlock(resumeData.achievements, neonGreen, y);
    y += 8;
  }
  // Languages
  if (resumeData.languages) {
    y = terminalHeader('languages', neonYellow, y);
    y = codeBlock(resumeData.languages, neonYellow, y);
    y += 8;
  }
  // Additional Info
  if (resumeData.additional_info) {
    y = terminalHeader('info', neonCyan, y);
    y = codeBlock(resumeData.additional_info, neonCyan, y);
    y += 8;
  }

  // Terminal footer as prompt
  doc.fontSize(11).font('Courier').fillColor(neonGreen)
    .text(`$ exit  # ${studentInfo.name} • Technical Resume • ${new Date().toLocaleDateString()}`,
      60, pageH - 36, { align: 'left' });
  doc.end();
}

/**
 * Professional template - Corporate style with structured sections and formal typography
 */
function generateProfessionalTemplate(resumeData, studentInfo, stream, layout = 'single-column') {
  // Professional: Right sidebar for skills/languages, timeline for experience, vertical accent bar
  const doc = new PDFDocument({
    margins: { top: 0, bottom: 0, left: 0, right: 0 },
    size: 'A4',
  });
  doc.pipe(stream);

  // Professional color palette
  const darkGray = '#333333';
  const lightGray = '#f4f4f4';
  const accentColor = '#ff5722';
  const darkText = '#111111';
  const mediumText = '#666666';
  const lightText = '#999999';

  // Right sidebar
  const sidebarWidth = 140;
  const pageW = doc.page.width;
  const pageH = doc.page.height;
  const sidebarX = pageW - sidebarWidth;
  doc.save();
  doc.rect(sidebarX, 0, sidebarWidth, pageH).fill(lightGray);
  doc.rect(sidebarX, 0, 8, pageH).fill(accentColor);
  doc.restore();

  // Sidebar: Skills and Languages
  let sidebarY = 60;
  doc.fontSize(13).font('Helvetica-Bold').fillColor(accentColor).text('SKILLS', sidebarX + 20, sidebarY);
  sidebarY += 20;
  doc.fontSize(10).font('Helvetica').fillColor(darkGray).text(resumeData.skills || '', sidebarX + 20, sidebarY, { width: sidebarWidth - 40, lineGap: 3 });
  sidebarY = doc.y + 18;
  doc.fontSize(13).font('Helvetica-Bold').fillColor(accentColor).text('LANGUAGES', sidebarX + 20, sidebarY);
  sidebarY += 20;
  doc.fontSize(10).font('Helvetica').fillColor(darkGray).text(resumeData.languages || '', sidebarX + 20, sidebarY, { width: sidebarWidth - 40, lineGap: 3 });

  // Header
  doc.rect(0, 0, pageW, 70).fill(darkGray);
  doc.fontSize(28).font('Helvetica-Bold').fillColor('#fff').text(studentInfo.name.toUpperCase(), 40, 22, { align: 'left' });
  doc.fontSize(12).font('Helvetica').fillColor('#e0f2fe').text(studentInfo.email || '', 40, 54, { align: 'left' });
  doc.fontSize(12).font('Helvetica').fillColor('#e0f2fe').text(studentInfo.branch || '', 300, 54, { align: 'left' });

  // Main content area
  let x = 60, y = 90, mainW = pageW - sidebarWidth - 100;

  // Professional Summary
  if (resumeData.objective) {
    doc.fontSize(16).font('Helvetica-Bold').fillColor(accentColor).text('PROFESSIONAL SUMMARY', x, y);
    y = doc.y + 4;
    doc.fontSize(11).font('Helvetica').fillColor(mediumText).text(resumeData.objective, x, y, { width: mainW, align: 'justify', lineGap: 4 });
    y = doc.y + 18;
  }

  // Timeline for Experience
  if (resumeData.experience) {
    doc.fontSize(15).font('Helvetica-Bold').fillColor(accentColor).text('EXPERIENCE', x, y);
    y = doc.y + 6;
    const lines = resumeData.experience.split('\n').map(l => l.trim()).filter(Boolean);
    let tY = y;
    lines.forEach((line, idx) => {
      doc.circle(x + 6, tY + 7, 5).fill(accentColor);
      if (idx < lines.length - 1) {
        doc.moveTo(x + 6, tY + 12).lineTo(x + 6, tY + 32).strokeColor(accentColor).lineWidth(2).stroke();
      }
      doc.fontSize(11).font('Helvetica').fillColor(darkText).text(line, x + 20, tY, { width: mainW - 30, lineGap: 2 });
      tY += 30;
    });
    y = tY + 8;
  }

  // Education
  if (resumeData.education) {
    doc.fontSize(15).font('Helvetica-Bold').fillColor(accentColor).text('EDUCATION', x, y);
    y = doc.y + 6;
    doc.fontSize(11).font('Helvetica').fillColor(darkText).text(resumeData.education, x, y, { width: mainW, lineGap: 3 });
    y = doc.y + 18;
  }

  // Projects
  if (resumeData.projects) {
    doc.fontSize(15).font('Helvetica-Bold').fillColor(accentColor).text('PROJECTS', x, y);
    y = doc.y + 6;
    doc.fontSize(11).font('Helvetica').fillColor(darkText).text(resumeData.projects, x, y, { width: mainW, lineGap: 3 });
    y = doc.y + 18;
  }

  // Certifications, Achievements, Additional Info
  function section(title, content) {
    if (!content) return;
    doc.fontSize(15).font('Helvetica-Bold').fillColor(accentColor).text(title, x, y);
    y = doc.y + 4;
    doc.fontSize(11).font('Helvetica').fillColor(darkText).text(content, x, y, { width: mainW, lineGap: 3 });
    y = doc.y + 18;
  }
  section('CERTIFICATIONS', resumeData.certifications);
  section('ACHIEVEMENTS', resumeData.achievements);
  section('ADDITIONAL INFO', resumeData.additional_info);

  // Professional footer
  doc.fontSize(10).font('Helvetica').fillColor(lightText)
    .text(`${studentInfo.name} • Professional Resume • ${new Date().toLocaleDateString()}`, 0, pageH - 30, { align: 'center' });
  doc.end();
}

/**
 * Academic template - Structured with left sidebar for education/research, main area for experience/publications, vertical timeline for education
 */
function generateAcademicTemplate(resumeData, studentInfo, stream, layout = 'single-column') {
  // Academic: Left sidebar for education/research, main for experience/publications, vertical timeline for education
  const doc = new PDFDocument({
    margins: { top: 0, bottom: 0, left: 0, right: 0 },
    size: 'A4',
  });
  doc.pipe(stream);

  // Academic color palette
  const maroon = '#800000';
  const lightMaroon = '#f8d7da';
  const darkText = '#333333';
  const mediumText = '#555555';
  const lightText = '#777777';

  // Left sidebar
  const sidebarWidth = 170;
  const pageW = doc.page.width;
  const pageH = doc.page.height;
  doc.save();
  doc.rect(0, 0, sidebarWidth, pageH).fill(lightMaroon);
  doc.rect(0, 0, sidebarWidth, 80).fill(maroon);
  doc.restore();

  // Sidebar: Name, contact, education, research
  let sidebarY = 30;
  doc.fontSize(22).font('Times-Bold').fillColor('#fff').text(studentInfo.name, 20, sidebarY, { width: sidebarWidth - 40 });
  sidebarY = doc.y + 8;
  doc.fontSize(11).font('Times-Roman').fillColor('#fff').text(studentInfo.email || '', 20, sidebarY, { width: sidebarWidth - 40 });
  sidebarY = doc.y + 4;
  doc.fontSize(11).font('Times-Roman').fillColor('#fff').text(studentInfo.branch || '', 20, sidebarY, { width: sidebarWidth - 40 });
  sidebarY = doc.y + 16;
  doc.fontSize(13).font('Times-Bold').fillColor(maroon).text('EDUCATION', 20, sidebarY);
  sidebarY += 18;
  // Timeline for education
  if (resumeData.education) {
    const lines = resumeData.education.split('\n').map(l => l.trim()).filter(Boolean);
    let tY = sidebarY;
    lines.forEach((line, idx) => {
      doc.circle(32, tY + 7, 4).fill(maroon);
      if (idx < lines.length - 1) {
        doc.moveTo(32, tY + 11).lineTo(32, tY + 28).strokeColor(maroon).lineWidth(2).stroke();
      }
      doc.fontSize(10).font('Times-Roman').fillColor(darkText).text(line, 44, tY, { width: sidebarWidth - 60 });
      tY += 24;
    });
    sidebarY = tY + 8;
  }
  doc.fontSize(13).font('Times-Bold').fillColor(maroon).text('RESEARCH', 20, sidebarY);
  sidebarY += 18;
  doc.fontSize(10).font('Times-Roman').fillColor(darkText).text(resumeData.research || '', 20, sidebarY, { width: sidebarWidth - 40, lineGap: 2 });
  sidebarY = doc.y + 10;

  // Main content area
  let x = sidebarWidth + 30, y = 40, mainW = pageW - sidebarWidth - 60;
  // Publications
  doc.fontSize(15).font('Times-Bold').fillColor(maroon).text('PUBLICATIONS', x, y);
  y = doc.y + 4;
  doc.fontSize(11).font('Times-Roman').fillColor(mediumText).text(resumeData.publications || '', x, y, { width: mainW, lineGap: 3 });
  y = doc.y + 18;
  // Conferences
  doc.fontSize(15).font('Times-Bold').fillColor(maroon).text('CONFERENCES', x, y);
  y = doc.y + 4;
  doc.fontSize(11).font('Times-Roman').fillColor(mediumText).text(resumeData.conferences || '', x, y, { width: mainW, lineGap: 3 });
  y = doc.y + 18;
  // Teaching Experience
  doc.fontSize(15).font('Times-Bold').fillColor(maroon).text('TEACHING EXPERIENCE', x, y);
  y = doc.y + 4;
  doc.fontSize(11).font('Times-Roman').fillColor(mediumText).text(resumeData.teaching_experience || '', x, y, { width: mainW, lineGap: 3 });
  y = doc.y + 18;
  // Experience
  doc.fontSize(15).font('Times-Bold').fillColor(maroon).text('EXPERIENCE', x, y);
  y = doc.y + 4;
  doc.fontSize(11).font('Times-Roman').fillColor(mediumText).text(resumeData.experience || '', x, y, { width: mainW, lineGap: 3 });
  y = doc.y + 18;
  // Skills, Certifications, Achievements, Additional Info
  function section(title, content) {
    if (!content) return;
    doc.fontSize(15).font('Times-Bold').fillColor(maroon).text(title, x, y);
    y = doc.y + 4;
    doc.fontSize(11).font('Times-Roman').fillColor(mediumText).text(content, x, y, { width: mainW, lineGap: 3 });
    y = doc.y + 18;
  }
  section('SKILLS', resumeData.skills);
  section('CERTIFICATIONS', resumeData.certifications);
  section('ACHIEVEMENTS', resumeData.achievements);
  section('LANGUAGES', resumeData.languages);
  section('ADDITIONAL INFO', resumeData.additional_info);

  // Academic footer
  doc.fontSize(10).font('Times-Italic').fillColor(lightText)
    .text(`${studentInfo.name} • Academic Resume • ${new Date().toLocaleDateString()}`, 0, pageH - 30, { align: 'center' });
  doc.end();
}

/**
 * Elegant template - Centered header, gold border, two-column skills/projects vs. experience/education, soft background pattern
 */
function generateElegantTemplate(resumeData, studentInfo, stream, layout = 'single-column') {
  // Elegant: Centered header, gold border, two-column skills/projects vs. experience/education, soft background pattern
  const doc = new PDFDocument({
    margins: { top: 0, bottom: 0, left: 0, right: 0 },
    size: 'A4',
  });
  doc.pipe(stream);

  // Elegant color palette
  const lightBlue = '#e1f5fe';
  const darkBlue = '#01579b';
  const gold = '#ffd54f';
  const darkText = '#212121';
  const mediumText = '#424242';
  const lightText = '#757575';

  // Soft background pattern
  for (let x = 0; x < doc.page.width; x += 60) {
    for (let y = 0; y < doc.page.height; y += 60) {
      doc.circle(x + 30, y + 30, 18).fillOpacity(0.07).fill(lightBlue).fillOpacity(1);
    }
  }

  // Gold border
  doc.save();
  doc.lineWidth(4).strokeColor(gold).rect(8, 8, doc.page.width - 16, doc.page.height - 16).stroke();
  doc.restore();

  // Centered header
  doc.rect(0, 0, doc.page.width, 90).fill(lightBlue);
  doc.fontSize(28).font('Times-Bold').fillColor(darkBlue).text(studentInfo.name.toUpperCase(), 0, 24, { align: 'center' });
  doc.fontSize(12).font('Times-Roman').fillColor(darkText).text(studentInfo.email || '', 0, 60, { align: 'center' });
  doc.fontSize(12).font('Times-Roman').fillColor(darkText).text(studentInfo.branch || '', 0, 76, { align: 'center' });

  // Two-column layout for main content
  let col1x = 60, col2x = doc.page.width / 2 + 10, colWidth = doc.page.width / 2 - 80;
  let colY = 110;
  doc.fontSize(15).font('Times-Bold').fillColor(gold).text('SKILLS', col1x, colY);
  doc.fontSize(15).font('Times-Bold').fillColor(gold).text('EXPERIENCE', col2x, colY);
  colY += 20;
  doc.fontSize(11).font('Times-Roman').fillColor(mediumText).text(resumeData.skills || '', col1x, colY, { width: colWidth, lineGap: 3 });
  doc.fontSize(11).font('Times-Roman').fillColor(mediumText).text(resumeData.experience || '', col2x, colY, { width: colWidth, lineGap: 3 });
  let y = Math.max(doc.y, colY + 60);

  // Second row: Projects and Education
  doc.fontSize(15).font('Times-Bold').fillColor(gold).text('PROJECTS', col1x, y);
  doc.fontSize(15).font('Times-Bold').fillColor(gold).text('EDUCATION', col2x, y);
  y += 20;
  doc.fontSize(11).font('Times-Roman').fillColor(mediumText).text(resumeData.projects || '', col1x, y, { width: colWidth, lineGap: 3 });
  doc.fontSize(11).font('Times-Roman').fillColor(mediumText).text(resumeData.education || '', col2x, y, { width: colWidth, lineGap: 3 });
  y = Math.max(doc.y, y + 60);

  // Single column for remaining sections
  function section(title, content) {
    if (!content) return;
    doc.fontSize(15).font('Times-Bold').fillColor(gold).text(title, 60, y);
    y = doc.y + 4;
    doc.fontSize(11).font('Times-Roman').fillColor(mediumText).text(content, 60, y, { width: doc.page.width - 120, lineGap: 3 });
    y = doc.y + 18;
  }
  section('CERTIFICATIONS', resumeData.certifications);
  section('ACHIEVEMENTS', resumeData.achievements);
  section('LANGUAGES', resumeData.languages);
  section('ADDITIONAL INFO', resumeData.additional_info);

  // Elegant footer
  doc.fontSize(10).font('Times-Italic').fillColor(lightText)
    .text(`${studentInfo.name} • Elegant Resume • ${new Date().toLocaleDateString()}`, 0, doc.page.height - 30, { align: 'center' });
  doc.end();
}
// Placeholder functions for other templates - using Modern template as fallback for now
function generateNewTemplate1(resumeData, studentInfo, stream, layout) {
  generateModernTemplate(resumeData, studentInfo, stream, layout);
}

function generateNewTemplate2(resumeData, studentInfo, stream, layout) {
  generateModernTemplate(resumeData, studentInfo, stream, layout);
}

module.exports = {
  generateResumePDF
};
