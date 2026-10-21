import {
  Component,
  OnInit,
  ElementRef,
  ViewChild,
  OnDestroy,
  ChangeDetectorRef,
} from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ApiService } from 'src/app/services/api.service';
import { ErrorHandlerService } from 'src/app/services/error-handler.service';
import * as pdfjsLib from 'pdfjs-dist'; // Importar pdfjs-dist

@Component({
  selector: 'app-pdf-viewer',
  templateUrl: './pdf-viewer.component.html',
  styleUrls: ['./pdf-viewer.component.css'],
})
export class PdfViewerComponent implements OnInit, OnDestroy {
  @ViewChild('pdfPagesContainer', { static: false })
  pdfPagesContainer!: ElementRef<HTMLDivElement>;

  isLoading: boolean = true;
  pdfLoadError: string | null = null;
  private pdfDocument: pdfjsLib.PDFDocumentProxy | null = null;
  private activeBlobUrls: string[] = [];

  isDesktop: boolean = false;
  isIOS: boolean = false;
  isAndroid: boolean = false;
  safePdfUrl: SafeResourceUrl | null = null;
  pdfBlob: Blob | null = null; // Para almacenar el Blob original del PDF

  constructor(
    private apiService: ApiService,
    private cdr: ChangeDetectorRef,
    private sanitizer: DomSanitizer,
  ) {
    console.log('PdfViewerComponent constructor: Setting workerSrc');
    // Asegúrate que la ruta coincida con tu configuración en angular.json
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      'assets/pdfjs-worker/pdf.worker.min.js';
  }

  ngOnInit(): void {
    const userAgent = navigator.userAgent;
    this.isDesktop = !/Mobi|Android|iPhone|iPad|iPod/i.test(userAgent);
    this.isIOS = /iPhone|iPad|iPod/i.test(userAgent);
    this.isAndroid = /Android/i.test(userAgent);

    console.log(
      `PdfViewerComponent ngOnInit: Starting PDF load process. Is Desktop: ${this.isDesktop}, Is iOS: ${this.isIOS}, Is Android: ${this.isAndroid}`,
    );

    // Lógica para iPad que se identifica como Mac (se maneja en loadPdf si isDesktop es true)
    const isMacintosh = /Macintosh/i.test(userAgent);
    const hasTouch = 'ontouchend' in document || navigator.maxTouchPoints > 0;
    if (isMacintosh && hasTouch && this.isDesktop) {
      console.log(
        'ngOnInit: Detected iPad masquerading as Mac. Will be handled by desktop logic + auto-download.',
      );
      // No necesitamos cambiar isIOS o isAndroid aquí, ya que isDesktop será true.
    }

    this.isLoading = true;
    this.pdfLoadError = null;
    this.pdfBlob = null;
    const endpoint = localStorage.getItem('pdfEndpoint');
    const dataParam = localStorage.getItem('pdfData') || '0';
    console.log(`ngOnInit: Endpoint: ${endpoint}, DataParam: ${dataParam}`);

    if (endpoint) {
      if (dataParam !== '0') {
        let data = {};
        try {
          data = JSON.parse(dataParam);
        } catch (e) {
          this.pdfLoadError =
            'Error: Parámetros del PDF inválidos. Contacta a soporte con este error.';
          this.isLoading = false;
          this.cleanupLocalStorage();
          this.cdr.detectChanges();
          return;
        }
        this.loadPdf(endpoint, data);
      } else {
        this.loadPdf(endpoint);
      }
    } else {
      this.pdfLoadError =
        'Error: Endpoint del PDF no encontrado. Contacta a soporte con este error.';
      this.isLoading = false;
      this.cleanupLocalStorage();
      this.cdr.detectChanges();
    }
  }

  private loadPdf(endpoint: string, data?: any): void {
    console.log(
      `loadPdf: Attempting to load PDF from endpoint: ${endpoint}`,
      data ? 'with POST data' : 'with GET request',
    );
    const observable = data
      ? this.apiService.postPdf(endpoint, data)
      : this.apiService.getPdf(endpoint);

    observable.subscribe(
      async (responseBlob: Blob) => {
        console.log('loadPdf success: Received responseBlob', responseBlob);
        if (!responseBlob || responseBlob.size === 0) {
          this.pdfLoadError =
            'Error: Datos de PDF vacíos recibidos del servidor. Contacta a soporte con este error.';
          this.isLoading = false;
          this.cleanupLocalStorage();
          this.cdr.detectChanges();
          return;
        }

        // Si el backend respondió con un JSON (mensaje de error) en lugar de un PDF, mostrar ese mensaje
        if (responseBlob.type && responseBlob.type.includes('json')) {
          const backendMessage =
            await this.extractMessageFromBlob(responseBlob);
          this.pdfLoadError = `No se pudo generar el PDF: ${backendMessage}`;
          this.isLoading = false;
          this.cleanupLocalStorage();
          this.cdr.detectChanges();
          return;
        }
        this.cleanupLocalStorage();
        this.pdfBlob = responseBlob; // Guardar el Blob original

        if (this.isDesktop) {
          console.log(
            'loadPdf: Desktop detected. Creating blob URL for iframe.',
          );
          const blobUrl = URL.createObjectURL(this.pdfBlob);
          this.activeBlobUrls.push(blobUrl);
          this.safePdfUrl =
            this.sanitizer.bypassSecurityTrustResourceUrl(blobUrl);
          this.isLoading = false;
          this.pdfLoadError = null;
          this.cdr.detectChanges();

          // Nueva lógica: si es un Mac (que podría ser un iPad), también descargar.
          const isMacintosh = /Macintosh/i.test(navigator.userAgent);
          if (isMacintosh) {
            console.log(
              'loadPdf: Macintosh detected (could be iPad). Triggering download as well.',
            );
            // Pequeña demora para asegurar que el iframe comience a cargar antes de la descarga
            setTimeout(() => {
              if (this.pdfBlob) {
                // Re-verificar por si acaso
                this.downloadPdf();
              }
            }, 500); // 500ms de demora, ajustar si es necesario
          }
        } else {
          // No es Desktop, entonces es Móvil
          if (this.isIOS) {
            // Para iOS (iPhone/iPad no Mac): Intentar descarga/apertura directa
            console.log(
              'loadPdf: iOS Mobile detected. Triggering direct OS handling.',
            );
            this.isLoading = false; // Indicar que la carga de datos ha terminado
            this.pdfLoadError = null;
            this.cdr.detectChanges(); // Actualizar UI antes de la acción
            this.downloadPdf(); // iOS maneja esto para "Abrir con..." o descargar
          } else if (this.isAndroid) {
            // Para Android: Renderizar con PDF.js en canvas
            console.log(
              'loadPdf: Android Mobile detected. Processing with PDF.js.',
            );
            try {
              const arrayBuffer = await this.pdfBlob.arrayBuffer();
              if (arrayBuffer.byteLength === 0) {
                this.pdfLoadError =
                  'Error: Los datos del PDF están vacíos después de la conversión para Android. Contacta a soporte con este error.';
                this.isLoading = false;
                this.cdr.detectChanges();
                return;
              }
              this.pdfDocument = await pdfjsLib.getDocument({
                data: arrayBuffer,
              }).promise;
              if (this.pdfDocument) {
                this.isLoading = false;
                this.pdfLoadError = null;
                this.cdr.detectChanges(); // Actualizar UI para que #pdfPagesContainer aparezca

                Promise.resolve().then(() => {
                  // Esperar a que el DOM se actualice
                  if (
                    this.pdfPagesContainer &&
                    this.pdfPagesContainer.nativeElement
                  ) {
                    console.log(
                      'loadPdf Android: pdfPagesContainer is now available. Calling renderAllPages.',
                    );
                    this.renderAllPages();
                  } else {
                    console.error(
                      'loadPdf Android: pdfPagesContainer still not available after DOM update.',
                    );
                    this.pdfLoadError =
                      'Error: El área de visualización del PDF no pudo ser inicializada para Android. Contacta a soporte con este error.';
                    this.cdr.detectChanges();
                  }
                });
              } else {
                this.pdfLoadError =
                  'Error: Falló al analizar la estructura del documento PDF para Android. Contacta a soporte con este error.';
                this.isLoading = false;
                this.cdr.detectChanges();
              }
            } catch (error) {
              console.error(
                'loadPdf Android: Error loading or rendering PDF with PDF.js:',
                error,
              );
              this.pdfLoadError =
                'Error: No se pudo cargar o renderizar el PDF para Android. Contacta a soporte con este error.';
              this.isLoading = false;
              this.cdr.detectChanges();
            }
          } else {
            // Fallback para otros móviles no identificados específicamente (raro)
            // Renderizar en canvas como un default seguro.
            console.log(
              'loadPdf: Other Mobile detected. Defaulting to PDF.js rendering.',
            );
            try {
              const arrayBuffer = await this.pdfBlob.arrayBuffer();
              if (arrayBuffer.byteLength === 0) {
                this.pdfLoadError =
                  'Error: Los datos del PDF están vacíos después de la conversión para Otro Móvil. Contacta a soporte con este error.';
                this.isLoading = false;
                this.cdr.detectChanges();
                return;
              }
              this.pdfDocument = await pdfjsLib.getDocument({
                data: arrayBuffer,
              }).promise;
              if (this.pdfDocument) {
                this.isLoading = false;
                this.pdfLoadError = null;
                this.cdr.detectChanges();
                Promise.resolve().then(() => {
                  if (
                    this.pdfPagesContainer &&
                    this.pdfPagesContainer.nativeElement
                  ) {
                    this.renderAllPages();
                  } else {
                    this.pdfLoadError =
                      'Error: Área de visualización del PDF no está lista para Otro Móvil. Contacta a soporte con este error.';
                    this.cdr.detectChanges();
                  }
                });
              } else {
                this.pdfLoadError =
                  'Error: Falló al analizar la estructura del documento PDF para Otro Móvil. Contacta a soporte con este error.';
                this.isLoading = false;
                this.cdr.detectChanges();
              }
            } catch (error) {
              console.error(
                'loadPdf Other Mobile: Error loading or rendering PDF with PDF.js:',
                error,
              );
              this.pdfLoadError =
                'Error: No se pudo cargar o renderizar el PDF para Otro Móvil. Contacta a soporte con este error.';
              this.isLoading = false;
              this.cdr.detectChanges();
            }
          }
        }
      },
      (error) => {
        console.error('loadPdf error: Error fetching PDF from API:', error);
        const backendMessage = ErrorHandlerService.getErrorMessage(
          error,
          'No se pudo obtener el PDF del servidor. Contacta a soporte con este error.',
        );
        this.pdfLoadError = `No se pudo generar el PDF: ${backendMessage}`;
        this.isLoading = false;
        this.cleanupLocalStorage();
        this.cdr.detectChanges();
      },
    );
  }

  /**
   * Lee un Blob con contenido JSON de error y devuelve el mensaje más específico disponible.
   */
  private async extractMessageFromBlob(blob: Blob): Promise<string> {
    const fallback =
      'El servidor devolvió una respuesta inesperada. Contacta a soporte con este error.';
    try {
      const text = await blob.text();
      try {
        return ErrorHandlerService.getErrorMessage(
          { error: JSON.parse(text) },
          text || fallback,
        );
      } catch (_) {
        return text || fallback;
      }
    } catch (_) {
      return fallback;
    }
  }

  // Método para renderizar todas las páginas en canvas (para móviles)
  private async renderAllPages(): Promise<void> {
    console.log('renderAllPages (mobile): Starting page rendering process.');
    if (this.isDesktop || !this.pdfDocument) {
      console.log('renderAllPages (mobile): Skipped (desktop or no document).');
      return;
    }
    if (!this.pdfPagesContainer || !this.pdfPagesContainer.nativeElement) {
      this.pdfLoadError =
        'Error: Área de visualización del PDF no está lista para móvil. Contacta a soporte con este error.';
      // isLoading ya debería ser false
      this.cdr.detectChanges();
      return;
    }

    const container = this.pdfPagesContainer.nativeElement;
    container.innerHTML = ''; // Limpiar páginas previas
    const containerWidth = container.clientWidth;
    console.log(
      `renderAllPages (mobile): Container width: ${containerWidth}px`,
    );

    const numPages = this.pdfDocument.numPages;
    console.log(`renderAllPages (mobile): Document has ${numPages} pages.`);
    if (numPages === 0) {
      this.pdfLoadError =
        'Info: El documento PDF no tiene páginas. Contacta a soporte con este error.';
      this.cdr.detectChanges();
      return;
    }

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      console.log(
        `renderAllPages (mobile): Attempting to render page ${pageNum}.`,
      );
      try {
        const page = await this.pdfDocument.getPage(pageNum);
        const originalViewport = page.getViewport({ scale: 1 });
        const scale = containerWidth / originalViewport.width;
        const viewport = page.getViewport({ scale: scale });

        const canvas = document.createElement('canvas');
        canvas.className = 'pdf-page-canvas';
        const context = canvas.getContext('2d');

        if (!context) {
          throw new Error('Could not get canvas context for page ' + pageNum);
        }

        const outputScale = window.devicePixelRatio || 1;
        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = Math.floor(viewport.width) + 'px';
        canvas.style.height = Math.floor(viewport.height) + 'px';

        const transform =
          outputScale !== 1
            ? [outputScale, 0, 0, outputScale, 0, 0]
            : undefined;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
          transform: transform,
        };
        await page.render(renderContext).promise;
        container.appendChild(canvas);
        console.log(
          `renderAllPages (mobile): Appended canvas for page ${pageNum}.`,
        );
      } catch (pageError) {
        console.error(
          `renderAllPages (mobile): Error rendering page ${pageNum}:`,
          pageError,
        );
        this.pdfLoadError = `Error renderizando página ${pageNum}. Contacta a soporte con este error.`;
        this.cdr.detectChanges();
      }
    }
    console.log('renderAllPages (mobile): Finished rendering all pages.');
    this.cdr.detectChanges(); // Asegurar que la UI se actualice
  }

  // Método para el botón de descarga
  downloadPdf(): void {
    if (this.pdfBlob) {
      const url = URL.createObjectURL(this.pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      const endpointForName =
        localStorage.getItem('pdfEndpoint') || 'documento';
      const fileNameBase =
        endpointForName
          .split('/')
          .pop()
          ?.split('?')[0]
          .replace(/[^a-z0-9]/gi, '_') || 'documento';
      a.download = `${fileNameBase}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      console.log('downloadPdf: PDF download initiated.');
    } else {
      console.error('downloadPdf: pdfBlob is null, cannot download.');
      this.pdfLoadError =
        'Error: No hay PDF para descargar. Contacta a soporte con este error.';
      this.cdr.detectChanges();
    }
  }

  /*
  // MÉTODO DE DESCARGA/APERTURA AUTOMÁTICA (AHORA COMENTADO/DESACTIVADO)
  private triggerMobilePdfHandling(blobUrl: string): void {
    console.log('triggerMobilePdfHandling: Mobile detected. Triggering PDF handling via anchor.');
    const a = document.createElement('a');
    a.href = blobUrl;
    const endpointForName = localStorage.getItem('pdfEndpoint') || 'documento';
    const fileNameBase = endpointForName.split('/').pop()?.split('?')[0].replace(/[^a-z0-9]/gi, '_') || 'documento';
    a.download = `${fileNameBase}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    console.log('triggerMobilePdfHandling: Mobile - PDF handling initiated via anchor click.');
  }
  */

  private cleanupLocalStorage(): void {
    console.log(
      'cleanupLocalStorage: Removing PDF endpoint and data from localStorage.',
    );
    localStorage.removeItem('pdfEndpoint');
    localStorage.removeItem('pdfData');
  }

  private revokeActiveBlobUrls(): void {
    if (this.activeBlobUrls.length > 0) {
      console.log(
        'revokeActiveBlobUrls: Revoking active blob URLs.',
        this.activeBlobUrls,
      );
      this.activeBlobUrls.forEach((url) => URL.revokeObjectURL(url));
      this.activeBlobUrls = [];
    }
  }

  ngOnDestroy(): void {
    console.log('PdfViewerComponent ngOnDestroy: Cleaning up.');
    this.cleanupLocalStorage();
    this.revokeActiveBlobUrls();
    if (this.pdfDocument) {
      this.pdfDocument
        .destroy()
        .catch((err) =>
          console.error('ngOnDestroy: Error destroying PDF document', err),
        );
      this.pdfDocument = null;
    }
    if (this.pdfBlob) {
      this.pdfBlob = null;
    }
  }
}
