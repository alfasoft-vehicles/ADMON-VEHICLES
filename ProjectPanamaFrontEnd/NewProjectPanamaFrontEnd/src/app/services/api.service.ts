import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ErrorHandlerService, RequestOptions } from './error-handler.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private baseURL: string = environment.url;

  constructor(
    private http: HttpClient,
    private errorHandlerService: ErrorHandlerService,
  ) {}

  /**
   * Fetch data from a specified endpoint.
   * @param {string} endpoint - The endpoint to fetch data from.
   * @param {RequestOptions} [options] - Optional request settings (e.g. { silent: true }).
   * @returns {Observable<any>} An Observable of the HTTP response.
   */
  getData(endpoint: string, options?: RequestOptions): Observable<any> {
    return this.http
      .get<any>(`${this.baseURL}/${endpoint}/`, { withCredentials: true })
      .pipe(
        catchError((error) =>
          this.errorHandlerService.handleError(error, options),
        ),
      );
  }

  /**
   * Fetch PDF from a specified endpoint. Silent by default so the viewer can display the error inline.
   * @param {string} endpoint - The endpoint to fetch data from.
   * @param {RequestOptions} [options] - Optional request settings. Defaults to { silent: true }.
   * @returns {Observable<any>} An Observable of the HTTP response.
   */
  getPdf(
    endpoint: string,
    options: RequestOptions = { silent: true },
  ): Observable<any> {
    return this.http
      .get<any>(`${this.baseURL}/${endpoint}/`, {
        responseType: 'blob' as 'json',
        withCredentials: true,
      })
      .pipe(
        catchError((error) =>
          this.errorHandlerService.handleError(error, options),
        ),
      );
  }

  /**
   * Post data to generate a PDF. Silent by default so the viewer can display the error inline.
   * @param {string} endpoint - The endpoint to post data to.
   * @param {any} data - The data to post.
   * @param {RequestOptions} [options] - Optional request settings. Defaults to { silent: true }.
   * @returns {Observable<any>} An Observable of the HTTP response.
   */
  postPdf(
    endpoint: string,
    data: any,
    options: RequestOptions = { silent: true },
  ): Observable<any> {
    return this.http
      .post<any>(`${this.baseURL}/${endpoint}/`, data, {
        responseType: 'blob' as 'json',
        withCredentials: true,
      })
      .pipe(
        catchError((error) =>
          this.errorHandlerService.handleError(error, options),
        ),
      );
  }

  /**
   * Post data to a specified endpoint and get blob response (for any type of document downloads).
   * @param {string} endpoint - The endpoint to post data to.
   * @param {any} data - The data to post.
   * @param {RequestOptions} [options] - Optional request settings.
   * @returns {Observable<Blob>} An Observable of the blob response.
   */
  postDocuments(
    endpoint: string,
    data: any,
    options?: RequestOptions,
  ): Observable<Blob> {
    return this.http
      .post(`${this.baseURL}/${endpoint}/`, data, {
        responseType: 'blob',
        withCredentials: true,
      })
      .pipe(
        catchError((error) =>
          this.errorHandlerService.handleError(error, options),
        ),
      );
  }

  /**
   * Post data to a specified endpoint.
   * @param {string} endpoint - The endpoint to post data to.
   * @param {any} data - The data to post.
   * @param {RequestOptions} [options] - Optional request settings.
   * @returns {Observable<any>} An Observable of the HTTP response.
   */
  postData(
    endpoint: string,
    data: any,
    options?: RequestOptions,
  ): Observable<any> {
    return this.http
      .post<any>(`${this.baseURL}/${endpoint}/`, data, {
        withCredentials: true,
      })
      .pipe(
        catchError((error) =>
          this.errorHandlerService.handleError(error, options),
        ),
      );
  }

  /**
   * Update data at a specified endpoint.
   * @param {string} endpoint - The endpoint to put data to.
   * @param {any} data - The data to update.
   * @param {RequestOptions} [options] - Optional request settings.
   * @returns {Observable<any>} An Observable of the HTTP response.
   */
  updateData(
    endpoint: string,
    data: any,
    options?: RequestOptions,
  ): Observable<any> {
    return this.http
      .put<any>(`${this.baseURL}/${endpoint}/`, data, { withCredentials: true })
      .pipe(
        catchError((error) =>
          this.errorHandlerService.handleError(error, options),
        ),
      );
  }

  /**
   * Delete data at a specified endpoint.
   * @param {string} endpoint - The endpoint to delete data from.
   * @param {RequestOptions} [options] - Optional request settings.
   * @returns {Observable<any>} An Observable of the HTTP response.
   */
  deleteData(endpoint: string, options?: RequestOptions): Observable<any> {
    return this.http
      .delete<any>(`${this.baseURL}/${endpoint}/`, { withCredentials: true })
      .pipe(
        catchError((error) =>
          this.errorHandlerService.handleError(error, options),
        ),
      );
  }

  uploadPhoto(
    endpoint: string,
    formData: FormData,
    options?: RequestOptions,
  ): Observable<any> {
    return this.http
      .post<any>(`${this.baseURL}/${endpoint}/`, formData, {
        withCredentials: true,
      })
      .pipe(
        catchError((error) =>
          this.errorHandlerService.handleError(error, options),
        ),
      );
  }
}
