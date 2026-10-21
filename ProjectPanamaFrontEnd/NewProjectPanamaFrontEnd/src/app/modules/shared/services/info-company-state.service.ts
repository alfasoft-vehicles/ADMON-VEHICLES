import { computed, Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, finalize, map, shareReplay, tap } from 'rxjs/operators';
import { ApiService } from 'src/app/services/api.service';
import { JwtService } from 'src/app/services/jwt.service';
import { InfoCompany } from '../interfaces/info-company.interface';

const INFOCOMPANY_DEFAULT: InfoCompany = {
  name: '',
  ruc: '',
  address: '',
  nit: '',
  direction: '',
  city: '',
  phone: '',
  email: '',
  logo: '',
};

interface StoredCompanyCache {
  companyId: string;
  data: InfoCompany;
}

@Injectable({
  providedIn: 'root',
})
export class InfoCompanyStateService {
  private readonly STORAGE_KEY = 'info_company';

  private infoCompanyState = signal<boolean>(false);
  private infoCompany = signal<InfoCompany>(INFOCOMPANY_DEFAULT);
  private loadedCompanyId: string | null = null;
  private inFlightRequest$: Observable<InfoCompany | null> | null = null;

  public displayInfoCompany = computed(() => this.infoCompanyState());
  public getInfoCompany = computed(() => this.infoCompany());

  constructor(
    private apiService: ApiService,
    private jwtService: JwtService,
  ) {
    this.hydrateFromStorage();
  }

  /**
   * Obtiene la información de la empresa desde memoria/localStorage si ya está disponible,
   * o realiza una única consulta al backend si aún no existe para la empresa actual.
   */
  loadInfoCompany(): Observable<InfoCompany | null> {
    const userData = this.jwtService.getUserData();
    const idCompany = userData?.empresa
      ? String(userData.empresa).trim()
      : null;

    if (!idCompany) {
      this.clearInfoCompany();
      return of(null);
    }

    // 1. Verificar si existe en localStorage (si fue eliminado por JwtService.logout(), invalida memoria)
    const cached = this.readFromStorage(idCompany);
    if (!cached) {
      this.loadedCompanyId = null;
      this.infoCompany.set(INFOCOMPANY_DEFAULT);
    } else if (cached.name) {
      this.loadedCompanyId = idCompany;
      this.infoCompany.set(cached);
      return of(cached);
    }

    // 3. Si ya hay una petición en curso, compartir la misma suscripción para no duplicar llamados
    if (this.inFlightRequest$) {
      return this.inFlightRequest$;
    }

    this.inFlightRequest$ = this.apiService
      .getData('info-company/' + idCompany)
      .pipe(
        map((response: any) => this.normalizeCompanyData(response)),
        tap((normalized) => {
          if (normalized.name) {
            this.loadedCompanyId = idCompany;
            this.infoCompany.set(normalized);
            this.saveToStorage(idCompany, normalized);
          }
        }),
        catchError((error) => {
          console.error('Error al obtener información de la empresa:', error);
          return of(null);
        }),
        finalize(() => {
          this.inFlightRequest$ = null;
        }),
        shareReplay(1),
      );

    return this.inFlightRequest$;
  }

  showInfoCompany(): void {
    this.infoCompanyState.set(true);
  }

  hideInfoCompany(): void {
    this.infoCompanyState.set(false);
  }

  setInfoCompany(infoCompany: InfoCompany): void {
    const normalized = this.normalizeCompanyData(infoCompany);
    this.infoCompany.set(normalized);

    const userData = this.jwtService.getUserData();
    const idCompany = userData?.empresa
      ? String(userData.empresa).trim()
      : null;
    if (idCompany && normalized.name) {
      this.loadedCompanyId = idCompany;
      this.saveToStorage(idCompany, normalized);
    }
  }

  clearInfoCompany(): void {
    this.loadedCompanyId = null;
    this.inFlightRequest$ = null;
    this.infoCompany.set(INFOCOMPANY_DEFAULT);
    localStorage.removeItem(this.STORAGE_KEY);
  }

  private hydrateFromStorage(): void {
    const userData = this.jwtService.getUserData();
    const idCompany = userData?.empresa
      ? String(userData.empresa).trim()
      : null;
    if (!idCompany) {
      localStorage.removeItem(this.STORAGE_KEY);
      return;
    }

    const cached = this.readFromStorage(idCompany);
    if (cached && cached.name) {
      this.loadedCompanyId = idCompany;
      this.infoCompany.set(cached);
    }
  }

  private readFromStorage(expectedCompanyId: string): InfoCompany | null {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return null;

      const parsed: StoredCompanyCache = JSON.parse(raw);
      if (parsed?.companyId === expectedCompanyId && parsed?.data?.name) {
        return this.normalizeCompanyData(parsed.data);
      }

      // Si pertenece a otra empresa o formato inválido, limpiar
      localStorage.removeItem(this.STORAGE_KEY);
      return null;
    } catch {
      localStorage.removeItem(this.STORAGE_KEY);
      return null;
    }
  }

  private saveToStorage(companyId: string, data: InfoCompany): void {
    try {
      const payload: StoredCompanyCache = { companyId, data };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(payload));
    } catch (error) {
      console.error('No se pudo guardar info_company en localStorage:', error);
    }
  }

  private normalizeCompanyData(raw: any): InfoCompany {
    if (!raw) return { ...INFOCOMPANY_DEFAULT };
    const rucValue = raw.ruc ?? raw.nit ?? '';
    const addressValue = raw.address ?? raw.direction ?? '';

    return {
      name: raw.name ?? '',
      ruc: rucValue,
      address: addressValue,
      nit: rucValue,
      direction: addressValue,
      city: raw.city ?? '',
      phone: raw.phone ?? '',
      email: raw.email ?? '',
      logo: raw.logo ?? '',
    };
  }
}
