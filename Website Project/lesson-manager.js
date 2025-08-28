document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const classesContainer = document.getElementById('classesContainer');
  const emptyState = document.getElementById('emptyState');
  const totalClassesEl = document.getElementById('totalClasses');
  const totalLessonsEl = document.getElementById('totalLessons');
  const completedLessonsEl = document.getElementById('completedLessons');
  const searchInput = document.getElementById('searchInput');
  const statusFilter = document.getElementById('statusFilter');
  
  // Buttons
  const createClassBtn = document.getElementById('createClassBtn');
  const importBtn = document.getElementById('importBtn');
  const profileBtn = document.getElementById('profileBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const fileInput = document.getElementById('fileInput');
  
  // Modals
  const createClassModal = document.getElementById('createClassModal');
  const createLessonModal = document.getElementById('createLessonModal');
  const viewLessonModal = document.getElementById('viewLessonModal');
  const profileModal = document.getElementById('profileModal');
  const importProgressModal = document.getElementById('importProgressModal');
  
  // Forms
  const createClassForm = document.getElementById('createClassForm');
  const createLessonForm = document.getElementById('createLessonForm');
  const profileForm = document.getElementById('profileForm');
  
  // Profile elements
  const profileImg = document.getElementById('profileImg');
  const profilePlaceholder = document.getElementById('profilePlaceholder');
  const profileInitials = document.getElementById('profileInitials');
  const uploadPictureBtn = document.getElementById('uploadPictureBtn');
  const profilePictureInput = document.getElementById('profilePictureInput');
  
  let currentSlide = 0;
  let lessonSlides = [];

  function splitContentIntoSlides(content, maxLength = 800) {
    if (!content || content.length <= maxLength) {
      return [content || ''];
    }

    const slides = [];
    const paragraphs = content.split('\n\n');
    let currentSlideContent = '';

    for (const paragraph of paragraphs) {
      if ((currentSlideContent + paragraph).length <= maxLength) {
        currentSlideContent += (currentSlideContent ? '\n\n' : '') + paragraph;
      } else {
        if (currentSlideContent) {
          slides.push(currentSlideContent);
          currentSlideContent = paragraph;
        } else {
          // Handle very long paragraphs
          const words = paragraph.split(' ');
          let tempContent = '';
          
          for (const word of words) {
            if ((tempContent + ' ' + word).length <= maxLength) {
              tempContent += (tempContent ? ' ' : '') + word;
            } else {
              if (tempContent) {
                slides.push(tempContent);
                tempContent = word;
              } else {
                slides.push(word);
              }
            }
          }
          currentSlideContent = tempContent;
        }
      }
    }

    if (currentSlideContent) {
      slides.push(currentSlideContent);
    }

    return slides.length > 0 ? slides : [''];
  }

  function updateSlideDisplay() {
    const contentEl = document.getElementById('viewLessonContent');
    const counterEl = document.getElementById('slideCounter');
    const slideDots = document.getElementById('slideDots');

    // Update content
    contentEl.textContent = lessonSlides[currentSlide] || '';

    // Update counter
    counterEl.textContent = `${currentSlide + 1} / ${lessonSlides.length}`;

    // Update slide dots
    slideDots.innerHTML = '';
    for (let i = 0; i < lessonSlides.length; i++) {
      const dot = document.createElement('div');
      dot.className = `slide-dot ${i === currentSlide ? 'active' : ''}`;
      dot.onclick = () => goToSlide(i);
      slideDots.appendChild(dot);
    }
  }

  function goToSlide(slideIndex) {
    if (slideIndex >= 0 && slideIndex < lessonSlides.length) {
      currentSlide = slideIndex;
      updateSlideDisplay();
    }
  }

  function nextSlide() {
    if (currentSlide < lessonSlides.length - 1) {
      currentSlide++;
      updateSlideDisplay();
    }
  }

  function prevSlide() {
    if (currentSlide > 0) {
      currentSlide--;
      updateSlideDisplay();
    }
  }

  let allClasses = [];
  let filteredClasses = [];
  let currentClassId = null;
  let currentLessonId = null;

  // Database functions
  function getLessonDatabase() {
    const data = localStorage.getItem('lessonDatabase');
    return data ? JSON.parse(data) : { classes: [] };
  }

  function saveLessonDatabase(db) {
    localStorage.setItem('lessonDatabase', JSON.stringify(db));
  }

  // Profile functions
  function getProfile() {
    const data = localStorage.getItem('userProfile');
    return data ? JSON.parse(data) : {
      name: '',
      email: '',
      role: '',
      bio: '',
      institution: '',
      picture: null
    };
  }

  function saveProfile(profileData) {
    localStorage.setItem('userProfile', JSON.stringify(profileData));
  }

  function loadProfile() {
    const profile = getProfile();
    document.getElementById('profileName').value = profile.name || '';
    document.getElementById('profileEmail').value = profile.email || '';
    document.getElementById('profileRole').value = profile.role || '';
    document.getElementById('profileBio').value = profile.bio || '';
    document.getElementById('profileInstitution').value = profile.institution || '';
    
    if (profile.picture) {
      profileImg.src = profile.picture;
      profileImg.style.display = 'block';
      profilePlaceholder.style.display = 'none';
    } else {
      profileImg.style.display = 'none';
      profilePlaceholder.style.display = 'flex';
      const initials = (profile.name || 'User Name').split(' ').map(n => n[0]).join('').toUpperCase() || 'UN';
      profileInitials.textContent = initials;
    }
  }

  function generateId() {
    return Date.now() + Math.random().toString(36).substr(2, 9);
  }

  function createClass(classData) {
    const db = getLessonDatabase();
    
    // Check if class code already exists
    const existingClass = db.classes.find(c => c.code === classData.code);
    if (existingClass) {
      throw new Error('Class code already exists');
    }
    
    const newClass = {
      id: generateId(),
      name: classData.name,
      code: classData.code.toUpperCase(),
      description: classData.description || '',
      lessons: [],
      createdAt: new Date().toISOString()
    };
    
    db.classes.push(newClass);
    saveLessonDatabase(db);
    return newClass;
  }

  function createLesson(classId, lessonData) {
    const db = getLessonDatabase();
    const classIndex = db.classes.findIndex(c => c.id === classId);
    
    if (classIndex === -1) {
      throw new Error('Class not found');
    }
    
    const newLesson = {
      id: generateId(),
      title: lessonData.title,
      content: lessonData.content,
      duration: parseInt(lessonData.duration) || 60,
      order: parseInt(lessonData.order) || (db.classes[classIndex].lessons.length + 1),
      status: 'not-started',
      createdAt: new Date().toISOString()
    };
    
    db.classes[classIndex].lessons.push(newLesson);
    
    // Sort lessons by order
    db.classes[classIndex].lessons.sort((a, b) => a.order - b.order);
    
    saveLessonDatabase(db);
    return newLesson;
  }

  function updateLessonStatus(classId, lessonId, status) {
    const db = getLessonDatabase();
    const classObj = db.classes.find(c => c.id === classId);
    
    if (!classObj) throw new Error('Class not found');
    
    const lesson = classObj.lessons.find(l => l.id === lessonId);
    if (!lesson) throw new Error('Lesson not found');
    
    lesson.status = status;
    lesson.updatedAt = new Date().toISOString();
    
    saveLessonDatabase(db);
    return lesson;
  }

  // File import function

  async function importFiles(files) {
    const progressModal = document.getElementById('importProgressModal');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const fileList = document.getElementById('fileList');
    
    progressModal.classList.add('show');
    fileList.innerHTML = '';
    
    const totalFiles = files.length;
    let processedFiles = 0;
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileItem = document.createElement('div');
      fileItem.className = 'file-item';
      fileItem.innerHTML = `
        <span>${file.name}</span>
        <span class="file-status status-processing">Processing...</span>
      `;
      fileList.appendChild(fileItem);
      
      try {
        await processFile(file);
        fileItem.querySelector('.file-status').textContent = 'Success';
        fileItem.querySelector('.file-status').className = 'file-status status-success';
      } catch (error) {
        fileItem.querySelector('.file-status').textContent = 'Error';
        fileItem.querySelector('.file-status').className = 'file-status status-error';
      }
      
      processedFiles++;
      const progress = (processedFiles / totalFiles) * 100;
      progressFill.style.width = `${progress}%`;
      progressText.textContent = `Processed ${processedFiles} of ${totalFiles} files`;
    }
    
    setTimeout(() => {
      progressModal.classList.remove('show');
      loadClasses();
    }, 2000);
  }

  async function processFile(file) {
    const extension = file.name.split('.').pop().toLowerCase();
    
    if (['pdf'].includes(extension)) {
      return processPDFFile(file);
    } else if (['doc', 'docx'].includes(extension)) {
      return processWordFile(file);
    } else if (['ppt', 'pptx'].includes(extension)) {
      return processPowerPointFile(file);
    } else {
      throw new Error('Unsupported file format');
    }
  }

  async function processPDFFile(file) {
    const className = file.name.replace(/\.[^/.]+$/, "");
    const classData = {
      name: className,
      code: className.substring(0, 6).toUpperCase(),
      description: `Imported from PDF: ${file.name}`
    };
    
    const newClass = createClass(classData);
    
    const lessonData = {
      title: `PDF Content: ${file.name}`,
      content: `This lesson was imported from a PDF file: ${file.name}\n\nFile size: ${(file.size / 1024).toFixed(2)} KB\nImported on: ${new Date().toLocaleString()}`,
      duration: 60,
      order: 1
    };
    
    createLesson(newClass.id, lessonData);
  }

  async function processWordFile(file) {
    if (window.mammoth) {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({arrayBuffer});
      
      const className = file.name.replace(/\.[^/.]+$/, "");
      const classData = {
        name: className,
        code: className.substring(0, 6).toUpperCase(),
        description: `Imported from Word document: ${file.name}`
      };
      
      const newClass = createClass(classData);
      
      const lessonData = {
        title: `Word Document: ${file.name}`,
        content: result.value || `Content from ${file.name}\n\nFile imported successfully.`,
        duration: 45,
        order: 1
      };
      
      createLesson(newClass.id, lessonData);
    } else {
      throw new Error('Word processing library not available');
    }
  }

  async function processPowerPointFile(file) {
    const className = file.name.replace(/\.[^/.]+$/, "");
    const classData = {
      name: className,
      code: className.substring(0, 6).toUpperCase(),
      description: `Imported from PowerPoint: ${file.name}`
    };
    
    const newClass = createClass(classData);
    
    const lessonData = {
      title: `PowerPoint: ${file.name}`,
      content: `This lesson was imported from a PowerPoint presentation: ${file.name}\n\nFile size: ${(file.size / 1024).toFixed(2)} KB\nImported on: ${new Date().toLocaleString()}\n\nNote: Slide content extraction requires additional processing.`,
      duration: 30,
      order: 1
    };
    
    createLesson(newClass.id, lessonData);
  }

  function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#22c55e' : type === 'error' ? '#ef4444' : '#7c3aed'};
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-weight: 500;
      z-index: 1000;
      animation: slideIn 0.3s ease;
      box-shadow: 0 8px 25px rgba(0,0,0,0.2);
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }

  function generateClassCard(classObj) {
    const totalLessons = classObj.lessons.length;
    const completedLessons = classObj.lessons.filter(l => l.status === 'completed').length;
    const progressPercent = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
    
    return `
      <div class="class-card" data-class-id="${classObj.id}">
        <div class="class-header">
          <div class="class-info">
            <h3>${classObj.name}</h3>
            <span class="class-code">${classObj.code}</span>
          </div>
        </div>
        
        ${classObj.description ? `<p class="class-description">${classObj.description}</p>` : ''}
        
        <div class="lessons-preview">
          <div class="lessons-count">${totalLessons} Lessons • ${completedLessons} Completed (${Math.round(progressPercent)}%)</div>
          <div class="lessons-list" id="lessons-${classObj.id}">
            ${classObj.lessons.slice(0, 3).map(lesson => `
              <div class="lesson-item" onclick="openLessonViewer('${classObj.id}', '${lesson.id}')">
                <span class="lesson-title">${lesson.title}</span>
                <span class="lesson-status status-${lesson.status}">${lesson.status.replace('-', ' ')}</span>
              </div>
            `).join('')}
            ${totalLessons > 3 ? `
              <div class="hidden-lessons" id="hidden-lessons-${classObj.id}" style="display:none;">
                ${classObj.lessons.slice(3).map(lesson => `
                  <div class="lesson-item" onclick="openLessonViewer('${classObj.id}', '${lesson.id}')">
                    <span class="lesson-title">${lesson.title}</span>
                    <span class="lesson-status status-${lesson.status}">${lesson.status.replace('-', ' ')}</span>
                  </div>
                `).join('')}
              </div>
              <div class="lesson-item toggle-lessons">
                <span class="lesson-title toggle-link" onclick="toggleLessons('${classObj.id}', ${totalLessons})" id="toggle-${classObj.id}">+ Show ${totalLessons - 3} more lessons...</span>
              </div>
            ` : ''}
          </div>
        </div>
        
        <div class="class-actions">
          <button class="action-btn add-lesson-btn" onclick="openCreateLessonModal('${classObj.id}')">+ Add Lesson</button>
        </div>
      </div>
    `;
  }

  function displayClasses(classes) {
    if (classes.length === 0) {
      classesContainer.style.display = 'none';
      emptyState.style.display = 'block';
    } else {
      classesContainer.style.display = 'grid';
      emptyState.style.display = 'none';
      classesContainer.innerHTML = classes.map(classObj => generateClassCard(classObj)).join('');
    }
  }

  function updateStatistics() {
    const db = getLessonDatabase();
    const totalClasses = db.classes.length;
    const totalLessons = db.classes.reduce((sum, c) => sum + c.lessons.length, 0);
    const completedLessons = db.classes.reduce((sum, c) => 
      sum + c.lessons.filter(l => l.status === 'completed').length, 0);
    
    totalClassesEl.textContent = totalClasses;
    totalLessonsEl.textContent = totalLessons;
    completedLessonsEl.textContent = completedLessons;
  }

  function filterClasses() {
    const searchTerm = searchInput.value.toLowerCase();
    const statusFilterValue = statusFilter.value;
    
    filteredClasses = allClasses.filter(classObj => {
      const matchesSearch = classObj.name.toLowerCase().includes(searchTerm) ||
                           classObj.code.toLowerCase().includes(searchTerm) ||
                           classObj.lessons.some(l => l.title.toLowerCase().includes(searchTerm));
      
      if (!matchesSearch) return false;
      
      if (statusFilterValue === 'all') return true;
      
      return classObj.lessons.some(l => l.status === statusFilterValue);
    });
    
    displayClasses(filteredClasses);
  }

  function loadClasses() {
    const db = getLessonDatabase();
    allClasses = db.classes || [];
    filteredClasses = [...allClasses];
    updateStatistics();
    displayClasses(filteredClasses);
  }

  // Global functions for onclick handlers
  window.openCreateClassModal = function() {
    createClassModal.classList.add('show');
  };

  window.openCreateLessonModal = function(classId) {
    currentClassId = classId;
    const classObj = allClasses.find(c => c.id === classId);
    document.getElementById('lessonClassId').value = classId;
    document.getElementById('lessonOrder').value = (classObj.lessons.length + 1);
    createLessonModal.classList.add('show');
  };

  window.openLessonViewer = function(classId, lessonId) {
    const classObj = allClasses.find(c => c.id === classId);
    const lesson = classObj.lessons.find(l => l.id === lessonId);
    
    if (!lesson) return;
    
    currentClassId = classId;
    currentLessonId = lessonId;
    currentSlide = 0;
    
    // Split lesson content into slides
    lessonSlides = splitContentIntoSlides(lesson.content);
    
    document.getElementById('viewLessonTitle').textContent = lesson.title;
    document.getElementById('viewLessonDuration').textContent = `${lesson.duration} minutes`;
    document.getElementById('viewLessonStatus').textContent = lesson.status.replace('-', ' ');
    document.getElementById('viewLessonStatus').className = `lesson-status status-${lesson.status}`;
    
    // Update slide display
    updateSlideDisplay();
    
    const toggleBtn = document.getElementById('toggleStatusBtn');
    if (lesson.status === 'completed') {
      toggleBtn.textContent = 'Mark Incomplete';
      toggleBtn.className = 'btn status-btn';
    } else {
      toggleBtn.textContent = 'Mark Complete';
      toggleBtn.className = 'btn status-btn';
    }
    
    viewLessonModal.classList.add('show');
  };

  window.toggleLessons = function(classId, totalLessons) {
    const hiddenLessons = document.getElementById(`hidden-lessons-${classId}`);
    const toggleLink = document.getElementById(`toggle-${classId}`);
    
    if (hiddenLessons.style.display === 'none') {
      hiddenLessons.style.display = 'block';
      toggleLink.textContent = '- Show fewer lessons';
      toggleLink.classList.add('expanded');
    } else {
      hiddenLessons.style.display = 'none';
      toggleLink.textContent = `+ Show ${totalLessons - 3} more lessons...`;
      toggleLink.classList.remove('expanded');
    }
  };

  // Event Listeners
  createClassBtn.addEventListener('click', () => openCreateClassModal());
  
  profileBtn.addEventListener('click', () => {
    loadProfile();
    profileModal.classList.add('show');
  });

  logoutBtn.addEventListener('click', () => {
    // Show confirmation dialog
    if (confirm('Are you sure you want to logout?')) {
      // Clear any user session data if needed
      localStorage.removeItem('currentUser');
      sessionStorage.clear();
      
      // Redirect to login page
      window.location.href = 'index.html';
    }
  });

  importBtn.addEventListener('click', () => {
    fileInput.click();
  });
  
  fileInput.addEventListener('change', async (e) => {
    if (e.target.files.length > 0) {
      await importFiles(Array.from(e.target.files));
      e.target.value = '';
    }
  });

  uploadPictureBtn.addEventListener('click', () => {
    profilePictureInput.click();
  });

  profilePictureInput.addEventListener('change', (e) => {
    if (e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = function(e) {
        profileImg.src = e.target.result;
        profileImg.style.display = 'block';
        profilePlaceholder.style.display = 'none';
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  });

  searchInput.addEventListener('input', filterClasses);
  statusFilter.addEventListener('change', filterClasses);

  // Modal close handlers
  document.getElementById('closeCreateModal').addEventListener('click', () => {
    createClassModal.classList.remove('show');
  });
  
  document.getElementById('cancelCreateClass').addEventListener('click', () => {
    createClassModal.classList.remove('show');
  });
  
  document.getElementById('closeCreateLessonModal').addEventListener('click', () => {
    createLessonModal.classList.remove('show');
  });
  
  document.getElementById('cancelCreateLesson').addEventListener('click', () => {
    createLessonModal.classList.remove('show');
  });
  
  document.getElementById('closeViewLessonModal').addEventListener('click', () => {
    viewLessonModal.classList.remove('show');
  });

  document.getElementById('closeProfileModal').addEventListener('click', () => {
    profileModal.classList.remove('show');
  });

  document.getElementById('cancelProfile').addEventListener('click', () => {
    profileModal.classList.remove('show');
  });

  // Form submissions
  createClassForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const classData = {
      name: formData.get('className').trim(),
      code: formData.get('classCode').trim(),
      description: formData.get('classDescription').trim()
    };
    
    if (!classData.name || !classData.code) {
      showNotification('Class name and code are required!', 'error');
      return;
    }
    
    try {
      createClass(classData);
      showNotification('Class created successfully!', 'success');
      createClassModal.classList.remove('show');
      createClassForm.reset();
      loadClasses();
    } catch (error) {
      showNotification(error.message, 'error');
    }
  });

  createLessonForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const lessonData = {
      title: formData.get('lessonTitle').trim(),
      content: formData.get('lessonContent').trim(),
      duration: formData.get('lessonDuration'),
      order: formData.get('lessonOrder')
    };
    
    if (!lessonData.title || !lessonData.content) {
      showNotification('Lesson title and content are required!', 'error');
      return;
    }
    
    try {
      createLesson(currentClassId, lessonData);
      showNotification('Lesson added successfully!', 'success');
      createLessonModal.classList.remove('show');
      createLessonForm.reset();
      loadClasses();
    } catch (error) {
      showNotification(error.message, 'error');
    }
  });

  // Toggle lesson status
  document.getElementById('toggleStatusBtn').addEventListener('click', () => {
    if (!currentClassId || !currentLessonId) return;
    
    const classObj = allClasses.find(c => c.id === currentClassId);
    const lesson = classObj.lessons.find(l => l.id === currentLessonId);
    
    const newStatus = lesson.status === 'completed' ? 'not-started' : 'completed';
    
    try {
      updateLessonStatus(currentClassId, currentLessonId, newStatus);
      showNotification(`Lesson marked as ${newStatus.replace('-', ' ')}!`, 'success');
      loadClasses();
      openLessonViewer(currentClassId, currentLessonId); // Refresh the modal
    } catch (error) {
      showNotification(error.message, 'error');
    }
  });

  // Close modals when clicking outside
  [createClassModal, createLessonModal, viewLessonModal, profileModal].forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('show');
      }
    });
  });

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (viewLessonModal.classList.contains('show')) {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        nextSlide();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevSlide();
      }
    }
  });

  // Profile form submission
  profileForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const profileData = {
      name: formData.get('profileName').trim(),
      email: formData.get('profileEmail').trim(),
      role: formData.get('profileRole').trim(),
      bio: formData.get('profileBio').trim(),
      institution: formData.get('profileInstitution').trim(),
      picture: profileImg.style.display === 'block' ? profileImg.src : null
    };
    
    saveProfile(profileData);
    showNotification('Profile saved successfully!', 'success');
    profileModal.classList.remove('show');
  });

  // Add animations
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
  `;
  document.head.appendChild(style);

  // Initialize
  loadClasses();
  
  // Create sample data if empty
  setTimeout(() => {
    if (allClasses.length === 0) {
      const sampleClass = {
        name: 'Web Development Fundamentals',
        code: 'WEB101',
        description: 'Learn the basics of web development including HTML, CSS, and JavaScript.'
      };
      
      try {
        const newClass = createClass(sampleClass);
        createLesson(newClass.id, {
          title: 'Introduction to HTML',
          content: 'HTML (HyperText Markup Language) is the standard markup language for creating web pages. It describes the structure of a web page using elements and tags.\n\nIn this lesson, you will learn:\n- Basic HTML structure\n- Common HTML tags\n- Creating your first webpage\n- Best practices for HTML coding',
          duration: 45,
          order: 1
        });
        createLesson(newClass.id, {
          title: 'CSS Styling Basics',
          content: 'CSS (Cascading Style Sheets) is used to style and layout web pages. It controls the visual presentation of HTML elements.\n\nTopics covered:\n- CSS selectors\n- Colors and fonts\n- Box model\n- Layout techniques',
          duration: 60,
          order: 2
        });
        loadClasses();
        showNotification('Sample lesson created for demonstration!', 'info');
      } catch (error) {
        console.log('Sample data already exists');
      }
    }
  }, 1000);
});
