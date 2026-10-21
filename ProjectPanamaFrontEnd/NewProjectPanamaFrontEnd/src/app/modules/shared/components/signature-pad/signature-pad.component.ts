import { Component, ViewChild, ElementRef, AfterViewInit, Output, EventEmitter, OnDestroy, HostListener } from '@angular/core';

@Component({
  selector: 'app-signature-pad',
  templateUrl: './signature-pad.component.html',
  styleUrls: ['./signature-pad.component.css']
})
export class SignaturePadComponent implements AfterViewInit, OnDestroy {
  @ViewChild('signatureCanvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;
  @Output() signatureSubmit = new EventEmitter<string>();

  private context!: CanvasRenderingContext2D;
  private isDrawing = false;
  private resizeTimeout: any = null;

  ngAfterViewInit(): void {
    this.initializeCanvas();
  }

  ngOnDestroy(): void {
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }
  }

  @HostListener('window:resize', ['$event'])
  @HostListener('window:orientationchange', ['$event'])
  onResize(event?: Event): void {
    // Debounce resize to avoid excessive calls
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }

    this.resizeTimeout = setTimeout(() => {
      this.handleResize();
    }, 100);
  }

  private initializeCanvas(): void {
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      console.error('Could not get 2D context from canvas');
      return;
    }

    this.context = ctx;
    this.setCanvasSize();
    this.setupEventListeners();
  }

  private setCanvasSize(): void {
    const canvas = this.canvasRef.nativeElement;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }

  private handleResize(): void {
    if (!this.context || !this.canvasRef) return;

    const canvas = this.canvasRef.nativeElement;
    
    // Save the current drawing as an image
    const tempCanvas = document.createElement('canvas');
    const tempContext = tempCanvas.getContext('2d');
    
    if (!tempContext) return;

    // Store old dimensions
    const oldWidth = canvas.width;
    const oldHeight = canvas.height;

    // Copy current canvas to temporary canvas
    tempCanvas.width = oldWidth;
    tempCanvas.height = oldHeight;
    tempContext.drawImage(canvas, 0, 0);

    // Resize the main canvas
    this.setCanvasSize();

    // Get new dimensions
    const newWidth = canvas.width;
    const newHeight = canvas.height;

    // Calculate scale factors
    const scaleX = newWidth / oldWidth;
    const scaleY = newHeight / oldHeight;

    // Draw the old content scaled to the new size
    this.context.drawImage(
      tempCanvas,
      0, 0, oldWidth, oldHeight,
      0, 0, newWidth, newHeight
    );
  }

  private setupEventListeners(): void {
    const canvas = this.canvasRef.nativeElement;

    // Mouse events
    canvas.addEventListener('mousedown', this.startDrawing.bind(this));
    canvas.addEventListener('mousemove', this.draw.bind(this));
    canvas.addEventListener('mouseup', this.stopDrawing.bind(this));
    canvas.addEventListener('mouseleave', this.stopDrawing.bind(this));

    // Touch events
    canvas.addEventListener('touchstart', this.handleTouchStart.bind(this));
    canvas.addEventListener('touchmove', this.handleTouchMove.bind(this));
    canvas.addEventListener('touchend', this.stopDrawing.bind(this));
  }

  private startDrawing(event: MouseEvent): void {
    this.isDrawing = true;
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    this.context.beginPath();
    this.context.moveTo(x, y);
  }

  private draw(event: MouseEvent): void {
    if (!this.isDrawing) return;

    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    this.context.lineTo(x, y);
    this.context.strokeStyle = '#000';
    this.context.lineWidth = 2;
    this.context.lineCap = 'round';
    this.context.lineJoin = 'round';
    this.context.stroke();
  }

  private stopDrawing(): void {
    if (this.isDrawing) {
      this.context.closePath();
      this.isDrawing = false;
    }
  }

  private handleTouchStart(event: TouchEvent): void {
    event.preventDefault();
    const touch = event.touches[0];
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    this.isDrawing = true;
    this.context.beginPath();
    this.context.moveTo(x, y);
  }

  private handleTouchMove(event: TouchEvent): void {
    event.preventDefault();
    if (!this.isDrawing) return;

    const touch = event.touches[0];
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    this.context.lineTo(x, y);
    this.context.strokeStyle = '#000';
    this.context.lineWidth = 2;
    this.context.lineCap = 'round';
    this.context.lineJoin = 'round';
    this.context.stroke();
  }

  clearPad(): void {
    const canvas = this.canvasRef.nativeElement;
    this.context.clearRect(0, 0, canvas.width, canvas.height);
  }

  saveSignature(): void {
    const canvas = this.canvasRef.nativeElement;
    const base64String = canvas.toDataURL('image/png');
    this.signatureSubmit.emit(base64String);
  }
}
