document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  const card = document.querySelector('.login-card');
  const forgotPasswordLink = document.getElementById('forgotPassword');
  const createAccountLink = document.getElementById('createAccount');
  const adminBtn = document.getElementById('adminBtn');
  const errorModal = document.getElementById('errorModal');
  const successModal = document.getElementById('successModal');
  const loadingModal = document.getElementById('loadingModal');
  const retryBtn = document.getElementById('retryBtn');
  const doneBtn = document.getElementById('doneBtn');
  const welcomeMessage = document.getElementById('welcomeMessage');
  const progressFill = document.getElementById('progressFill');
  const progressText = document.getElementById('progressText');

  // Initialize database in localStorage if it doesn't exist (fallback)
  if (!localStorage.getItem('userDatabase')) {
    const defaultDatabase = {
      users: [
        // Pre-created admin account
        {
          id: 1,
          username: 'ADMIN',
          password: 'ADMIN',
          email: 'admin@system.com',
          role: 'admin',
          createdAt: new Date().toISOString()
        }
      ]
    };
    localStorage.setItem('userDatabase', JSON.stringify(defaultDatabase));
  }

  // Ensure admin account always exists in database
  function ensureAdminExists() {
    const db = getDatabase();
    const adminExists = db.users.find(user => user.username === 'ADMIN');
    
    if (!adminExists) {
      // Add admin account if it doesn't exist
      const adminAccount = {
        id: 1,
        username: 'ADMIN',
        password: 'ADMIN',
        email: 'admin@system.com',
        role: 'admin',
        createdAt: new Date().toISOString()
      };
      db.users.unshift(adminAccount); // Add at beginning
      saveDatabase(db);
      console.log('Admin account added to database');
    } else {
      console.log('Admin account already exists:', adminExists);
    }
  }

  // Force create admin function for testing
  function forceCreateAdmin() {
    const db = getDatabase();
    // Remove any existing admin accounts
    db.users = db.users.filter(user => user.username !== 'ADMIN');
    
    // Add fresh admin account
    const adminAccount = {
      id: 1,
      username: 'ADMIN',
      password: 'ADMIN',
      email: 'admin@system.com',
      role: 'admin',
      createdAt: new Date().toISOString()
    };
    db.users.unshift(adminAccount);
    saveDatabase(db);
    console.log('Admin account force-created:', adminAccount);
    return adminAccount;
  }

  // Ensure admin exists on page load
  ensureAdminExists();

  // Debug function to check database state
  function debugDatabase() {
    const db = getDatabase();
    console.log('Current database:', db);
    console.log('Total users:', db.users.length);
    const adminUser = db.users.find(user => user.username === 'ADMIN');
    console.log('Admin user found:', adminUser);
    return adminUser;
  }

  // Call debug function on load
  console.log('=== Database Debug Info ===');
  debugDatabase();

  // Test admin login function (can be called from console)
  window.testAdminLogin = function() {
    console.log('=== Testing Admin Login ===');
    const user = findUser('ADMIN');
    console.log('Admin user found:', user);
    if (user) {
      console.log('Username match:', user.username === 'ADMIN');
      console.log('Password match:', user.password === 'ADMIN');
      console.log('Is admin role:', isAdmin(user));
      console.log('Login should work:', user.username === 'ADMIN' && user.password === 'ADMIN' && isAdmin(user));
    } else {
      console.log('Admin user not found, creating...');
      forceCreateAdmin();
      window.testAdminLogin(); // Test again
    }
  };

  // Make admin functions available globally for debugging
  window.ensureAdminExists = ensureAdminExists;
  window.forceCreateAdmin = forceCreateAdmin;
  window.debugDatabase = debugDatabase;

  // Modal functions
  function showErrorModal() {
    errorModal.classList.add('show');
  }

  function hideErrorModal() {
    errorModal.classList.remove('show');
  }

  function showSuccessModal(username) {
    welcomeMessage.textContent = `Welcome back, ${username}!`;
    successModal.classList.add('show');
  }

  function hideSuccessModal() {
    successModal.classList.remove('show');
  }

  function showLoadingModal() {
    loadingModal.classList.add('show');
  }

  function hideLoadingModal() {
    loadingModal.classList.remove('show');
  }

  function updateProgress(percentage) {
    progressFill.style.width = percentage + '%';
    progressText.textContent = percentage + '%';
  }

  // Retry button event listener
  retryBtn.addEventListener('click', () => {
    hideErrorModal();
    setTimeout(() => {
      location.reload();
    }, 300);
  });

  // Done button event listener
  doneBtn.addEventListener('click', () => {
    hideSuccessModal();
    
    // Show loading modal after a brief delay
    setTimeout(() => {
      showLoadingModal();
      
      // Simulate loading progress
      let progress = 0;
      const loadingInterval = setInterval(() => {
        progress += Math.random() * 15 + 5; // Random increment between 5-20
        
        if (progress >= 100) {
          progress = 100;
          updateProgress(progress);
          
          // Complete loading and redirect
          setTimeout(() => {
            hideLoadingModal();
            window.location.href = 'lesson-manager.html';
          }, 500);
          
          clearInterval(loadingInterval);
        } else {
          updateProgress(Math.floor(progress));
        }
      }, 200); // Update every 200ms
      
    }, 300);
  });

  // Close modals when clicking outside
  errorModal.addEventListener('click', (e) => {
    if (e.target === errorModal) {
      hideErrorModal();
      setTimeout(() => {
        location.reload();
      }, 300);
    }
  });

  successModal.addEventListener('click', (e) => {
    if (e.target === successModal) {
      hideSuccessModal();
      setTimeout(() => {
        form.reset();
        card.classList.remove('success');
      }, 300);
    }
  });

  // Database helper functions
  function getDatabase() {
    return JSON.parse(localStorage.getItem('userDatabase'));
  }

  function saveDatabase(db) {
    localStorage.setItem('userDatabase', JSON.stringify(db));
  }

  function findUser(username) {
    const db = getDatabase();
    return db.users.find(user => user.username === username);
  }

  function createUser(username, password, email) {
    const db = getDatabase();
    const newUser = {
      id: Date.now(),
      username: username,
      password: password, // In real apps, this should be hashed
      email: email,
      role: 'user',
      createdAt: new Date().toISOString()
    };
    db.users.push(newUser);
    saveDatabase(db);
    return newUser;
  }

  // Admin-specific functions
  function isAdmin(user) {
    return user && (user.role === 'admin' || user.username === 'ADMIN');
  }

  function showAdminLoginForm() {
    // Ensure admin account exists before showing login form
    ensureAdminExists();
    
    // Replace login form with admin login form
    form.innerHTML = `
      <h1 class="logo">Admin Login</h1>
      <div class="field">
        <label for="adminUsername">Admin Username</label>
        <input id="adminUsername" name="adminUsername" type="text" value="ADMIN" required>
      </div>
      <div class="field">
        <label for="adminPassword">Admin Password</label>
        <input id="adminPassword" name="adminPassword" type="password" value="ADMIN" required>
      </div>
      <button type="submit" class="btn">Admin Sign In</button>
      <div class="links">
        <a href="#" class="link" id="backToLogin">Back to Login</a>
      </div>
    `;

    // Add event listener for admin login form
    form.removeEventListener('submit', handleLogin);
    form.removeEventListener('submit', handleCreateAccount);
    form.addEventListener('submit', handleAdminLogin);

    // Add back to login link
    document.getElementById('backToLogin').addEventListener('click', (e) => {
      e.preventDefault();
      showLoginForm();
    });
  }

  function handleAdminLogin(e) {
    e.preventDefault();
    const username = form.adminUsername.value.trim();
    const password = form.adminPassword.value.trim();

    console.log('Admin login attempt:', { username, password });

    if (!username || !password) {
      // trigger shake animation for invalid input
      card.classList.remove('shake');
      void card.offsetWidth;
      card.classList.add('shake');
      setTimeout(() => {
        showErrorModal();
      }, 500);
      return;
    }

    // Ensure admin account exists in database
    ensureAdminExists();
    
    // Additional check: if admin login with ADMIN/ADMIN fails, force create admin
    if (username === 'ADMIN' && password === 'ADMIN') {
      let user = findUser(username);
      if (!user || user.password !== password || !isAdmin(user)) {
        console.log('Admin account issue detected, force creating...');
        user = forceCreateAdmin();
      }
      
      console.log('Final admin user for login:', user);
      
      if (user && user.password === password && isAdmin(user)) {
        console.log('Admin login successful');
        // success animation
        card.classList.remove('shake');
        card.classList.add('success');
        card.animate([
          { transform: 'scale(1)' },
          { transform: 'scale(0.98)' },
          { transform: 'scale(1.02)' },
          { transform: 'scale(1)' }
        ], { duration: 600, easing: 'ease-out' });

        // Show success modal after animation
        setTimeout(() => {
          welcomeMessage.textContent = `Welcome Admin ${user.username}!`;
          successModal.classList.add('show');
          
          // Override done button for admin redirect
          const originalDoneHandler = doneBtn.onclick;
          doneBtn.onclick = () => {
            hideSuccessModal();
            
            // Show loading modal after a brief delay
            setTimeout(() => {
              showLoadingModal();
              
              // Simulate loading progress
              let progress = 0;
              const loadingInterval = setInterval(() => {
                progress += Math.random() * 15 + 5; // Random increment between 5-20
                
                if (progress >= 100) {
                  progress = 100;
                  updateProgress(progress);
                  
                  // Complete loading and redirect to user-info.html
                  setTimeout(() => {
                    hideLoadingModal();
                    window.location.href = 'user-info.html';
                  }, 500);
                  
                  clearInterval(loadingInterval);
                } else {
                  updateProgress(Math.floor(progress));
                }
              }, 200); // Update every 200ms
              
            }, 300);
          };
        }, 700);
        return;
      }
    }
    
    // Regular admin validation for other credentials
    const user = findUser(username);
    console.log('Found user:', user);
    console.log('Is admin check:', user ? isAdmin(user) : false);
    
    if (user && user.password === password && isAdmin(user)) {
      console.log('Admin login successful');
      // ... (same success code as above)
    } else {
      console.log('Admin login failed');
      // Invalid admin credentials - shake animation then show error modal
      card.classList.remove('shake');
      void card.offsetWidth;
      card.classList.add('shake');
      setTimeout(() => {
        showErrorModal();
      }, 500);
    }
  }

  function showCreateAccountForm() {
    // Replace login form with create account form
    form.innerHTML = `
      <h1 class="logo">Create Account</h1>
      <div class="field">
        <label for="newUsername">Username</label>
        <input id="newUsername" name="newUsername" type="text" required>
      </div>
      <div class="field">
        <label for="newEmail">Email</label>
        <input id="newEmail" name="newEmail" type="email" required>
      </div>
      <div class="field">
        <label for="newPassword">Password</label>
        <input id="newPassword" name="newPassword" type="password" required>
      </div>
      <div class="field">
        <label for="confirmPassword">Confirm Password</label>
        <input id="confirmPassword" name="confirmPassword" type="password" required>
      </div>
      <button type="submit" class="btn">Create Account</button>
      <div class="links">
        <a href="#" class="link" id="backToLogin">Back to Login</a>
      </div>
    `;

    // Add event listener for create account form
    form.removeEventListener('submit', handleLogin);
    form.addEventListener('submit', handleCreateAccount);

    // Add back to login link
    document.getElementById('backToLogin').addEventListener('click', (e) => {
      e.preventDefault();
      showLoginForm();
    });
  }

  function showLoginForm() {
    // Restore original login form
    form.innerHTML = `
      <h1 class="logo">Welcome</h1>
      <div class="field">
        <label for="username">Username</label>
        <input id="username" name="username" type="text" required>
      </div>
      <div class="field">
        <label for="password">Password</label>
        <input id="password" name="password" type="password" required>
      </div>
      <button type="submit" class="btn">Sign In</button>
      <div class="links">
        <a href="#" class="link" id="forgotPassword">Forgot Password?</a>
        <a href="#" class="link" id="createAccount">Create Account</a>
      </div>
      <div class="admin-section">
        <button type="button" class="admin-btn" id="adminBtn">Are you an Admin?</button>
      </div>
    `;

    // Re-add event listeners
    form.removeEventListener('submit', handleCreateAccount);
    form.removeEventListener('submit', handleAdminLogin);
    form.addEventListener('submit', handleLogin);
    
    document.getElementById('forgotPassword').addEventListener('click', (e) => {
      e.preventDefault();
      alert('Forgot password functionality would be implemented here');
    });

    document.getElementById('createAccount').addEventListener('click', (e) => {
      e.preventDefault();
      showCreateAccountForm();
    });

    document.getElementById('adminBtn').addEventListener('click', (e) => {
      e.preventDefault();
      showAdminLoginForm();
    });
  }

  function handleLogin(e) {
    e.preventDefault();
    const username = form.username.value.trim();
    const password = form.password.value.trim();

    if (!username || !password) {
      // trigger shake animation for invalid input
      card.classList.remove('shake');
      void card.offsetWidth;
      card.classList.add('shake');
      setTimeout(() => {
        showErrorModal();
      }, 500);
      return;
    }

    // Check if user exists and password matches (localStorage database)
    const user = findUser(username);
    if (user && user.password === password) {
      // success animation
      card.classList.remove('shake');
      card.classList.add('success');
      card.animate([
        { transform: 'scale(1)' },
        { transform: 'scale(0.98)' },
        { transform: 'scale(1.02)' },
        { transform: 'scale(1)' }
      ], { duration: 600, easing: 'ease-out' });

      // Show success modal after animation
      setTimeout(() => {
        showSuccessModal(user.username);
      }, 700);
    } else {
      // Invalid credentials - shake animation then show error modal
      card.classList.remove('shake');
      void card.offsetWidth;
      card.classList.add('shake');
      setTimeout(() => {
        showErrorModal();
      }, 500);
    }
  }

  function handleCreateAccount(e) {
    e.preventDefault();
    const newUsername = form.newUsername.value.trim();
    const newEmail = form.newEmail.value.trim();
    const newPassword = form.newPassword.value.trim();
    const confirmPassword = form.confirmPassword.value.trim();

    // Validation
    if (!newUsername || !newEmail || !newPassword || !confirmPassword) {
      card.classList.remove('shake');
      void card.offsetWidth;
      card.classList.add('shake');
      setTimeout(() => {
        alert('All fields are required');
        location.reload();
      }, 800);
      return;
    }

    if (newPassword !== confirmPassword) {
      card.classList.remove('shake');
      void card.offsetWidth;
      card.classList.add('shake');
      setTimeout(() => {
        alert('Passwords do not match');
        location.reload();
      }, 800);
      return;
    }

    if (newPassword.length < 6) {
      card.classList.remove('shake');
      void card.offsetWidth;
      card.classList.add('shake');
      setTimeout(() => {
        alert('Password must be at least 6 characters long');
        location.reload();
      }, 800);
      return;
    }

    // Check if username already exists
    if (findUser(newUsername)) {
      card.classList.remove('shake');
      void card.offsetWidth;
      card.classList.add('shake');
      setTimeout(() => {
        alert('Username already exists');
        location.reload();
      }, 800);
      return;
    }

    // Create new user
    try {
      const newUser = createUser(newUsername, newPassword, newEmail);
      
      // Success animation
      card.classList.remove('shake');
      card.classList.add('success');
      card.animate([
        { transform: 'scale(1)' },
        { transform: 'scale(0.98)' },
        { transform: 'scale(1.02)' },
        { transform: 'scale(1)' }
      ], { duration: 600, easing: 'ease-out' });

      setTimeout(() => {
        alert(`Account created successfully for ${newUser.username}!\nYou can now login with your credentials.`);
        showLoginForm();
        card.classList.remove('success');
      }, 700);
    } catch (error) {
      card.classList.remove('shake');
      void card.offsetWidth;
      card.classList.add('shake');
      setTimeout(() => {
        alert('Failed to create account');
        location.reload();
      }, 800);
    }
  }

  // Initial event listeners
  form.addEventListener('submit', handleLogin);

  // Handle forgot password click
  forgotPasswordLink.addEventListener('click', (e) => {
    e.preventDefault();
    alert('Forgot password functionality would be implemented here');
  });

  // Handle create account click
  createAccountLink.addEventListener('click', (e) => {
    e.preventDefault();
    showCreateAccountForm();
  });

  // Handle admin button click
  adminBtn.addEventListener('click', (e) => {
    e.preventDefault();
    showAdminLoginForm();
  });
});
