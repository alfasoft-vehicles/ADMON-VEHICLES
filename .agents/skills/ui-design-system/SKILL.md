---
name: ui-design-system
description: "Sistema de diseño global y pautas visuales para la creación de nuevas vistas o el rediseño de componentes existentes en Angular: paleta Slate + Pastel, encabezados superiores, tarjetas de módulos/opciones con mat-icon, tablas enterprise, buscadores personalizados, botones pastel, tarjetas KPI, diálogos modales y estados vacíos (basado en cash-register y home-users)."
---

# Pautas de Diseño Global: UI Design System (Enterprise Slate & Pastel)

Esta skill define el estándar visual, estructural y de experiencia de usuario para **todas las nuevas secciones y rediseños** de la aplicación frontend, unificando la identidad introducida en el módulo de **Caja (`cash-register`)** y el **Panel Principal de Usuarios (`home-users`)**.

---

## 🧭 Principios Fundamentales

1. **Lienzo Claro y Jerarquía por Bordes Sutiles**:
   - El fondo base de las vistas es gris pizarra muy claro (`#f8fafc`), sobre el cual descansan contenedores y tarjetas blancas (`#ffffff`) delimitadas por bordes finos (`1px solid #e2e8f0`) y radios redondeados (`10px` a `12px`), evitando sombras pesadas o bordes negros bruscos (`#888`).
2. **Iconografía Material en Contenedores Pastel**:
   - Sustituir imágenes SVG monocromáticas antiguas por iconos de Angular Material (`<mat-icon>`) alojados dentro de cajas cuadradas con bordes redondeados (`border-radius: 10px` o `12px`) y **fondos pastel semánticos** con texto/icono vibrante.
3. **Tipografía Limpia (Escala Slate)**:
   - Nunca usar negro puro (`#000000`). Utilizar la escala **Slate** (`#0f172a` / `#1e293b` para títulos, `#334155` / `#475569` para contenido y etiquetas, `#64748b` / `#94a3b8` para subtítulos y textos secundarios).
4. **Micro-interacciones Suaves**:
   - Todo elemento accionable (tarjeta, tile o botón) debe incluir `matRipple`, transiciones suaves (`0.18s cubic-bezier(0.4, 0, 0.2, 1)`), ligera elevación al pasar el cursor (`transform: translateY(-2px)` o `-3px`) y escalado sutil de su icono (`transform: scale(1.08)`).

---

## 🔀 Árbol de Decisión según el Tipo de Pantalla

```
¿Qué tipo de interfaz vas a construir o rediseñar?
│
├── 1. Menú Principal o Menú de Opciones de un Departamento (ej. Home, Operaciones, Gerencia, Taller)
│   └── ➔ USAR: Contenedor .main-container + Encabezado Superior (.top-header) + Grid de Tarjetas de Módulo (.modules-grid / .module-card)
│
├── 2. Vista de Tabla de Datos / Procesamiento / Listados (ej. Carga Masiva, Vehículos, Conductores)
│   └── ➔ USAR: Encabezado Superior (.top-header) + Contenedor de Tabla (.table-section) con Toolbar (.table-toolbar), Buscador Custom y Tabla Enterprise (.data-table)
│
├── 3. Vista Operativa / Formulario Multi-panel (ej. Caja Recaudos)
│   └── ➔ USAR: Grid de 12 columnas (.main-grid) con Tarjetas Blancas (.card-container), Header de Tarjeta (.card-header), Inputs compactos (49px) y Botones Pastel
│
└── 4. Ventana Emergente / Diálogo Modal (MatDialog)
    └── ➔ USAR: Estructura estándar de Diálogo (.dialog-header-container + mat-divider + .dialog-content-custom + mat-divider + .dialog-actions-custom)
```

> [!IMPORTANT]
> Para cualquier estado de carga (*loaders*, *spinners*, barras de progreso o subida de archivos), **combina siempre esta skill con la skill `loader-patterns`**.

---

## 🎨 1. Paleta de Colores y Tokens Semánticos

### Superficies y Bordes
| Uso | Color Hex | Descripción |
| :--- | :--- | :--- |
| **Fondo de página** | `#f8fafc` | Gris pizarra claro para el contenedor raíz de las vistas |
| **Superficie de tarjeta** | `#ffffff` | Blanco puro para headers, cards, tablas y diálogos |
| **Superficie secundaria** | `#f1f5f9` | Fondo de cabeceras de tabla (`thead`), *pills* neutros y grupos de *toggles* |
| **Borde estándar** | `#e2e8f0` | Borde principal de tarjetas, divisores y celdas |
| **Borde interactivo / input** | `#cbd5e1` | Borde en reposo para buscadores, inputs y *button-toggles* |
| **Borde hover** | `#94a3b8` | Borde al pasar el cursor sobre tarjetas o controles |
| **Acento primario (Foco)** | `#0284c7` | Azul cielo corporativo para bordes en foco, enlaces activos y textos hover |

### Escala Tipográfica
| Rol | Color Hex | Peso recomendado |
| :--- | :--- | :--- |
| **Títulos principales (`h1`, `h2`)** | `#1e293b` o `#0f172a` | `700` - `800` |
| **Texto de cuerpo / Valores** | `#334155` | `500` - `600` |
| **Encabezados de tabla / Labels** | `#475569` | `600` - `700` |
| **Subtítulos / Texto secundario** | `#64748b` | `400` - `500` |
| **Placeholders / Iconos pasivos** | `#94a3b8` | `400` |

### Paleta Pastel para Cajas de Iconos (`.icon-box`) y Badges
Utiliza siempre pares armónicos de fondo suave + icono vibrante:

```css
/* Verde (Caja, Éxito, Pagos) */
.bg-green { background-color: #dcfce7; }
.text-green { color: #16a34a; }

/* Esmeralda (Cartera, Ahorros, Saldos a favor) */
.bg-emerald { background-color: #d1fae5; }
.text-emerald { color: #059669; }

/* Azul (Operaciones, CNT, Información) */
.bg-blue { background-color: #dbeafe; }
.text-blue { color: #2563eb; }

/* Azul Cielo (Sucursal, Taller, Vínculos) */
.bg-sky { background-color: #e0f2fe; }
.text-sky { color: #0284c7; }

/* Cian (Llavero, Transferencias) */
.bg-cyan { background-color: #cffafe; }
.text-cyan { color: #0891b2; }

/* Verde Azulado / Teal (Cobros, Operadores) */
.bg-teal { background-color: #ccfbf1; }
.text-teal { color: #0d9488; }

/* Índigo (Trámites, Gerencia, Detalle General) */
.bg-indigo { background-color: #e0e7ff; }
.text-indigo { color: #4f46e5; }

/* Púrpura (Chapistería, Resumen Empresa) */
.bg-purple { background-color: #f3e8ff; }
.text-purple { color: #9333ea; }

/* Naranja (Almacén, Carga Masiva, Consecutivos) */
.bg-orange { background-color: #ffedd5; }
.text-orange { color: #ea580c; }

/* Ámbar (Gastos, Advertencias) */
.bg-amber { background-color: #fef3c7; }
.text-amber { color: #d97706; }

/* Rojo (Reclamos, Siniestros, Cierres, Deudas, Eliminar) */
.bg-red { background-color: #fee2e2; }
.text-red { color: #dc2626; }

/* Pizarra / Gris (Contado, Copias, Inactivos) */
.bg-slate { background-color: #f1f5f9; }
.text-slate { color: #64748b; }

/* Gris Oscuro (Utilidades, Configuración, Resumen Diario) */
.bg-darkgray { background-color: #e2e8f0; }
.text-darkgray { color: #475569; }
```

---

## 🧱 2. Patrón de Encabezado Superior (`.top-header`)

Todas las vistas principales o menús de departamento deben abrir con un bloque de encabezado blanco que contextualice la vista, muestre contadores o metadatos y, cuando aplique, el botón de regreso o la insignia de la empresa.

### Plantilla HTML
```html
<header class="top-header mat-elevation-z2">
  <div class="header-left">
    <!-- Opcional: Botón de regreso si es una subvista -->
    <!--
    <button mat-stroked-button class="btn-pastel-red header-exit-btn" routerLink="/ruta-padre">
      <mat-icon>arrow_back</mat-icon>
      <span>Regresar</span>
    </button>
    <div class="header-divider"></div>
    -->

    <!-- Insignia del módulo -->
    <div class="brand-badge">
      <mat-icon class="brand-icon">dashboard</mat-icon>
    </div>

    <div class="title-text">
      <div class="title-row">
        <h1 class="page-title">Título de la Sección</h1>
        <span class="meta-pill pill-info">
          <mat-icon class="meta-icon">verified_user</mat-icon>
          <span class="meta-value">{{ totalItems }}</span>
          <span class="meta-label">habilitados</span>
        </span>
      </div>
      <p class="page-subtitle">
        Subtítulo descriptivo o saludo contextual para el usuario
      </p>
    </div>
  </div>

  <div class="header-right">
    <!-- Pill de Fecha o Metadato Secundario -->
    <div class="meta-pill date-pill">
      <mat-icon class="meta-icon">calendar_today</mat-icon>
      <span class="meta-value">{{ currentDateFormatted }}</span>
    </div>

    <!-- Chip de Empresa o Controles de Acción -->
    <div class="company-badge" *ngIf="infoCompanyName">
      <mat-icon class="company-icon">apartment</mat-icon>
      <span class="company-name">{{ infoCompanyName }}</span>
    </div>
  </div>
</header>
```

### Estilos CSS Base del Header
```css
.main-container {
  min-height: calc(100vh - 64px);
  padding: 20px 24px 36px;
  background-color: #f8fafc;
  display: flex;
  flex-direction: column;
  gap: 20px;
  box-sizing: border-box;
  width: 100%;
  user-select: none;
}

.top-header {
  background: #ffffff;
  border-radius: 12px;
  padding: 16px 22px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  border: 1px solid #e2e8f0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.brand-badge {
  width: 46px;
  height: 46px;
  border-radius: 12px;
  background: linear-gradient(135deg, #1e40af 0%, #0284c7 100%);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 10px rgba(2, 132, 199, 0.22);
  flex-shrink: 0;
}

.title-text {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.page-title {
  font-size: 1.4rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
  line-height: 1.2;
}

.page-subtitle {
  font-size: 0.84rem;
  color: #64748b;
  margin: 0;
  line-height: 1.4;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.meta-pill {
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  padding: 5px 12px;
  font-size: 0.76rem;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: #334155;
  height: 28px;
  box-sizing: border-box;
}

.pill-info {
  background-color: #eff6ff;
  border-color: #bfdbfe;
  color: #1e40af;
}

.date-pill {
  height: 40px;
  padding: 0 14px;
  border-radius: 10px;
  background-color: #f8fafc;
}

.company-badge {
  height: 40px;
  background: linear-gradient(135deg, #0077c8 0%, #00a4e4 100%);
  color: #ffffff;
  padding: 0 16px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 2px 6px rgba(0, 119, 200, 0.24);
  box-sizing: border-box;
}

.company-name {
  font-size: 0.82rem;
  font-weight: 800;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  white-space: nowrap;
}
```

---

## 🗂️ 3. Tarjetas de Módulos y Opciones (`.module-card` y `.query-tile-btn`)

Existen dos variantes según la jerarquía de la pantalla:

### Variante A: Tarjeta de Navegación de Módulo / Submódulo (`.module-card`)
Ideal para `HomeUsersComponent` y las páginas de menú de cada departamento (`opciones-operaciones`, `opciones-gerencia`, `opciones-taller`, `opciones-cartera`, etc.). No incluye descripciones largas ni chips de categoría innecesarios: se enfoca en el icono pastel, el título claro y el pie de acción.

```html
<section class="modules-grid">
  <button
    type="button"
    class="module-card"
    matRipple
    [matRippleDisabled]="option.disabled"
    [routerLink]="option.disabled ? null : option.url"
    [disabled]="option.disabled"
  >
    <div class="card-main">
      <div class="icon-box" [ngClass]="option.bgClass">
        <mat-icon [ngClass]="option.colorClass">{{ option.icon }}</mat-icon>
      </div>
      <div class="card-info">
        <h2 class="card-title">{{ option.name }}</h2>
        <span *ngIf="option.disabled" class="badge badge-disabled">
          No disponible
        </span>
      </div>
    </div>

    <div class="card-footer">
      <span class="card-action-text">
        {{ option.disabled ? 'Acceso deshabilitado' : 'Ingresar al módulo' }}
      </span>
      <mat-icon class="card-arrow" *ngIf="!option.disabled">arrow_forward</mat-icon>
      <mat-icon class="card-lock" *ngIf="option.disabled">lock</mat-icon>
    </div>
  </button>
</section>
```

```css
.modules-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
  width: 100%;
}

.module-card {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  text-align: left;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 18px 20px;
  cursor: pointer;
  outline: none;
  gap: 16px;
  box-sizing: border-box;
  transition:
    transform 0.18s cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 0.18s cubic-bezier(0.4, 0, 0.2, 1),
    border-color 0.18s cubic-bezier(0.4, 0, 0.2, 1);
}

.module-card:hover:not(:disabled) {
  border-color: #94a3b8;
  transform: translateY(-3px);
  box-shadow:
    0 10px 15px -3px rgba(15, 23, 42, 0.07),
    0 4px 6px -4px rgba(15, 23, 42, 0.05);
}

.module-card:disabled {
  background: #f8fafc;
  border-color: #e2e8f0;
  border-style: dashed;
  cursor: not-allowed;
  opacity: 0.68;
}

.card-main {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
}

.icon-box {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
}

.module-card:hover:not(:disabled) .icon-box {
  transform: scale(1.08);
}

.icon-box mat-icon {
  font-size: 26px;
  width: 26px;
  height: 26px;
}

.card-title {
  font-size: 1.08rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
  line-height: 1.25;
  transition: color 0.15s ease;
}

.module-card:hover:not(:disabled) .card-title {
  color: #0284c7;
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding-top: 10px;
  border-top: 1px solid #f1f5f9;
}

.card-action-text {
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
  transition: color 0.15s ease;
}

.module-card:hover:not(:disabled) .card-action-text {
  color: #0284c7;
}

.card-arrow {
  font-size: 18px;
  width: 18px;
  height: 18px;
  color: #94a3b8;
  transition: transform 0.2s ease, color 0.2s ease;
}

.module-card:hover:not(:disabled) .card-arrow {
  color: #0284c7;
  transform: translateX(4px);
}
```

### Variante B: Tile Compacto Centrado (`.query-tile-btn`)
Ideal para grillas densas dentro de diálogos (como `QueriesDialogComponent`) o paneles laterales de accesos rápidos (como la sección `CONSULTAS` en `CashRegisterViewComponent`).

```html
<button class="query-tile-btn" matRipple (click)="selectOption(item)">
  <div class="query-icon-container" [ngClass]="item.bgClass">
    <mat-icon [ngClass]="item.colorClass">{{ item.icon }}</mat-icon>
  </div>
  <span class="query-tile-label">{{ item.label }}</span>
</button>
```

```css
.query-tile-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 16px 10px;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
}

.query-tile-btn:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
  transform: translateY(-2px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.08);
}

.query-icon-container {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.15s ease;
}

.query-tile-btn:hover .query-icon-container {
  transform: scale(1.08);
}

.query-tile-label {
  font-size: 0.82rem;
  font-weight: 600;
  color: #334155;
  text-align: center;
  line-height: 1.25;
}
```

---

## 🔘 4. Botones de Acción Pastel y Controles de Formulario

### Botones Pastel (`mat-flat-button` / `mat-stroked-button`)
En lugar de botones con colores saturados pesados, los botones de acción principales utilizan fondos pastel con texto e icono de alto contraste semántico:

```css
.cr-button {
  height: 46px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border-radius: 8px;
}

/* Azul: Verificar, Buscar, Acción Primaria */
.cr-btn-pastel-blue {
  background-color: #e3f2fd !important;
  color: #1e88e5 !important;
}

/* Verde: Recaudar, Confirmar, Guardar, Aprobar */
.cr-btn-pastel-green {
  background-color: #e8f5e9 !important;
  color: #2e7d32 !important;
}

/* Rojo: Limpiar, Cancelar, Regresar, Eliminar */
.cr-btn-pastel-red {
  background-color: #ffebee !important;
  color: #e53935 !important;
}

/* Naranja: Carga Masiva, Advertencia, Acción Especial */
.cr-btn-pastel-orange {
  background-color: #fff3e0 !important;
  color: #fb8c00 !important;
}

.cr-button:disabled,
.cr-button.mat-mdc-button-disabled {
  background-color: #e2e8f0 !important;
  color: #94a3b8 !important;
  opacity: 0.75 !important;
  cursor: not-allowed !important;
  box-shadow: none !important;
}
```

### Buscador Custom (`.search-box-wrapper`)
Para barras de búsqueda en diálogos o toolbars de tablas, se prefiere un contenedor HTML limpio con borde `#cbd5e1` y foco `#0284c7` en lugar de un `mat-form-field` pesado con espacio reservado de subscript:

```html
<div class="search-box-wrapper">
  <mat-icon class="search-box-icon">search</mat-icon>
  <input
    type="text"
    class="search-box-input"
    [(ngModel)]="filterTerm"
    placeholder="Buscar registro..."
  />
  <button
    *ngIf="filterTerm"
    type="button"
    class="search-box-clear"
    (click)="filterTerm = ''"
    matTooltip="Limpiar búsqueda"
  >
    <mat-icon>close</mat-icon>
  </button>
</div>
```

```css
.search-box-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
  background-color: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  padding: 0 14px;
  height: 46px;
  box-sizing: border-box;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.search-box-wrapper:focus-within {
  border-color: #0284c7;
  box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.12);
}

.search-box-icon {
  color: #64748b;
  font-size: 20px;
  width: 20px;
  height: 20px;
}

.search-box-input {
  border: none;
  outline: none;
  background: transparent;
  width: 100%;
  font-size: 0.9rem;
  color: #1e293b;
}

.search-box-input::placeholder {
  color: #94a3b8;
}
```

---

## 📊 5. Tablas de Datos Enterprise y Tarjetas KPI

### Tablas de Datos (`.data-table`)
- **Contenedor**: `.table-section` con `background: #ffffff`, `border: 1px solid #e2e8f0`, `border-radius: 10px`, `overflow: hidden`.
- **Cabecera (`thead th`)**: Sticky (`position: sticky; top: 0; z-index: 10`), fondo `#f1f5f9`, texto `#475569`, `font-weight: 700`, `font-size: 0.75rem`, `text-transform: uppercase`, `border-bottom: 2px solid #cbd5e1`.
- **Celdas (`tbody td`)**: Texto `#1e293b`, `border-bottom: 1px solid #f1f5f9`, `padding: 8px 12px`. Para columnas numéricas o monetarias, usar `text-align: right; font-variant-numeric: tabular-nums;`.
- **Scrollbars personalizados**: Ancho/alto de `6px` a `8px`, track `#f1f5f9` y thumb `#cbd5e1` redondeado.

### Tarjetas KPI de Resumen (`.kpi-card`)
Usadas en la parte superior de diálogos financieros o paneles de control (ej. `pay-surcharges-dialog`):
```html
<div class="kpi-summary-grid">
  <div class="kpi-card kpi-balance">
    <div class="kpi-icon-box">
      <mat-icon>account_balance_wallet</mat-icon>
    </div>
    <div class="kpi-data">
      <span class="kpi-label">Saldo Total</span>
      <span class="kpi-value text-red">$ {{ totalBalance | number: '1.2-2' }}</span>
    </div>
  </div>
</div>
```

---

## 🪟 6. Estándar para Diálogos Modales (`MatDialog`)

Todo diálogo modal nuevo o rediseñado debe respetar esta estructura en 3 bloques separados por `<mat-divider>`:

```html
<!-- 1. Header del Diálogo -->
<div class="dialog-header-container">
  <div class="dialog-title-wrapper">
    <!-- Opcional: Badge con icono cuando el diálogo es una herramienta clave -->
    <div class="dialog-badge-icon">
      <mat-icon>manage_search</mat-icon>
    </div>
    <div class="dialog-header-info">
      <h2 class="dialog-title">Título del Diálogo</h2>
      <p class="dialog-subtitle">Descripción breve del propósito del modal</p>
    </div>
  </div>
  <button mat-icon-button (click)="close()" class="close-button" matTooltip="Cerrar">
    <mat-icon>close</mat-icon>
  </button>
</div>

<mat-divider></mat-divider>

<!-- 2. Contenido del Diálogo -->
<mat-dialog-content class="dialog-content-custom">
  <!-- Contenido, KPIs, buscador o tabla -->
</mat-dialog-content>

<mat-divider></mat-divider>

<!-- 3. Acciones del Diálogo -->
<mat-dialog-actions align="end" class="dialog-actions-custom">
  <button mat-button type="button" (click)="close()" class="action-btn">
    <mat-icon>close</mat-icon> Cancelar
  </button>
  <button mat-flat-button color="primary" type="button" (click)="confirm()" class="action-btn btn-confirm">
    <mat-icon>check</mat-icon> Confirmar
  </button>
</mat-dialog-actions>
```

---

## 📭 7. Estados Vacíos (`.empty-state`)

Nunca dejes una tabla o grilla en blanco cuando no existan datos. Utiliza el bloque `.empty-state`:

```html
<div class="empty-state mat-elevation-z1">
  <div class="empty-icon-wrap">
    <mat-icon class="empty-icon">manage_search</mat-icon>
  </div>
  <h2 class="empty-title">No se encontraron registros</h2>
  <p class="empty-subtitle">
    Intente ajustar los criterios de búsqueda o seleccione otra opción para continuar.
  </p>
</div>
```

```css
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 56px 24px;
  background-color: #ffffff;
  border-radius: 12px;
  border: 1px dashed #cbd5e1;
  text-align: center;
  gap: 8px;
}

.empty-icon-wrap {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background-color: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
}

.empty-icon {
  font-size: 30px;
  width: 30px;
  height: 30px;
  color: #94a3b8;
}

.empty-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #334155;
  margin: 0;
}

.empty-subtitle {
  font-size: 0.85rem;
  color: #64748b;
  max-width: 440px;
  margin: 0;
  line-height: 1.45;
}
```

---

## 📱 8. Reglas de Responsividad

- **Breakpoints estándar**:
  - `@media (max-width: 960px)`: El `.top-header` pasa a `flex-direction: column; align-items: stretch;`.
  - `@media (max-width: 768px)`: Las grillas multi-columna de formularios pasan a `grid-template-columns: 1fr;`.
  - `@media (max-width: 640px)`:
    - Reducir el padding del contenedor principal a `14px`.
    - Ocultar metadatos secundarios no esenciales (como `.date-pill`) para priorizar el título y el badge de empresa.
    - En diálogos (`.dialog-content-custom`), eliminar cualquier `min-width` fijo (`min-width: unset; width: 100%;`) para evitar desbordamiento horizontal en móviles.

---

## ✅ Lista de Verificación (Checklist) para Nuevas Vistas o Rediseños

- [ ] **¿El contenedor raíz usa `#f8fafc` y las tarjetas usan `#ffffff` con borde `#e2e8f0`?**
- [ ] **¿Se reemplazaron los iconos `.svg` antiguos por `<mat-icon>` dentro de cajas pastel (`.icon-box`)?**
- [ ] **¿El encabezado superior (`.top-header`) sigue la estructura con insignia, título `#1e293b`, subtítulo `#64748b` y metadatos/empresa a la derecha?**
- [ ] **¿Las tarjetas de módulos/opciones son limpias (sin descripciones extensas ni chips de categoría redundantes) e incluyen `matRipple` y pie de acción?**
- [ ] **¿Las tablas usan cabeceras `#f1f5f9` en mayúsculas, `tabular-nums` en importes y buscadores redondeados de `42px-48px`?**
- [ ] **¿Los estados de carga cumplen con la skill `loader-patterns`?**
- [ ] **¿Se verificó el comportamiento responsivo en `960px`, `768px` y `640px`?**

