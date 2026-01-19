// Configurações de autenticação
const AUTH_CONFIG = {
  password: 'prompts2025', // Senha única para todos
  storageKey: 'promptsSynUser'
};

// Variáveis globais
let allPrompts = [];
let filteredPrompts = [];
let searchTimeout;
let currentUser = null;

// Estado dos filtros
const filterState = {
  search: '',
  ia: [],
  category: [],
  difficulty: [],
  sort: 'relevance'
};

// Inicializar aplicação
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Verificar se usuário já está logado
    checkAuth();
    
    // Se não está logado, mostrar página de login
    if (!currentUser) {
      setupLoginPage();
    } else {
      // Se está logado, carregar catálogo
      await loadCatalog();
    }
  } catch (error) {
    console.error('Erro ao inicializar:', error);
  }
});

// ========== AUTENTICAÇÃO ==========

function checkAuth() {
  const storedUser = localStorage.getItem(AUTH_CONFIG.storageKey);
  if (storedUser) {
    currentUser = JSON.parse(storedUser);
    showCatalog();
  } else {
    showLogin();
  }
}

function setupLoginPage() {
  const loginForm = document.getElementById('loginForm');
  loginForm.addEventListener('submit', handleLogin);
}

function handleLogin(e) {
  e.preventDefault();
  
  const nameInput = document.getElementById('userName');
  const passwordInput = document.getElementById('userPassword');
  const errorDiv = document.getElementById('loginError');
  
  const name = nameInput.value.trim();
  const password = passwordInput.value;
  
  // Validar campos
  if (!name) {
    errorDiv.textContent = 'Por favor, digite seu nome';
    return;
  }
  
  if (!password) {
    errorDiv.textContent = 'Por favor, digite a senha';
    return;
  }
  
  // Validar senha
  if (password !== AUTH_CONFIG.password) {
    errorDiv.textContent = 'Senha incorreta';
    passwordInput.value = '';
    return;
  }
  
  // Login bem-sucedido
  currentUser = {
    name: name,
    loginTime: new Date().toISOString()
  };
  
  // Salvar no localStorage
  localStorage.setItem(AUTH_CONFIG.storageKey, JSON.stringify(currentUser));
  
  // Carregar catálogo
  loadCatalog();
}

function logout() {
  if (confirm('Deseja realmente sair?')) {
    localStorage.removeItem(AUTH_CONFIG.storageKey);
    currentUser = null;
    showLogin();
    // Limpar dados
    allPrompts = [];
    filteredPrompts = [];
  }
}

function showLogin() {
  document.getElementById('loginPage').style.display = 'flex';
  document.getElementById('mainPage').style.display = 'none';
}

function showCatalog() {
  document.getElementById('loginPage').style.display = 'none';
  document.getElementById('mainPage').style.display = 'block';
  
  // Atualizar nome do usuário no header
  if (currentUser) {
    document.getElementById('userName').textContent = `Bem-vindo, ${currentUser.name}`;
  }
}

// ========== CATÁLOGO ==========

async function loadCatalog() {
  try {
    // Carregar dados
    await loadPrompts();
    
    // Mostrar catálogo
    showCatalog();
    
    // Configurar event listeners
    setupEventListeners();
    
    // Renderizar prompts iniciais
    applyFilters();
  } catch (error) {
    console.error('Erro ao carregar catálogo:', error);
    showError('Erro ao carregar os prompts');
  }
}

// Carregar prompts do JSON
async function loadPrompts() {
  try {
    const response = await fetch('data/prompts.json');
    if (!response.ok) throw new Error('Erro ao carregar prompts');
    allPrompts = await response.json();
    console.log(`✓ ${allPrompts.length} prompts carregados`);
  } catch (error) {
    console.error('Erro ao carregar prompts:', error);
    throw error;
  }
}

// Configurar event listeners
function setupEventListeners() {
  // Busca
  const searchBar = document.getElementById('searchBar');
  searchBar.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      filterState.search = e.target.value.toLowerCase().trim();
      applyFilters();
    }, 300);
  });

  // Filtros de checkbox
  document.querySelectorAll('.filter-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      const filterType = e.target.dataset.filter;
      const value = e.target.value;

      if (e.target.checked) {
        if (!filterState[filterType].includes(value)) {
          filterState[filterType].push(value);
        }
      } else {
        filterState[filterType] = filterState[filterType].filter(v => v !== value);
      }

      applyFilters();
    });
  });

  // Ordenação
  document.getElementById('sortSelect').addEventListener('change', (e) => {
    filterState.sort = e.target.value;
    applyFilters();
  });

  // Limpar filtros
  document.getElementById('clearFiltersBtn').addEventListener('click', () => {
    clearAllFilters();
  });

  // Logout
  document.getElementById('logoutBtn').addEventListener('click', logout);

  // Modal
  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('detailModal').addEventListener('click', (e) => {
    if (e.target.id === 'detailModal') closeModal();
  });
}

// Aplicar filtros
function applyFilters() {
  filteredPrompts = allPrompts.filter(prompt => {
    // Filtro de busca
    if (filterState.search) {
      const searchTerm = filterState.search;
      const matchesSearch = 
        prompt.prompt.toLowerCase().includes(searchTerm) ||
        prompt.category.toLowerCase().includes(searchTerm) ||
        prompt.ia.toLowerCase().includes(searchTerm) ||
        (prompt.tags && prompt.tags.some(tag => tag.toLowerCase().includes(searchTerm)));
      
      if (!matchesSearch) return false;
    }

    // Filtro de IA
    if (filterState.ia.length > 0 && !filterState.ia.includes(prompt.ia)) {
      return false;
    }

    // Filtro de categoria
    if (filterState.category.length > 0 && !filterState.category.includes(prompt.category)) {
      return false;
    }

    // Filtro de dificuldade
    if (filterState.difficulty.length > 0 && !filterState.difficulty.includes(prompt.difficulty)) {
      return false;
    }

    return true;
  });

  // Aplicar ordenação
  sortPrompts();

  // Renderizar
  renderPrompts();

  // Atualizar contagem
  updateResultsCount();
}

// Ordenar prompts
function sortPrompts() {
  switch (filterState.sort) {
    case 'newest':
      filteredPrompts.sort((a, b) => (b.id || 0) - (a.id || 0));
      break;
    case 'ia':
      filteredPrompts.sort((a, b) => a.ia.localeCompare(b.ia));
      break;
    case 'category':
      filteredPrompts.sort((a, b) => a.category.localeCompare(b.category));
      break;
    case 'relevance':
    default:
      // Manter ordem original
      break;
  }
}

// Renderizar prompts
function renderPrompts() {
  const grid = document.getElementById('promptsGrid');

  if (filteredPrompts.length === 0) {
    grid.innerHTML = `
      <div class="no-results">
        <p style="font-size: 1.2rem; margin-bottom: 0.5rem;">Nenhum prompt encontrado</p>
        <p style="font-size: 0.95rem;">Tente ajustar seus filtros ou termos de busca</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = filteredPrompts.map(prompt => createPromptCard(prompt)).join('');

  // Adicionar event listeners aos cards
  document.querySelectorAll('.prompt-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (!e.target.classList.contains('copy-btn')) {
        const promptId = card.dataset.id;
        const prompt = allPrompts.find(p => p.id === parseInt(promptId));
        if (prompt) openModal(prompt);
      }
    });
  });

  // Adicionar event listeners aos botões de copiar
  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const promptId = btn.closest('.prompt-card').dataset.id;
      const prompt = allPrompts.find(p => p.id === parseInt(promptId));
      if (prompt) copyToClipboard(prompt.prompt, btn);
    });
  });
}

// Criar card de prompt
function createPromptCard(prompt) {
  const iaBadgeClass = prompt.ia.toLowerCase().replace('á', 'a');
  const difficultyClass = prompt.difficulty.toLowerCase().replace('á', 'a');

  return `
    <div class="prompt-card" data-id="${prompt.id}">
      <div class="prompt-header">
        <span class="ia-badge ${iaBadgeClass}">${prompt.ia}</span>
        <span class="difficulty-badge ${difficultyClass}">${prompt.difficulty}</span>
      </div>
      <div class="prompt-category">${prompt.category}</div>
      <p class="prompt-text">${escapeHtml(prompt.prompt)}</p>
      <div class="prompt-footer">
        <span class="prompt-id">#${String(prompt.id).padStart(4, '0')}</span>
        <button class="copy-btn">Copiar</button>
      </div>
    </div>
  `;
}

// Abrir modal
function openModal(prompt) {
  const modal = document.getElementById('detailModal');
  const modalBody = document.getElementById('modalBody');

  modalBody.innerHTML = `
    <div class="prompt-meta">
      <div class="meta-item">
        <div class="meta-label">IA</div>
        <div class="meta-value">${prompt.ia}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Categoria</div>
        <div class="meta-value">${prompt.category}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Dificuldade</div>
        <div class="meta-value">${prompt.difficulty}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">ID</div>
        <div class="meta-value">#${String(prompt.id).padStart(4, '0')}</div>
      </div>
    </div>
    <div class="prompt-text-full">${escapeHtml(prompt.prompt)}</div>
    ${prompt.tags ? `
      <div>
        <p style="margin-bottom: 0.5rem; color: var(--text-muted); font-size: 0.9rem; text-transform: uppercase;">Tags</p>
        <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
          ${prompt.tags.map(tag => `<span style="background: var(--surface-light); padding: 0.35rem 0.75rem; border-radius: 0.25rem; font-size: 0.85rem;">${escapeHtml(tag)}</span>`).join('')}
        </div>
      </div>
    ` : ''}
  `;

  const modalFooter = modal.querySelector('.modal-footer');
  modalFooter.innerHTML = `
    <button class="btn btn-secondary" onclick="closeModal()">Fechar</button>
    <button class="btn btn-primary" onclick="copyFromModal('${escapeHtml(prompt.prompt).replace(/'/g, "\\'")}')">Copiar Prompt</button>
  `;

  modal.classList.add('active');
}

// Fechar modal
function closeModal() {
  document.getElementById('detailModal').classList.remove('active');
}

// Copiar para clipboard
function copyToClipboard(text, btn) {
  navigator.clipboard.writeText(text).then(() => {
    const originalText = btn.textContent;
    btn.textContent = '✓ Copiado!';
    btn.classList.add('copied');
    
    setTimeout(() => {
      btn.textContent = originalText;
      btn.classList.remove('copied');
    }, 2000);
  }).catch(err => {
    console.error('Erro ao copiar:', err);
  });
}

// Copiar do modal
function copyFromModal(text) {
  const btn = document.querySelector('.modal-footer .btn-primary');
  copyToClipboard(text, btn);
}

// Limpar todos os filtros
function clearAllFilters() {
  // Limpar estado
  filterState.search = '';
  filterState.ia = [];
  filterState.category = [];
  filterState.difficulty = [];
  filterState.sort = 'relevance';

  // Limpar inputs
  document.getElementById('searchBar').value = '';
  document.querySelectorAll('.filter-checkbox').forEach(checkbox => {
    checkbox.checked = false;
  });
  document.getElementById('sortSelect').value = 'relevance';

  // Aplicar filtros
  applyFilters();
}

// Atualizar contagem de resultados
function updateResultsCount() {
  const count = filteredPrompts.length;
  const total = allPrompts.length;
  const element = document.getElementById('resultsCount');
  
  if (count === total) {
    element.textContent = `${total} prompts encontrados`;
  } else {
    element.textContent = `${count} de ${total} prompts encontrados`;
  }
}

// Escapar HTML
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// Mostrar erro
function showError(message) {
  const grid = document.getElementById('promptsGrid');
  grid.innerHTML = `
    <div class="no-results">
      <p style="color: #ef4444; font-size: 1.2rem;">⚠️ ${message}</p>
      <p style="margin-top: 1rem;">Por favor, recarregue a página e tente novamente.</p>
    </div>
  `;
}


// ========== MENU HAMBÚRGUER (MOBILE) ==========

function setupMobileMenu() {
  const menuToggle = document.getElementById('menuToggle');
  const sidebar = document.querySelector('.sidebar');
  
  if (!menuToggle) return;
  
  // Toggle menu ao clicar no botão
  menuToggle.addEventListener('click', () => {
    menuToggle.classList.toggle('active');
    sidebar.classList.toggle('active');
  });
  
  // Fechar menu ao clicar em um filtro
  document.querySelectorAll('.filter-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', () => {
      if (window.innerWidth <= 768) {
        menuToggle.classList.remove('active');
        sidebar.classList.remove('active');
      }
    });
  });
  
  // Fechar menu ao clicar em "Limpar Filtros"
  const clearBtn = document.getElementById('clearFiltersBtn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (window.innerWidth <= 768) {
        menuToggle.classList.remove('active');
        sidebar.classList.remove('active');
      }
    });
  }
  
  // Fechar menu ao redimensionar para desktop
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
      menuToggle.classList.remove('active');
      sidebar.classList.remove('active');
    }
  });
}

// Chamar setup do menu ao carregar catálogo
const originalLoadCatalog = window.loadCatalog;
window.loadCatalog = async function() {
  const result = await originalLoadCatalog.call(this);
  setupMobileMenu();
  return result;
};
