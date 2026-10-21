import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DocumentsService } from 'src/app/services/documents.service';

// Interfaz para los datos que recibirá el diálogo
export interface InspectionImagesDialogData {
  vehicleNumber: string;
  images: string[];
  action?: string;
}

@Component({
  selector: 'app-inspection-finish-images-dialog',
  templateUrl: './inspection-finish-images-dialog.component.html',
  styleUrls: ['./inspection-finish-images-dialog.component.css'],
})
export class InspectionFinishImagesDialogComponent {
  currentImageIndex: number = 0;
  zoomLevel: number = 1;
  minZoom: number = 0.5;
  maxZoom: number = 3;
  zoomStep: number = 0.25;

  // Variables para el panning
  isPanning: boolean = false;
  panX: number = 0;
  panY: number = 0;
  lastTouchX: number = 0;
  lastTouchY: number = 0;
  lastMouseX: number = 0;
  lastMouseY: number = 0;

  constructor(
    private documentsService: DocumentsService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<InspectionFinishImagesDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: InspectionImagesDialogData,
  ) {}

  // Ir a la imagen anterior
  previousImage(): void {
    if (this.currentImageIndex > 0) {
      this.currentImageIndex--;
      this.resetZoom();
    }
  }

  // Ir a la imagen siguiente
  nextImage(): void {
    if (this.currentImageIndex < this.data.images.length - 1) {
      this.currentImageIndex++;
      this.resetZoom();
    }
  }

  // Detectar cuando la imagen se ha cargado para ajustar el zoom inicial
  onImageLoad(event: Event): void {
    const img = event.target as HTMLImageElement;
    this.adjustInitialZoom(img);
  }

  // Ajustar zoom inicial basado en las dimensiones de la imagen
  private adjustInitialZoom(img: HTMLImageElement): void {
    const containerWidth = img.parentElement?.clientWidth || 800;
    const containerHeight = img.parentElement?.clientHeight || 600;

    const imageAspectRatio = img.naturalWidth / img.naturalHeight;
    const containerAspectRatio = containerWidth / containerHeight;

    // Si la imagen es más alta que ancha (vertical) y estamos en PC
    if (imageAspectRatio < 1 && containerWidth > 768) {
      // Calcular zoom para que la imagen use mejor el espacio disponible
      const widthRatio = containerWidth / img.naturalWidth;
      const heightRatio = containerHeight / img.naturalHeight;

      // Usar el menor ratio para que la imagen quepa completamente
      const optimalZoom = Math.min(widthRatio, heightRatio);

      // Aplicar un factor de ajuste para imágenes verticales (entre 0.8 y 1.2)
      this.zoomLevel = Math.min(Math.max(optimalZoom * 0.9, 0.8), 1.2);
    } else {
      // Para imágenes horizontales o en móviles, mantener zoom normal
      this.zoomLevel = 1;
    }

    // Resetear pan al cambiar zoom inicial
    this.panX = 0;
    this.panY = 0;
  }

  // Verificar si es la primera imagen
  isFirstImage(): boolean {
    return this.currentImageIndex === 0;
  }

  // Verificar si es la última imagen
  isLastImage(): boolean {
    return this.currentImageIndex === this.data.images.length - 1;
  }

  // Obtener la imagen actual
  getCurrentImage(): string {
    return this.data.images[this.currentImageIndex];
  }

  // Obtener el texto del contador
  getCounterText(): string {
    return `${this.currentImageIndex + 1} de ${this.data.images.length}`;
  }

  // Funciones de zoom
  zoomIn(): void {
    if (this.zoomLevel < this.maxZoom) {
      this.zoomLevel = Math.min(this.zoomLevel + this.zoomStep, this.maxZoom);
    }
  }

  zoomOut(): void {
    if (this.zoomLevel > this.minZoom) {
      this.zoomLevel = Math.max(this.zoomLevel - this.zoomStep, this.minZoom);
    }
  }

  resetZoom(): void {
    // Resetear al zoom inicial (que puede ser diferente de 1 para imágenes verticales)
    const imgElement = document.querySelector(
      '.inspection-image',
    ) as HTMLImageElement;
    if (imgElement && imgElement.complete) {
      this.adjustInitialZoom(imgElement);
    } else {
      this.zoomLevel = 1;
    }
    this.panX = 0;
    this.panY = 0;
  }

  // Zoom con rueda del mouse
  onWheel(event: WheelEvent): void {
    event.preventDefault();
    if (event.deltaY < 0) {
      this.zoomIn();
    } else {
      this.zoomOut();
    }
  }

  // Eventos táctiles para móviles
  onTouchStart(event: TouchEvent): void {
    if (this.zoomLevel > 1 && event.touches.length === 1) {
      event.preventDefault();
      this.isPanning = true;
      this.lastTouchX = event.touches[0].clientX;
      this.lastTouchY = event.touches[0].clientY;
    }
  }

  onTouchMove(event: TouchEvent): void {
    if (this.isPanning && event.touches.length === 1 && this.zoomLevel > 1) {
      event.preventDefault();
      const deltaX = event.touches[0].clientX - this.lastTouchX;
      const deltaY = event.touches[0].clientY - this.lastTouchY;

      this.panX += deltaX;
      this.panY += deltaY;

      this.lastTouchX = event.touches[0].clientX;
      this.lastTouchY = event.touches[0].clientY;

      this.constrainPan();
    }
  }

  onTouchEnd(event: TouchEvent): void {
    if (event.touches.length === 0) {
      this.isPanning = false;
    }
  }

  // Eventos de mouse para desktop
  onMouseDown(event: MouseEvent): void {
    if (this.zoomLevel > 1) {
      event.preventDefault();
      this.isPanning = true;
      this.lastMouseX = event.clientX;
      this.lastMouseY = event.clientY;
    }
  }

  onMouseMove(event: MouseEvent): void {
    if (this.isPanning && this.zoomLevel > 1) {
      event.preventDefault();
      const deltaX = event.clientX - this.lastMouseX;
      const deltaY = event.clientY - this.lastMouseY;

      this.panX += deltaX;
      this.panY += deltaY;

      this.lastMouseX = event.clientX;
      this.lastMouseY = event.clientY;

      this.constrainPan();
    }
  }

  onMouseUp(): void {
    this.isPanning = false;
  }

  onMouseLeave(): void {
    this.isPanning = false;
  }

  // Limitar el panning para que no se vaya más allá de los bordes
  private constrainPan(): void {
    // Calcular los límites basados en el nivel de zoom actual
    // El zoom base puede ser diferente de 1, así que calculamos desde el zoom inicial
    const baseZoom = this.getInitialZoom();
    const scaleFactor = Math.max(this.zoomLevel - baseZoom, 0);
    const maxPanX = scaleFactor * 250; // Ajuste más generoso para el panning horizontal
    const maxPanY = scaleFactor * 250; // Ajuste más generoso para el panning vertical

    // Limitar el panning dentro de los límites calculados
    this.panX = Math.max(-maxPanX, Math.min(maxPanX, this.panX));
    this.panY = Math.max(-maxPanY, Math.min(maxPanY, this.panY));
  }

  // Obtener el zoom inicial ideal para la imagen actual
  private getInitialZoom(): number {
    const imgElement = document.querySelector(
      '.inspection-image',
    ) as HTMLImageElement;
    if (!imgElement || !imgElement.complete) return 1;

    const containerWidth = imgElement.parentElement?.clientWidth || 800;
    const containerHeight = imgElement.parentElement?.clientHeight || 600;

    const imageAspectRatio = imgElement.naturalWidth / imgElement.naturalHeight;

    // Si es imagen vertical en PC, calcular zoom óptimo
    if (imageAspectRatio < 1 && containerWidth > 768) {
      const widthRatio = containerWidth / imgElement.naturalWidth;
      const heightRatio = containerHeight / imgElement.naturalHeight;
      const optimalZoom = Math.min(widthRatio, heightRatio);
      return Math.min(Math.max(optimalZoom * 0.9, 0.8), 1.2);
    }

    return 1;
  }

  // Obtener el transform completo (zoom + pan)
  getImageTransform(): string {
    return `scale(${this.zoomLevel}) translate(${
      this.panX / this.zoomLevel
    }px, ${this.panY / this.zoomLevel}px)`;
  }

  // Verificar si se puede hacer más zoom in
  canZoomIn(): boolean {
    return this.zoomLevel < this.maxZoom;
  }

  // Verificar si se puede hacer más zoom out
  canZoomOut(): boolean {
    // El zoom mínimo ahora puede ser diferente dependiendo de la imagen
    const effectiveMinZoom = Math.min(this.minZoom, this.getInitialZoom());
    return this.zoomLevel > effectiveMinZoom;
  }

  // Obtener el porcentaje de zoom
  getZoomPercentage(): string {
    return `${Math.round(this.zoomLevel * 100)}%`;
  }

  downloadCurrentImage(): void {
    const imageUrl = this.getCurrentImage();
    const data = { image_url: imageUrl };
    const filename = this.getDownloadFileName();

    this.documentsService
      .downloadDocument('inspections/download_image', data, filename)
      .subscribe({
        next: () => {
          this.openSnackbar('Imagen descargada correctamente.');
        },
        error: (error) => {
          console.error('Error descargando imagen:', error);
        },
      });
  }

  private getDownloadFileName(): string {
    const currentIndex = this.currentImageIndex + 1;
    return `inspeccion_vehiculo_${this.data.vehicleNumber}_imagen_${currentIndex}.jpg`;
  }

  openSnackbar(message: string) {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }

  closeDialog(): void {
    this.dialogRef.close(this.data.action);
  }
}
