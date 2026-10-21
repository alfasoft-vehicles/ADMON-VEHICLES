---
name: loader-patterns
description: "Pautas de diseño y arquitectura para estados de carga (loaders) en la aplicación: uso de LoadingService en vistas generales y componentes principales, y diseño de loaders integrados en diálogos modales (loader completo de diálogo, loader inline para campos/tarjetas, banners de procesamiento y estados de subida)."
---

# Pautas de Diseño: Estados de Carga (Loaders)

Esta skill define el estándar visual y arquitectónico para la implementación de loaders y estados de carga en toda la plataforma.

---

## 🧭 Principio Fundamental

> **Nunca utilices un `<mat-progress-bar>` aislado o huérfano sin contexto visual.**
> Toda acción que requiera tiempo de espera debe comunicar al usuario qué está sucediendo, qué datos se están procesando y si puede o no interactuar con la pantalla.

---

## 🔀 Árbol de Decisión

```
¿Dónde ocurre la carga?
│
├── 1. Componente General / Vista de Página (Rutas, tablas principales, módulos)
│   └── ➔ USAR: LoadingService (Diálogo global LoadingDialogComponent)
│
└── 2. Dentro de un Diálogo Modal (MatDialog)
    ├── ¿El diálogo completo está cargando/guardando?
    │   └── ➔ USAR: Loader Completo de Diálogo (.dialog-loader-container)
    │
    ├── ¿Un campo o sección específica está cargando (ej. autocomplete, consulta secundaria)?
    │   └── ➔ USAR: Loader Inline / Card Pequeña (.dialog-inline-loader)
    │
    └── ¿Se están subiendo archivos o procesando transacciones críticas?
        └── ➔ USAR: Banner de Procesamiento / Subida (.processing-notice-banner o .upload-status-container)
```

> [!WARNING]
> **Prohibido usar `LoadingService` dentro de un `MatDialog` abierto.**
> `LoadingService` abre un `MatDialog` global (`LoadingDialogComponent`). Abrir un diálogo sobre otro diálogo produce conflictos de backdrop, pérdidas de foco y riesgo de cerrar el modal padre por error. En diálogos siempre se usan loaders locales integrados en la plantilla del propio modal.

---

## 1. Vistas Generales con `LoadingService`

Aplica a componentes de rutas principales (ej. `CashRegisterViewComponent`, `BulkUploadViewComponent`, `InspectionsTableComponent`).

### Implementación en TypeScript

```typescript
import { Component, OnInit } from '@angular/core';
import { LoadingService } from 'src/app/services/loading.service';

@Component({ ... })
export class MyTableComponent implements OnInit {
  isLoadingData = false;

  constructor(
    private apiService: ApiService,
    private loadingService: LoadingService,
  ) {}

  fetchData(): void {
    this.isLoadingData = true;
    
    // 1. Mostrar el loader con mensajes claros y contextuales
    this.loadingService.show({
      title: 'Cargando Información',
      message: 'Obteniendo los registros desde el servidor...',
      submessage: 'Por favor espere un momento',
    });

    this.apiService.getData('endpoint').subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.isLoadingData = false;
        // 2. Ocultar siempre al terminar con éxito
        this.loadingService.hide();
      },
      error: (err) => {
        console.error('Error:', err);
        this.isLoadingData = false;
        // 3. Ocultar siempre ante error
        this.loadingService.hide();
      },
    });
  }
}
```

### Reglas para la Plantilla HTML
- **Eliminar** cualquier `<mat-progress-bar>` que estuviera actuando como loader principal de la página.
- Mantener la condición `*ngIf="!isLoadingData"` en el contenedor principal de la tabla o formulario para evitar parpadeos de contenido vacío o desconfigurado mientras el modal de carga está visible.

---

## 2. Loader Completo de Diálogo (`.dialog-loader-container`)

Se utiliza cuando un diálogo modal (`MatDialog`) está recuperando sus datos iniciales (ej. detalles de inspección, carga previa de vehículos) o procesando la creación/actualización inicial.

### Plantilla HTML

```html
<h2 mat-dialog-title>Detalles de la Operación</h2>

<mat-dialog-content class="mat-typography">
  <!-- Loader completo si está cargando -->
  <div class="dialog-loader-container" *ngIf="isLoading">
    <div class="spinner-wrapper">
      <mat-progress-spinner
        mode="indeterminate"
        [diameter]="52"
        [strokeWidth]="4"
        color="primary"
        class="custom-spinner"
      ></mat-progress-spinner>
      <div class="spinner-center-icon">
        <mat-icon>hourglass_top</mat-icon>
      </div>
    </div>
    <div class="loader-text">
      <h3 class="loader-title">Cargando información</h3>
      <p class="loader-message">Obteniendo los detalles del registro...</p>
    </div>
    <div class="progress-bar-wrapper">
      <mat-progress-bar mode="indeterminate" color="primary"></mat-progress-bar>
    </div>
  </div>

  <!-- Contenido real cuando termina de cargar -->
  <div class="dialog-content-body" *ngIf="!isLoading">
    <!-- Formularios, tablas o detalles aquí -->
  </div>
</mat-dialog-content>
```

### Estilos CSS

```css
/* Contenedor central del loader de diálogo */
.dialog-loader-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 36px 20px 28px 20px;
  text-align: center;
  width: 100%;
  box-sizing: border-box;
}

/* Spinner circular con icono centrado */
.spinner-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  width: 60px;
  height: 60px;
}

.custom-spinner {
  filter: drop-shadow(0 2px 8px rgba(2, 132, 199, 0.25));
}

.spinner-center-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #0284c7;
  animation: pulse-icon 1.8s ease-in-out infinite;
}

.spinner-center-icon mat-icon {
  font-size: 22px;
  width: 22px;
  height: 22px;
}

@keyframes pulse-icon {
  0%, 100% {
    opacity: 0.55;
    transform: translate(-50%, -50%) scale(0.9);
  }
  50% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.1);
  }
}

/* Tipografía de carga */
.loader-text {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  margin-bottom: 18px;
}

.loader-title {
  margin: 0;
  font-size: 1.12rem;
  font-weight: 700;
  color: #0f172a;
}

.loader-message {
  margin: 0;
  font-size: 0.86rem;
  color: #64748b;
  max-width: 320px;
  line-height: 1.4;
}

/* Barra inferior complementaria */
.progress-bar-wrapper {
  width: 100%;
  max-width: 240px;
  border-radius: 6px;
  overflow: hidden;
}
```

---

## 3. Loader Inline / Sección / Card (`.dialog-inline-loader`)

Se utiliza cuando un elemento dentro del diálogo (como un autocomplete, un combo dependiente o una búsqueda secundaria) está cargando datos de fondo sin bloquear el resto de campos ya completados.

### Plantilla HTML

```html
<div class="dialog-inline-loader" *ngIf="isLoadingSection">
  <div class="spinner-wrapper-small">
    <mat-progress-spinner
      mode="indeterminate"
      [diameter]="28"
      [strokeWidth]="3"
      color="primary"
    ></mat-progress-spinner>
    <div class="spinner-center-icon-small">
      <mat-icon>sync</mat-icon>
    </div>
  </div>
  <div class="inline-loader-text">
    <span class="inline-loader-title">Cargando información del registro...</span>
    <span class="inline-loader-subtitle">Obteniendo datos complementarios</span>
  </div>
</div>
```

### Estilos CSS

```css
.dialog-inline-loader {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  margin: 8px 0 14px 0;
}

.spinner-wrapper-small {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  flex-shrink: 0;
}

.spinner-center-icon-small {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #0284c7;
}

.spinner-center-icon-small mat-icon {
  font-size: 15px;
  width: 15px;
  height: 15px;
}

.inline-loader-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.inline-loader-title {
  font-size: 0.84rem;
  font-weight: 600;
  color: #1e293b;
}

.inline-loader-subtitle {
  font-size: 0.74rem;
  color: #64748b;
}
```

---

## 4. Banners de Procesamiento y Carga de Archivos

Se utiliza en dos casos principales:
1. **Subida de fotos o documentos** (`.upload-status-container`): como en captura de fotos de inspección.
2. **Procesamiento de lotes/archivos bancarios** (`.processing-notice-banner`): como en `select-bank-dialog.component.html`.

### Variante A: Contenedor de Subida de Fotos/Archivos (`.upload-status-container`)

```html
<div *ngIf="isUploading" class="upload-status-container">
  <div class="upload-spinner-box">
    <mat-progress-spinner
      mode="indeterminate"
      [diameter]="36"
      [strokeWidth]="3"
      color="primary"
    ></mat-progress-spinner>
    <div class="upload-spinner-center">
      <mat-icon>cloud_upload</mat-icon>
    </div>
  </div>
  <div class="upload-text-box">
    <span class="upload-title">{{ uploadStatus }}</span>
    <span class="upload-subtitle">Guardando archivos en el servidor...</span>
  </div>
  <div class="upload-bar-wrapper">
    <mat-progress-bar mode="indeterminate" color="primary"></mat-progress-bar>
  </div>
</div>
```

```css
.upload-status-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin: 20px 16px;
  padding: 20px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  text-align: center;
}

.upload-spinner-box {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
}

.upload-spinner-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #0284c7;
  animation: pulse-icon 1.8s ease-in-out infinite;
}

.upload-spinner-center mat-icon {
  font-size: 20px;
  width: 20px;
  height: 20px;
}

.upload-text-box {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.upload-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: #0f172a;
}

.upload-subtitle {
  font-size: 0.8rem;
  color: #64748b;
}

.upload-bar-wrapper {
  width: 100%;
  max-width: 260px;
  border-radius: 6px;
  overflow: hidden;
}
```

### Variante B: Banner de Procesamiento y Prevención de Cierre (Estilo `select-bank-dialog`)

```html
<!-- Barra de progreso superior fija justo bajo el divider del header -->
<mat-progress-bar
  *ngIf="isUploading"
  mode="indeterminate"
  class="upload-progress-bar"
></mat-progress-bar>

<!-- Banner informativo que reacciona al estado de carga -->
<div class="processing-notice-banner" [class.processing-active]="isUploading">
  <mat-icon class="notice-banner-icon" [class.spin-icon]="isUploading">
    {{ isUploading ? 'sync' : 'warning_amber' }}
  </mat-icon>
  <div class="notice-banner-text">
    <strong *ngIf="!isUploading">Aviso de seguridad:</strong>
    <strong *ngIf="isUploading">¡Procesamiento en progreso!</strong>
    <span>
      {{
        isUploading
          ? ' Por favor NO cierre este diálogo ni recargue la página mientras se guardan las transacciones.'
          : ' Al iniciar la operación, permanezca en esta pantalla hasta que se confirme la finalización.'
      }}
    </span>
  </div>
</div>
```

```css
.processing-notice-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 8px;
  background-color: #fffbeb;
  border: 1px solid #fef3c7;
  color: #92400e;
  margin-bottom: 16px;
  transition: all 0.3s ease;
}

.processing-notice-banner.processing-active {
  background-color: #f0fdf4;
  border-color: #bbf7d0;
  color: #166534;
}

.notice-banner-icon {
  font-size: 20px;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.spin-icon {
  animation: spin 1.5s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.notice-banner-text {
  font-size: 0.84rem;
  line-height: 1.4;
}
```

---

## ✅ Lista de Verificación (Checklist)

- [ ] **¿Es una vista de página/módulo?** -> Utiliza `loadingService.show(...)` y `loadingService.hide()`.
- [ ] **¿Es un diálogo modal?** -> Usa loader local (`.dialog-loader-container`, `.dialog-inline-loader` o `.upload-status-container`). No llames a `loadingService.show()`.
- [ ] **¿Se maneja el error?** -> En todos los observables, el loader debe ocultarse tanto en `next` como en `error`.
- [ ] **¿Las acciones están deshabilitadas?** -> Durante la carga (`isLoading` o `isUploading`), deshabilita botones de confirmar/cancelar para evitar llamadas duplicadas.
- [ ] **¿Se removió el `mat-progress-bar` viejo y huérfano?** -> Si existía una barra suelta de diseño legacy, debe ser reemplazada por el loader correspondiente según esta pauta.
