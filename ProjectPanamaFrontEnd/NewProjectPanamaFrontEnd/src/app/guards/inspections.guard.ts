import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { JwtService } from 'src/app/services/jwt.service';

@Injectable({
  providedIn: 'root'
})
export class inspectionsGuard implements CanActivate {
  constructor(private jwtService: JwtService, private router: Router) {}

  canActivate(): boolean | UrlTree {
    if (this.jwtService.isOwner() || this.jwtService.getPermissionUser('opcion18')) {
      return true; 
    }

    return this.router.createUrlTree(['/home']); 
  }
}