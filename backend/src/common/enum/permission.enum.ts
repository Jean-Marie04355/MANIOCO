export enum Permission {
  // Global
  ALL = '*',

  // Roles & Permissions
  ROLES_MANAGE = 'roles:manage',

  // Users
  USERS_MANAGE = 'users:manage',
  USERS_VIEW = 'users:view',

  // Products
  PRODUCTS_MANAGE = 'products:manage',
  PRODUCTS_VIEW = 'products:view',

  // Product Categories
  PRODUCT_CATEGORIES_MANAGE = 'product-categories:manage',
  PRODUCT_CATEGORIES_VIEW = 'product-categories:view',

  // Orders
  ORDERS_MANAGE = 'orders:manage',
  ORDERS_VIEW = 'orders:view',

  // Stores
  STORES_MANAGE = 'stores:manage',

  // System & Logs
  LOGS_VIEW = 'logs:view',
  SETTINGS_MANAGE = 'settings:manage',

  // High Level Sections used in UI
  ADMINS_MANAGE = 'admins:manage',
  STOCK_VIEW = 'stock:view',
  FINANCE_VIEW = 'finance:view',
  SUPPORT_MANAGE = 'support:manage',
}
