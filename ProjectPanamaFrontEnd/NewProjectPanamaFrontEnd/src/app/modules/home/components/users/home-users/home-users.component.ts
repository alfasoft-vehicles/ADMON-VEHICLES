import { Component, OnInit } from '@angular/core';
import { JwtService } from 'src/app/services/jwt.service';
import { InfoCompanyStateService } from 'src/app/modules/shared/services/info-company-state.service';
import { MatDialog } from '@angular/material/dialog';
import { CobrosComponent } from '../options/cobros/cobros.component';
import { Router } from '@angular/router';

export interface HomeModuleOption {
  name: string;
  icon: string;
  bgClass: string;
  colorClass: string;
  url: string | null;
  click: () => void;
  enabled: boolean;
  disabled: boolean;
}

@Component({
  selector: 'app-home-users',
  templateUrl: './home-users.component.html',
  styleUrls: ['./home-users.component.css'],
})
export class HomeUsersComponent implements OnInit {
  options: HomeModuleOption[] = [];
  permisos: any;
  userName: string = 'Usuario';
  infoCompanyName: string = '';
  currentDateFormatted: string = '';

  constructor(
    private infoCompanyStateService: InfoCompanyStateService,
    private jwtService: JwtService,
    private router: Router,
    public dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.formatCurrentDate();
    this.obtenerUsuario();
    this.getInfoCompany();
  }

  private formatCurrentDate(): void {
    const now = new Date();
    const formatted = now.toLocaleDateString('es-PA', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    this.currentDateFormatted =
      formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }

  getInfoCompany(): void {
    this.infoCompanyStateService.loadInfoCompany().subscribe((infoCompany) => {
      this.infoCompanyName = infoCompany?.name || '';
    });
  }

  obtenerUsuario(): void {
    this.permisos = this.jwtService.getUserPermissions() || {};
    this.userName = this.permisos.nombre || 'Usuario';

    this.options = [
      {
        name: 'Caja',
        icon: 'point_of_sale',
        bgClass: 'hu-bg-green',
        colorClass: 'hu-text-green',
        url: '/cash-register',
        click: () => null,
        enabled: !!this.permisos.opcion01,
        disabled: false,
      },
      {
        name: 'Operaciones',
        icon: 'local_taxi',
        bgClass: 'hu-bg-blue',
        colorClass: 'hu-text-blue',
        url: '/operations',
        click: () => null,
        enabled: !!this.permisos.opcion02,
        disabled: false,
      },
      {
        name: 'Cobros',
        icon: 'payments',
        bgClass: 'hu-bg-teal',
        colorClass: 'hu-text-teal',
        url: null,
        click: () => this.openDialogCobros(),
        enabled: !!this.permisos.opcion03,
        disabled: false,
      },
      {
        name: 'Trámites',
        icon: 'assignment',
        bgClass: 'hu-bg-indigo',
        colorClass: 'hu-text-indigo',
        url: '/procedures',
        click: () => null,
        enabled: !!this.permisos.opcion04,
        disabled: false,
      },
      {
        name: 'Almacén',
        icon: 'inventory_2',
        bgClass: 'hu-bg-orange',
        colorClass: 'hu-text-orange',
        url: '/warehouse',
        click: () => null,
        enabled: !!this.permisos.opcion05,
        disabled: false,
      },
      {
        name: 'Sucursal',
        icon: 'home_repair_service',
        bgClass: 'hu-bg-sky',
        colorClass: 'hu-text-sky',
        url: '/workshop',
        click: () => null,
        enabled: !!this.permisos.opcion06,
        disabled: false,
      },
      {
        name: 'Chapistería',
        icon: 'car_repair',
        bgClass: 'hu-bg-purple',
        colorClass: 'hu-text-purple',
        url: '/sheet-metal-work',
        click: () => null,
        enabled: !!this.permisos.opcion07,
        disabled: false,
      },
      {
        name: 'Llavero',
        icon: 'vpn_key',
        bgClass: 'hu-bg-cyan',
        colorClass: 'hu-text-cyan',
        url: '/keychain',
        click: () => null,
        enabled: !!this.permisos.opcion08,
        disabled: false,
      },
      {
        name: 'Reclamos',
        icon: 'car_crash',
        bgClass: 'hu-bg-red',
        colorClass: 'hu-text-red',
        url: '/claims',
        click: () => null,
        enabled: !!this.permisos.opcion09,
        disabled: false,
      },
      {
        name: 'Cartera',
        icon: 'account_balance_wallet',
        bgClass: 'hu-bg-emerald',
        colorClass: 'hu-text-emerald',
        url: '/wallet',
        click: () => null,
        enabled: !!this.permisos.opcion10,
        disabled: false,
      },
      {
        name: 'Gerencia',
        icon: 'insights',
        bgClass: 'hu-bg-indigo',
        colorClass: 'hu-text-indigo',
        url: '/management',
        click: () => null,
        enabled: !!this.permisos.opcion11,
        disabled: false,
      },
      {
        name: 'Gastos',
        icon: 'receipt_long',
        bgClass: 'hu-bg-amber',
        colorClass: 'hu-text-amber',
        url: '/expenses',
        click: () => null,
        enabled: !!this.permisos.opcion12,
        disabled: false,
      },
      {
        name: 'CNT',
        icon: 'account_balance',
        bgClass: 'hu-bg-blue',
        colorClass: 'hu-text-blue',
        url: '/cnt',
        click: () => null,
        enabled: !!this.permisos.opcion13,
        disabled: false,
      },
      {
        name: 'Contado',
        icon: 'paid',
        bgClass: 'hu-bg-slate',
        colorClass: 'hu-text-slate',
        url: 'hoalalalal',
        click: () => null,
        enabled: !!this.permisos.opcion14,
        disabled: true,
      },
      {
        name: 'Utilidades',
        icon: 'tune',
        bgClass: 'hu-bg-darkgray',
        colorClass: 'hu-text-darkgray',
        url: '/utilities',
        click: () => null,
        enabled: !!this.permisos.opcion15,
        disabled: false,
      },
    ];
  }

  get enabledOptions(): HomeModuleOption[] {
    return this.options.filter((option) => option.enabled);
  }

  openDialogCobros(): void {
    const dialogRef = this.dialog.open(CobrosComponent, {
      minWidth: 'min(600px, 90vw)',
      maxHeight: '100vh',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.router.navigate(['/cobros']);
      }
    });
  }
}
