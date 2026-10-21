import {
  Component,
  ElementRef,
  ViewChild,
  OnDestroy,
  OnInit,
  Input,
  Output,
  EventEmitter,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { CameraPreviewComponent } from '../camera-preview/camera-preview.component';

interface Photo {
  previewUrl: SafeUrl;
  blob: Blob;
  base64: string;
}

@Component({
  selector: 'app-camera',
  templateUrl: './camera.component.html',
  styleUrls: ['./camera.component.css'],
})
export class CameraComponent implements OnInit, OnDestroy {
  @Input() maxPhotos: number = 16;
  @Output() photosChange = new EventEmitter<string[]>();

  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasElement!: ElementRef<HTMLCanvasElement>;

  photos: Photo[] = [];
  private stream: MediaStream | null = null;

  constructor(
    private sanitizer: DomSanitizer,
    private dialog: MatDialog
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
    if (this.photos.length >= this.maxPhotos || !this.stream) return;

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
          // Convertir blob a base64
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64String = reader.result as string;
            const newPhoto: Photo = {
              blob: blob,
              previewUrl: this.sanitizer.bypassSecurityTrustUrl(
                URL.createObjectURL(blob)
              ),
              base64: base64String.split(',')[1], // Quitar el prefijo data:image/jpeg;base64,
            };
            this.photos.push(newPhoto);
            this.emitPhotos();
            
            if (this.photos.length >= this.maxPhotos) {
              this.stopCamera();
            }
          };
          reader.readAsDataURL(blob);
        }
      },
      'image/jpeg',
      0.9
    );
  }

  openPreview(index: number): void {
    const dialogRef = this.dialog.open(CameraPreviewComponent, {
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
    this.emitPhotos();
    
    if (this.photos.length < this.maxPhotos && !this.stream) {
      this.startCamera();
    }
  }

  clearPhotos(): void {
    this.photos = [];
    this.emitPhotos();
  }

  stopCamera(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
  }

  private emitPhotos(): void {
    const base64Photos = this.photos.map((photo) => photo.base64);
    this.photosChange.emit(base64Photos);
  }

  getPhotosBase64(): string[] {
    return this.photos.map((photo) => photo.base64);
  }
}
