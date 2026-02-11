import {
  Component,
  ElementRef,
  ViewChild,
  OnDestroy,
  OnInit,
  Input,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { forkJoin, Observable, of, throwError } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';
import { ApiService } from 'src/app/services/api.service';
import { ImagePreviewRepairDialogComponent } from '../image-preview-repair-dialog/image-preview-repair-dialog.component';
import { MatSnackBar } from '@angular/material/snack-bar';

interface Photo {
  previewUrl: SafeUrl;
  blob: Blob;
}

@Component({
  selector: 'app-take-photos-repair',
  templateUrl: './take-photos-repair.component.html',
  styleUrls: ['./take-photos-repair.component.css'],
})
export class TakePhotosRepairComponent implements OnInit, OnDestroy {
  @Input() vehicleRepairId!: string;

  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasElement!: ElementRef<HTMLCanvasElement>;

  readonly MAX_PHOTOS = 6;
  photos: Photo[] = [];
  isUploading = false;
  uploadStatus = '';
  private stream: MediaStream | null = null;

  constructor(
    private sanitizer: DomSanitizer,
    private apiService: ApiService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.startCamera();
  }

  ngOnDestroy(): void {
    this.stopCamera();
  }

  async startCamera(): Promise<void> {
    if (this.stream) return;
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      this.videoElement.nativeElement.srcObject = this.stream;
    } catch (err) {
      console.error('Error al acceder a la cámara:', err);
    }
  }

  takePhoto(): void {
    if (this.photos.length >= this.MAX_PHOTOS || !this.stream) return;

    const video = this.videoElement.nativeElement;
    const canvas = this.canvasElement.nativeElement;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas
      .getContext('2d')
      ?.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const newPhoto: Photo = {
            blob: blob,
            previewUrl: this.sanitizer.bypassSecurityTrustUrl(
              URL.createObjectURL(blob),
            ),
          };
          this.photos.push(newPhoto);
          if (this.photos.length >= this.MAX_PHOTOS) {
            this.stopCamera();
          }
        }
      },
      'image/jpeg',
      0.9,
    );
  }

  openPreview(index: number): void {
    const dialogRef = this.dialog.open(ImagePreviewRepairDialogComponent, {
      data: { imageUrl: this.photos[index].previewUrl },
      width: 'auto',
      panelClass: 'custom-dialog-container',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && result.delete) {
        this.deletePhoto(index);
      }
    });
  }

  deletePhoto(index: number): void {
    this.photos.splice(index, 1);
    if (this.photos.length < this.MAX_PHOTOS && !this.stream) {
      this.startCamera();
    }
  }

  sendAllPhotos(): Observable<any> {
    if (this.photos.length === 0 || !this.vehicleRepairId) {
      this.uploadStatus =
        'Error: Faltan datos para la subida (ID de reparación de vehículo).';
      console.error(this.uploadStatus);
      this.openSnackbar(
        'Realiza la captura de las fotos para guardar el registro',
      );
      return throwError(this.uploadStatus);
    }

    this.isUploading = true;
    this.uploadStatus = `Subiendo ${this.photos.length} fotos...`;

    const formData = new FormData();
    this.photos.forEach((photo, index) => {
      formData.append('images', photo.blob, `photo_${index + 1}.jpg`);
    });

    // TODO: Replace with actual API endpoint when available
    return this.apiService
      .uploadPhoto(
        'vehicle-repair/upload_images/' + this.vehicleRepairId,
        formData,
      )
      .pipe(
        tap((response) => {
          this.uploadStatus =
            response.message || '¡Todas las fotos se han subido con éxito!';
          return true;
        }),
        catchError((err) => {
          this.uploadStatus =
            err.error?.detail ||
            'Error al enviar las fotos. Inténtalo de nuevo.';
          console.error('Error en la subida:', err);
          this.openSnackbar('Error al subir las fotos. Inténtalo de nuevo.');
          return throwError(err);
        }),
        finalize(() => {
          this.isUploading = false;
        }),
      );
  }

  clearPhotos(): void {
    this.photos = [];
  }

  stopCamera(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
  }

  openSnackbar(message: string) {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }
}
