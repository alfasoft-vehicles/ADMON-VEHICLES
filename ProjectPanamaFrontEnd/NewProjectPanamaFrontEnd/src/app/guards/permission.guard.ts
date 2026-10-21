import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  UrlTree,
} from '@angular/router';
import { JwtService } from 'src/app/services/jwt.service';

/**
 * Guard genérico por permiso. Se configura por ruta mediante `data`:
 *
 *   { path: 'operations', component: X,
 *     canActivate: [PermissionGuard], data: { permission: 'opcion02' } }
 *
 * `permission` puede ser un string o un arreglo de strings (basta con
 * que el usuario tenga uno de ellos). Si no se declara permiso, se
 * deniega el acceso por seguridad (fail-closed).
 */
@Injectable({
  providedIn: 'root',
})
export class PermissionGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private router: Router,
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean | UrlTree {
    const required = route.data?.['permission'] as
      | string
      | string[]
      | undefined;
    const permissions = Array.isArray(required)
      ? required
      : required
        ? [required]
        : [];

    if (
      permissions.length > 0 &&
      permissions.some((p) => this.jwtService.getPermissionUser(p))
    ) {
      return true;
    }

    return this.router.createUrlTree(['/home']);
  }
}
