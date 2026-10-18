/**
 * IT seobiseu - API Client Service (FastAPI v1 Integration)
 * Base URL: http://localhost:8000/api/v1
 */

// Paso 1: Definicion de URL base del backend y constantes de almacenamiento local
const API_BASE_URL = (window.IT_SEOBISEU_API_URL || 'http://localhost:8000') + '/api/v1';

// Claves para el token de sesion y datos de usuario en localStorage
const TOKEN_KEY = 'it_seobiseu_token';
const USER_KEY = 'it_seobiseu_user';

// Paso 2: Constructor de cabeceras HTTP con inyeccion de token Bearer JWT
function getHeaders(isJson = true) {
  const headers = {};
  if (isJson) {
    headers['Content-Type'] = 'application/json';
  }
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// Paso 3: Despachador generico de peticiones Fetch con interceptor de errores HTTP
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const defaultHeaders = getHeaders(options.body && !(options.body instanceof FormData));

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);

    // Deteccion de no autorizado (401) para limpiar credenciales
    if (response.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      console.warn('[IT seobiseu API] Sesion expirada o no autorizada (401).');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.detail || errorData.message || `Error HTTP: ${response.status} ${response.statusText}`;
      throw new Error(errorMessage);
    }

    if (response.status === 204) {
      return true;
    }

    return await response.json();
  } catch (error) {
    console.error(`[IT seobiseu API Error] Endpoint: ${endpoint}`, error);
    throw error;
  }
}

// Paso 4: Diccionario de cuentas de respaldo para ejecucion en GitHub Pages
export const DEMO_ACCOUNTS = {
  'admin@it-seobiseu.local': {
    password: 'Admin123!',
    user: { id: 1, nombre: 'Carlos Mendoza', email: 'admin@it-seobiseu.local', rol: 'ADMINISTRADOR', cargo: 'SuperAdmin IT', sede: 'Bogotá • Datacenter Zona Franca' }
  },
  'supervisor@it-seobiseu.local': {
    password: 'Supervisor123!',
    user: { id: 2, nombre: 'Ing. Sofía Reyes', email: 'supervisor@it-seobiseu.local', rol: 'SUPERVISOR', cargo: 'Líder Operaciones NOC', sede: 'Bogotá • Sede Chicó Calle 100' }
  },
  'tecnico@it-seobiseu.local': {
    password: 'Tecnico123!',
    user: { id: 3, nombre: 'Téc. Marco Silva', email: 'tecnico@it-seobiseu.local', rol: 'TECNICO', cargo: 'Especialista Hardware & Servidores', sede: 'Cundinamarca • Datacenter Tocancipá' }
  },
  'cliente@it-seobiseu.local': {
    password: 'Cliente123!',
    user: { id: 4, nombre: 'Dra. Elena Vásquez', email: 'cliente@it-seobiseu.local', rol: 'CLIENTE', cargo: 'Gerente IT Bancolombia', sede: 'Medellín / Bogotá • Torre Empresarial' }
  }
};

// Paso 5: Servicio de Autenticacion y control de sesion activa
/* ==========================================================================
   1. AUTHENTICATION SERVICE
   ========================================================================== */
export const AuthService = {
  /**
   * Login user and store JWT token in localStorage
   * Supports live FastAPI backend and instant local demo fallback
   */
  async login(email, password) {
    const cleanEmail = (email || '').trim().toLowerCase();
    
    try {
      const data = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: cleanEmail, password }),
      });

      if (data.access_token || data.token) {
        const token = data.access_token || data.token;
        localStorage.setItem(TOKEN_KEY, token);
        if (data.user) {
          localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        }
        return data;
      }
    } catch (apiError) {
      console.warn('[IT seobiseu] Backend remoto no disponible o con error, validando cuentas demo:', apiError.message);
      
      const demoAccount = DEMO_ACCOUNTS[cleanEmail];
      if (demoAccount && demoAccount.password === password) {
        const mockToken = 'demo_session_' + cleanEmail + '_' + Date.now();
        localStorage.setItem(TOKEN_KEY, mockToken);
        localStorage.setItem(USER_KEY, JSON.stringify(demoAccount.user));
        return {
          access_token: mockToken,
          token_type: 'bearer',
          user: demoAccount.user,
          is_demo: true
        };
      }
      
      throw new Error(apiError.message.includes('HTTP') ? apiError.message : 'Credenciales inválidas. Verifique correo y contraseña.');
    }
  },

  /**
   * Remove token and clear local session
   */
  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    window.location.href = 'login.html';
  },

  /**
   * Check if user is currently authenticated
   */
  isAuthenticated() {
    return !!localStorage.getItem(TOKEN_KEY);
  },

  /**
   * Get stored JWT token
   */
  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },

  /**
   * Get stored user profile object
   */
  getCurrentUser() {
    const userStr = localStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }
};

/* ==========================================================================
   2. ÓRDENES DE TRABAJO (WORK ORDERS) CRUD
   ========================================================================== */
export const OrdenesService = {
  /**
   * Get all work orders with optional filtering and pagination
   * @param {Object} params { status, priority, search, page, limit }
   */
  async getOrdenes(params = {}) {
    const query = new URLSearchParams(params).toString();
    const endpoint = query ? `/ordenes?${query}` : '/ordenes';
    return await request(endpoint, { method: 'GET' });
  },

  /**
   * Get single work order by ID
   * @param {string|number} id 
   */
  async getOrdenById(id) {
    return await request(`/ordenes/${id}`, { method: 'GET' });
  },

  /**
   * Create new work order
   * @param {Object} ordenData { cliente, equipo, serie, prioridad, tecnico_id, diagnostico, sla_horas }
   */
  async createOrden(ordenData) {
    return await request('/ordenes', {
      method: 'POST',
      body: JSON.stringify(ordenData),
    });
  },

  /**
   * Update existing work order (Status, notes, assigned tech)
   * @param {string|number} id 
   * @param {Object} ordenData 
   */
  async updateOrden(id, ordenData) {
    return await request(`/ordenes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(ordenData),
    });
  },

  /**
   * Delete or archive work order
   * @param {string|number} id 
   */
  async deleteOrden(id) {
    return await request(`/ordenes/${id}`, { method: 'DELETE' });
  },

  /**
   * Add technical log note (Work Log bitácora) to order
   * @param {string|number} id 
   * @param {Object} logData { nota, porcentaje_rebuild, tecnico }
   */
  async addWorkLog(id, logData) {
    return await request(`/ordenes/${id}/logs`, {
      method: 'POST',
      body: JSON.stringify(logData),
    });
  }
};

/* ==========================================================================
   3. INVENTARIO DE REPUESTOS Y COMPONENTES (WAREHOUSE TELEMETRY)
   ========================================================================== */
export const InventarioService = {
  /**
   * Get inventory items catalog with optional category and stock filters
   * @param {Object} params { categoria, stock_bajo, search }
   */
  async getInventario(params = {}) {
    const query = new URLSearchParams(params).toString();
    const endpoint = query ? `/inventario?${query}` : '/inventario';
    return await request(endpoint, { method: 'GET' });
  },

  /**
   * Get single spare part details by SKU or ID
   * @param {string} sku 
   */
  async getRepuestoBySku(sku) {
    return await request(`/inventario/${sku}`, { method: 'GET' });
  },

  /**
   * Register new spare part item
   * @param {Object} itemData { sku, nombre, categoria, stock, stock_minimo, precio_unitario, rack_ubicacion, proveedor }
   */
  async createRepuesto(itemData) {
    return await request('/inventario', {
      method: 'POST',
      body: JSON.stringify(itemData),
    });
  },

  /**
   * Update spare part details
   * @param {string} sku 
   * @param {Object} itemData 
   */
  async updateRepuesto(sku, itemData) {
    return await request(`/inventario/${sku}`, {
      method: 'PUT',
      body: JSON.stringify(itemData),
    });
  },

  /**
   * Quick adjust stock quantity (Ingreso / Salida / Auditoría)
   * @param {string} sku 
   * @param {number} cantidadDiferencia 
   * @param {string} motivo 
   */
  async adjustStock(sku, cantidadDiferencia, motivo) {
    return await request(`/inventario/${sku}/ajuste-stock`, {
      method: 'POST',
      body: JSON.stringify({ cantidad: cantidadDiferencia, motivo }),
    });
  },

  /**
   * Delete or decommission SKU
   * @param {string} sku 
   */
  async deleteRepuesto(sku) {
    return await request(`/inventario/${sku}`, { method: 'DELETE' });
  }
};

/* ==========================================================================
   4. SOLICITUDES Y TICKETS DE SOPORTE (INCIDENT INTAKE)
   ========================================================================== */
export const TicketsService = {
  /**
   * Get tickets list
   * @param {Object} params { prioridad, estado, search }
   */
  async getTickets(params = {}) {
    const query = new URLSearchParams(params).toString();
    const endpoint = query ? `/tickets?${query}` : '/tickets';
    return await request(endpoint, { method: 'GET' });
  },

  /**
   * Create new support ticket / incident intake
   * @param {Object} ticketData { tipo_requerimiento, prioridad_sla, correo_contacto, telefono, serial_equipo, datacenter_ubicacion, descripcion }
   */
  async createTicket(ticketData) {
    return await request('/tickets', {
      method: 'POST',
      body: JSON.stringify(ticketData),
    });
  },

  /**
   * Update ticket status or escalate
   * @param {string|number} id 
   * @param {Object} ticketData 
   */
  async updateTicket(id, ticketData) {
    return await request(`/tickets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(ticketData),
    });
  }
};

/* ==========================================================================
   5. CLIENTES & TELEMETRÍA GLOBAL
   ========================================================================== */
export const ClientesService = {
  async getClientes(params = {}) {
    const query = new URLSearchParams(params).toString();
    const endpoint = query ? `/clientes?${query}` : '/clientes';
    return await request(endpoint, { method: 'GET' });
  },

  async createCliente(clienteData) {
    return await request('/clientes', {
      method: 'POST',
      body: JSON.stringify(clienteData),
    });
  }
};

export const TelemetriaService = {
  /**
   * Get real-time cockpit metrics (Disponibilidad, Latencia, Órdenes activas, Racks)
   */
  async getMetrics() {
    return await request('/telemetria/resumen', { method: 'GET' });
  }
};

// Default export grouping all services
export default {
  Auth: AuthService,
  Ordenes: OrdenesService,
  Inventario: InventarioService,
  Tickets: TicketsService,
  Clientes: ClientesService,
  Telemetria: TelemetriaService,
};
