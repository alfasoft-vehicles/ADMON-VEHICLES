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

Todas las vistas principales o menús de departamento deben abrir con un bloque de encabezado blanco que contextualice la vista, muestre contadores o metadatos y, cuando aplique, el botón de regreso, la píldora de fecha y la insignia de la empresa.

### Reglas de Contenido en el Header (`.page-subtitle` y Chips de Conteo)
- **Mostrar subtítulo (`.page-subtitle`)**: Únicamente en **componentes de selección de módulos u opciones** (ej. `home-users`, `opciones-operaciones`, `opciones-gerencia`, `opciones-taller`, etc.), donde guía al usuario a elegir una opción o muestra un saludo contextual.
- **NO mostrar subtítulo**: En **componentes de funcionalidad operativa directa** (ej. `cash-register-view`, `bulk-upload-view`, vistas de tablas de procesamiento o formularios de trabajo). En estas pantallas el header debe mantenerse compacto mostrando solo el título principal.
- **NO mostrar chips de conteo de módulos u opciones**: En los componentes de selección de módulos u opciones (como `home-users`, `opciones-operaciones`, etc.), **no se debe incluir** un chip/pill que indique cuántos módulos u opciones hay habilitados para escoger (ej. evitar `X habilitados` o `X opciones` al lado del título). Solo se permiten badges contextuales propios de una operación o pasarela (como el badge del banco en `bulk-upload` o la unidad activa en `cash-register`).

### Estándar Visual de Fecha (`.date-pill`) y Chip de Empresa (`.company-badge`)
A la derecha del encabezado (`.header-right`) se deben presentar la fecha y el nombre de la empresa (obtenido desde la caché centralizada de `InfoCompanyStateService.loadInfoCompany()`) con el estilo pastel suave y limpio de `bulk-upload-view`:
- **`.date-pill`**: Fondo `#f8fafc`, borde `1px solid #e2e8f0`, `border-radius: 8px`, texto `#475569` (`font-weight: 600`) e ícono `calendar_today` en azul cielo `#0284c7` (`16px`).
- **`.company-badge`**: Fondo pastel degradado suave `linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)`, borde `1px solid #bae6fd`, `border-radius: 10px`, texto `#0369a1` (`font-weight: 700`, `text-transform: uppercase`) e ícono `apartment` en `#0284c7` (`20px`).

### Plantilla HTML
```html
<header class="top-header">
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
      </div>
      <!-- SOLO incluir .page-subtitle en menús de selección de opciones (ej. home-users, operaciones).
           OMITIR en vistas de funcionalidad directa (ej. cash-register, bulk-upload). -->
      <p class="page-subtitle">
        Subtítulo descriptivo o saludo contextual para el usuario
      </p>
    </div>
  </div>

  <div class="header-right">
    <!-- Pill de Fecha -->
    <div class="date-pill">
      <mat-icon>calendar_today</mat-icon>
      <span>{{ currentDateFormatted }}</span>
    </div>

    <!-- Chip de Empresa (estilo pastel azul cielo) -->
    <div class="company-badge" *ngIf="infoCompanyName">
      <mat-icon>apartment</mat-icon>
      <span>{{ infoCompanyName }}</span>
    </div>
  </div>
</header>
```

### Estilos CSS Base del Contenedor Padre (`.main-container`) y Header (`.top-header`)
> **Importante**: El contenedor padre de cada vista (`.main-container`) debe mantener un espaciado compacto y uniforme igual al de `bulk-upload-view`: `padding: 16px 22px 24px` y `gap: 14px` (y en móvil `<= 640px`: `padding: 8px 10px` y `gap: 8px`). El `.top-header` utiliza `padding: 14px 20px`.

```css
.main-container {
  min-height: 92vh;
  padding: 16px 22px 24px;
  background-color: #f8fafc;
  display: flex;
  flex-direction: column;
  gap: 14px;
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
  user-select: none;
}

.top-header {
  background: #ffffff;
  border-radius: 12px;
  padding: 14px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

.brand-badge {
  width: 46px;
  height: 46px;
  border-radius: 12px;
  background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 10px -2px rgba(2, 132, 199, 0.35);
  flex-shrink: 0;
}

.title-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.page-title {
  font-size: 1.35rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
  line-height: 1.2;
  letter-spacing: -0.3px;
}

.page-subtitle {
  font-size: 0.84rem;
  color: #64748b;
  margin: 2px 0 0 0;
  font-weight: 500;
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
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 5px 11px;
  font-size: 0.76rem;
  font-weight: 600;
  color: #475569;
  white-space: nowrap;
}

.date-pill mat-icon {
  font-size: 15px;
  width: 15px;
  height: 15px;
  color: #0284c7;
}

.company-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border: 1px solid #bae6fd;
  border-radius: 8px;
  padding: 6px 13px;
  color: #0369a1;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.3px;
  box-shadow: 0 2px 6px rgba(2, 132, 199, 0.08);
}

.company-badge mat-icon {
  font-size: 18px;
  width: 18px;
  height: 18px;
  color: #0284c7;
  flex-shrink: 0;
}

.company-badge span {
  text-transform: uppercase;
  line-height: 1.2;
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

- **Breakpoints y Escalado Compacto del Header**:
  - **Botón Regresar (`.header-exit-btn` / `.btn-back`)**:
    - Desktop: `height: 38px; padding: 0 14px;`
    - Móvil (`<= 640px` / `768px`): Se reduce a `height: 34px !important; padding: 0 10px !important; font-size: 0.8rem !important;` con `mat-icon` de `18px`, y en `<= 420px` a `padding: 0 8px !important; font-size: 0.75rem !important;` para permitir que quepa más texto al lado en el header.
  - **Ícono del Componente (`.brand-badge`)**:
    - Desktop: `46px × 46px` (`border-radius: 12px`, `mat-icon` de `24px`).
    - Tablet (`<= 960px` / `992px`): `38px × 38px` (`border-radius: 10px`, `mat-icon` de `20px`).
    - Móvil (`<= 640px` / `768px`): `34px × 34px` (`border-radius: 8px`, `mat-icon` de `18px`).
  - **Fecha (`.date-pill`) y Chip de Empresa (`.company-badge`)**:
    - Tablet (`<= 960px` / `992px`): `.date-pill` pasa a `padding: 5px 10px; font-size: 0.74rem; gap: 6px;` (`mat-icon: 14px`), y `.company-badge` a `padding: 6px 12px; font-size: 0.78rem; gap: 8px; border-radius: 8px;` (`mat-icon: 17px`).
    - Móvil (`<= 640px` / `768px`): `.date-pill` pasa a `padding: 4px 8px; font-size: 0.7rem; gap: 5px; border-radius: 6px;` (`mat-icon: 13px`), y `.company-badge` a `padding: 5px 10px; font-size: 0.74rem; gap: 6px; border-radius: 8px;` (`mat-icon: 15px`).
  - **Contenedores y Grillas**:
    - `@media (max-width: 960px)`: El `.top-header` pasa a `flex-direction: column; align-items: stretch; padding: 12px 14px; gap: 10px;`.
    - `@media (max-width: 768px)`: Las grillas multi-columna de formularios pasan a `grid-template-columns: 1fr;`.
    - `@media (max-width: 640px)`:
      - Reducir el padding del contenedor principal (`.main-container`) a `8px 10px` y el `gap` a `8px` (y el `.top-header` a `padding: 8px 10px; gap: 8px;`).
      - En diálogos (`.dialog-content-custom`), eliminar cualquier `min-width` fijo (`min-width: unset; width: 100%;`) para evitar desbordamiento horizontal en móviles.

```css
@media (max-width: 960px) {
  .top-header {
    flex-direction: column;
    align-items: stretch;
    padding: 12px 14px;
    gap: 10px;
  }

  .header-left {
    flex-wrap: wrap;
    row-gap: 4px;
    column-gap: 10px;
  }

  .title-text {
    display: contents;
  }

  .page-subtitle {
    flex-basis: 100%;
    width: 100%;
  }

  .brand-badge {
    width: 38px;
    height: 38px;
    border-radius: 10px;
  }

  .brand-badge mat-icon {
    font-size: 20px;
    width: 20px;
    height: 20px;
  }

  .page-title {
    font-size: 1.18rem;
  }

  .header-right {
    justify-content: space-between;
    gap: 8px;
  }

  .date-pill {
    padding: 5px 10px;
    font-size: 0.74rem;
    gap: 6px;
  }

  .date-pill mat-icon {
    font-size: 14px;
    width: 14px;
    height: 14px;
  }

  .company-badge {
    flex: 1 1 auto;
    justify-content: center;
    padding: 6px 12px;
    font-size: 0.78rem;
    gap: 8px;
    border-radius: 8px;
  }

  .company-badge mat-icon {
    font-size: 17px;
    width: 17px;
    height: 17px;
  }
}

@media (max-width: 640px) {
  .main-container {
    padding: 8px 10px;
    gap: 8px;
  }

  .top-header {
    padding: 8px 10px;
    gap: 8px;
  }

  .header-exit-btn {
    height: 34px !important;
    padding: 0 10px !important;
    font-size: 0.8rem !important;
  }

  .header-exit-btn mat-icon {
    font-size: 18px !important;
    width: 18px !important;
    height: 18px !important;
  }

  .header-divider {
    height: 18px;
  }

  .brand-badge {
    width: 34px;
    height: 34px;
    border-radius: 8px;
  }

  .brand-badge mat-icon {
    font-size: 18px;
    width: 18px;
    height: 18px;
  }

  .page-title {
    font-size: 1.05rem;
  }

  .date-pill {
    padding: 4px 8px;
    font-size: 0.7rem;
    gap: 5px;
    border-radius: 6px;
  }

  .date-pill mat-icon {
    font-size: 13px;
    width: 13px;
    height: 13px;
  }

  .company-badge {
    padding: 5px 10px;
    font-size: 0.74rem;
    gap: 6px;
    border-radius: 8px;
  }

  .company-badge mat-icon {
    font-size: 15px;
    width: 15px;
    height: 15px;
  }
}
```

---

## ✅ Lista de Verificación (Checklist) para Nuevas Vistas o Rediseños

- [ ] **¿El contenedor raíz (`.main-container`) usa `#f8fafc`, `padding: 16px 22px 24px`, `gap: 14px`, y las tarjetas usan `#ffffff` con borde `#e2e8f0`?**
- [ ] **¿Se reemplazaron los iconos `.svg` antiguos por `<mat-icon>` dentro de cajas pastel (`.icon-box`)?**
- [ ] **¿El encabezado superior (`.top-header`) sigue la estructura con insignia, título `#0f172a`, fecha `.date-pill` y chip de empresa pastel `.company-badge` a la derecha?**
- [ ] **¿Se muestra el subtítulo (`.page-subtitle`) SOLO en vistas de selección de opciones (como `home-users` u `operaciones`) y se omite en vistas de funcionalidad directa (como `cash-register` o `bulk-upload`)?**
- [ ] **¿Se omitió el chip de conteo de módulos/opciones (`X habilitados` / `X opciones`) en el header de las vistas de selección?**
- [ ] **¿Las tarjetas de módulos/opciones son limpias (sin descripciones extensas ni chips de categoría redundantes) e incluyen `matRipple` y pie de acción?**
- [ ] **¿Las tablas usan cabeceras `#f1f5f9` en mayúsculas, `tabular-nums` en importes y buscadores redondeados de `42px-48px`?**
- [ ] **¿Los estados de carga cumplen con la skill `loader-patterns`?**
- [ ] **¿Se verificó el comportamiento responsivo en `960px`, `768px` y `640px`?**

