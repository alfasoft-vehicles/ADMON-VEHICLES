import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class DocumentsService {
  constructor(private apiService: ApiService) {}

  /**
   * Download any type of document (PDF, Excel, etc.) from a POST endpoint
   * @param {string} endpoint - The endpoint to download the document from
   * @param {any} data - The data to send in the request body
   * @param {string} filename - Optional filename for the download (will be auto-detected if not provided)
   * @returns {Observable<void>} An Observable that completes when download starts
   */
  downloadDocument(
    endpoint: string,
    data: any,
    filename?: string
  ): Observable<void> {
    return this.apiService.postDocuments(endpoint, data).pipe(
      map((blob: Blob) => {
        const isIOS =
          /iPad|iPhone|iPod/.test(navigator.userAgent) &&
          !('MSStream' in window);

        if (isIOS) {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64data = reader.result as string;
            const link = document.createElement('a');
            link.href = base64data;
            link.download =
              filename ||
              `document_${new Date().getTime()}${this.getFileExtensionFromBlob(
                blob
              )}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          };
          reader.readAsDataURL(blob);
          return;
        }

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;

        if (filename) {
          link.download = filename;
        } else {
          const fileExtension = this.getFileExtensionFromBlob(blob);
          link.download = `document_${new Date().getTime()}${fileExtension}`;
        }

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      })
    );
  }

  /**
   * Get file extension based on blob MIME type
   * @param {Blob} blob - The blob to analyze
   * @returns {string} File extension with dot
   */
  private getFileExtensionFromBlob(blob: Blob): string {
    const mimeType = blob.type;

    switch (mimeType) {
      case 'application/pdf':
        return '.pdf';
      case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
        return '.xlsx';
      case 'application/vnd.ms-excel':
        return '.xls';
      case 'text/csv':
        return '.csv';
      case 'application/msword':
        return '.doc';
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        return '.docx';
      case 'image/jpeg':
        return '.jpg';
      case 'image/png':
        return '.png';
      case 'image/gif':
        return '.gif';
      case 'image/webp':
        return '.webp';
      case 'image/bmp':
        return '.bmp';
      default:
        return '.bin'; 
    }
  }
}
