let currentUser = null;
let authToken = localStorage.getItem('authToken');
let currentPurchaseProduct = null;
let categoriesCache = [];

const CART_KEY = 'cart';

function getCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : { items: [] };
  } catch {
    return { items: [] };
  }
}

function setCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function addToCart(productId, quantity = 1) {
  const cart = getCart();
  const existing = cart.items.find((i) => i.productId === productId);
  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.items.push({ productId, quantity });
  }
  setCart(cart);
  updateCartBadge();
}

function removeFromCart(productId) {
  const cart = getCart();
  cart.items = cart.items.filter((i) => i.productId !== productId);
  setCart(cart);
  updateCartBadge();
}

function updateCartQuantity(productId, quantity) {
  const cart = getCart();
  const item = cart.items.find((i) => i.productId === productId);
  if (item) {
    if (quantity < 1) {
      cart.items = cart.items.filter((i) => i.productId !== productId);
    } else {
      item.quantity = quantity;
    }
  }
  setCart(cart);
  updateCartBadge();
}

function clearCart() {
  setCart({ items: [] });
  updateCartBadge();
}

function getCartCount() {
  return getCart().items.reduce((sum, i) => sum + i.quantity, 0);
}

function updateCartBadge() {
  const badges = document.querySelectorAll('.cart-badge');
  const count = getCartCount();
  badges.forEach((b) => {
    b.textContent = count;
    b.style.display = count > 0 ? 'inline' : 'none';
  });
}

function showToast(message) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2000);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function showError(elementId, message) {
  const el = document.getElementById(elementId);
  el.textContent = typeof message === 'object' ? JSON.stringify(message, null, 2) : message;
  el.classList.add('show');
}

function hideError(elementId) {
  const el = document.getElementById(elementId);
  el.textContent = '';
  el.classList.remove('show');
}

function showSuccess(elementId, message) {
  const el = document.getElementById(elementId);
  el.textContent = message;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 3000);
}

async function apiRequest(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    ...options.headers
  };
  const res = await fetch(url, { ...options, headers });
  const data = await res.json();
  return { res, data };
}

function openModal(modalId) {
  document.getElementById(modalId).classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('active');
  document.body.style.overflow = '';
  const modal = document.getElementById(modalId);
  const form = modal.querySelector('form');
  if (form) form.reset();
  modal.querySelectorAll('.error-message, .success-message').forEach((el) => {
    el.textContent = '';
    el.classList.remove('show');
  });
  if (modalId === 'purchaseModal') currentPurchaseProduct = null;
  if (modalId === 'loginModal' && typeof resetLoginModal === 'function') resetLoginModal();
}

function closeModalOnOverlay(event, modalId) {
  if (event.target === event.currentTarget) {
    closeModal(modalId);
  }
}

function formatPhone(phone) {
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length >= 10) {
    const rest = digits.slice(-10);
    return '+7 (' + rest.slice(0, 3) + ') ' + rest.slice(3, 6) + '-' + rest.slice(6);
  }
  return phone;
}

function toggleProfileDropdown(event) {
  event.stopPropagation();
  const dropdown = document.getElementById('profileDropdown');
  if (dropdown) dropdown.classList.toggle('open');
}

document.addEventListener('click', (e) => {
  const dropdown = document.getElementById('profileDropdown');
  const wrap = e.target.closest('.user-profile-wrap');
  if (dropdown && !wrap) dropdown.classList.remove('open');
});

function updateAuthUI() {
  const authButtons = document.getElementById('authButtons');
  const userSection = document.getElementById('userSection');
  const userEmail = document.getElementById('userEmail');
  const userRole = document.getElementById('userRole');
  const productAdminBlock = document.getElementById('productAdminBlock');
  const categoryAdminNotice = document.getElementById('categoryAdminNotice');
  const createProductBtn = document.getElementById('createProductBtn');
  const createCategoryBtn = document.getElementById('createCategoryBtn');

  if (currentUser) {
    authButtons.classList.add('hidden');
    userSection.classList.remove('hidden');
    userEmail.textContent = currentUser.email || currentUser.phone || '';
    if (userRole) {
      userRole.textContent = currentUser.role === 'admin' ? 'Админ' : 'Пользователь';
      userRole.className = `badge badge-${currentUser.role}`;
    }

    const adminPhone = '+77777777777';
    const phone = currentUser.phone || '';

    const profileTextEl = document.getElementById('userProfileText');
    if (profileTextEl) {
      profileTextEl.textContent = (phone === adminPhone) ? 'admin' : (phone ? phone.replace(/\D/g, '') : (currentUser.email || ''));
    }

    const dropdownPhoneEl = document.getElementById('profileDropdownPhone');
    if (dropdownPhoneEl) {
      dropdownPhoneEl.textContent = (phone === adminPhone) ? 'admin' : (phone ? formatPhone(phone) : (currentUser.email || ''));
    }

    if (currentUser.role === 'admin') {
      if (productAdminBlock) productAdminBlock.classList.remove('hidden');
      categoryAdminNotice.classList.add('hidden');
      createProductBtn.disabled = false;
      createCategoryBtn.disabled = false;
    } else {
      if (productAdminBlock) productAdminBlock.classList.add('hidden');
      categoryAdminNotice.classList.remove('hidden');
      createProductBtn.disabled = true;
      createCategoryBtn.disabled = true;
    }
  } else {
    authButtons.classList.remove('hidden');
    userSection.classList.add('hidden');
    if (productAdminBlock) productAdminBlock.classList.add('hidden');
    categoryAdminNotice.classList.remove('hidden');
    createProductBtn.disabled = true;
    createCategoryBtn.disabled = true;
  }
}

async function checkAuth() {
  if (!authToken) {
    currentUser = null;
    updateAuthUI();
    updateCartBadge();
    loadCategories();
    loadProducts();
    return;
  }

  try {
    const { res, data } = await apiRequest('/auth/me');
    if (res.ok) {
      currentUser = data.user;
    } else {
      authToken = null;
      localStorage.removeItem('authToken');
      currentUser = null;
    }
  } catch (e) {
    authToken = null;
    localStorage.removeItem('authToken');
    currentUser = null;
  }
  updateAuthUI();
  updateCartBadge();
  loadCategories();
  loadProducts();
}

let loginPhoneSent = null;

function resetLoginModal() {
  loginPhoneSent = null;
  document.getElementById('loginStepPhone').classList.remove('hidden');
  document.getElementById('loginStepCode').classList.add('hidden');
  const phoneInput = document.getElementById('loginPhone');
  if (phoneInput) phoneInput.value = '+7';
  document.getElementById('loginCode').value = '';
}

function backToPhoneStep() {
  resetLoginModal();
  hideError('loginError');
}

async function handleSendCode(event) {
  event.preventDefault();
  hideError('loginError');

  const form = event.target;
  const phone = form.phone.value.trim().replace(/\s/g, '');

  if (!phone || phone === '+7') {
    showError('loginError', 'Укажите номер телефона');
    return;
  }

  try {
    const { res, data } = await apiRequest('/auth/send-code', {
      method: 'POST',
      body: JSON.stringify({ phone })
    });

    if (!res.ok) {
      showError('loginError', data.error || data.message || 'Ошибка отправки кода');
      return;
    }

    loginPhoneSent = data.phone || phone;
    document.getElementById('loginStepPhone').classList.add('hidden');
    document.getElementById('loginStepCode').classList.remove('hidden');
    document.getElementById('loginCode').value = '';
    document.getElementById('loginCode').focus();
  } catch (err) {
    showError('loginError', err.message);
  }
}

async function handleVerifyCode(event) {
  event.preventDefault();
  hideError('loginError');

  const form = event.target;
  const code = form.code.value.trim();

  if (!loginPhoneSent) {
    showError('loginError', 'Сначала введите номер и нажмите «Выслать код»');
    return;
  }

  try {
    const { res, data } = await apiRequest('/auth/verify-code', {
      method: 'POST',
      body: JSON.stringify({ phone: loginPhoneSent, code })
    });

    if (!res.ok) {
      showError('loginError', data.error || data.message || 'Неверный код');
      return;
    }

    authToken = data.token;
    localStorage.setItem('authToken', authToken);
    currentUser = data.user;
    resetLoginModal();
    closeModal('loginModal');
    updateAuthUI();
    loadProducts();
    loadCategories();
  } catch (err) {
    showError('loginError', err.message);
  }
}

async function handleRegister(event) {
  event.preventDefault();
  hideError('registerError');

  const form = event.target;
  const email = form.email.value;
  const password = form.password.value;
  const role = form.role.value;

  try {
    const { res, data } = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, role })
    });

    if (!res.ok) {
      showError('registerError', data.message || 'Ошибка регистрации');
      return;
    }

    showSuccess('registerSuccess', 'Регистрация успешна! Теперь войдите в систему.');
    form.reset();
  } catch (err) {
    showError('registerError', err.message);
  }
}

function logout() {
  authToken = null;
  localStorage.removeItem('authToken');
  currentUser = null;
  updateAuthUI();
  loadProducts();
  loadCategories();
}

async function loadImageSelector(containerId, inputId) {
  const container = document.getElementById(containerId);
  const input = document.getElementById(inputId);
  if (!container || !input) return;

  if (!currentUser || currentUser.role !== 'admin') return;

  try {
    const { res, data } = await apiRequest('/api/images');
    if (!res.ok) {
      container.innerHTML = '<span class="empty-state">Нет доступа к изображениям</span>';
      return;
    }
    const images = data.images || [];
    if (!images.length) {
      container.innerHTML = '<span class="empty-state">Нет изображений в папке images/</span>';
      return;
    }
    container.innerHTML = images.map((img) => `
      <button type="button" class="image-selector-item" data-image="${escapeHtml(img)}" title="${escapeHtml(img)}">
        <img src="/${img}" alt="">
      </button>
    `).join('');
    container.querySelectorAll('.image-selector-item').forEach((btn) => {
      btn.addEventListener('click', function () {
        container.querySelectorAll('.image-selector-item').forEach((b) => b.classList.remove('selected'));
        this.classList.add('selected');
        input.value = this.dataset.image;
      });
    });
  } catch (e) {
    container.innerHTML = '<span class="empty-state">Ошибка загрузки</span>';
  }
}

async function loadCategories() {
  const listEl = document.getElementById('categoriesList');
  const selectEl = document.getElementById('productCategory');
  hideError('categoriesError');
    listEl.innerHTML = '<div class="empty-state">Загрузка...</div>';

  try {
    const { res, data } = await apiRequest('/categories');

    if (!res.ok) {
      showError('categoriesError', data.message || data);
      listEl.innerHTML = '';
      return;
    }

    categoriesCache = data;

    selectEl.innerHTML = '<option value="">Выберите категорию...</option>';
    const categoryAccountEl = document.getElementById('productCategoryAccount');
    if (categoryAccountEl) {
      categoryAccountEl.innerHTML = '<option value="">Категория...</option>';
    }
    data.forEach(c => {
      const option = document.createElement('option');
      option.value = c._id;
      option.textContent = c.name;
      selectEl.appendChild(option);
      if (categoryAccountEl) {
        const opt2 = document.createElement('option');
        opt2.value = c._id;
        opt2.textContent = c.name;
        categoryAccountEl.appendChild(opt2);
      }
    });

    const models = [...new Set(data.map(c => c.model).filter(Boolean))].sort();
    const colors = [...new Set(data.map(c => c.color).filter(Boolean))].sort();
    const memories = [...new Set(data.map(c => c.memory).filter(Boolean))].sort();

    const filterModelEl = document.getElementById('filterModel');
    const filterColorEl = document.getElementById('filterColor');
    const filterMemoryEl = document.getElementById('filterMemory');

    filterModelEl.innerHTML = '<option value="">Все</option>';
    models.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m;
      opt.textContent = m;
      filterModelEl.appendChild(opt);
    });
    filterColorEl.innerHTML = '<option value="">Все</option>';
    colors.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m;
      opt.textContent = m;
      filterColorEl.appendChild(opt);
    });
    filterMemoryEl.innerHTML = '<option value="">Все</option>';
    memories.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m;
      opt.textContent = m;
      filterMemoryEl.appendChild(opt);
    });

    const filterCategoryEl = document.getElementById('filterCategory');
    filterCategoryEl.innerHTML = '<option value="">Все</option>';
    data.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c._id;
      opt.textContent = c.name;
      filterCategoryEl.appendChild(opt);
    });

    if (currentUser?.role === 'admin') {
      loadImageSelector('productImageSelector', 'productImage');
    }

    if (!data.length) {
      listEl.innerHTML = '<div class="empty-state">Нет категорий</div>';
      return;
    }

    listEl.innerHTML = data.map(c => `
      <div class="item-card">
        <h4>${escapeHtml(c.name)}</h4>
        ${c.model ? `<div class="meta">Модель: ${escapeHtml(c.model)}</div>` : ''}
        ${c.memory ? `<div class="meta">Объём памяти: ${escapeHtml(c.memory)}</div>` : ''}
        ${c.color ? `<div class="meta">Цвет: ${escapeHtml(c.color)}</div>` : ''}
        ${c.description ? `<div class="description">${escapeHtml(c.description)}</div>` : ''}
        <div class="id">ID: ${c._id}</div>
        ${currentUser?.role === 'admin' ? `
          <div class="item-actions">
            <button class="btn-danger btn-small" onclick="deleteCategory('${c._id}')">Удалить</button>
          </div>
        ` : ''}
      </div>
    `).join('');
  } catch (e) {
    showError('categoriesError', e.message);
    listEl.innerHTML = '';
  }
}

async function handleCreateCategory(event) {
  event.preventDefault();
  hideError('createCategoryError');

  if (!currentUser || currentUser.role !== 'admin') {
    showError('createCategoryError', 'Только администраторы могут создавать категории');
    return;
  }

  const form = event.target;
  const name = form.name.value;
  const model = form.model.value;
  const memory = form.memory.value;
  const color = form.color.value;
  const description = form.description.value;
  const image = form.image?.value || '';

  try {
    const { res, data } = await apiRequest('/categories', {
      method: 'POST',
      body: JSON.stringify({ name, model, memory, color, description, image })
    });

    if (!res.ok) {
      showError('createCategoryError', data.message || data);
      return;
    }

    form.reset();
    const catImg = document.getElementById('categoryImage');
    if (catImg) catImg.value = '';
    document.querySelectorAll('#categoryImageSelector .image-selector-item.selected').forEach((e) => e.classList.remove('selected'));
    loadCategories();
  } catch (err) {
    showError('createCategoryError', err.message);
  }
}

async function deleteCategory(id) {
  if (!confirm('Вы уверены, что хотите удалить эту категорию?')) return;

  try {
    const { res, data } = await apiRequest(`/categories/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      alert(data.message || 'Ошибка удаления');
      return;
    }
    loadCategories();
  } catch (e) {
    alert(e.message);
  }
}

async function loadProducts() {
  const listEl = document.getElementById('productsList');
  hideError('productsError');
  listEl.innerHTML = '<div class="empty-state">Загрузка...</div>';

  const category = document.getElementById('filterCategory')?.value || '';
  const model = document.getElementById('filterModel')?.value || '';
  const color = document.getElementById('filterColor')?.value || '';
  const memory = document.getElementById('filterMemory')?.value || '';
  const minPrice = document.getElementById('filterMinPrice')?.value || '';
  const maxPrice = document.getElementById('filterMaxPrice')?.value || '';
  const searchQ = document.getElementById('filterSearch')?.value?.trim() || '';
  const params = new URLSearchParams();
  if (category) params.set('category', category);
  if (model) params.set('model', model);
  if (color) params.set('color', color);
  if (memory) params.set('memory', memory);
  if (minPrice) params.set('minPrice', minPrice);
  if (maxPrice) params.set('maxPrice', maxPrice);
  if (searchQ) params.set('q', searchQ);
  const query = params.toString();
  const url = query ? '/products?' + query : '/products';

  try {
    const { res, data } = await apiRequest(url);

    if (!res.ok) {
      showError('productsError', data.message || data);
      listEl.innerHTML = '';
      return;
    }

    if (!data.length) {
      listEl.innerHTML = '<div class="empty-state">Нет товаров</div>';
      return;
    }

    listEl.innerHTML = data.map(p => {
      const imgSrc = p.colors?.[0]?.image ? `/${p.colors[0].image}` : (p.image ? `/${p.image}` : null);
      return `
      <div class="product-card">
        <a href="#product/${p._id}" class="product-card-image-link">
          <div class="product-card-image">
            ${imgSrc ? `<img src="${imgSrc}" alt="${escapeHtml(p.name)}">` : '<span class="product-card-placeholder">📱</span>'}
          </div>
        </a>
        <h4><a href="#product/${p._id}" class="product-card-name">${escapeHtml(p.name)}</a></h4>
        <div class="product-card-meta">${escapeHtml(p.category?.name || '')}</div>
        <div class="product-card-price">${p.price} 〒</div>
        <div class="product-card-actions">
          <a href="#product/${p._id}" class="btn-secondary btn-small">Подробнее</a>
          <button class="btn-primary btn-small" onclick="addToCart('${p._id}'); showToast('Добавлено в корзину');">В корзину</button>
          <button class="btn-secondary btn-small" onclick="openPurchaseModal('${p._id}')">Купить сейчас</button>
          ${currentUser?.role === 'admin' ? `<button class="btn-secondary btn-small" onclick="event.preventDefault(); openEditProductModal('${p._id}')">Редактировать</button>` : ''}
          ${currentUser?.role === 'admin' ? `<button class="btn-danger btn-small" onclick="deleteProduct('${p._id}')">Удалить</button>` : ''}
        </div>
      </div>
    `;
    }).join('');
  } catch (e) {
    showError('productsError', e.message);
    listEl.innerHTML = '';
  }
}

async function handleCreateProduct(event) {
  event.preventDefault();
  hideError('createProductError');

  if (!currentUser || currentUser.role !== 'admin') {
    showError('createProductError', 'Только администраторы могут создавать товары');
    return;
  }

  const form = event.target;
  const name = form.name.value;
  const price = Number(form.price.value);
  const category = form.category.value;
  const description = form.description.value;
  const image = form.image?.value || '';

  try {
    const { res, data } = await apiRequest('/products', {
      method: 'POST',
      body: JSON.stringify({ name, price, category, description, image })
    });

    if (!res.ok) {
      showError('createProductError', data.message || data);
      return;
    }

    form.reset();
    const imgInput = document.getElementById('productImage');
    if (imgInput) imgInput.value = '';
    document.querySelectorAll('#productImageSelector .image-selector-item.selected').forEach((e) => e.classList.remove('selected'));
    loadProducts();
  } catch (err) {
    showError('createProductError', err.message);
  }
}

async function handleCreateProductAccount(event) {
  event.preventDefault();
  hideError('createProductErrorAccount');

  if (!currentUser || currentUser.role !== 'admin') {
    showError('createProductErrorAccount', 'Только администраторы могут создавать товары');
    return;
  }

  const form = event.target;
  const name = form.name.value;
  const price = Number(form.price.value);
  const category = form.category.value;
  const description = form.description.value;
  const image = form.image?.value || '';

  try {
    const { res, data } = await apiRequest('/products', {
      method: 'POST',
      body: JSON.stringify({ name, price, category, description, image })
    });

    if (!res.ok) {
      showError('createProductErrorAccount', data.message || 'Ошибка создания');
      return;
    }

    form.reset();
    const imgAcc = document.getElementById('productImageAccount');
    if (imgAcc) imgAcc.value = '';
    document.querySelectorAll('#productImageSelectorAccount .image-selector-item.selected').forEach((e) => e.classList.remove('selected'));
    loadProducts();
    loadCategories();
  } catch (err) {
    showError('createProductErrorAccount', err.message);
  }
}

async function deleteProduct(id) {
  if (!confirm('Вы уверены, что хотите удалить этот товар?')) return;

  try {
    const { res, data } = await apiRequest(`/products/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      alert(data.message || 'Ошибка удаления');
      return;
    }
    loadProducts();
  } catch (e) {
    alert(e.message);
  }
}

async function openPurchaseModal(productId) {
  if (!currentUser) {
    openModal('loginModal');
    return;
  }

  hideError('purchaseError');
  const successEl = document.getElementById('purchaseSuccess');
  successEl.textContent = '';
  successEl.classList.remove('show');

  try {
    const { res, data } = await apiRequest(`/products/${productId}`);
    if (!res.ok) {
      alert(data.message || 'Товар не найден');
      return;
    }

    currentPurchaseProduct = data;
    document.getElementById('purchaseProductId').value = data._id;
    document.getElementById('purchaseProductName').textContent = data.name;
    document.getElementById('purchaseProductMeta').textContent =
      'Категория: ' + (data.category?.name || 'Неизвестно');
    document.getElementById('purchaseProductDescription').textContent = data.description || '';
    document.getElementById('purchaseProductPrice').textContent = data.price + ' 〒';
    document.getElementById('purchaseQuantity').value = 1;
    document.getElementById('purchaseTotal').textContent = data.price + ' 〒';

    document.getElementById('purchaseQuantity').oninput = function () {
      const qty = Math.max(1, parseInt(this.value, 10) || 1);
      this.value = qty;
      if (currentPurchaseProduct) {
        document.getElementById('purchaseTotal').textContent =
          currentPurchaseProduct.price * qty + ' 〒';
      }
    };

    openModal('purchaseModal');
  } catch (e) {
    alert(e.message);
  }
}

async function handlePurchase(event) {
  event.preventDefault();
  hideError('purchaseError');

  if (!currentUser) {
    showError('purchaseError', 'Войдите в аккаунт для оформления покупки');
    return;
  }

  const form = event.target;
  const productId = form.productId.value;
  const quantity = Math.max(1, parseInt(form.quantity.value, 10) || 1);

  try {
    const { res, data } = await apiRequest('/orders', {
      method: 'POST',
      body: JSON.stringify({ product: productId, quantity })
    });

    if (!res.ok) {
      showError('purchaseError', data.message || 'Ошибка оформления заказа');
      return;
    }

    showSuccess('purchaseSuccess', 'Заказ оформлен! Спасибо за покупку.');
    form.querySelector('#purchaseQuantity').value = 1;
    if (currentPurchaseProduct) {
      document.getElementById('purchaseTotal').textContent =
        currentPurchaseProduct.price + ' 〒';
    }
    setTimeout(() => closeModal('purchaseModal'), 1500);
  } catch (err) {
    showError('purchaseError', err.message);
  }
}

async function openEditProductModal(productId) {
  if (!currentUser || currentUser.role !== 'admin') return;

  hideError('editProductError');
  document.getElementById('editProductId').value = productId;

  try {
    const { res, data } = await apiRequest(`/products/${productId}`);
    if (!res.ok) {
      alert(data.message || 'Товар не найден');
      return;
    }

    document.getElementById('editProductName').value = data.name;
    document.getElementById('editProductPrice').value = data.price;
    document.getElementById('editProductDescription').value = data.description || '';

    if (!categoriesCache.length) {
      const catRes = await apiRequest('/categories');
      if (catRes.res.ok) categoriesCache = catRes.data;
    }

    const categorySelect = document.getElementById('editProductCategory');
    categorySelect.innerHTML = '<option value="">Выберите категорию...</option>';
    const currentCategoryId = data.category?._id || data.category;
    categoriesCache.forEach((c) => {
      const opt = document.createElement('option');
      opt.value = c._id;
      opt.textContent = c.name;
      if (String(c._id) === String(currentCategoryId)) opt.selected = true;
      categorySelect.appendChild(opt);
    });

    openModal('editProductModal');
  } catch (err) {
    alert(err.message);
  }
}

async function handleEditProduct(event) {
  event.preventDefault();
  hideError('editProductError');

  if (!currentUser || currentUser.role !== 'admin') return;

  const form = event.target;
  const productId = form.productId.value;
  const name = form.name.value.trim();
  const price = Number(form.price.value);
  const category = form.category.value;
  const description = form.description.value.trim();

  if (!name || !category || !description || price < 0) {
    showError('editProductError', 'Заполните все поля');
    return;
  }

  const btn = document.getElementById('editProductBtn');
  btn.disabled = true;

  try {
    const { res, data } = await apiRequest(`/products/${productId}`, {
      method: 'PUT',
      body: JSON.stringify({ name, price, category, description })
    });

    if (!res.ok) {
      showError('editProductError', data.message || 'Ошибка сохранения');
      return;
    }

    closeModal('editProductModal');
    loadProductPage(productId);
    loadProducts();
  } catch (err) {
    showError('editProductError', err.message);
  } finally {
    btn.disabled = false;
  }
}

function handleHeaderSearch(event) {
  event.preventDefault();
  const input = document.getElementById('headerSearchInput');
  const q = (input?.value || '').trim();
  window.location.hash = q ? `products?q=${encodeURIComponent(q)}` : 'products';
  return false;
}

function showPage(pageId) {
  document.querySelectorAll('.page').forEach((p) => p.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach((a) => a.classList.remove('active'));
  const cap = pageId.charAt(0).toUpperCase() + pageId.slice(1);
  const pageEl = document.getElementById('page' + cap);
  if (pageEl) pageEl.classList.add('active');
  const navPage = pageId === 'product' ? 'products' : pageId;
  const navEl = document.querySelector('.nav-link[data-page="' + navPage + '"]');
  if (navEl) navEl.classList.add('active');
}

function handleHash() {
  const hash = window.location.hash.slice(1) || 'home';
  const [pathPart, queryPart] = hash.split('?');
  const parts = pathPart.split('/');
  const page = parts[0];
  const id = parts[1];
  const params = new URLSearchParams(queryPart || '');

  if (page === 'product' && id) {
    showPage('product');
    loadProductPage(id);
    return;
  }

  if (page === 'home' || page === '') {
    showPage('home');
    const hint = document.getElementById('homeAuthPrompt');
    if (hint) hint.style.display = currentUser ? 'none' : 'block';
    return;
  }

  if (page === 'products') {
    showPage('products');
    loadCategories();
    const filterSearch = document.getElementById('filterSearch');
    if (filterSearch) filterSearch.value = params.get('q') || '';
    loadProducts();
    return;
  }

  if (page === 'account') {
    showPage('account');
    renderAccountPage();
    return;
  }

  if (page === 'cart') {
    showPage('cart');
    loadCartPage();
    return;
  }

  if (page === 'compare' || page === 'favorites') {
    showPage('home');
    return;
  }

  showPage('home');
}

async function loadCartPage() {
  const cartEmpty = document.getElementById('cartEmpty');
  const cartContent = document.getElementById('cartContent');
  const cartItems = document.getElementById('cartItems');

  const cart = getCart();
  if (!cart.items.length) {
    cartEmpty.classList.remove('hidden');
    cartContent.classList.add('hidden');
    return;
  }

  cartEmpty.classList.add('hidden');
  cartContent.classList.remove('hidden');

  const productIds = [...new Set(cart.items.map((i) => i.productId))];
  const products = [];
  for (const id of productIds) {
    try {
      const { res, data } = await apiRequest(`/products/${id}`);
      if (res.ok) products.push(data);
    } catch {}
  }

  let total = 0;
  cartItems.innerHTML = cart.items.map((item) => {
    const p = products.find((x) => x._id === item.productId);
    if (!p) return '';
    const sum = p.price * item.quantity;
    total += sum;
    const imgSrc = p.colors?.[0]?.image ? `/${p.colors[0].image}` : (p.image ? `/${p.image}` : '');
    return `
      <div class="cart-item" data-product-id="${p._id}">
        <a href="#product/${p._id}" class="cart-item-image">${imgSrc ? `<img src="${imgSrc}" alt="">` : '<span>📱</span>'}</a>
        <div class="cart-item-info">
          <a href="#product/${p._id}" class="cart-item-name">${escapeHtml(p.name)}</a>
          <div class="cart-item-price">${p.price} 〒 × ${item.quantity} = ${sum} 〒</div>
          <div class="cart-item-actions">
            <input type="number" min="1" value="${item.quantity}" onchange="updateCartQuantity('${p._id}', parseInt(this.value)||1); loadCartPage();">
            <button type="button" class="btn-danger btn-small" onclick="removeFromCart('${p._id}'); loadCartPage();">Удалить</button>
          </div>
        </div>
      </div>
    `;
  }).filter(Boolean).join('');

  document.getElementById('cartTotalSum').textContent = total.toLocaleString('ru-KZ');

  const checkoutBtn = document.getElementById('cartCheckoutBtn');
  checkoutBtn.onclick = handleCartCheckout;
}

async function handleCartCheckout() {
  if (!currentUser) {
    openModal('loginModal');
    return;
  }

  const cart = getCart();
  if (!cart.items.length) {
    alert('Корзина пуста');
    return;
  }

  const btn = document.getElementById('cartCheckoutBtn');
  btn.disabled = true;
  btn.textContent = 'Оформление...';

  try {
    for (const item of cart.items) {
      const { res } = await apiRequest('/orders', {
        method: 'POST',
        body: JSON.stringify({ product: item.productId, quantity: item.quantity })
      });
      if (!res.ok) throw new Error('Ошибка оформления');
    }
    clearCart();
    loadCartPage();
    updateCartBadge();
    window.location.hash = 'account';
    renderAccountPage();
    alert('Заказ успешно оформлен!');
  } catch (err) {
    alert(err.message || 'Ошибка оформления заказа');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Оформить заказ';
  }
}

async function loadProductPage(productId) {
  const contentEl = document.getElementById('productDetailContent');
  const errorEl = document.getElementById('productDetailError');
  hideError('productDetailError');
  contentEl.innerHTML = '<div class="empty-state">Загрузка...</div>';

  try {
    const { res, data } = await apiRequest('/products/' + productId);
    if (!res.ok) {
      showError('productDetailError', data.message || 'Товар не найден');
      contentEl.innerHTML = '';
      return;
    }
    const p = data;
    const hasVariants = p.colors?.length > 0 || p.memoryOptions?.length > 0;
    const colors = p.colors || [];
    const memoryOptions = p.memoryOptions || [];
    const firstColor = colors[0];
    const firstMemory = memoryOptions[0] || { size: 0, price: p.price };
    const currentPrice = memoryOptions.length ? firstMemory.price : p.price;
    const currentMemory = memoryOptions.length ? firstMemory.size : null;

    if (hasVariants) {
      const colorNameRu = { 'Natural Titanium': 'титан', 'White Titanium': 'белый', 'Desert Titanium': 'бежевый' };
      contentEl.innerHTML = `
        <a href="#products" class="btn-secondary btn-small" style="margin-bottom:16px;display:inline-block;text-decoration:none">← К списку товаров</a>
        <div class="product-detail-layout">
          <div class="product-detail-gallery">
            <img id="productMainImage" src="/${firstColor?.image || 'images/placeholder.webp'}" alt="${escapeHtml(p.name)}" class="product-detail-main-image">
          </div>
          <div class="product-detail-info">
            <h1 class="product-detail-title">${escapeHtml(p.name)} ${currentMemory ? currentMemory + 'GB' : ''}${firstColor ? ` (${escapeHtml(firstColor.name)})` : ''}</h1>
            <div class="product-detail-price-block">
              <span id="productDetailPrice" class="product-detail-price">${currentPrice.toLocaleString('ru-KZ')} 〒</span>
            </div>
            ${colors.length ? `
            <div class="product-detail-option">
              <label class="product-detail-option-label">Цвет корпуса: <span id="productColorName">${escapeHtml(firstColor?.colorName || firstColor?.name || '')}</span></label>
              <div class="product-detail-color-thumbs">
                ${colors.map((c, i) => `
                  <button type="button" class="product-detail-color-thumb ${i === 0 ? 'active' : ''}" data-color-index="${i}" data-image="/${c.image}" data-name="${escapeHtml(c.colorName || c.name)}" title="${escapeHtml(c.name)}">
                    <img src="/${c.image}" alt="${escapeHtml(c.name)}">
                  </button>
                `).join('')}
              </div>
            </div>
            ` : ''}
            ${memoryOptions.length > 1 ? `
            <div class="product-detail-option">
              <label class="product-detail-option-label">Объём встроенной памяти: <span id="productMemorySize">${currentMemory} ГБ</span></label>
              <div class="product-detail-memory-btns">
                ${memoryOptions.map((m, i) => `
                  <button type="button" class="product-detail-memory-btn ${i === 0 ? 'active' : ''}" data-size="${m.size}" data-price="${m.price}">${m.size} ГБ</button>
                `).join('')}
              </div>
            </div>
            ` : ''}
            ${p.specs ? `
            <div class="product-detail-specs">
              ${p.specs.article ? `<div><strong>Артикул:</strong> ${escapeHtml(p.specs.article)}</div>` : ''}
              ${p.specs.brand ? `<div><strong>Бренд:</strong> ${escapeHtml(p.specs.brand)}</div>` : ''}
              ${p.specs.model ? `<div><strong>Модель:</strong> ${escapeHtml(p.specs.model)}</div>` : ''}
              ${p.specs.ram ? `<div><strong>Объём оперативной памяти:</strong> ${escapeHtml(p.specs.ram)}</div>` : ''}
              ${p.specs.screen ? `<div><strong>Тип матрицы экрана:</strong> ${escapeHtml(p.specs.screen)}</div>` : ''}
            </div>
            ` : ''}
            <div class="product-detail-description">${escapeHtml(p.description)}</div>
            <div class="product-detail-actions">
              <button class="btn-primary" onclick="addToCart('${p._id}'); showToast('Добавлено в корзину');">В корзину</button>
              <button class="btn-secondary" onclick="openPurchaseModal('${p._id}')">Купить сейчас</button>
              ${currentUser?.role === 'admin' ? `<button class="btn-secondary" onclick="openEditProductModal('${p._id}')">Редактировать</button>` : ''}
              ${currentUser?.role === 'admin' ? `<button class="btn-danger" onclick="deleteProduct('${p._id}'); window.location.hash='products';">Удалить</button>` : ''}
              <a href="#products" class="btn-secondary">К списку</a>
            </div>
          </div>
        </div>
      `;
      contentEl.querySelectorAll('.product-detail-color-thumb').forEach((btn) => {
        btn.addEventListener('click', function () {
          contentEl.querySelectorAll('.product-detail-color-thumb').forEach((b) => b.classList.remove('active'));
          this.classList.add('active');
          document.getElementById('productMainImage').src = this.dataset.image;
          document.getElementById('productColorName').textContent = this.dataset.name;
        });
      });
      contentEl.querySelectorAll('.product-detail-memory-btn').forEach((btn) => {
        btn.addEventListener('click', function () {
          contentEl.querySelectorAll('.product-detail-memory-btn').forEach((b) => b.classList.remove('active'));
          this.classList.add('active');
          document.getElementById('productDetailPrice').textContent = Number(this.dataset.price).toLocaleString('ru-KZ') + ' 〒';
          document.getElementById('productMemorySize').textContent = this.dataset.size + ' ГБ';
        });
      });
    } else {
      const simpleImg = p.image ? `/${p.image}` : null;
      contentEl.innerHTML = `
        <div class="card product-detail-card">
          <a href="#products" class="btn-secondary btn-small" style="margin-bottom:16px;display:inline-block;text-decoration:none">← К списку товаров</a>
          ${simpleImg ? `<div class="product-detail-simple-image"><img src="${simpleImg}" alt="${escapeHtml(p.name)}"></div>` : ''}
          <h2>${escapeHtml(p.name)}</h2>
          <div class="product-detail-meta">Категория: ${escapeHtml(p.category?.name || 'Неизвестно')}</div>
          <div class="product-detail-description">${escapeHtml(p.description)}</div>
          <div class="product-detail-price">${p.price} 〒</div>
          <div class="product-detail-actions">
            <button class="btn-primary" onclick="addToCart('${p._id}'); showToast('Добавлено в корзину');">В корзину</button>
            <button class="btn-secondary" onclick="openPurchaseModal('${p._id}')">Купить сейчас</button>
            ${currentUser?.role === 'admin' ? `<button class="btn-secondary" onclick="openEditProductModal('${p._id}')">Редактировать</button>` : ''}
            ${currentUser?.role === 'admin' ? `<button class="btn-danger" onclick="deleteProduct('${p._id}'); window.location.hash='products';">Удалить</button>` : ''}
            <a href="#products" class="btn-secondary">К списку</a>
          </div>
        </div>
      `;
    }
  } catch (e) {
    showError('productDetailError', e.message);
    contentEl.innerHTML = '';
  }
}

async function renderAccountPage() {
  const guestEl = document.getElementById('accountGuest');
  const profileEl = document.getElementById('accountProfile');
  const ordersEl = document.getElementById('accountOrders');
  const adminEl = document.getElementById('accountAdmin');

  if (!currentUser) {
    guestEl.classList.remove('hidden');
    profileEl.classList.add('hidden');
    ordersEl.classList.add('hidden');
    adminEl.classList.add('hidden');
    return;
  }

  guestEl.classList.add('hidden');
  profileEl.classList.remove('hidden');
  profileEl.innerHTML = `
    <h2>Профиль</h2>
    <p><strong>Email:</strong> ${escapeHtml(currentUser.email)}</p>
    <p><strong>Роль:</strong> ${currentUser.role === 'admin' ? 'Администратор' : 'Пользователь'}</p>
  `;

  ordersEl.classList.remove('hidden');
  ordersEl.innerHTML = '<h2>Мои заказы</h2><div class="empty-state">Загрузка...</div>';

  try {
    const { res, data } = await apiRequest('/orders');
    if (!res.ok) {
      ordersEl.innerHTML = '<h2>Мои заказы</h2><div class="empty-state">Ошибка загрузки</div>';
      return;
    }
    if (!data.length) {
      ordersEl.innerHTML = '<h2>Мои заказы</h2><div class="empty-state">Заказов пока нет</div>';
    } else {
      ordersEl.innerHTML =
        '<h2>Мои заказы</h2>' +
        data
          .map(
            (o) => `
        <div class="item-card">
          <h4>${escapeHtml(o.product?.name || 'Товар')}</h4>
          <div class="meta">Кол-во: ${o.quantity} | Сумма: ${o.totalPrice} 〒 | ${o.status}</div>
        </div>
      `
          )
          .join('');
    }
  } catch (e) {
    ordersEl.innerHTML = '<h2>Мои заказы</h2><div class="empty-state">Ошибка загрузки</div>';
  }

  if (currentUser.role === 'admin') {
    adminEl.classList.remove('hidden');
    loadCategories();
    loadImageSelector('categoryImageSelector', 'categoryImage');
    loadImageSelector('productImageSelectorAccount', 'productImageAccount');
  } else {
    adminEl.classList.add('hidden');
  }
}

function initEventListeners() {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.active').forEach(modal => {
        closeModal(modal.id);
      });
    }
  });

  document.getElementById('loginPhoneForm').addEventListener('submit', handleSendCode);
  document.getElementById('loginCodeForm').addEventListener('submit', handleVerifyCode);
  document.getElementById('registerForm').addEventListener('submit', handleRegister);
  document.getElementById('createProductForm').addEventListener('submit', handleCreateProduct);
  document.getElementById('createProductFormAccount')?.addEventListener('submit', handleCreateProductAccount);
  document.getElementById('editProductForm').addEventListener('submit', handleEditProduct);
  document.getElementById('createCategoryForm').addEventListener('submit', handleCreateCategory);
  document.getElementById('purchaseForm').addEventListener('submit', handlePurchase);

  document.getElementById('filterCategory')?.addEventListener('change', loadProducts);
  document.getElementById('filterSearch')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      loadProducts();
    }
  });
  document.getElementById('filterBrand')?.addEventListener('change', loadProducts);
  document.getElementById('filterModel')?.addEventListener('change', loadProducts);
  document.getElementById('filterColor')?.addEventListener('change', loadProducts);
  document.getElementById('filterMemory')?.addEventListener('change', loadProducts);
  document.getElementById('filterAvailability')?.addEventListener('change', loadProducts);
  document.getElementById('filterRam')?.addEventListener('change', loadProducts);
  document.getElementById('filterPlatform')?.addEventListener('change', loadProducts);
  document.getElementById('filterScreen')?.addEventListener('change', loadProducts);
  document.getElementById('filterMinPrice')?.addEventListener('change', loadProducts);
  document.getElementById('filterMaxPrice')?.addEventListener('change', loadProducts);

  document.querySelectorAll('.filter-group-head').forEach((btn) => {
    btn.addEventListener('click', function () {
      const group = this.closest('.filter-group');
      if (group) group.classList.toggle('expanded');
    });
  });
}

function initRouter() {
  window.addEventListener('hashchange', handleHash);
}

function initHeroCarousel() {
  const slides = document.querySelectorAll('.hero-carousel-slide');
  const dots = document.querySelectorAll('.hero-carousel-dot');
  if (!slides.length) return;

  let currentIndex = 0;

  function goToSlide(index) {
    currentIndex = (index + slides.length) % slides.length;
    slides.forEach((s, i) => s.classList.toggle('active', i === currentIndex));
    dots.forEach((d, i) => d.classList.toggle('active', i === currentIndex));
  }

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => goToSlide(i));
  });

  setInterval(() => goToSlide(currentIndex + 1), 5000);
}

function toggleCatalog() {
  const panel = document.getElementById('catalogPanel');
  if (!panel) return;
  panel.classList.toggle('open');
}

document.querySelectorAll('.catalog-sidebar-item').forEach((btn) => {
  btn.addEventListener('click', function () {
    const cat = this.dataset.category || 'smartphones';
    document.querySelectorAll('.catalog-sidebar-item').forEach((b) => b.classList.remove('active'));
    this.classList.add('active');
    document.querySelectorAll('.catalog-pane').forEach((p) => {
      p.classList.toggle('active', p.dataset.category === cat);
    });
  });
});

document.addEventListener('click', (e) => {
  const panel = document.getElementById('catalogPanel');
  const toggle = e.target.closest('.catalog-toggle');
  if (!panel) return;
  if (toggle) return;
  if (!panel.contains(e.target)) {
    panel.classList.remove('open');
  }

  const catalogLink = e.target.closest('.catalog-link[data-category-name]');
  if (catalogLink) {
    e.preventDefault();
    const name = catalogLink.dataset.categoryName;
    const cat = categoriesCache.find((c) => c.name === name);
    if (cat) {
      const filterEl = document.getElementById('filterCategory');
      if (filterEl) {
        filterEl.value = cat._id;
      }
      panel.classList.remove('open');
      window.location.hash = 'products';
      loadProducts();
    }
  }
});

document.addEventListener('DOMContentLoaded', () => {
  initRouter();
  initEventListeners();
  checkAuth();
  updateCartBadge();
  handleHash();
  initHeroCarousel();
});
