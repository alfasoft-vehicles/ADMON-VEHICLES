import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, from, throwError } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';

export interface RequestOptions {
  silent?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ErrorHandlerService {
  constructor(private snackBar: MatSnackBar) {}

  /**
   * Extrae el mensaje de error más específico proveniente del backend o de la excepción.
   * Soporta formatos FastAPI (detail como string o array de validaciones Pydantic),
   * respuestas con { message: "..." }, { error: "..." }, strings directos, etc.
   */
  static getErrorMessage(
    error: any,
    fallback: string = 'Ha ocurrido un error inesperado',
  ): string {
    if (!error) {
      return fallback;
    }

    if (typeof error === 'string') {
      return error;
    }

    // Si el error contiene un payload error.error como string
    if (typeof error.error === 'string' && error.error.trim()) {
      return error.error;
    }

    // Formato de validación FastAPI/Pydantic (estándar 'detail' o personalizado 'details' de main.py)
    const validationList = Array.isArray(error.error?.details)
      ? error.error.details
      : Array.isArray(error.error?.detail)
        ? error.error.detail
        : null;

    if (validationList && validationList.length > 0) {
      const messages = validationList
        .map((item: any) => {
          const field =
            Array.isArray(item.loc) && item.loc.length > 0
              ? item.loc[item.loc.length - 1]
              : '';
          return field
            ? `${field}: ${item.msg}`
            : item.msg || JSON.stringify(item);
        })
        .filter(Boolean);

      if (messages.length > 0) {
        const prefix =
          typeof error.error?.message === 'string' &&
          error.error.message.trim() &&
          error.error.message !== messages.join('; ')
            ? `${error.error.message}: `
            : '';
        return `${prefix}${messages.join('; ')}`;
      }
    }

    // Formato estándar backend: { message: "..." }
    if (
      typeof error.error?.message === 'string' &&
      error.error.message.trim()
    ) {
      return error.error.message;
    }

    // Formato estándar FastAPI: { detail: "..." }
    if (typeof error.error?.detail === 'string' && error.error.detail.trim()) {
      return error.error.detail;
    }

    // Formato alternativo { error: "..." }
    if (typeof error.error?.error === 'string' && error.error.error.trim()) {
      return error.error.error;
    }

    // Si ya viene procesado en error.message (y no es el mensaje genérico de Angular)
    if (typeof error.message === 'string' && error.message.trim()) {
      if (
        !error.message.includes('Http failure response') &&
        !error.message.startsWith('Server-side error:')
      ) {
        return error.message;
      }
    }

    return fallback;
  }

  showErrorSnackbar(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }

  handleError = (
    error: HttpErrorResponse,
    options?: RequestOptions,
  ): Observable<never> => {
    const isSilent = !!options?.silent;

    // Si error.error es un Blob (ocurre con descargas como postDocuments o getPdf cuando el backend retorna JSON de error)
    if (
      error.error instanceof Blob &&
      (error.error.type.includes('json') ||
        error.error.type.includes('text') ||
        !error.error.type)
    ) {
      return from(error.error.text()).pipe(
        switchMap((text) => {
          let parsedMessage = text;
          let parsedError: any = text;
          try {
            parsedError = JSON.parse(text);
            parsedMessage =
              parsedError.message ||
              parsedError.detail ||
              parsedError.error ||
              text;
          } catch (_) {}
          console.error('ErrorHandlerService (Blob error):', parsedMessage);
          if (!isSilent) {
            this.showErrorSnackbar(parsedMessage);
          }
          return throwError(() => ({
            status: error.status,
            message: parsedMessage,
            error: parsedError,
          }));
        }),
      );
    }

    let errorMessage = 'Ha ocurrido un error inesperado';

    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = error.error.message || 'Error en la aplicación';
    } else {
      // Error del lado del servidor
      if (error.status === 0) {
        errorMessage =
          'No se pudo conectar con el servidor. Verifica tu conexión a internet o el estado del servicio.';
      } else {
        const extracted = ErrorHandlerService.getErrorMessage(error, '');
        if (extracted) {
          errorMessage = extracted;
        } else if (error.status === 404) {
          errorMessage = 'Recurso no encontrado (404)';
        } else if (error.status === 403) {
          errorMessage = 'No tienes permiso para realizar esta acción (403)';
        } else if (error.status === 401) {
          errorMessage = 'Sesión no autorizada o expirada (401)';
        } else if (error.status === 500) {
          errorMessage = 'Error interno en el servidor (500)';
        } else {
          errorMessage = error.message || `Error del servidor: ${error.status}`;
        }
      }
    }

    console.error('ErrorHandlerService:', errorMessage, error);
    if (!isSilent) {
      this.showErrorSnackbar(errorMessage);
    }
    return throwError(() => ({
      status: error.status,
      message: errorMessage,
      error: error.error,
    }));
  };
}
