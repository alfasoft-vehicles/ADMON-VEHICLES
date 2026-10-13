import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ErrorHandlerService {
  constructor() {}

  handleError(error: HttpErrorResponse) {
    let errorMessage = 'An error occurred';
    if (error.error instanceof ErrorEvent) {
      // Cliente-side error
      errorMessage = `Client-side error: ${error.error.message}`;
    } else {
      // Servidor-side error
      errorMessage =
        error.error?.message ||
        `Server-side error: ${error.status} - ${error.message}`;
    }

    console.error(errorMessage);
    return throwError({
      status: error.status,
      message: errorMessage,
      error: error.error,
    });
  }
}
