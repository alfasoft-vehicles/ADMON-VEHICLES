import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  Router,
  UrlTree,
} from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BulkUploadService } from '../modules/options/users/cash-register/components/bulk-upload-view/services/bulk-upload.service';

@Injectable({
  providedIn: 'root',
})
export class BulkUploadRecordsGuard implements CanActivate {
  constructor(
    private bulkUploadService: BulkUploadService,
    private router: Router,
    private snackBar: MatSnackBar,
  ) {}

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean | UrlTree> {
    const type = route.paramMap.get('type') || 'yappy';

    return this.bulkUploadService.hasRecords(type).pipe(
      map((hasRecords) => {
        if (hasRecords) {
          return true;
        }

        // Si no hay registros, redirige a caja y solicita abrir el diálogo para subir el archivo
        this.snackBar.open(
          'No se encontraron registros pendientes. Debe cargar un archivo .CSV primero.',
          'Cerrar',
          {
            duration: 4000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
          },
        );

        return this.router.createUrlTree(['/cash-register'], {
          queryParams: { openUpload: 'true' },
        });
      }),
      catchError(() => {
        return of(
          this.router.createUrlTree(['/cash-register'], {
            queryParams: { openUpload: 'true' },
          }),
        );
      }),
    );
  }
}
