/**
 * IT seobiseu — Enterprise Reactive Data Store (Colombia Edition)
 * Persistencia en localStorage con reactividad instantánea para GitHub Pages.
 * Permite Agregar, Editar, Enlistar y Eliminar en todas las entidades:
 * - Órdenes de Trabajo (Orders)
 * - Inventario de Repuestos (Inventory)
 * - Clientes y Sedes SLA (Clients)
 * - Solicitudes y Tickets (Tickets)
 */

const STORAGE_KEYS = {
  ORDERS: 'it_seobiseu_orders',
  INVENTORY: 'it_seobiseu_inventory',
  CLIENTS: 'it_seobiseu_clients',
  TICKETS: 'it_seobiseu_tickets'
};

const SEED_DATA = {
  orders: [
    {
      id: '#OT-2045',
      client: 'Bancolombia S.A.',
      sede: 'Datacenter Tocancipá • Rack A-04',
      device: 'Servidor Dell PowerEdge R740 (2U)',
      serial: 'SN: 8HG9-Q29-DELL',
      diag: 'Alerta en fuente redundante #2 (PSU 750W). Reemplazo en caliente y verificación iDRAC9.',
      tech: 'Téc. Marco Silva',
      techInitials: 'MS',
      techRole: 'Hardware & Servidores - Tocancipá',
      priority: 'p1',
      priorityLabel: 'Crítica (2h)',
      status: 'proceso',
      statusLabel: 'En Diagnóstico / Triage',
      slaTime: '32m restantes',
      slaTimeOk: false,
      slaSigned: false,
      createdAt: '2026-10-18 09:15'
    },
    {
      id: '#OT-2044',
      client: 'Ecopetrol S.A.',
      sede: 'Bogotá Sede Principal Cra 13 • Piso 7',
      device: 'Switch Cisco Catalyst 9300 (48P PoE+)',
      serial: 'SN: CAT93-48P-99A',
      diag: 'Pérdida de paquetes en enlace de fibra óptica multimodo. Cambio de transceptor SFP+ 10G.',
      tech: 'Ing. Andrés Ruiz',
      techInitials: 'AR',
      techRole: 'Especialista Storage & RAID - Zona Franca',
      priority: 'p2',
      priorityLabel: 'Alta (6h)',
      status: 'proceso',
      statusLabel: 'En Reparación Activa',
      slaTime: 'En ruta (SLA OK)',
      slaTimeOk: true,
      slaSigned: false,
      createdAt: '2026-10-18 10:30'
    },
    {
      id: '#OT-2043',
      client: 'Davivienda S.A.',
      sede: 'Datacenter Zona Franca Bogotá',
      device: 'Servidor HP ProLiant DL380 Gen10',
      serial: 'SN: HPE-DL380-G10-99',
      diag: 'Alerta en Smart Array P408i. Reemplazo preventivo de disco SAS 1.2TB bahía 4.',
      tech: 'Ing. Sofía Reyes',
      techInitials: 'SR',
      techRole: 'Redes & Fibra Óptica - Chicó Calle 100',
      priority: 'p2',
      priorityLabel: 'Alta (6h)',
      status: 'completado',
      statusLabel: 'Completado / SLA Cumplido',
      slaTime: 'SLA Certificado OK',
      slaTimeOk: true,
      slaSigned: true,
      createdAt: '2026-10-17 16:40'
    },
    {
      id: '#OT-2042',
      client: 'Grupo Éxito S.A.',
      sede: 'Medellín • Datacenter Envigado',
      device: 'Firewall Fortinet FortiGate 200F',
      serial: 'SN: FG-200F-COL-77',
      diag: 'Actualización de firmware de seguridad y alta disponibilidad en cluster HA.',
      tech: 'Téc. Marco Silva',
      techInitials: 'MS',
      techRole: 'Hardware & Servidores - Tocancipá',
      priority: 'p3',
      priorityLabel: 'Media (12h)',
      status: 'completado',
      statusLabel: 'Completado / Listo',
      slaTime: 'SLA Certificado OK',
      slaTimeOk: true,
      slaSigned: true,
      createdAt: '2026-10-17 14:10'
    }
  ],
  inventory: [
    {
      sku: 'PSU-750W-DELL-HOTSWAP',
      name: 'Fuente Redundante Platinum 750W Hot-Plug',
      desc: 'Compatible con servidores Dell PowerEdge R640 / R740 / R750',
      category: 'power',
      categoryLabel: 'Fuentes de Poder',
      qty: 2,
      minQty: 5,
      price: 850000,
      priceFormatted: '$850.000 COP',
      rack: 'Rack B-04 / Gaveta 12',
      status: 'Crítico'
    },
    {
      sku: 'RAM-DDR4-32GB-ECC-SRV',
      name: 'Memoria Samsung 32GB DDR4-3200MHz ECC RDIMM',
      desc: 'Módulo servidor HPE ProLiant Gen10 y Dell PowerEdge 14G',
      category: 'ram',
      categoryLabel: 'Memorias RAM',
      qty: 4,
      minQty: 8,
      price: 490000,
      priceFormatted: '$490.000 COP',
      rack: 'Rack A-02 / Gaveta 03',
      status: 'Bajo'
    },
    {
      sku: 'SFP-10G-SR-CISCO',
      name: 'Transceiver Cisco 10GBASE-SR SFP+ 850nm',
      desc: 'Fibra Multimodo MMF LC Duplex hasta 300m',
      category: 'sfp',
      categoryLabel: 'Conectividad',
      qty: 18,
      minQty: 6,
      price: 420000,
      priceFormatted: '$420.000 COP',
      rack: 'Rack C-01 / Gav. 02',
      status: 'Óptimo'
    },
    {
      sku: 'HDD-SAS-1.2TB-10K-DELL',
      name: 'Disco Duro Dell Enterprise 1.2TB SAS 12Gbps 10K',
      desc: 'Disco de 2.5" Hot-Plug con caddy Dell Gen 14/15',
      category: 'storage',
      categoryLabel: 'Almacenamiento',
      qty: 12,
      minQty: 4,
      price: 680000,
      priceFormatted: '$680.000 COP',
      rack: 'Rack B-01 / Gaveta 05',
      status: 'Óptimo'
    }
  ],
  clients: [
    {
      id: 'cli-1',
      name: 'Bancolombia S.A.',
      nit: '890.903.938-8',
      initials: 'BC',
      colorClass: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
      sedes: 'Bogotá D.C. • Datacenter Tocancipá',
      servers: '24 Servidores Core',
      contract: 'Platinum SLA 99.98% (2h 24/7)',
      status: 'Activo',
      email: 'datacenter@bancolombia.com.co',
      phone: '+57 (601) 488-6000'
    },
    {
      id: 'cli-2',
      name: 'Ecopetrol S.A.',
      nit: '899.999.068-1',
      initials: 'EC',
      colorClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      sedes: 'Bogotá D.C. • Edificio Cra 13',
      servers: '16 Nodos & Switches Core',
      contract: 'Gold SLA 99.9% (4h)',
      status: 'Activo',
      email: 'noc-redes@ecopetrol.com.co',
      phone: '+57 (601) 234-4000'
    },
    {
      id: 'cli-3',
      name: 'Davivienda S.A.',
      nit: '860.034.313-7',
      initials: 'DV',
      colorClass: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      sedes: 'Bogotá D.C. • Datacenter Zona Franca',
      servers: '32 Racks Virtualizados',
      contract: 'Platinum SLA 99.98% (2h 24/7)',
      status: 'Activo',
      email: 'infraestructura@davivienda.com',
      phone: '+57 (601) 338-3838'
    },
    {
      id: 'cli-4',
      name: 'Grupo Éxito S.A.',
      nit: '890.900.608-9',
      initials: 'EX',
      colorClass: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
      sedes: 'Medellín • Datacenter Envigado',
      servers: '12 Servidores Edge',
      contract: 'Silver SLA 99.5% (8h)',
      status: 'Activo',
      email: 'sistemas@grupo-exito.com',
      phone: '+57 (604) 339-6565'
    }
  ],
  tickets: [
    {
      id: '#TK-COL-9842',
      clientEmail: 'tecnologia@bancolombia.com.co',
      phone: '+57 315 892 4410',
      type: 'hardware',
      typeLabel: 'Falla de Hardware / Servidor',
      priority: 'p1',
      priorityLabel: 'P1 - Crítica (2h)',
      hostname: 'SRV-DELL-R740-02',
      location: 'Datacenter Tocancipá • Rack B-04',
      diag: 'Falla en fuente de poder redundante PSU #2. Se requiere reemplazo en caliente.',
      status: 'En Proceso',
      createdAt: '2026-10-18 09:20'
    },
    {
      id: '#TK-COL-9841',
      clientEmail: 'redes@ecopetrol.com.co',
      phone: '+57 310 998 1234',
      type: 'network',
      typeLabel: 'Conectividad & Redes (LAN / Fibra)',
      priority: 'p2',
      priorityLabel: 'P2 - Alta (4h)',
      hostname: 'SW-CISCO-9300-BOG',
      location: 'Bogotá D.C. • Cra 13 Piso 7',
      diag: 'Pérdida de paquetes en enlace de fibra óptica multimodo hacia piso 5.',
      status: 'Abierto',
      createdAt: '2026-10-18 10:05'
    },
    {
      id: '#TK-COL-9840',
      clientEmail: 'soporte@davivienda.com',
      phone: '+57 318 450 7890',
      type: 'parts',
      typeLabel: 'Reemplazo de Repuesto Almacén',
      priority: 'p2',
      priorityLabel: 'P2 - Alta (4h)',
      hostname: 'SRV-HPE-DL380-04',
      location: 'Datacenter Zona Franca Bogotá',
      diag: 'Alerta predictiva SMART en disco SAS 1.2TB. Repuesto instalado con éxito.',
      status: 'Resuelto',
      createdAt: '2026-10-17 15:30'
    }
  ]
};

// Paso 3: Definicion de la clase gestora del almacenamiento local (Patron Repository)
class DataStore {
  constructor() {
    this.initStore();
  }

  // Paso 4: Inicializacion automatica del dataset por defecto si no existen datos previos
  initStore() {
    if (!localStorage.getItem(STORAGE_KEYS.ORDERS)) {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(SEED_DATA.orders));
    }
    if (!localStorage.getItem(STORAGE_KEYS.INVENTORY)) {
      localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(SEED_DATA.inventory));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CLIENTS)) {
      localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(SEED_DATA.clients));
    }
    if (!localStorage.getItem(STORAGE_KEYS.TICKETS)) {
      localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(SEED_DATA.tickets));
    }
  }

  // Paso 5: Operaciones CRUD para la entidad de Ordenes de Trabajo
  /* ------------------ ORDERS CRUD ------------------ */
  getOrders() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.ORDERS)) || [];
    } catch {
      return SEED_DATA.orders;
    }
  }

  saveOrders(orders) {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  }

  addOrder(orderData) {
    const orders = this.getOrders();
    const id = orderData.id || `#OT-2024-${Math.floor(Math.random() * 8000 + 2000)}`;
    const newOrder = {
      id,
      client: orderData.client || 'Cliente Corporativo Colombia',
      sede: orderData.sede || 'Datacenter Bogotá Zona Franca',
      device: orderData.device || 'Servidor Rack 2U Enterprise',
      serial: orderData.serial || `SN: COL-${Math.floor(Math.random() * 9000 + 1000)}-DELL`,
      diag: orderData.diag || 'Diagnóstico preliminar de hardware.',
      tech: orderData.tech || 'Téc. Marco Silva',
      techInitials: orderData.techInitials || 'MS',
      techRole: orderData.techRole || 'Técnico Especialista Hardware',
      priority: orderData.priority || 'p2',
      priorityLabel: orderData.priority === 'p1' ? 'Crítica (2h)' : orderData.priority === 'p2' ? 'Alta (6h)' : 'Media (12h)',
      status: orderData.status || 'proceso',
      statusLabel: orderData.status === 'completado' ? 'Completado / SLA Cumplido' : orderData.status === 'pendiente' ? 'Pendiente / Crítico' : 'En Diagnóstico / Triage',
      slaTime: orderData.priority === 'p1' ? '1h 55m restantes' : 'En ruta (SLA OK)',
      slaTimeOk: orderData.priority !== 'p1',
      slaSigned: false,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16)
    };
    orders.unshift(newOrder);
    this.saveOrders(orders);
    return newOrder;
  }

  updateOrder(id, updates) {
    const orders = this.getOrders();
    const idx = orders.findIndex(o => o.id === id);
    if (idx !== -1) {
      orders[idx] = { ...orders[idx], ...updates };
      this.saveOrders(orders);
      return orders[idx];
    }
    return null;
  }

  deleteOrder(id) {
    let orders = this.getOrders();
    orders = orders.filter(o => o.id !== id);
    this.saveOrders(orders);
    return true;
  }

  // Paso 6: Operaciones CRUD para la entidad de Inventario de Repuestos
  /* ------------------ INVENTORY CRUD ------------------ */
  getInventory() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.INVENTORY)) || [];
    } catch {
      return SEED_DATA.inventory;
    }
  }

  saveInventory(items) {
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(items));
  }

  addInventoryItem(itemData) {
    const items = this.getInventory();
    const sku = (itemData.sku || `SKU-COL-${Date.now().toString().slice(-4)}`).toUpperCase().trim();
    const qty = parseInt(itemData.qty, 10) || 10;
    const minQty = parseInt(itemData.minQty, 10) || 5;
    const priceNum = typeof itemData.price === 'number' ? itemData.price : parseInt(String(itemData.price).replace(/[^0-9]/g, ''), 10) || 450000;
    
    const newItem = {
      sku,
      name: itemData.name || 'Componente Servidor Enterprise',
      desc: itemData.desc || 'Componente catalogado en inventario Colombia',
      category: itemData.category || 'storage',
      categoryLabel: itemData.category === 'power' ? 'Fuentes de Poder' : itemData.category === 'ram' ? 'Memorias RAM' : itemData.category === 'sfp' ? 'Conectividad' : 'Almacenamiento',
      qty,
      minQty,
      price: priceNum,
      priceFormatted: `$${priceNum.toLocaleString('es-CO')} COP`,
      rack: itemData.rack || 'Rack Central / Gav. 02',
      status: qty <= 2 ? 'Crítico' : qty <= minQty ? 'Bajo' : 'Óptimo'
    };
    items.unshift(newItem);
    this.saveInventory(items);
    return newItem;
  }

  adjustStock(sku, diff) {
    const items = this.getInventory();
    const idx = items.findIndex(i => i.sku === sku);
    if (idx !== -1) {
      const newQty = Math.max(0, items[idx].qty + diff);
      items[idx].qty = newQty;
      items[idx].status = newQty <= 2 ? 'Crítico' : newQty <= items[idx].minQty ? 'Bajo' : 'Óptimo';
      this.saveInventory(items);
      return items[idx];
    }
    return null;
  }

  updateInventoryItem(sku, updates) {
    const items = this.getInventory();
    const idx = items.findIndex(i => i.sku === sku);
    if (idx !== -1) {
      items[idx] = { ...items[idx], ...updates };
      if (updates.qty !== undefined) {
        const q = items[idx].qty;
        items[idx].status = q <= 2 ? 'Crítico' : q <= (items[idx].minQty || 5) ? 'Bajo' : 'Óptimo';
      }
      if (updates.price !== undefined) {
        const priceNum = typeof updates.price === 'number' ? updates.price : parseInt(String(updates.price).replace(/[^0-9]/g, ''), 10) || items[idx].price;
        items[idx].price = priceNum;
        items[idx].priceFormatted = `$${priceNum.toLocaleString('es-CO')} COP`;
      }
      this.saveInventory(items);
      return items[idx];
    }
    return null;
  }

  deleteInventoryItem(sku) {
    let items = this.getInventory();
    items = items.filter(i => i.sku !== sku);
    this.saveInventory(items);
    return true;
  }

  // Paso 7: Operaciones CRUD para el Directorio Corporativo de Clientes y Sedes
  /* ------------------ CLIENTS CRUD ------------------ */
  getClients() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.CLIENTS)) || [];
    } catch {
      return SEED_DATA.clients;
    }
  }

  saveClients(clients) {
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
  }

  addClient(clientData) {
    const clients = this.getClients();
    const name = clientData.name || 'Empresa Colombia S.A.S.';
    const initials = name.split(' ').filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase();
    const nit = clientData.nit || `901.${Math.floor(Math.random() * 800 + 100)}.${Math.floor(Math.random() * 800 + 100)}-${Math.floor(Math.random() * 9)}`;
    
    const newClient = {
      id: 'cli-' + Date.now().toString().slice(-4),
      name,
      nit,
      initials: initials || 'CO',
      colorClass: 'text-brand-cyan bg-sky-500/10 border-sky-500/20',
      sedes: clientData.sedes || 'Bogotá D.C. • Datacenter Corporativo',
      servers: clientData.servers || '8 Servidores Core',
      contract: clientData.contract || 'Platinum SLA 99.98% (2h 24/7)',
      status: 'Activo',
      email: clientData.email || 'contacto@empresa.com.co',
      phone: clientData.phone || '+57 (601) 745-0000'
    };
    clients.unshift(newClient);
    this.saveClients(clients);
    return newClient;
  }

  updateClient(id, updates) {
    const clients = this.getClients();
    const idx = clients.findIndex(c => c.id === id || c.nit === id);
    if (idx !== -1) {
      clients[idx] = { ...clients[idx], ...updates };
      this.saveClients(clients);
      return clients[idx];
    }
    return null;
  }

  deleteClient(id) {
    let clients = this.getClients();
    clients = clients.filter(c => c.id !== id && c.nit !== id);
    this.saveClients(clients);
    return true;
  }

  // Paso 8: Operaciones CRUD para el modulo de Tickets y Solicitudes Tecnicas
  /* ------------------ TICKETS CRUD ------------------ */
  getTickets() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.TICKETS)) || [];
    } catch {
      return SEED_DATA.tickets;
    }
  }

  saveTickets(tickets) {
    localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(tickets));
  }

  addTicket(ticketData) {
    const tickets = this.getTickets();
    const id = ticketData.id || `#TK-COL-${Math.floor(Math.random() * 8000 + 1000)}`;
    const newTicket = {
      id,
      clientEmail: ticketData.clientEmail || 'usuario@empresa.com.co',
      phone: ticketData.phone || '+57 310 123 4567',
      type: ticketData.type || 'hardware',
      typeLabel: ticketData.type === 'network' ? 'Conectividad & Redes' : ticketData.type === 'parts' ? 'Reemplazo Repuesto' : ticketData.type === 'sla' ? 'Mantenimiento SLA' : 'Falla de Hardware',
      priority: ticketData.priority || 'p2',
      priorityLabel: ticketData.priority === 'p1' ? 'P1 - Crítica (2h)' : ticketData.priority === 'p2' ? 'P2 - Alta (4h)' : 'P3 - Media (8h)',
      hostname: ticketData.hostname || 'SRV-HOST-01',
      location: ticketData.location || 'Datacenter Zona Franca Bogotá',
      diag: ticketData.diag || 'Incidente técnico reportado.',
      status: 'Abierto',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16)
    };
    tickets.unshift(newTicket);
    this.saveTickets(tickets);
    return newTicket;
  }

  updateTicket(id, updates) {
    const tickets = this.getTickets();
    const idx = tickets.findIndex(t => t.id === id);
    if (idx !== -1) {
      tickets[idx] = { ...tickets[idx], ...updates };
      this.saveTickets(tickets);
      return tickets[idx];
    }
    return null;
  }

  deleteTicket(id) {
    let tickets = this.getTickets();
    tickets = tickets.filter(t => t.id !== id);
    this.saveTickets(tickets);
    return true;
  }
}

// Paso 9: Exportacion de la instancia unica (Singleton Pattern)
export const Store = new DataStore();

