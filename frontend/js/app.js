/**
 * IT seobiseu — Core Application Engine (Colombia Enterprise Edition)
 * Gestor de Autenticación, Roles, Control de Acceso por Módulo,
 * Modales Universales, Notificaciones Globales y Operaciones CRUD en Tiempo Real.
 */

import { AuthService, DEMO_ACCOUNTS } from './api.js';
import { Store } from './store.js';

/* ==========================================================================
   0. CONFIGURACION Y CONTROL DE ACCESO POR ROL (RBAC)
   Paso 1: Matriz de permisos por perfil y ciclo de vida de la aplicacion
   ========================================================================== */
const ROLE_PERMISSIONS = {
  ADMINISTRADOR: {
    label: 'Administrador General',
    colorClass: 'text-brand-cyan',
    allowedPages: ['index.html', 'ordenes.html', 'inventario.html', 'tickets.html', 'clientes.html'],
    allowedModules: ['dashboard', 'ordenes', 'inventario', 'tickets', 'clientes', 'ajustes']
  },
  SUPERVISOR: {
    label: 'Supervisor de Operaciones NOC',
    colorClass: 'text-amber-400',
    allowedPages: ['index.html', 'ordenes.html', 'inventario.html', 'tickets.html', 'clientes.html'],
    allowedModules: ['dashboard', 'ordenes', 'inventario', 'tickets', 'clientes']
  },
  TECNICO: {
    label: 'Técnico Especialista de Campo',
    colorClass: 'text-emerald-400',
    allowedPages: ['index.html', 'ordenes.html', 'inventario.html', 'tickets.html'],
    allowedModules: ['dashboard', 'ordenes', 'inventario', 'tickets']
  },
  CLIENTE: {
    label: 'Cliente Corporativo VIP',
    colorClass: 'text-purple-400',
    allowedPages: ['index.html', 'ordenes.html', 'tickets.html'],
    allowedModules: ['dashboard', 'ordenes', 'tickets']
  }
};

let currentActiveDrawerOrderId = null;

// Paso 2: Funcion principal de arranque (Punto de entrada de la aplicacion)
function startApp() {
  const currentPage = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const isLoginPage = currentPage === 'login.html';

  // Paso 2.1: Guard de autenticacion (Verifica sesion activa en LocalStorage)
  if (!isLoginPage) {
    if (!AuthService.isAuthenticated() || !AuthService.getCurrentUser()) {
      window.location.href = 'login.html';
      return;
    }

    // Paso 2.2: Control de acceso por rol (Redireccion preventiva si no tiene permiso)
    const currentUser = AuthService.getCurrentUser();
    const userRole = (currentUser.rol || 'ADMINISTRADOR').toUpperCase();
    const permissions = ROLE_PERMISSIONS[userRole] || ROLE_PERMISSIONS.ADMINISTRADOR;

    if (!permissions.allowedPages.includes(currentPage)) {
      showToast(`El perfil [${currentUser.rol}] no tiene acceso al modulo solicitado. Redirigiendo...`, 'error', 'Acceso Restringido');
      setTimeout(() => {
        window.location.href = userRole === 'CLIENTE' ? 'tickets.html' : 'ordenes.html';
      }, 700);
      return;
    }
  }

  // Paso 2.3: Inicializacion de componentes y utilidades transversales
  initTheme();
  initCurrentNavigation();
  initSidebar();
  initSearch();
  initNotifications();
  initUniversalModalsAndDrawers();
  initFormValidations();
  initRealtimeFilters();
  initSkeletonSimulators();
  initQuickStats();

  // Paso 2.4: Adaptacion visual del sidebar y header segun el rol del usuario
  if (!isLoginPage) {
    initUserHeaderAndDropdown();
    adaptSidebarAndModulesByRole();
  }

  // Paso 2.5: Enrutamiento e inicializacion reactiva del controlador de la pagina activa
  if (currentPage.includes('inventario')) {
    initInventarioModule();
  } else if (currentPage.includes('ordenes')) {
    initOrdenesModule();
  } else if (currentPage.includes('tickets')) {
    initTicketsModule();
  } else if (currentPage.includes('clientes')) {
    initClientesModule();
  } else if (currentPage.includes('index') || currentPage === '') {
    initDashboardModule();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApp);
} else {
  startApp();
}

/* ==========================================================================
   1. PERFIL DE USUARIO, MENÚ DESPLEGABLE Y CIERRE DE SESIÓN
   ========================================================================== */
function initUserHeaderAndDropdown() {
  const currentUser = AuthService.getCurrentUser() || {
    nombre: 'Carlos Mendoza',
    email: 'admin@it-seobiseu.local',
    rol: 'ADMINISTRADOR',
    cargo: 'SuperAdmin IT',
    sede: 'Bogotá • Datacenter Zona Franca'
  };

  const userBtn = document.getElementById('userMenuBtn');
  if (!userBtn) return;

  const initials = currentUser.nombre
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  // Eliminar cualquier <img> de avatar y colocar iniciales limpias con gradiente
  const existingImg = userBtn.querySelector('img');
  let avatarBadge = userBtn.querySelector('.user-avatar-badge');
  if (existingImg) existingImg.remove();

  if (!avatarBadge) {
    avatarBadge = document.createElement('div');
    avatarBadge.className = 'user-avatar-badge w-7 h-7 rounded-xl bg-gradient-to-tr from-[#0077B6] to-[#48CAE4] flex items-center justify-center font-bold text-slate-900 font-mono text-[11px] shadow-sm shrink-0';
    userBtn.prepend(avatarBadge);
  }
  avatarBadge.textContent = initials;

  // Actualizar textos visibles en Header
  const nameEl = userBtn.querySelector('.font-display');
  const roleEl = userBtn.querySelector('.font-mono');
  if (nameEl) nameEl.textContent = currentUser.nombre;
  if (roleEl) {
    roleEl.textContent = currentUser.cargo || currentUser.rol;
    const perm = ROLE_PERMISSIONS[currentUser.rol] || ROLE_PERMISSIONS.ADMINISTRADOR;
    roleEl.className = `text-[9px] font-mono mt-0.5 font-bold ${perm.colorClass}`;
  }

  // Inyectar menú desplegable de usuario
  let userDropdown = document.getElementById('userMenuDropdown');
  if (!userDropdown) {
    userDropdown = document.createElement('div');
    userDropdown.id = 'userMenuDropdown';
    userDropdown.className = 'hidden absolute right-0 mt-3 w-72 sm:w-80 bg-[#1C2541]/95 backdrop-blur-2xl border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150';
    
    userDropdown.innerHTML = `
      <div class="p-4 border-b border-slate-800 bg-[#0B132B]/85">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0077B6] to-[#48CAE4] flex items-center justify-center font-bold text-slate-900 font-mono text-sm shadow-md">
            ${initials}
          </div>
          <div class="flex flex-col min-w-0 flex-1">
            <span class="font-display font-bold text-xs text-white truncate">${currentUser.nombre}</span>
            <span class="text-[10px] font-mono text-slate-400 truncate">${currentUser.email}</span>
            <div class="mt-1 flex items-center gap-1.5">
              <span class="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-sky-500/15 text-brand-cyan border border-sky-500/30">
                ${currentUser.rol}
              </span>
              <span class="text-[9px] font-mono text-slate-400 truncate">• Colombia</span>
            </div>
          </div>
        </div>
        <div class="mt-2 text-[10px] font-mono text-slate-400 flex items-center gap-1">
          <span class="material-symbols-outlined text-[13px] text-brand-cyan">location_on</span>
          <span class="truncate">${currentUser.sede || 'Sede Central Bogotá'}</span>
        </div>
      </div>

      <div class="p-3 border-b border-slate-800/80">
        <div class="flex items-center justify-between mb-2 px-1">
          <span class="text-[10px] font-mono uppercase text-slate-400 font-semibold">Cambiar de Perfil (Demo Colombia):</span>
          <span class="text-[9px] font-mono text-brand-cyan">1-Click</span>
        </div>
        <div class="grid grid-cols-2 gap-1.5">
          <button type="button" data-switch-role="admin" class="btn-switch-role text-left p-1.5 rounded-lg bg-slate-800/70 hover:bg-sky-500/20 border border-slate-700/50 hover:border-brand-cyan/50 text-[11px] text-slate-200 transition-all flex items-center gap-1.5">
            <span class="material-symbols-outlined text-[13px] text-brand-cyan">admin_panel_settings</span> <span>Admin</span>
          </button>
          <button type="button" data-switch-role="supervisor" class="btn-switch-role text-left p-1.5 rounded-lg bg-slate-800/70 hover:bg-sky-500/20 border border-slate-700/50 hover:border-brand-cyan/50 text-[11px] text-slate-200 transition-all flex items-center gap-1.5">
            <span class="material-symbols-outlined text-[13px] text-amber-400">shield</span> <span>Supervisor</span>
          </button>
          <button type="button" data-switch-role="tecnico" class="btn-switch-role text-left p-1.5 rounded-lg bg-slate-800/70 hover:bg-sky-500/20 border border-slate-700/50 hover:border-brand-cyan/50 text-[11px] text-slate-200 transition-all flex items-center gap-1.5">
            <span class="material-symbols-outlined text-[13px] text-emerald-400">build</span> <span>Técnico</span>
          </button>
          <button type="button" data-switch-role="cliente" class="btn-switch-role text-left p-1.5 rounded-lg bg-slate-800/70 hover:bg-sky-500/20 border border-slate-700/50 hover:border-brand-cyan/50 text-[11px] text-slate-200 transition-all flex items-center gap-1.5">
            <span class="material-symbols-outlined text-[13px] text-purple-400">person</span> <span>Cliente</span>
          </button>
        </div>
      </div>

      <div class="p-2 space-y-1">
        <a href="index.html" class="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 text-xs transition-colors">
          <span class="material-symbols-outlined text-[18px] text-brand-cyan">grid_view</span>
          <span>Dashboard Principal</span>
        </a>
        <button id="btnLogout" type="button" class="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-500/15 hover:text-rose-300 text-xs font-semibold transition-all">
          <span class="material-symbols-outlined text-[18px]">logout</span>
          <span>Cerrar Sesión</span>
        </button>
      </div>
    `;

    userBtn.parentElement.appendChild(userDropdown);
  }

  // Abrir / Cerrar dropdown
  userBtn.onclick = (e) => {
    e.stopPropagation();
    userDropdown.classList.toggle('hidden');
    const notifDropdown = document.getElementById('notifDropdown');
    if (notifDropdown) notifDropdown.classList.add('hidden');
  };

  document.addEventListener('click', (e) => {
    if (!userDropdown.contains(e.target) && !userBtn.contains(e.target)) {
      userDropdown.classList.add('hidden');
    }
  });

  // Cerrar Sesión
  const btnLogout = document.getElementById('btnLogout');
  if (btnLogout) {
    btnLogout.onclick = () => {
      showToast('Cerrando sesión de IT seobiseu...', 'info', 'Sesión Terminada');
      setTimeout(() => AuthService.logout(), 400);
    };
  }

  // Botones de Cambio Rápido de Rol
  userDropdown.querySelectorAll('[data-switch-role]').forEach((btn) => {
    btn.onclick = async (e) => {
      e.stopPropagation();
      const roleKey = btn.getAttribute('data-switch-role');
      const emailMap = {
        admin: 'admin@it-seobiseu.local',
        supervisor: 'supervisor@it-seobiseu.local',
        tecnico: 'tecnico@it-seobiseu.local',
        cliente: 'cliente@it-seobiseu.local',
      };
      const email = emailMap[roleKey];
      const account = DEMO_ACCOUNTS[email];
      if (account) {
        await AuthService.login(email, account.password);
        showToast(`Cambiando a perfil: ${account.user.rol}. Cargando permisos...`, 'success', 'Rol Actualizado');
        setTimeout(() => {
          if (roleKey === 'cliente') {
            window.location.href = 'tickets.html';
          } else {
            window.location.reload();
          }
        }, 500);
      }
    };
  });
}

/* ==========================================================================
   2. ADAPTACIÓN DEL SIDEBAR Y MÓDULOS SEGÚN ROL
   ========================================================================== */
function adaptSidebarAndModulesByRole() {
  const currentUser = AuthService.getCurrentUser();
  if (!currentUser) return;

  const role = (currentUser.rol || 'ADMINISTRADOR').toUpperCase();

  document.querySelectorAll('#mainSidebar nav a[href]').forEach((link) => {
    const href = link.getAttribute('href').toLowerCase();
    const isInventario = href.includes('inventario');
    const isClientes = href.includes('clientes');
    const isAjustes = href.includes('#') || link.textContent.includes('Ajustes');
    const isOrdenes = href.includes('ordenes');
    const isTickets = href.includes('tickets');

    if (role === 'CLIENTE') {
      if (isInventario || isClientes || isAjustes) {
        link.style.display = 'none';
      }
      if (isOrdenes) {
        const label = link.querySelector('.nav-label');
        if (label) label.textContent = 'Mis Órdenes de Servicio';
      }
      if (isTickets) {
        const label = link.querySelector('.nav-label');
        if (label) label.textContent = 'Solicitar Soporte / Tickets';
      }
    } else if (role === 'TECNICO') {
      if (isClientes || isAjustes) {
        link.style.display = 'none';
      }
    } else if (role === 'SUPERVISOR') {
      if (isAjustes) {
        link.style.display = 'none';
      }
    }
  });

  if (role === 'CLIENTE') {
    document.querySelectorAll('[data-modal-target="newPartModal"]').forEach(el => el.style.display = 'none');
    document.querySelectorAll('[data-modal-target="newClientModal"]').forEach(el => el.style.display = 'none');
  }
}

/* ==========================================================================
   3. NOTIFICACIONES GLOBALES (COLOMBIA)
   ========================================================================== */
function initNotifications() {
  const notifBtn = document.getElementById('notifToggleBtn');
  if (!notifBtn) return;

  let notifDropdown = document.getElementById('notifDropdown');

  if (!notifDropdown) {
    notifDropdown = document.createElement('div');
    notifDropdown.id = 'notifDropdown';
    notifDropdown.className = 'hidden absolute right-0 mt-3 w-80 sm:w-96 bg-[#1C2541]/95 backdrop-blur-2xl border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150';

    notifDropdown.innerHTML = `
      <div class="p-3.5 border-b border-slate-800 flex items-center justify-between bg-[#0B132B]/80">
        <div class="flex items-center gap-2">
          <span class="font-display font-bold text-xs text-slate-100">Centro de Telemetría • Colombia</span>
          <span class="px-1.5 py-0.2 text-[9px] font-mono rounded-full bg-sky-500/20 text-sky-300 font-semibold notif-count-badge">3 Nuevas</span>
        </div>
        <button id="btnMarkNotifsRead" class="text-[11px] text-brand-cyan hover:underline">Marcar leídas</button>
      </div>
      
      <div class="divide-y divide-slate-800/70 max-h-80 overflow-y-auto text-xs">
        <div class="p-3 hover:bg-slate-800/50 transition-colors flex items-start gap-2.5 cursor-pointer">
          <div class="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
            <span class="material-symbols-outlined text-[16px]">crisis_alert</span>
          </div>
          <div class="flex flex-col">
            <span class="font-semibold text-slate-200">Stock Crítico: Memoria RAM Servidor</span>
            <span class="text-[11px] text-slate-400 mt-0.5">Datacenter Tocancipá • Restan 2 unidades en Rack B-04.</span>
            <span class="text-[9px] font-mono text-slate-500 mt-1">Hace 5 min • Alerta Almacén</span>
          </div>
        </div>

        <div class="p-3 hover:bg-slate-800/50 transition-colors flex items-start gap-2.5 cursor-pointer">
          <div class="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
            <span class="material-symbols-outlined text-[16px]">verified</span>
          </div>
          <div class="flex flex-col">
            <span class="font-semibold text-slate-200">Entrega SLA Cumplida: Bancolombia</span>
            <span class="text-[11px] text-slate-400 mt-0.5">Mantenimiento de Servidor Dell R740 finalizado en tiempo récord.</span>
            <span class="text-[9px] font-mono text-slate-500 mt-1">Hace 25 min • SLA 99.98% OK</span>
          </div>
        </div>

        <div class="p-3 hover:bg-slate-800/50 transition-colors flex items-start gap-2.5 cursor-pointer">
          <div class="w-7 h-7 rounded-lg bg-sky-500/20 text-brand-cyan flex items-center justify-center shrink-0 mt-0.5">
            <span class="material-symbols-outlined text-[16px]">router</span>
          </div>
          <div class="flex flex-col">
            <span class="font-semibold text-slate-200">Enlace Fibra Óptica Bogotá - Medellín</span>
            <span class="text-[11px] text-slate-400 mt-0.5">Ecopetrol reporta latencia nominal de 8.4 ms entre datacenters.</span>
            <span class="text-[9px] font-mono text-slate-500 mt-1">Hace 1 hora • NOC Redes</span>
          </div>
        </div>
      </div>
    `;

    notifBtn.parentElement.appendChild(notifDropdown);
  }

  notifBtn.onclick = (e) => {
    e.stopPropagation();
    notifDropdown.classList.toggle('hidden');
    const userDropdown = document.getElementById('userMenuDropdown');
    if (userDropdown) userDropdown.classList.add('hidden');
  };

  document.addEventListener('click', (e) => {
    if (!notifDropdown.contains(e.target) && !notifBtn.contains(e.target)) {
      notifDropdown.classList.add('hidden');
    }
  });

  const btnMarkRead = document.getElementById('btnMarkNotifsRead');
  if (btnMarkRead) {
    btnMarkRead.onclick = () => {
      const pingDot = notifBtn.querySelector('.animate-ping');
      if (pingDot) pingDot.parentElement.remove();
      const countBadge = notifDropdown.querySelector('.notif-count-badge');
      if (countBadge) countBadge.textContent = '0 Nuevas';
      showToast('Todas las alertas marcadas como leídas.', 'info', 'Notificaciones');
    };
  }
}

/* ==========================================================================
   4. GESTIÓN UNIVERSAL DE MODALES Y DRAWERS
   ========================================================================== */
export function openModal(targetId, triggerEl = null) {
  const modal = typeof targetId === 'string' ? document.getElementById(targetId) : targetId;
  if (!modal) {
    console.warn(`[Modal] Modal no encontrado: ${targetId}`);
    return;
  }

  // Quitar hidden, agregar is-open y forzar visibilidad inmediata
  modal.classList.remove('hidden');
  modal.classList.add('is-open');
  modal.style.setProperty('display', 'flex', 'important');
  modal.style.setProperty('pointer-events', 'auto', 'important');
  modal.style.setProperty('visibility', 'visible', 'important');
  modal.style.setProperty('opacity', '1', 'important');

  // Pre-llenado reactivo de datos según el tipo de modal
  const id = typeof targetId === 'string' ? targetId : modal.id;

  if (id === 'editOrderModal') {
    const orderId = triggerEl?.getAttribute('data-order-id') || modal.getAttribute('data-order-id') || 'OT-COL-8921';
    if (typeof populateEditOrderModal === 'function') {
      populateEditOrderModal(orderId);
    }
  } else if (id === 'editPartModal') {
    const sku = triggerEl?.getAttribute('data-sku') || modal.getAttribute('data-sku');
    if (sku) {
      const item = Store.getInventory().find(i => i.sku === sku);
      if (item) {
        const adjustSku = document.getElementById('adjustPartSku');
        const adjustDisplay = document.getElementById('adjustPartDisplay');
        if (adjustSku) adjustSku.value = item.sku;
        if (adjustDisplay) adjustDisplay.textContent = `${item.sku} — ${item.name} (Stock Actual: ${item.qty} u.)`;
      }
    }
  } else if (id === 'editPartDetailsModal') {
    const sku = triggerEl?.getAttribute('data-sku') || modal.getAttribute('data-sku');
    if (sku) {
      const item = Store.getInventory().find(i => i.sku === sku);
      if (item) {
        const idHidden = document.getElementById('editPartSkuHidden');
        const skuDisplay = document.getElementById('editPartSkuDisplay');
        const nameInput = document.getElementById('editPartNameInput');
        const catSelect = document.getElementById('editPartCategorySelect');
        const priceInput = document.getElementById('editPartPriceInput');
        const rackInput = document.getElementById('editPartRackInput');
        if (idHidden) idHidden.value = item.sku;
        if (skuDisplay) skuDisplay.value = item.sku;
        if (nameInput) nameInput.value = item.name;
        if (catSelect) catSelect.value = item.category || 'storage';
        if (priceInput) priceInput.value = item.priceFormatted || `${item.price} COP`;
        if (rackInput) rackInput.value = item.rack;
      }
    }
  } else if (id === 'editClientModal') {
    const clientId = triggerEl?.getAttribute('data-client-id') || modal.getAttribute('data-client-id');
    if (clientId) {
      const client = Store.getClients().find(c => c.id === clientId || c.nit === clientId);
      if (client) {
        const idInput = document.getElementById('editClientId');
        const nameInput = document.getElementById('editClientName');
        const nitInput = document.getElementById('editClientNit');
        const slaInput = document.getElementById('editClientSla');
        const sedesInput = document.getElementById('editClientSedes');
        const serversInput = document.getElementById('editClientServers');
        const statusInput = document.getElementById('editClientStatus');
        const phoneInput = document.getElementById('editClientPhone');
        if (idInput) idInput.value = client.id;
        if (nameInput) nameInput.value = client.name;
        if (nitInput) nitInput.value = client.nit;
        if (slaInput) slaInput.value = client.contract;
        if (sedesInput) sedesInput.value = client.sedes;
        if (serversInput) serversInput.value = client.servers;
        if (statusInput) statusInput.value = client.status || 'Activo';
        if (phoneInput) phoneInput.value = client.phone || '+57 (601) 745-0000';
      }
    }
  } else if (id === 'slaDetailModal') {
    const clientId = triggerEl?.getAttribute('data-client-id') || modal.getAttribute('data-client-id');
    if (clientId) {
      const client = Store.getClients().find(c => c.id === clientId || c.nit === clientId);
      if (client) {
        const slaName = document.getElementById('modalSlaClientName');
        const slaNit = document.getElementById('modalSlaNit');
        const slaTier = document.getElementById('modalSlaTier');
        const slaSedes = document.getElementById('modalSlaSedes');
        const slaServers = document.getElementById('modalSlaServers');
        if (slaName) slaName.textContent = client.name;
        if (slaNit) slaNit.textContent = `NIT: ${client.nit}`;
        if (slaTier) slaTier.textContent = client.contract;
        if (slaSedes) slaSedes.textContent = client.sedes;
        if (slaServers) slaServers.textContent = client.servers;
      }
    }
  } else if (id === 'editTicketModal') {
    const ticketId = triggerEl?.getAttribute('data-ticket-id') || modal.getAttribute('data-ticket-id');
    if (ticketId) {
      const ticket = Store.getTickets().find(t => t.id === ticketId);
      if (ticket) {
        const idInput = document.getElementById('editTicketId');
        const dispInput = document.getElementById('editTicketIdDisplay');
        const statusSelect = document.getElementById('editTicketStatusSelect');
        const prioSelect = document.getElementById('editTicketPrioritySelect');
        const notesInput = document.getElementById('editTicketNotes');
        if (idInput) idInput.value = ticket.id;
        if (dispInput) dispInput.value = `${ticket.id} • ${ticket.clientEmail}`;
        if (statusSelect) statusSelect.value = ticket.status || 'Abierto';
        if (prioSelect) prioSelect.value = ticket.priority || 'p2';
        if (notesInput) notesInput.value = ticket.diag || '';
      }
    }
  }
}

export function closeModal(targetId) {
  let modal = null;
  if (typeof targetId === 'string') {
    modal = document.getElementById(targetId);
  } else if (targetId instanceof HTMLElement) {
    modal = targetId.closest('.modal-container') || targetId;
  }
  if (!modal) {
    document.querySelectorAll('.modal-container').forEach(m => {
      m.classList.add('hidden');
      m.classList.remove('is-open');
      m.style.setProperty('display', 'none', 'important');
    });
    return;
  }
  modal.classList.add('hidden');
  modal.classList.remove('is-open');
  modal.style.setProperty('display', 'none', 'important');
}

window.openModal = openModal;
window.closeModal = closeModal;

function initUniversalModalsAndDrawers() {
  let overlay = document.getElementById('drawerBackdropOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'drawerBackdropOverlay';
    overlay.className = 'hidden fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm transition-opacity duration-300';
    document.body.appendChild(overlay);
  }

  // 1. Delegación de click universal en document
  document.addEventListener('click', (e) => {
    // Abrir Modal
    const openTrigger = e.target.closest('[data-modal-target]');
    if (openTrigger) {
      e.preventDefault();
      const targetId = openTrigger.getAttribute('data-modal-target');
      openModal(targetId, openTrigger);
      return;
    }

    // Cerrar Modal
    const closeTrigger = e.target.closest('[data-modal-close]');
    if (closeTrigger) {
      e.preventDefault();
      closeModal(closeTrigger);
      return;
    }

    // Abrir Drawer de Detalle de Orden
    const drawerTrigger = e.target.closest('.btn-open-drawer');
    if (drawerTrigger) {
      e.preventDefault();
      const orderId = drawerTrigger.getAttribute('data-order-id');
      populateAndOpenDrawer(orderId);
      return;
    }

    // Cerrar Drawer
    const closeDrawerTrigger = e.target.closest('.btn-close-drawer');
    if (closeDrawerTrigger) {
      e.preventDefault();
      closeDrawer();
      return;
    }

    // Click en Backdrop de Drawer
    if (e.target === overlay) {
      closeDrawer();
      return;
    }

    // Click en Backdrop de Modal
    if (e.target.classList && e.target.classList.contains('modal-container')) {
      closeModal(e.target);
    }
  });

  // 2. Asignación directa a botones existentes por redundancia máxima
  document.querySelectorAll('[data-modal-target]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = btn.getAttribute('data-modal-target');
      openModal(targetId, btn);
    });
  });

  document.querySelectorAll('[data-modal-close]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      closeModal(btn);
    });
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeDrawer();
      closeModal();
    }
  });

  // Botón "Firmar Entrega SLA"
  const btnSignSla = document.getElementById('btnSignSla');
  if (btnSignSla) {
    btnSignSla.onclick = () => {
      if (!currentActiveDrawerOrderId) return;

      const order = Store.updateOrder(currentActiveDrawerOrderId, {
        status: 'completado',
        statusLabel: 'Completado / SLA Cumplido',
        slaTime: 'SLA Certificado OK',
        slaTimeOk: true,
        slaSigned: true
      });

      // Actualizar estado en el Drawer
      const percBadge = document.getElementById('drawerPercBadge');
      if (percBadge) {
        percBadge.className = 'px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-400 font-mono text-xs font-bold';
        percBadge.textContent = 'Completado / SLA Cumplido';
      }

      // Bitácora
      const logsList = document.getElementById('drawerLogsList');
      if (logsList) {
        const logEntry = document.createElement('div');
        logEntry.className = 'p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-2 animate-in fade-in';
        logEntry.innerHTML = `
          <span class="material-symbols-outlined text-emerald-400 text-[16px] mt-0.5">verified</span>
          <div>
            <p class="text-slate-200 text-[11px] font-semibold">Acta de entrega y certificación SLA firmada digitalmente.</p>
            <span class="text-[9px] font-mono text-emerald-400">Ahora mismo • Mesa de Ayuda Colombia</span>
          </div>
        `;
        logsList.prepend(logEntry);
      }

      // Re-renderizar tablas activas
      renderCurrentPageOrders();

      showToast(`Orden ${currentActiveDrawerOrderId} cerrada. Certificación SLA generada y notificada a la empresa.`, 'success', 'Certificación SLA');
      setTimeout(() => closeDrawer(), 700);
    };
  }
}

function populateAndOpenDrawer(orderId) {
  const drawer = document.getElementById('techDetailDrawer');
  const overlay = document.getElementById('drawerBackdropOverlay');
  if (!drawer) return;

  const orders = Store.getOrders();
  const order = orders.find(o => o.id === orderId) || orders[0];
  if (!order) return;

  currentActiveDrawerOrderId = order.id;

  const drawerOrderId = document.getElementById('drawerOrderId');
  const drawerClient = document.getElementById('drawerClient');
  const drawerDevice = document.getElementById('drawerDevice');
  const drawerDiagText = document.getElementById('drawerDiagText');
  const drawerPercBadge = document.getElementById('drawerPercBadge');
  const drawerSlaTime = document.getElementById('drawerSlaTime');

  if (drawerOrderId) drawerOrderId.textContent = order.id;
  if (drawerClient) drawerClient.textContent = `${order.client} — ${order.sede}`;
  if (drawerDevice) drawerDevice.textContent = `${order.device} • ${order.serial || ''}`;
  if (drawerDiagText) drawerDiagText.textContent = order.diag;
  if (drawerSlaTime) drawerSlaTime.textContent = `Estado SLA: ${order.slaTime} • Sede Colombia`;
  if (drawerPercBadge) {
    if (order.status === 'completado') {
      drawerPercBadge.className = 'px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-400 font-mono text-xs font-bold';
      drawerPercBadge.textContent = 'Completado / SLA Cumplido';
    } else {
      drawerPercBadge.className = 'px-2 py-0.5 rounded-lg bg-sky-500/20 text-brand-cyan font-mono text-xs font-bold';
      drawerPercBadge.textContent = order.statusLabel || 'En Atención';
    }
  }

  drawer.classList.remove('translate-x-full', 'pointer-events-none');
  if (overlay) overlay.classList.remove('hidden');
}

function closeDrawer() {
  const drawer = document.getElementById('techDetailDrawer');
  const overlay = document.getElementById('drawerBackdropOverlay');
  if (drawer) drawer.classList.add('translate-x-full', 'pointer-events-none');
  if (overlay) overlay.classList.add('hidden');
}

function populateEditOrderModal(orderId) {
  const orders = Store.getOrders();
  const order = orders.find(o => o.id === orderId) || orders[0];
  if (!order) return;

  const idHidden = document.getElementById('editOrderIdHidden');
  const displayId = document.getElementById('editOrderDisplayId');
  const techSelect = document.getElementById('editOrderTechSelect');
  const statusSelect = document.getElementById('editOrderStatusSelect');
  const prioritySelect = document.getElementById('editOrderPrioritySelect');
  const diagInput = document.getElementById('editOrderDiagInput');

  if (idHidden) idHidden.value = order.id;
  if (displayId) displayId.value = `${order.id} — ${order.client}`;
  if (techSelect) techSelect.value = order.techInitials || 'MS';
  if (statusSelect) statusSelect.value = order.status || 'proceso';
  if (prioritySelect) prioritySelect.value = order.priority || 'p2';
  if (diagInput) diagInput.value = order.diag || '';
}

/* ==========================================================================
   5. MÓDULO DASHBOARD PRINCIPAL
   ========================================================================== */
function initDashboardModule() {
  renderDashboardOrdersTable();

  // Formulario Nueva Orden Express
  const modalNewOrder = document.getElementById('newOrderModal');
  const formNewOrder = modalNewOrder ? modalNewOrder.querySelector('form') : null;

  if (formNewOrder) {
    formNewOrder.onsubmit = (e) => {
      e.preventDefault();
      const inputs = formNewOrder.querySelectorAll('input');
      const client = (inputs[0] ? inputs[0].value.trim() : '') || 'Bancolombia S.A.';
      const device = (inputs[3] ? inputs[3].value.trim() : '') || 'Servidor Dell PowerEdge R750';
      const diag = (formNewOrder.querySelector('textarea') ? formNewOrder.querySelector('textarea').value.trim() : '') || 'Mantenimiento preventivo de hardware.';
      const prioritySelect = formNewOrder.querySelector('select');
      const priority = prioritySelect ? prioritySelect.value : 'p2';

      const newOrder = Store.addOrder({
        client,
        device,
        diag,
        priority,
        sede: 'Datacenter Tocancipá • Bahía 02',
        tech: 'Téc. Marco Silva',
        techInitials: 'MS',
        techRole: 'Hardware & Servidores - Tocancipá',
        status: 'proceso'
      });

      renderDashboardOrdersTable();
      formNewOrder.reset();
      modalNewOrder.classList.add('hidden');
      showToast(`Órden express [${newOrder.id}] asignada a técnico de guardia en Bogotá.`, 'success', 'Órden Creada');
    };
  }

  // Formulario Editar Orden
  const formEditOrder = document.getElementById('formEditOrder');
  if (formEditOrder) {
    formEditOrder.onsubmit = (e) => {
      e.preventDefault();
      const orderId = document.getElementById('editOrderIdHidden').value;
      const techSelect = document.getElementById('editOrderTechSelect');
      const statusSelect = document.getElementById('editOrderStatusSelect');
      const prioritySelect = document.getElementById('editOrderPrioritySelect');
      const diagInput = document.getElementById('editOrderDiagInput');

      const techMap = {
        MS: { tech: 'Téc. Marco Silva', techInitials: 'MS', techRole: 'Hardware & Servidores' },
        AR: { tech: 'Ing. Andrés Ruiz', techInitials: 'AR', techRole: 'Storage & RAID' },
        SR: { tech: 'Ing. Sofía Reyes', techInitials: 'SR', techRole: 'Redes & Fibra' }
      };

      const selectedTech = techMap[techSelect.value] || techMap.MS;
      const statusVal = statusSelect.value;
      const priorityVal = prioritySelect.value;
      const diagVal = diagInput.value.trim();

      Store.updateOrder(orderId, {
        tech: selectedTech.tech,
        techInitials: selectedTech.techInitials,
        techRole: selectedTech.techRole,
        status: statusVal,
        statusLabel: statusVal === 'completado' ? 'Completado / SLA Cumplido' : statusVal === 'pendiente' ? 'Pendiente / Crítico' : 'En Diagnóstico / Triage',
        priority: priorityVal,
        priorityLabel: priorityVal === 'p1' ? 'Crítica (2h)' : priorityVal === 'p2' ? 'Alta (6h)' : 'Media (12h)',
        diag: diagVal,
        slaTime: statusVal === 'completado' ? 'SLA Certificado OK' : 'En tiempo normativo',
        slaTimeOk: statusVal === 'completado'
      });

      renderDashboardOrdersTable();
      document.getElementById('editOrderModal').classList.add('hidden');
      showToast(`Órden [${orderId}] actualizada correctamente.`, 'success', 'Orden Guardada');
    };
  }

  // Delegación de botón eliminar orden
  document.addEventListener('click', (e) => {
    const btnDel = e.target.closest('.btn-delete-order');
    if (btnDel) {
      e.preventDefault();
      const orderId = btnDel.getAttribute('data-order-id');
      if (confirm(`¿Confirma que desea eliminar la orden ${orderId} del registro?`)) {
        Store.deleteOrder(orderId);
        renderDashboardOrdersTable();
        showToast(`Orden ${orderId} eliminada del sistema.`, 'info', 'Registro Eliminado');
      }
    }
  });

  // Botones de Turno y Exportación
  document.querySelectorAll('button').forEach(btn => {
    if (btn.textContent.includes('Exportar Informe')) {
      btn.onclick = () => {
        showToast('Generando informe corporativo para Colombia (SLA & Racks)...', 'info', 'Exportando');
        setTimeout(() => {
          showToast('Informe descargado: IT_Seobiseu_Colombia_Reporte_Octubre.pdf', 'success', 'Descarga Completada');
        }, 700);
      };
    } else if (btn.textContent.includes('Filtrar por Turno')) {
      btn.onclick = () => {
        showToast('Filtro: Turno 24/7 Datacenter Bogotá Zona Franca Activo.', 'info', 'Turno Actual');
      };
    }
  });
}

function renderDashboardOrdersTable() {
  const tableBody = document.querySelector('tbody');
  if (!tableBody) return;

  const orders = Store.getOrders();
  tableBody.innerHTML = '';

  orders.slice(0, 6).forEach(order => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-800/40 transition-colors animate-in fade-in';
    tr.setAttribute('data-status', order.priority || 'p2');

    const priorityBadge = order.priority === 'p1'
      ? '<span class="px-2 py-0.5 rounded-full text-[10px] font-mono bg-rose-500/15 text-rose-400 border border-rose-500/30 font-semibold">Crítica (P1)</span>'
      : '<span class="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/15 text-amber-400 border border-amber-500/30 font-semibold">Alta (P2)</span>';

    const slaStatusHtml = order.status === 'completado'
      ? `<div class="flex items-center gap-1.5 text-emerald-400 font-mono text-[11px]"><span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span><span>SLA Certificado OK</span></div>`
      : `<div class="flex items-center gap-1.5 text-amber-400 font-mono text-[11px]"><span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span><span>${order.slaTime || '32m restantes'}</span></div>`;

    tr.innerHTML = `
      <td class="py-3 px-3 font-mono font-bold text-brand-cyan">${order.id}</td>
      <td class="py-3 px-3">
        <div class="font-semibold text-slate-200">${order.client} — ${order.device}</div>
        <div class="text-[11px] text-slate-400">${order.diag}</div>
      </td>
      <td class="py-3 px-3">${priorityBadge}</td>
      <td class="py-3 px-3 text-slate-300 font-medium">${order.tech}</td>
      <td class="py-3 px-3">${slaStatusHtml}</td>
      <td class="py-3 px-3 text-right">
        <div class="inline-flex items-center gap-1">
          <button 
            class="btn-open-drawer btn-pro px-2.5 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-brand-cyan border border-sky-500/30 transition-colors flex items-center gap-1 font-semibold text-[11px]" 
            data-order-id="${order.id}"
            title="Ver Detalle de Incidente"
          >
            <span class="material-symbols-outlined text-[15px]">visibility</span>
            <span>Detalle</span>
          </button>
          <button data-modal-target="editOrderModal" data-order-id="${order.id}" class="btn-pro p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all" title="Editar orden">
            <span class="material-symbols-outlined text-[15px]">edit</span>
          </button>
          <button data-order-id="${order.id}" class="btn-delete-order btn-pro p-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition-all border border-rose-500/20" title="Eliminar orden">
            <span class="material-symbols-outlined text-[15px]">delete</span>
          </button>
        </div>
      </td>
    `;
    tableBody.appendChild(tr);
  });
}

function renderCurrentPageOrders() {
  const currentPage = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
  if (currentPage.includes('ordenes')) {
    renderOrdersTable();
  } else if (currentPage.includes('index') || currentPage === '') {
    renderDashboardOrdersTable();
  }
}

/* ==========================================================================
   6. MÓDULO ÓRDENES DE TRABAJO (ordenes.html)
   ========================================================================== */
function initOrdenesModule() {
  renderOrdersTable();

  // Nueva Orden Form
  const modalNewOrder = document.getElementById('newOrderModal');
  const formNewOrder = modalNewOrder ? modalNewOrder.querySelector('form') : null;

  if (formNewOrder) {
    formNewOrder.onsubmit = (e) => {
      e.preventDefault();
      const inputs = formNewOrder.querySelectorAll('input');
      const client = (inputs[0] ? inputs[0].value.trim() : '') || 'Bancolombia S.A.';
      const device = (inputs[3] ? inputs[3].value.trim() : '') || 'Servidor Dell PowerEdge R750';
      const diag = (formNewOrder.querySelector('textarea') ? formNewOrder.querySelector('textarea').value.trim() : '') || 'Mantenimiento técnico preventivo y correctivo.';
      const prioritySelect = formNewOrder.querySelector('select');
      const priority = prioritySelect ? prioritySelect.value : 'p2';

      const newOrder = Store.addOrder({
        client,
        device,
        diag,
        priority,
        sede: 'Datacenter Zona Franca Piso 4',
        tech: 'Ing. Andrés Ruiz',
        techInitials: 'AR',
        techRole: 'Especialista Storage & RAID',
        status: 'proceso'
      });

      renderOrdersTable();
      formNewOrder.reset();
      modalNewOrder.classList.add('hidden');
      showToast(`Órden [${newOrder.id}] radicada exitosamente en el sistema.`, 'success', 'Orden Registrada');
    };
  }

  // Editar Orden Form
  const formEditOrder = document.getElementById('formEditOrder');
  if (formEditOrder) {
    formEditOrder.onsubmit = (e) => {
      e.preventDefault();
      const orderId = document.getElementById('editOrderIdHidden').value;
      const techSelect = document.getElementById('editOrderTechSelect');
      const statusSelect = document.getElementById('editOrderStatusSelect');
      const prioritySelect = document.getElementById('editOrderPrioritySelect');
      const diagInput = document.getElementById('editOrderDiagInput');

      const techMap = {
        MS: { tech: 'Téc. Marco Silva', techInitials: 'MS', techRole: 'Hardware & Servidores' },
        AR: { tech: 'Ing. Andrés Ruiz', techInitials: 'AR', techRole: 'Storage & RAID' },
        SR: { tech: 'Ing. Sofía Reyes', techInitials: 'SR', techRole: 'Redes & Fibra' }
      };

      const selectedTech = techMap[techSelect.value] || techMap.AR;
      const statusVal = statusSelect.value;
      const priorityVal = prioritySelect.value;
      const diagVal = diagInput.value.trim();

      Store.updateOrder(orderId, {
        tech: selectedTech.tech,
        techInitials: selectedTech.techInitials,
        techRole: selectedTech.techRole,
        status: statusVal,
        statusLabel: statusVal === 'completado' ? 'Completado / SLA Cumplido' : statusVal === 'pendiente' ? 'Pendiente / Crítico' : 'En Diagnóstico / Triage',
        priority: priorityVal,
        priorityLabel: priorityVal === 'p1' ? 'Crítica (2h)' : priorityVal === 'p2' ? 'Alta (6h)' : 'Media (12h)',
        diag: diagVal,
        slaTime: statusVal === 'completado' ? 'SLA Certificado OK' : 'En tiempo normativo',
        slaTimeOk: statusVal === 'completado'
      });

      renderOrdersTable();
      document.getElementById('editOrderModal').classList.add('hidden');
      showToast(`Órden [${orderId}] actualizada correctamente.`, 'success', 'Orden Guardada');
    };
  }

  // Eliminar Orden
  document.addEventListener('click', (e) => {
    const btnDel = e.target.closest('.btn-delete-order');
    if (btnDel) {
      e.preventDefault();
      const orderId = btnDel.getAttribute('data-order-id');
      if (confirm(`¿Confirma que desea eliminar la orden ${orderId} del registro?`)) {
        Store.deleteOrder(orderId);
        renderOrdersTable();
        showToast(`Orden ${orderId} eliminada del sistema.`, 'info', 'Registro Eliminado');
      }
    }
  });
}

function renderOrdersTable() {
  const tableBody = document.querySelector('#ordersTableContent tbody');
  if (!tableBody) return;

  const orders = Store.getOrders();
  const searchInput = document.getElementById('ordersFilterSearch');
  const statusSelect = document.getElementById('ordersStatusSelect');

  const query = (searchInput ? searchInput.value : '').toLowerCase().trim();
  const statusFilter = (statusSelect ? statusSelect.value : 'all').toLowerCase();

  tableBody.innerHTML = '';

  let visibleCount = 0;
  orders.forEach(order => {
    const matchesSearch = !query || order.id.toLowerCase().includes(query) || order.client.toLowerCase().includes(query) || order.device.toLowerCase().includes(query) || order.tech.toLowerCase().includes(query);
    const matchesStatus = statusFilter === 'all' || (order.status || '').toLowerCase().includes(statusFilter);

    if (!matchesSearch || !matchesStatus) return;
    visibleCount++;

    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-800/40 transition-colors animate-in fade-in';
    tr.setAttribute('data-status', order.status || 'proceso');

    const priorityBadge = order.priority === 'p1'
      ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-mono bg-rose-500/15 text-rose-400 border border-rose-500/30 font-semibold flex items-center gap-1 w-max"><span class="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse"></span>Crítica (2h)</span>`
      : `<span class="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/15 text-amber-400 border border-amber-500/30 font-semibold flex items-center gap-1 w-max"><span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span>Alta (6h)</span>`;

    const statusBadge = order.status === 'completado'
      ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold">Completado / SLA Cumplido</span>`
      : order.status === 'pendiente'
      ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-mono bg-rose-500/15 text-rose-400 border border-rose-500/30 font-semibold">Pendiente / Crítico</span>`
      : `<span class="px-2 py-0.5 rounded-full text-[10px] font-mono bg-sky-500/15 text-sky-400 border border-sky-500/30 font-semibold">${order.statusLabel || 'En Diagnóstico / Triage'}</span>`;

    tr.innerHTML = `
      <td class="py-3 px-4 font-mono font-bold text-brand-cyan">
        <div class="flex items-center gap-1.5">
          <span class="w-1.5 h-5 rounded-full ${order.priority === 'p1' ? 'bg-rose-500' : 'bg-amber-500'}"></span>
          <span>${order.id}</span>
        </div>
      </td>
      <td class="py-3 px-4">
        <div class="font-semibold text-slate-200">${order.client}</div>
        <div class="text-[11px] text-slate-400">${order.sede}</div>
      </td>
      <td class="py-3 px-4">
        <div class="font-semibold text-slate-200">${order.device}</div>
        <div class="text-[10px] font-mono text-brand-electric">${order.serial || 'SN: COL-ENTERPRISE'}</div>
        <div class="text-[11px] text-slate-400 truncate max-w-xs">${order.diag}</div>
      </td>
      <td class="py-3 px-4">
        <div class="flex items-center gap-2">
          <div class="w-6 h-6 rounded-lg bg-sky-500/20 text-brand-cyan border border-sky-500/30 flex items-center justify-center font-mono font-bold text-[10px]">${order.techInitials || 'TC'}</div>
          <div>
            <div class="font-semibold text-slate-200 text-xs">${order.tech}</div>
            <div class="text-[9px] text-slate-400 font-mono">${order.techRole || 'Campo'}</div>
          </div>
        </div>
      </td>
      <td class="py-3 px-4">${priorityBadge}</td>
      <td class="py-3 px-4">${statusBadge}</td>
      <td class="py-3 px-4 text-right">
        <div class="inline-flex items-center gap-1">
          <button 
            class="btn-open-drawer btn-pro px-2.5 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-brand-cyan border border-sky-500/30 transition-colors flex items-center gap-1 font-semibold text-[11px]" 
            data-order-id="${order.id}"
            title="Ver Detalle Técnico"
          >
            <span class="material-symbols-outlined text-[15px]">visibility</span>
            <span>Ver Detalle</span>
          </button>
          <button data-modal-target="editOrderModal" data-order-id="${order.id}" class="btn-pro p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all" title="Editar orden">
            <span class="material-symbols-outlined text-[15px]">edit</span>
          </button>
          <button data-order-id="${order.id}" class="btn-delete-order btn-pro p-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition-all border border-rose-500/20" title="Eliminar orden">
            <span class="material-symbols-outlined text-[15px]">delete</span>
          </button>
        </div>
      </td>
    `;
    tableBody.appendChild(tr);
  });

  const counterBadge = document.getElementById('ordersCounterBadge');
  if (counterBadge) counterBadge.textContent = `${visibleCount} orden${visibleCount === 1 ? '' : 'es'}`;
}

/* ==========================================================================
   7. MÓDULO INVENTARIO DE REPUESTOS (inventario.html)
   ========================================================================== */
function initInventarioModule() {
  renderInventoryTable();

  // Registrar Repuesto
  const formNewPart = document.getElementById('formNewPart') || document.querySelector('#newPartModal form');
  if (formNewPart) {
    formNewPart.onsubmit = (e) => {
      e.preventDefault();
      const sku = document.getElementById('newPartSku')?.value || `SKU-COL-${Date.now().toString().slice(-4)}`;
      const name = document.getElementById('newPartName')?.value || 'Componente IT Servidor';
      const category = document.getElementById('newPartCategory')?.value || 'storage';
      const price = document.getElementById('newPartPrice')?.value || '450.000 COP';
      const qty = parseInt(document.getElementById('newPartQty')?.value || '10', 10);
      const minQty = parseInt(document.getElementById('newPartMinQty')?.value || '5', 10);
      const rack = document.getElementById('newPartRack')?.value || 'Rack Central / Gav. 02';

      Store.addInventoryItem({
        sku,
        name,
        category,
        price,
        qty,
        minQty,
        rack
      });

      renderInventoryTable();
      formNewPart.reset();
      document.getElementById('newPartModal').classList.add('hidden');
      showToast(`Repuesto [${sku}] catalogado con éxito en el almacén.`, 'success', 'Inventario Actualizado');
    };
  }

  // Ajuste de Stock Rápido (tune)
  const formEditStock = document.getElementById('formEditStock');
  if (formEditStock) {
    formEditStock.onsubmit = (e) => {
      e.preventDefault();
      const sku = document.getElementById('adjustPartSku').value;
      const diff = parseInt(document.getElementById('adjustPartDiff').value || '0', 10);

      const updated = Store.adjustStock(sku, diff);
      renderInventoryTable();
      document.getElementById('editPartModal').classList.add('hidden');
      formEditStock.reset();
      showToast(`Stock de [${sku}] actualizado a ${updated.qty} unidades (${diff >= 0 ? '+' : ''}${diff}).`, 'success', 'Stock Modificado');
    };
  }

  // Editar Detalles de Repuesto
  const formEditPartDetails = document.getElementById('formEditPartDetails');
  if (formEditPartDetails) {
    formEditPartDetails.onsubmit = (e) => {
      e.preventDefault();
      const sku = document.getElementById('editPartSkuHidden').value;
      const name = document.getElementById('editPartNameInput').value.trim();
      const category = document.getElementById('editPartCategorySelect').value;
      const price = document.getElementById('editPartPriceInput').value.trim();
      const rack = document.getElementById('editPartRackInput').value.trim();

      Store.updateInventoryItem(sku, {
        name,
        category,
        categoryLabel: category === 'power' ? 'Fuentes de Poder' : category === 'ram' ? 'Memorias RAM' : category === 'sfp' ? 'Conectividad' : 'Almacenamiento',
        price,
        rack
      });

      renderInventoryTable();
      document.getElementById('editPartDetailsModal').classList.add('hidden');
      showToast(`Repuesto [${sku}] modificado con éxito.`, 'success', 'Repuesto Actualizado');
    };
  }

  // Delegación de clicks en la tabla de inventario
  document.addEventListener('click', (e) => {
    // Abrir Ajuste de Stock
    const btnAdjust = e.target.closest('.btn-adjust-stock');
    if (btnAdjust) {
      e.preventDefault();
      const sku = btnAdjust.getAttribute('data-sku');
      const item = Store.getInventory().find(i => i.sku === sku);
      if (item) {
        document.getElementById('adjustPartSku').value = item.sku;
        document.getElementById('adjustPartDisplay').textContent = `${item.sku} — ${item.name} (Stock Actual: ${item.qty} u.)`;
        document.getElementById('editPartModal').classList.remove('hidden');
      }
      return;
    }

    // Abrir Editar Detalles
    const btnEdit = e.target.closest('.btn-edit-part');
    if (btnEdit) {
      e.preventDefault();
      const sku = btnEdit.getAttribute('data-sku');
      const item = Store.getInventory().find(i => i.sku === sku);
      if (item) {
        document.getElementById('editPartSkuHidden').value = item.sku;
        document.getElementById('editPartSkuDisplay').value = item.sku;
        document.getElementById('editPartNameInput').value = item.name;
        document.getElementById('editPartCategorySelect').value = item.category || 'storage';
        document.getElementById('editPartPriceInput').value = item.priceFormatted || `${item.price} COP`;
        document.getElementById('editPartRackInput').value = item.rack;
        document.getElementById('editPartDetailsModal').classList.remove('hidden');
      }
      return;
    }

    // Eliminar Repuesto
    const btnDel = e.target.closest('.btn-delete-part');
    if (btnDel) {
      e.preventDefault();
      const sku = btnDel.getAttribute('data-sku');
      if (confirm(`¿Confirma que desea eliminar el repuesto SKU ${sku}?`)) {
        Store.deleteInventoryItem(sku);
        renderInventoryTable();
        showToast(`Repuesto ${sku} eliminado del almacén.`, 'info', 'Repuesto Eliminado');
      }
    }
  });
}

function renderInventoryTable() {
  const tableBody = document.querySelector('#inventoryTableContent tbody') || document.getElementById('inventoryTableBody');
  if (!tableBody) return;

  const items = Store.getInventory();
  const searchInput = document.getElementById('inventoryFilterSearch') || document.querySelector('input[placeholder*="Filtrar por SKU"]');
  const catSelect = document.getElementById('inventoryCategoryFilter') || Array.from(document.querySelectorAll('select')).find(sel => Array.from(sel.options).some(opt => opt.value === 'storage'));

  const query = (searchInput ? searchInput.value : '').toLowerCase().trim();
  const catFilter = (catSelect ? catSelect.value : 'all').toLowerCase();

  tableBody.innerHTML = '';

  let totalSkus = 0;
  let totalValueCop = 0;
  let criticalCount = 0;

  items.forEach(item => {
    totalSkus++;
    totalValueCop += (item.price || 0) * (item.qty || 0);
    if (item.qty <= 2) criticalCount++;

    const matchesSearch = !query || item.sku.toLowerCase().includes(query) || item.name.toLowerCase().includes(query) || item.rack.toLowerCase().includes(query);
    const matchesCat = catFilter === 'all' || (item.category || '').toLowerCase() === catFilter;

    if (!matchesSearch || !matchesCat) return;

    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-800/40 transition-colors animate-in fade-in';
    tr.setAttribute('data-category', item.category || 'storage');

    const isCritical = item.qty <= 2;
    const isLow = !isCritical && item.qty <= (item.minQty || 5);
    const stockColor = isCritical ? 'text-rose-400' : isLow ? 'text-amber-400' : 'text-emerald-400';
    const barColor = isCritical ? 'bg-rose-500' : isLow ? 'bg-amber-500' : 'bg-emerald-500';
    const barPercent = Math.min(100, Math.round((item.qty / ((item.minQty || 5) * 2)) * 100));

    const statusBadge = isCritical
      ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-mono bg-rose-500/15 text-rose-400 border border-rose-500/30 font-semibold">Crítico / Urgente</span>`
      : isLow
      ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/15 text-amber-400 border border-amber-500/30 font-semibold">Bajo / Reponer</span>`
      : `<span class="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold">Abastecido</span>`;

    tr.innerHTML = `
      <td class="py-3 px-4 font-mono font-bold text-brand-cyan">${item.sku}</td>
      <td class="py-3 px-4">
        <div class="font-semibold text-slate-200">${item.name}</div>
        <div class="text-[11px] text-slate-400">${item.desc}</div>
      </td>
      <td class="py-3 px-4">
        <span class="px-2 py-0.5 rounded-full text-[10px] font-mono bg-sky-500/10 text-sky-400 border border-sky-500/20">${item.categoryLabel || 'Infraestructura'}</span>
      </td>
      <td class="py-3 px-4">
        <div class="space-y-1">
          <div class="flex justify-between text-[10px]">
            <span class="${stockColor} font-bold font-mono">${item.qty} u. (${item.status})</span>
            <span class="text-slate-400 font-mono">Mín: ${item.minQty || 5}</span>
          </div>
          <div class="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div class="${barColor} h-full rounded-full" style="width: ${barPercent}%"></div>
          </div>
        </div>
      </td>
      <td class="py-3 px-4 font-mono font-semibold text-slate-200">${item.priceFormatted || '$' + item.price + ' COP'}</td>
      <td class="py-3 px-4 font-mono text-slate-300 text-[11px]">${item.rack}</td>
      <td class="py-3 px-4">${statusBadge}</td>
      <td class="py-3 px-4 text-right">
        <div class="inline-flex items-center gap-1">
          <button data-sku="${item.sku}" class="btn-adjust-stock btn-pro p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all" title="Ajustar Stock Rápido">
            <span class="material-symbols-outlined text-[15px]">tune</span>
          </button>
          <button data-sku="${item.sku}" class="btn-edit-part btn-pro p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all" title="Editar Repuesto">
            <span class="material-symbols-outlined text-[15px]">edit</span>
          </button>
          <button data-sku="${item.sku}" class="btn-delete-part btn-pro p-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition-all border border-rose-500/20" title="Eliminar Repuesto">
            <span class="material-symbols-outlined text-[15px]">delete</span>
          </button>
        </div>
      </td>
    `;
    tableBody.appendChild(tr);
  });

  // Actualizar Widgets de Métricas
  const totalSkuEl = document.querySelector('.font-display.text-sm.font-bold.text-white');
  if (totalSkuEl) totalSkuEl.textContent = totalSkus;

  const totalValueEl = document.querySelectorAll('.font-display.text-sm.font-bold.text-white')[1];
  if (totalValueEl) totalValueEl.innerHTML = `$${totalValueCop.toLocaleString('es-CO')} <span class="text-[9px] text-slate-400 font-mono font-normal">COP</span>`;

  const criticalEl = document.querySelector('.font-display.text-sm.font-bold.text-rose-400');
  if (criticalEl) criticalEl.textContent = `${criticalCount} Ítems`;
}

/* ==========================================================================
   8. MÓDULO TICKETS Y REQUERIMIENTOS (tickets.html)
   ========================================================================== */
function initTicketsModule() {
  renderTicketsTable();

  // Formulario Crear Ticket
  const formTicket = document.querySelector('form[data-validate="true"]');
  if (formTicket) {
    formTicket.onsubmit = (e) => {
      e.preventDefault();
      const selects = formTicket.querySelectorAll('select');
      const inputs = formTicket.querySelectorAll('input');
      const textarea = formTicket.querySelector('textarea');

      const type = selects[0] ? selects[0].value : 'hardware';
      const priority = selects[1] ? selects[1].value : 'p2';
      const clientEmail = inputs[0] ? inputs[0].value.trim() : 'usuario@empresa.com.co';
      const phone = inputs[1] ? inputs[1].value.trim() : '+57 310 123 4567';
      const hostname = inputs[2] ? inputs[2].value.trim() : 'SRV-HOST-01';
      const location = inputs[3] ? inputs[3].value.trim() : 'Datacenter Zona Franca';
      const diag = textarea ? textarea.value.trim() : 'Incidente técnico radicado.';

      const newTicket = Store.addTicket({
        clientEmail,
        phone,
        type,
        priority,
        hostname,
        location,
        diag
      });

      renderTicketsTable();
      formTicket.reset();
      showToast(`Ticket [${newTicket.id}] radicado con éxito en Mesa de Ayuda Colombia. Notificación enviada.`, 'success', 'Ticket Generado');
    };
  }

  // Formulario Editar Ticket
  const formEditTicket = document.getElementById('formEditTicket');
  if (formEditTicket) {
    formEditTicket.onsubmit = (e) => {
      e.preventDefault();
      const id = document.getElementById('editTicketId').value;
      const status = document.getElementById('editTicketStatusSelect').value;
      const priority = document.getElementById('editTicketPrioritySelect').value;
      const notes = document.getElementById('editTicketNotes').value.trim();

      Store.updateTicket(id, {
        status,
        priority,
        priorityLabel: priority === 'p1' ? 'P1 - Crítica (2h)' : priority === 'p2' ? 'P2 - Alta (4h)' : 'P3 - Media (8h)',
        diag: notes || undefined
      });

      renderTicketsTable();
      document.getElementById('editTicketModal').classList.add('hidden');
      showToast(`Ticket [${id}] actualizado a estado: ${status}.`, 'success', 'Ticket Actualizado');
    };
  }

  // Delegación de clicks en la tabla de tickets
  document.addEventListener('click', (e) => {
    // Editar Ticket
    const btnEdit = e.target.closest('.btn-edit-ticket');
    if (btnEdit) {
      e.preventDefault();
      const id = btnEdit.getAttribute('data-ticket-id');
      const ticket = Store.getTickets().find(t => t.id === id);
      if (ticket) {
        document.getElementById('editTicketId').value = ticket.id;
        document.getElementById('editTicketIdDisplay').value = `${ticket.id} • ${ticket.clientEmail}`;
        document.getElementById('editTicketStatusSelect').value = ticket.status || 'Abierto';
        document.getElementById('editTicketPrioritySelect').value = ticket.priority || 'p2';
        document.getElementById('editTicketNotes').value = ticket.diag || '';
        document.getElementById('editTicketModal').classList.remove('hidden');
      }
      return;
    }

    // Eliminar Ticket
    const btnDel = e.target.closest('.btn-delete-ticket');
    if (btnDel) {
      e.preventDefault();
      const id = btnDel.getAttribute('data-ticket-id');
      if (confirm(`¿Confirma que desea eliminar el ticket ${id}?`)) {
        Store.deleteTicket(id);
        renderTicketsTable();
        showToast(`Ticket ${id} eliminado del registro.`, 'info', 'Ticket Eliminado');
      }
    }
  });
}

function renderTicketsTable() {
  const tableBody = document.querySelector('#ticketsTableContent tbody');
  if (!tableBody) return;

  const tickets = Store.getTickets();
  const searchInput = document.getElementById('ticketsFilterSearch');
  const statusSelect = document.getElementById('ticketsStatusSelect');

  const query = (searchInput ? searchInput.value : '').toLowerCase().trim();
  const statusFilter = (statusSelect ? statusSelect.value : 'all').toLowerCase();

  tableBody.innerHTML = '';

  let visibleCount = 0;
  tickets.forEach(ticket => {
    const matchesSearch = !query || ticket.id.toLowerCase().includes(query) || ticket.clientEmail.toLowerCase().includes(query) || ticket.hostname.toLowerCase().includes(query) || ticket.location.toLowerCase().includes(query);
    const matchesStatus = statusFilter === 'all' || (ticket.status || '').toLowerCase() === statusFilter;

    if (!matchesSearch || !matchesStatus) return;
    visibleCount++;

    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-800/40 transition-colors animate-in fade-in';

    const priorityBadge = ticket.priority === 'p1'
      ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-mono bg-rose-500/15 text-rose-400 border border-rose-500/30 font-semibold">${ticket.priorityLabel || 'P1 - Crítica'}</span>`
      : `<span class="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/15 text-amber-400 border border-amber-500/30 font-semibold">${ticket.priorityLabel || 'P2 - Alta'}</span>`;

    const statusBadge = ticket.status === 'Resuelto'
      ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold">Resuelto</span>`
      : ticket.status === 'En Proceso'
      ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/15 text-amber-400 border border-amber-500/30 font-semibold">En Proceso</span>`
      : `<span class="px-2 py-0.5 rounded-full text-[10px] font-mono bg-sky-500/15 text-sky-400 border border-sky-500/30 font-semibold">Abierto</span>`;

    tr.innerHTML = `
      <td class="py-3 px-4 font-mono font-bold text-brand-cyan">${ticket.id}</td>
      <td class="py-3 px-4">
        <div class="font-semibold text-slate-200">${ticket.clientEmail}</div>
        <div class="text-[10px] font-mono text-slate-400">${ticket.phone || '+57 Colombia'}</div>
      </td>
      <td class="py-3 px-4">
        <div class="font-semibold text-slate-200">${ticket.typeLabel}</div>
        <div class="text-[10px] font-mono text-brand-electric">${ticket.hostname}</div>
      </td>
      <td class="py-3 px-4 text-slate-300">${ticket.location}</td>
      <td class="py-3 px-4">${priorityBadge}</td>
      <td class="py-3 px-4">${statusBadge}</td>
      <td class="py-3 px-4 text-right">
        <div class="inline-flex items-center gap-1">
          <button data-ticket-id="${ticket.id}" class="btn-edit-ticket btn-pro p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all" title="Editar estado ticket">
            <span class="material-symbols-outlined text-[15px]">edit</span>
          </button>
          <button data-ticket-id="${ticket.id}" class="btn-delete-ticket btn-pro p-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition-all border border-rose-500/20" title="Eliminar ticket">
            <span class="material-symbols-outlined text-[15px]">delete</span>
          </button>
        </div>
      </td>
    `;
    tableBody.appendChild(tr);
  });

  const counterBadge = document.getElementById('ticketsCounterBadge');
  if (counterBadge) counterBadge.textContent = `${visibleCount} ticket${visibleCount === 1 ? '' : 's'} activo${visibleCount === 1 ? '' : 's'}`;
}

/* ==========================================================================
   9. MÓDULO DIRECTORIO CORPORATIVO DE CLIENTES (clientes.html)
   ========================================================================== */
function initClientesModule() {
  renderClientsTable();

  // Registrar Cliente Form
  const formNewClient = document.getElementById('formNewClient') || document.querySelector('#newClientModal form');
  if (formNewClient) {
    formNewClient.onsubmit = (e) => {
      e.preventDefault();
      const name = document.getElementById('newClientName')?.value.trim() || 'Empresa Colombia S.A.S.';
      const nit = document.getElementById('newClientNit')?.value.trim() || '901.890.123-4';
      const contract = document.getElementById('newClientSla')?.value || 'Platinum SLA 99.98% (2h 24/7)';
      const email = document.getElementById('newClientEmail')?.value.trim() || 'tecnologia@empresa.com.co';
      const phone = document.getElementById('newClientPhone')?.value.trim() || '+57 315 892 4410';
      const sedes = document.getElementById('newClientSede')?.value.trim() || 'Bogotá D.C. • Datacenter Corporativo';
      const servers = document.getElementById('newClientServers')?.value.trim() || '16 Servidores Core';

      Store.addClient({
        name,
        nit,
        contract,
        email,
        phone,
        sedes,
        servers
      });

      renderClientsTable();
      formNewClient.reset();
      document.getElementById('newClientModal').classList.add('hidden');
      showToast(`Cliente corporativo [${name}] registrado exitosamente con contrato SLA.`, 'success', 'Cliente Agregado');
    };
  }

  // Editar Cliente Form
  const formEditClient = document.getElementById('formEditClient');
  if (formEditClient) {
    formEditClient.onsubmit = (e) => {
      e.preventDefault();
      const id = document.getElementById('editClientId').value;
      const name = document.getElementById('editClientName').value.trim();
      const contract = document.getElementById('editClientSla').value;
      const sedes = document.getElementById('editClientSedes').value.trim();
      const servers = document.getElementById('editClientServers').value.trim();
      const status = document.getElementById('editClientStatus').value;
      const phone = document.getElementById('editClientPhone').value.trim();

      Store.updateClient(id, {
        name,
        contract,
        sedes,
        servers,
        status,
        phone
      });

      renderClientsTable();
      document.getElementById('editClientModal').classList.add('hidden');
      showToast(`Información corporativa de [${name}] actualizada.`, 'success', 'Cliente Actualizado');
    };
  }

  // Delegación de clicks en la tabla de clientes
  document.addEventListener('click', (e) => {
    // Ver SLA Modal
    const btnSla = e.target.closest('.btn-client-sla');
    if (btnSla) {
      e.preventDefault();
      const clientId = btnSla.getAttribute('data-client-id');
      const client = Store.getClients().find(c => c.id === clientId || c.nit === clientId);
      if (client) {
        document.getElementById('modalSlaClientName').textContent = client.name;
        document.getElementById('modalSlaNit').textContent = `NIT: ${client.nit}`;
        document.getElementById('modalSlaTier').textContent = client.contract;
        document.getElementById('modalSlaSedes').textContent = client.sedes;
        document.getElementById('modalSlaServers').textContent = client.servers;
        document.getElementById('slaDetailModal').classList.remove('hidden');
      }
      return;
    }

    // Editar Cliente
    const btnEdit = e.target.closest('.btn-edit-client');
    if (btnEdit) {
      e.preventDefault();
      const clientId = btnEdit.getAttribute('data-client-id');
      const client = Store.getClients().find(c => c.id === clientId || c.nit === clientId);
      if (client) {
        document.getElementById('editClientId').value = client.id;
        document.getElementById('editClientName').value = client.name;
        document.getElementById('editClientNit').value = client.nit;
        document.getElementById('editClientSla').value = client.contract;
        document.getElementById('editClientSedes').value = client.sedes;
        document.getElementById('editClientServers').value = client.servers;
        document.getElementById('editClientStatus').value = client.status || 'Activo';
        document.getElementById('editClientPhone').value = client.phone || '+57 (601) 745-0000';
        document.getElementById('editClientModal').classList.remove('hidden');
      }
      return;
    }

    // Eliminar Cliente
    const btnDel = e.target.closest('.btn-delete-client');
    if (btnDel) {
      e.preventDefault();
      const clientId = btnDel.getAttribute('data-client-id');
      const client = Store.getClients().find(c => c.id === clientId || c.nit === clientId);
      if (client && confirm(`¿Confirma que desea eliminar la cuenta corporativa de ${client.name}?`)) {
        Store.deleteClient(client.id);
        renderClientsTable();
        showToast(`Cliente ${client.name} eliminado del directorio.`, 'info', 'Cliente Eliminado');
      }
    }
  });
}

function renderClientsTable() {
  const tableBody = document.querySelector('#clientsTableContent tbody');
  if (!tableBody) return;

  const clients = Store.getClients();
  const searchInput = document.querySelector('input[placeholder*="Filtrar por empresa"]');
  const query = (searchInput ? searchInput.value : '').toLowerCase().trim();

  tableBody.innerHTML = '';

  clients.forEach(client => {
    if (query && !client.name.toLowerCase().includes(query) && !client.nit.toLowerCase().includes(query) && !client.sedes.toLowerCase().includes(query)) {
      return;
    }

    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-800/40 transition-colors animate-in fade-in';

    tr.innerHTML = `
      <td class="py-3 px-4">
        <div class="flex items-center gap-2.5">
          <div class="w-7 h-7 rounded-lg ${client.colorClass || 'text-brand-cyan bg-sky-500/10 border-sky-500/20'} border flex items-center justify-center font-display font-bold text-xs shrink-0">
            ${client.initials || 'CO'}
          </div>
          <div>
            <div class="font-semibold text-slate-200">${client.name}</div>
            <div class="text-[10px] font-mono text-slate-400">NIT: ${client.nit}</div>
          </div>
        </div>
      </td>
      <td class="py-3 px-4 text-slate-300">${client.sedes}</td>
      <td class="py-3 px-4 font-mono text-slate-300">${client.servers}</td>
      <td class="py-3 px-4">
        <span class="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">${client.contract}</span>
      </td>
      <td class="py-3 px-4">
        <span class="px-2 py-0.5 rounded-full text-[10px] font-mono ${client.status === 'Activo' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}">${client.status || 'Activo'}</span>
      </td>
      <td class="py-3 px-4 text-right">
        <div class="inline-flex items-center gap-1">
          <button data-client-id="${client.id}" class="btn-client-sla btn-pro px-2.5 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-brand-cyan border border-sky-500/30 text-[11px] font-semibold flex items-center gap-1" title="Ver Contrato y Sedes SLA">
            <span class="material-symbols-outlined text-[14px]">contract</span>
            <span>Ver SLA</span>
          </button>
          <button data-client-id="${client.id}" class="btn-edit-client btn-pro p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all" title="Editar cliente">
            <span class="material-symbols-outlined text-[15px]">edit</span>
          </button>
          <button data-client-id="${client.id}" class="btn-delete-client btn-pro p-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition-all border border-rose-500/20" title="Eliminar cliente">
            <span class="material-symbols-outlined text-[15px]">delete</span>
          </button>
        </div>
      </td>
    `;
    tableBody.appendChild(tr);
  });
}

/* ==========================================================================
   10. UTILIDADES GLOBALES (THEME, NAV, BUSCADOR, VALIDACIONES, TOASTS)
   ========================================================================== */
export function showToast(message, type = 'success', title = '') {
  let toastContainer = document.getElementById('toastContainer');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toastContainer';
    toastContainer.className = 'fixed top-5 right-5 z-[100] flex flex-col gap-2.5 max-w-sm pointer-events-none';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  toast.className = `pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl backdrop-blur-2xl border shadow-2xl transition-all duration-300 transform -translate-y-4 opacity-0 animate-in fade-in slide-in-from-top-3 ${
    type === 'success' 
      ? 'bg-[#1C2541]/95 border-emerald-500/40 text-slate-100 shadow-emerald-500/10' 
      : type === 'error'
      ? 'bg-[#1C2541]/95 border-rose-500/40 text-slate-100 shadow-rose-500/10'
      : 'bg-[#1C2541]/95 border-sky-500/40 text-slate-100 shadow-sky-500/10'
  }`;

  const iconName = type === 'success' ? 'check_circle' : type === 'error' ? 'error' : 'info';
  const iconColor = type === 'success' ? 'text-emerald-400' : type === 'error' ? 'text-rose-400' : 'text-brand-cyan';
  const defaultTitle = type === 'success' ? 'Operación Exitosa' : type === 'error' ? 'Aviso' : 'Notificación';

  toast.innerHTML = `
    <span class="material-symbols-outlined ${iconColor} text-[20px] shrink-0 mt-0.5">${iconName}</span>
    <div class="flex flex-col flex-1 min-w-0">
      <span class="font-display font-bold text-xs ${iconColor}">${title || defaultTitle}</span>
      <span class="text-xs text-slate-300 mt-0.5 leading-relaxed truncate">${message}</span>
    </div>
    <button class="text-slate-400 hover:text-white p-0.5 rounded-lg transition-colors" onclick="this.parentElement.remove()">
      <span class="material-symbols-outlined text-[14px]">close</span>
    </button>
  `;

  toastContainer.appendChild(toast);
  requestAnimationFrame(() => toast.classList.remove('-translate-y-4', 'opacity-0'));

  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-x-6');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}
window.showToast = showToast;

function initTheme() {
  const root = document.documentElement;
  const storedTheme = localStorage.getItem('it_seobiseu_theme');
  const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
  const initialTheme = storedTheme || (prefersLight ? 'light' : 'dark');

  root.classList.toggle('dark', initialTheme === 'dark');
  root.style.colorScheme = initialTheme;

  const header = document.getElementById('mainHeader');
  const notification = document.getElementById('notifToggleBtn');

  const themeButton = document.createElement('button');
  themeButton.type = 'button';
  themeButton.id = 'themeToggleBtn';
  themeButton.className = 'theme-toggle p-2 text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-xl border border-transparent hover:border-slate-700/60 transition-all btn-pro';
  themeButton.setAttribute('aria-label', 'Cambiar a modo claro');
  themeButton.title = 'Cambiar tema';
  if (header && notification) {
    notification.parentElement.before(themeButton);
  } else {
    themeButton.classList.add('fixed', 'top-4', 'right-4', 'z-50', 'bg-[#1C2541]/90', 'backdrop-blur-xl');
    document.body.appendChild(themeButton);
  }

  const updateThemeButton = () => {
    const isDark = root.classList.contains('dark');
    themeButton.innerHTML = `<span class="material-symbols-outlined text-[20px]">${isDark ? 'light_mode' : 'dark_mode'}</span>`;
    themeButton.setAttribute('aria-label', isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
  };

  themeButton.onclick = () => {
    const nextTheme = root.classList.contains('dark') ? 'light' : 'dark';
    root.classList.toggle('dark', nextTheme === 'dark');
    root.style.colorScheme = nextTheme;
    localStorage.setItem('it_seobiseu_theme', nextTheme);
    updateThemeButton();
  };

  updateThemeButton();
}

function initCurrentNavigation() {
  const currentPage = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
  document.querySelectorAll('#mainSidebar nav a[href]').forEach((link) => {
    const linkPage = link.getAttribute('href').split('/').pop().toLowerCase();
    if (linkPage === currentPage) {
      link.setAttribute('aria-current', 'page');
    }
  });
}

function initSidebar() {
  const sidebar = document.getElementById('mainSidebar');
  const collapseBtn = document.getElementById('sidebarCollapseBtn');
  const mainContent = document.getElementById('mainContentWrapper');
  const header = document.getElementById('mainHeader');
  const brandFull = document.getElementById('brandLogoFull');
  const brandShort = document.getElementById('brandLogoShort');
  const navTextElements = document.querySelectorAll('.nav-label');
  const navBadges = document.querySelectorAll('.nav-badge');
  const telemetryWidget = document.getElementById('sidebarTelemetryWidget');
  const navSectionTitles = document.querySelectorAll('.nav-section-title');

  let isCollapsed = false;

  if (collapseBtn && sidebar) {
    collapseBtn.onclick = () => {
      isCollapsed = !isCollapsed;
      if (isCollapsed) {
        sidebar.classList.remove('w-64');
        sidebar.classList.add('w-20');
        if (mainContent) { mainContent.classList.remove('pl-64'); mainContent.classList.add('pl-20'); }
        if (header) { header.classList.remove('left-64'); header.classList.add('left-20'); }
        if (brandFull) brandFull.classList.add('hidden');
        if (brandShort) brandShort.classList.remove('hidden');
        if (telemetryWidget) telemetryWidget.classList.add('hidden');
        navTextElements.forEach(el => el.classList.add('hidden'));
        navBadges.forEach(el => el.classList.add('hidden'));
        navSectionTitles.forEach(el => el.classList.add('hidden'));
      } else {
        sidebar.classList.remove('w-20');
        sidebar.classList.add('w-64');
        if (mainContent) { mainContent.classList.remove('pl-20'); mainContent.classList.add('pl-64'); }
        if (header) { header.classList.remove('left-20'); header.classList.add('left-64'); }
        if (brandFull) brandFull.classList.remove('hidden');
        if (brandShort) brandShort.classList.add('hidden');
        if (telemetryWidget) telemetryWidget.classList.remove('hidden');
        navTextElements.forEach(el => el.classList.remove('hidden'));
        navBadges.forEach(el => el.classList.remove('hidden'));
        navSectionTitles.forEach(el => el.classList.remove('hidden'));
      }
    };
  }
}

function initSearch() {
  const searchInputs = document.querySelectorAll('.global-search-input');
  const searchModal = document.getElementById('searchModal');
  const searchModalInput = document.getElementById('searchModalInput');
  const closeSearchModal = document.getElementById('closeSearchModal');

  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (searchModal) {
        searchModal.classList.remove('hidden');
        if (searchModalInput) setTimeout(() => searchModalInput.focus(), 50);
      }
    }
  });

  searchInputs.forEach(input => {
    input.onclick = () => {
      if (searchModal) {
        searchModal.classList.remove('hidden');
        if (searchModalInput) setTimeout(() => searchModalInput.focus(), 50);
      }
    };
  });

  if (closeSearchModal && searchModal) {
    closeSearchModal.onclick = () => searchModal.classList.add('hidden');
  }
}

function initFormValidations() {
  const forms = document.querySelectorAll('form[data-validate="true"]');
  forms.forEach(form => {
    if (form.hasAttribute('data-auth-form')) return;
    form.querySelectorAll('input, select, textarea').forEach(input => {
      input.addEventListener('input', () => {
        input.classList.remove('border-rose-500', 'bg-rose-500/10');
      });
    });
  });
}

function initRealtimeFilters() {
  // Filtro de Órdenes
  const orderSearch = document.getElementById('ordersFilterSearch');
  const orderStatus = document.getElementById('ordersStatusSelect');
  if (orderSearch) orderSearch.addEventListener('input', () => renderOrdersTable());
  if (orderStatus) orderStatus.addEventListener('change', () => renderOrdersTable());

  // Filtro de Inventario
  const invSearch = document.getElementById('inventoryFilterSearch') || document.querySelector('input[placeholder*="Filtrar por SKU"]');
  const allSelects = Array.from(document.querySelectorAll('select'));
  const invCategory = document.getElementById('inventoryCategoryFilter') || allSelects.find(sel => Array.from(sel.options).some(opt => opt.value === 'storage'));
  if (invSearch) invSearch.addEventListener('input', () => renderInventoryTable());
  if (invCategory) invCategory.addEventListener('change', () => renderInventoryTable());

  // Filtro de Clientes
  const clientSearch = document.getElementById('clientsFilterSearch') || document.querySelector('input[placeholder*="Filtrar por empresa"]');
  if (clientSearch) clientSearch.addEventListener('input', () => renderClientsTable());

  // Filtro de Tickets
  const ticketSearch = document.getElementById('ticketsFilterSearch');
  const ticketStatus = document.getElementById('ticketsStatusSelect');
  if (ticketSearch) ticketSearch.addEventListener('input', () => renderTicketsTable());
  if (ticketStatus) ticketStatus.addEventListener('change', () => renderTicketsTable());
}

function initSkeletonSimulators() {
  const refreshBtns = [
    { btn: 'btnRefreshOrders', skeleton: 'ordersSkeletonLoader', content: 'ordersTableContent', fn: renderOrdersTable },
    { btn: 'btnRefreshClients', skeleton: 'clientsSkeletonLoader', content: 'clientsTableContent', fn: renderClientsTable },
    { btn: 'btnRefreshInventory', skeleton: 'inventorySkeletonLoader', content: 'inventoryTableContent', fn: renderInventoryTable },
    { btn: 'btnRefreshTickets', skeleton: 'ticketsSkeletonLoader', content: 'ticketsTableContent', fn: renderTicketsTable }
  ];

  refreshBtns.forEach(({ btn, skeleton, content, fn }) => {
    const btnEl = document.getElementById(btn);
    const skEl = document.getElementById(skeleton);
    const ctEl = document.getElementById(content);

    if (btnEl && skEl && ctEl) {
      btnEl.onclick = () => {
        ctEl.classList.add('hidden');
        skEl.classList.remove('hidden');
        setTimeout(() => {
          if (fn) fn();
          skEl.classList.add('hidden');
          ctEl.classList.remove('hidden');
          showToast('Sincronización en vivo con Datacenter Colombia.', 'info', 'Actualizado');
        }, 500);
      };
    }
  });
}

function initQuickStats() {
  const latencyBadge = document.getElementById('telemetryLatency');
  if (latencyBadge) {
    setInterval(() => {
      const randomLatency = Math.floor(Math.random() * 4) + 8;
      latencyBadge.textContent = `Latencia ${randomLatency}ms • Bogotá NOC`;
    }, 4000);
  }
}
