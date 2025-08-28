document.addEventListener('DOMContentLoaded', () => {
  const usersGrid = document.getElementById('usersGrid');
  const emptyState = document.getElementById('emptyState');
  const totalUsersElement = document.getElementById('totalUsers');
  const searchInput = document.getElementById('searchInput');
  const refreshBtn = document.getElementById('refreshBtn');
  const exportBtn = document.getElementById('exportBtn');
  const clearBtn = document.getElementById('clearBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  
  // Modal elements
  const editModal = document.getElementById('editModal');
  const deleteModal = document.getElementById('deleteModal');
  const editForm = document.getElementById('editForm');
  const closeEditModal = document.getElementById('closeEditModal');
  const closeDeleteModal = document.getElementById('closeDeleteModal');
  const cancelEdit = document.getElementById('cancelEdit');
  const cancelDelete = document.getElementById('cancelDelete');
  const confirmDelete = document.getElementById('confirmDelete');
  
  // Form elements
  const editUserId = document.getElementById('editUserId');
  const editUsername = document.getElementById('editUsername');
  const editEmail = document.getElementById('editEmail');
  const editPassword = document.getElementById('editPassword');
  const deleteUsername = document.getElementById('deleteUsername');

  let allUsers = [];
  let filteredUsers = [];
  let currentEditUserId = null;
  let currentDeleteUserId = null;

  // Database helper functions
  function getDatabase() {
    const data = localStorage.getItem('userDatabase');
    return data ? JSON.parse(data) : { users: [] };
  }

  function saveDatabase(db) {
    localStorage.setItem('userDatabase', JSON.stringify(db));
  }

  function updateUser(userId, updatedData) {
    const db = getDatabase();
    const userIndex = db.users.findIndex(user => user.id === userId);
    
    if (userIndex !== -1) {
      // Check if username already exists (excluding current user)
      const existingUser = db.users.find(user => 
        user.username === updatedData.username && user.id !== userId
      );
      
      if (existingUser) {
        throw new Error('Username already exists');
      }
      
      // Update user data
      db.users[userIndex] = {
        ...db.users[userIndex],
        username: updatedData.username,
        email: updatedData.email,
        ...(updatedData.password && { password: updatedData.password }),
        updatedAt: new Date().toISOString()
      };
      
      saveDatabase(db);
      return db.users[userIndex];
    }
    
    throw new Error('User not found');
  }

  function deleteUser(userId) {
    const db = getDatabase();
    const userIndex = db.users.findIndex(user => user.id === userId);
    
    if (userIndex !== -1) {
      const deletedUser = db.users[userIndex];
      db.users.splice(userIndex, 1);
      saveDatabase(db);
      return deletedUser;
    }
    
    throw new Error('User not found');
  }

  function clearDatabase() {
    if (confirm('Are you sure you want to clear all user data? This action cannot be undone.')) {
      localStorage.setItem('userDatabase', JSON.stringify({ users: [] }));
      loadUsers();
      showNotification('Database cleared successfully!', 'success');
    }
  }

  function exportToJSON() {
    const db = getDatabase();
    const dataStr = JSON.stringify(db, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `user-database-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    showNotification('Database exported successfully!', 'success');
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

  function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function getInitials(username) {
    return username.substring(0, 2).toUpperCase();
  }

  function generateUserCard(user) {
    return `
      <div class="user-card" data-user-id="${user.id}">
        <div class="user-actions">
          <button class="action-btn edit-btn" onclick="openEditModal(${user.id})" title="Edit User">✏️</button>
          <button class="action-btn delete-btn" onclick="openDeleteModal(${user.id})" title="Delete User">🗑️</button>
        </div>
        <div class="user-avatar">${getInitials(user.username)}</div>
        <h3 class="user-name">${user.username}</h3>
        <p class="user-email">${user.email}</p>
        <div class="user-details">
          <div class="user-detail">
            <span>User ID:</span>
            <span>#${user.id}</span>
          </div>
          <div class="user-detail">
            <span>Created:</span>
            <span>${formatDate(user.createdAt)}</span>
          </div>
          ${user.updatedAt ? `
          <div class="user-detail">
            <span>Updated:</span>
            <span>${formatDate(user.updatedAt)}</span>
          </div>
          ` : ''}
          <div class="user-detail">
            <span>Password:</span>
            <span>${user.password ? '••••••••' : 'No password'}</span>
          </div>
        </div>
      </div>
    `;
  }

  function displayUsers(users) {
    if (users.length === 0) {
      usersGrid.style.display = 'none';
      emptyState.style.display = 'block';
    } else {
      usersGrid.style.display = 'grid';
      emptyState.style.display = 'none';
      usersGrid.innerHTML = users.map(user => generateUserCard(user)).join('');
    }
  }

  function filterUsers(searchTerm) {
    const term = searchTerm.toLowerCase();
    filteredUsers = allUsers.filter(user => 
      user.username.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term) ||
      user.id.toString().includes(term)
    );
    displayUsers(filteredUsers);
  }

  function loadUsers() {
    const db = getDatabase();
    allUsers = db.users || [];
    filteredUsers = [...allUsers];
    
    // Update statistics
    totalUsersElement.textContent = allUsers.length;
    
    // Display users
    displayUsers(filteredUsers);
    
    // Clear search
    searchInput.value = '';
  }

  function generateSampleUsers() {
    const db = getDatabase();
    if (db.users.length === 0) {
      const sampleUsers = [
        {
          id: Date.now(),
          username: 'admin',
          password: 'admin123',
          email: 'admin@example.com',
          createdAt: new Date().toISOString()
        },
        {
          id: Date.now() + 1,
          username: 'testuser',
          password: 'test123',
          email: 'test@example.com',
          createdAt: new Date(Date.now() - 86400000).toISOString() // 1 day ago
        }
      ];
      
      db.users = sampleUsers;
      saveDatabase(db);
      showNotification('Sample users created for demonstration!', 'info');
    }
  }

  // Event listeners
  refreshBtn.addEventListener('click', () => {
    loadUsers();
    showNotification('Data refreshed!', 'success');
  });

  exportBtn.addEventListener('click', exportToJSON);
  clearBtn.addEventListener('click', clearDatabase);

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

  searchInput.addEventListener('input', (e) => {
    filterUsers(e.target.value);
  });

  // Add some CSS animations
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
  loadUsers();
  
  // Create sample users if database is empty (for demonstration)
  setTimeout(() => {
    if (allUsers.length === 0) {
      generateSampleUsers();
      loadUsers();
    }
  }, 1000);

  // Global functions for onclick handlers
  window.openEditModal = function(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (user) {
      currentEditUserId = userId;
      editUserId.value = userId;
      editUsername.value = user.username;
      editEmail.value = user.email;
      editPassword.value = '';
      editModal.classList.add('show');
    }
  };

  window.openDeleteModal = function(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (user) {
      currentDeleteUserId = userId;
      deleteUsername.textContent = user.username;
      deleteModal.classList.add('show');
    }
  };

  // Modal event listeners
  function closeEditModalHandler() {
    editModal.classList.remove('show');
    currentEditUserId = null;
    editForm.reset();
  }

  function closeDeleteModalHandler() {
    deleteModal.classList.remove('show');
    currentDeleteUserId = null;
  }

  closeEditModal.addEventListener('click', closeEditModalHandler);
  closeDeleteModal.addEventListener('click', closeDeleteModalHandler);
  cancelEdit.addEventListener('click', closeEditModalHandler);
  cancelDelete.addEventListener('click', closeDeleteModalHandler);

  // Close modals when clicking outside
  editModal.addEventListener('click', (e) => {
    if (e.target === editModal) {
      closeEditModalHandler();
    }
  });

  deleteModal.addEventListener('click', (e) => {
    if (e.target === deleteModal) {
      closeDeleteModalHandler();
    }
  });

  // Edit form submission
  editForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    if (!currentEditUserId) return;
    
    const updatedData = {
      username: editUsername.value.trim(),
      email: editEmail.value.trim(),
      ...(editPassword.value.trim() && { password: editPassword.value.trim() })
    };
    
    if (!updatedData.username || !updatedData.email) {
      showNotification('Username and email are required!', 'error');
      return;
    }
    
    try {
      updateUser(currentEditUserId, updatedData);
      showNotification('User updated successfully!', 'success');
      closeEditModalHandler();
      loadUsers();
    } catch (error) {
      showNotification(error.message, 'error');
    }
  });

  // Delete confirmation
  confirmDelete.addEventListener('click', () => {
    if (!currentDeleteUserId) return;
    
    try {
      const deletedUser = deleteUser(currentDeleteUserId);
      showNotification(`User "${deletedUser.username}" deleted successfully!`, 'success');
      closeDeleteModalHandler();
      loadUsers();
    } catch (error) {
      showNotification(error.message, 'error');
    }
  });
});
