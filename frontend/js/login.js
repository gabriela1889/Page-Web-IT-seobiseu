/**
 * IT seobiseu - Controlador del Portal de Acceso y Gestion de Sesion
 * Proyecto de Ingenieria de Sistemas
 */

import { AuthService, DEMO_ACCOUNTS } from './api.js';
import { showToast } from './app.js';

// Paso 1: Diccionario de credenciales por rol para el entorno de pruebas
const CREDENTIALS = {
  admin: { email: 'admin@it-seobiseu.local', pass: 'Admin123!' },
  supervisor: { email: 'supervisor@it-seobiseu.local', pass: 'Supervisor123!' },
  tecnico: { email: 'tecnico@it-seobiseu.local', pass: 'Tecnico123!' },
  cliente: { email: 'cliente@it-seobiseu.local', pass: 'Cliente123!' },
};

function initLogin() {
  const form = document.querySelector('[data-auth-form]');
  const roleButtons = document.querySelectorAll('[data-role-demo]');
  const currentUser = AuthService.getCurrentUser();

  // Paso 2: Verificacion de sesion activa previa
  if (currentUser && AuthService.isAuthenticated()) {
    showActiveSessionBanner(currentUser);
  }

  // Paso 3: Asignacion automatica de credenciales mediante botones de rol demo
  roleButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const roleKey = btn.getAttribute('data-role-demo');
      const creds = CREDENTIALS[roleKey];
      if (!creds || !form) return;

      form.elements.email.value = creds.email;
      form.elements.password.value = creds.pass;

      roleButtons.forEach((b) => b.classList.remove('ring-2', 'ring-brand-cyan', 'bg-sky-500/20'));
      btn.classList.add('ring-2', 'ring-brand-cyan', 'bg-sky-500/20');

      showToast(`Credenciales cargadas para ${roleKey.toUpperCase()}`, 'info', 'Acceso Rapido');
      
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.focus();
    });
  });

  // Paso 4: Captura del submit, validacion de entradas y envio a autenticacion
  if (form) {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const email = form.elements.email.value.trim();
      const password = form.elements.password.value;
      const submitBtn = form.querySelector('button[type="submit"]');

      if (!email || !password) {
        showToast('Ingrese su correo corporativo y contrasena.', 'error', 'Campos Incompletos');
        return;
      }

      const originalHtml = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = `
        <span class="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span>
        <span>Autenticando...</span>
      `;

      // Paso 5: Peticion de autenticacion al servicio central y redireccion
      try {
        const result = await AuthService.login(email, password);
        const user = result.user || AuthService.getCurrentUser() || { nombre: 'Usuario', rol: 'OPERADOR' };
        
        showToast(`Bienvenido, ${user.nombre} (${user.rol})`, 'success', 'Acceso Concedido');
        
        window.setTimeout(() => {
          window.location.href = 'index.html';
        }, 600);
      } catch (error) {
        showToast(error.message || 'No fue posible iniciar sesion.', 'error', 'Acceso Rechazado');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalHtml;
      }
    });
  }
}

// Paso 6: Arranque seguro del script considerando el estado de carga del DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLogin);
} else {
  initLogin();
}

// Paso 7: Renderizado del indicador de sesion activa persistente
function showActiveSessionBanner(user) {
  const container = document.querySelector('.max-w-sm');
  if (!container) return;

  const banner = document.createElement('div');
  banner.className = 'mb-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs';
  banner.innerHTML = `
    <div class="flex items-center gap-2">
      <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
      <span class="text-slate-200">Sesion activa: <strong class="text-emerald-400">${user.nombre}</strong> (${user.rol})</span>
    </div>
    <a href="index.html" class="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-bold text-[11px] transition-all">
      Ir al Dashboard
    </a>
  `;
  container.prepend(banner);
}
