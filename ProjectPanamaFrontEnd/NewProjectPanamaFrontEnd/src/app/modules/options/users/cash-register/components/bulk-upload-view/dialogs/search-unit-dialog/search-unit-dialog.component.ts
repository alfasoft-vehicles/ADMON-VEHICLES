import {
  AfterViewInit,
  Component,
  ElementRef,
  Inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BulkUploadRecord } from '../../models/bulk-upload-record.interface';
import { ConfirmActionDialogComponent } from 'src/app/modules/shared/components/confirm-action-dialog/confirm-action-dialog.component';

export interface VehicleSearchItem {
  unidad: string;
  placa: string;
  conductor: string;
  cedula: string;
  empresa: string;
  estado: string;
  nroCupo: string;
  propietario: string;
  codigoConductor: string;
  telefono: string;
  valorCuota: number;
  cuotasTotales: number;
  cuotasPagas: number;
  cuotasPendientes: number;
}

@Component({
  selector: 'app-search-unit-dialog',
  templateUrl: './search-unit-dialog.component.html',
  styleUrls: ['./search-unit-dialog.component.css'],
})
export class SearchUnitDialogComponent implements OnInit, AfterViewInit {
  @ViewChild('searchInput') searchInputEl?: ElementRef<HTMLInputElement>;

  searchTerm: string = '';
  selectedVehicle: VehicleSearchItem | null = null;
  filteredVehicles: VehicleSearchItem[] = [];

  // Datos mock de catálogo de vehículos / conductores
  mockVehicles: VehicleSearchItem[] = [
    {
      unidad: '0373',
      placa: '8T-9876',
      conductor: 'Rebeca Sanjur',
      cedula: '4-752-1980',
      empresa: 'Taxis Panamá Central',
      estado: 'Activo',
      nroCupo: '373',
      propietario: 'Inversiones Sanjur S.A.',
      codigoConductor: '10882',
      telefono: '50767063190',
      valorCuota: 36.0,
      cuotasTotales: 250,
      cuotasPagas: 200,
      cuotasPendientes: 50,
    },
    {
      unidad: '0334',
      placa: '8T-5432',
      conductor: 'Manuel Barría',
      cedula: '8-412-8874',
      empresa: 'Taxis Panamá Central',
      estado: 'Activo',
      nroCupo: '334',
      propietario: 'Manuel Barría',
      codigoConductor: '10432',
      telefono: '50764984356',
      valorCuota: 37.0,
      cuotasTotales: 180,
      cuotasPagas: 160,
      cuotasPendientes: 20,
    },
    {
      unidad: 'AS51',
      placa: '8T-1234',
      conductor: 'Stephany Saldaña',
      cedula: '8-875-2451',
      empresa: 'Taxis Panamá Metro',
      estado: 'Activo',
      nroCupo: '105',
      propietario: 'Transportes Unidos S.A.',
      codigoConductor: '10055',
      telefono: '50767675459',
      valorCuota: 36.0,
      cuotasTotales: 300,
      cuotasPagas: 245,
      cuotasPendientes: 55,
    },
    {
      unidad: 'FG67',
      placa: '8T-8899',
      conductor: 'Luis Moreno',
      cedula: '8-764-853',
      empresa: 'Taxis Panamá Metro',
      estado: 'Activo',
      nroCupo: '67',
      propietario: 'Moreno Hnos',
      codigoConductor: '10396',
      telefono: '50765225610',
      valorCuota: 33.5,
      cuotasTotales: 220,
      cuotasPagas: 215,
      cuotasPendientes: 5,
    },
    {
      unidad: 'FA35',
      placa: '8T-3535',
      conductor: 'Bernardo Abrego',
      cedula: '8-917-1771',
      empresa: 'Taxis Panamá Norte',
      estado: 'Activo',
      nroCupo: '35',
      propietario: 'Inversiones Abrego',
      codigoConductor: '10694',
      telefono: '50767770575',
      valorCuota: 36.0,
      cuotasTotales: 260,
      cuotasPagas: 250,
      cuotasPendientes: 10,
    },
    {
      unidad: 'FG73',
      placa: '8T-7373',
      conductor: 'Demetrio Sanjur',
      cedula: '4-217-440',
      empresa: 'Taxis Panamá Central',
      estado: 'Activo',
      nroCupo: '73',
      propietario: 'Demetrio Sanjur',
      codigoConductor: '10414',
      telefono: '50763626271',
      valorCuota: 34.5,
      cuotasTotales: 200,
      cuotasPagas: 195,
      cuotasPendientes: 5,
    },
    {
      unidad: 'ASM40',
      placa: '8T-4040',
      conductor: 'Juan Abrego',
      cedula: '8-749-2294',
      empresa: 'Taxis Panamá Central',
      estado: 'Activo',
      nroCupo: '40',
      propietario: 'Juan Abrego',
      codigoConductor: '11039',
      telefono: '50765410308',
      valorCuota: 35.0,
      cuotasTotales: 150,
      cuotasPagas: 140,
      cuotasPendientes: 10,
    },
  ];

  get isAlreadyIdentified(): boolean {
    return Boolean(this.data.record.unidad && !this.data.record.hasAlert);
  }

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { record: BulkUploadRecord },
    private dialogRef: MatDialogRef<SearchUnitDialogComponent>,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    // Si el registro tiene algún indicio de unidad o comentario, pre-filtrar o sugerir
    if (this.data.record.identifica) {
      this.searchTerm = this.data.record.identifica;
      this.onSearch();
    } else if (this.data.record.unidad) {
      this.searchTerm = this.data.record.unidad;
      this.onSearch();
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.searchInputEl) {
        this.searchInputEl.nativeElement.focus();
        if (this.searchTerm) {
          this.searchInputEl.nativeElement.select();
        }
      }
    }, 150);
  }

  onSearch(): void {
    const term = (this.searchTerm || '').trim().toLowerCase();
    if (!term) {
      this.filteredVehicles = [];
      return;
    }

    this.filteredVehicles = this.mockVehicles.filter(
      (v) =>
        v.unidad.toLowerCase().includes(term) ||
        v.placa.toLowerCase().includes(term) ||
        v.conductor.toLowerCase().includes(term) ||
        v.cedula.toLowerCase().includes(term) ||
        v.empresa.toLowerCase().includes(term),
    );
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.filteredVehicles = [];
    this.selectedVehicle = null;
  }

  selectVehicle(vehicle: VehicleSearchItem): void {
    this.selectedVehicle = vehicle;
  }

  onAccept(): void {
    if (!this.selectedVehicle) {
      return;
    }

    const vehicle = this.selectedVehicle;
    const confirmMessage = `¿Está seguro de asignar la unidad ${vehicle.unidad} (${vehicle.conductor}) al registro de ${this.data.record.nombre}? El registro pasará a estar validado.`;

    const confirmRef = this.dialog.open(ConfirmActionDialogComponent, {
      width: '480px',
      maxWidth: '92vw',
      data: {
        documentName: 'Confirmar Asignación de Unidad',
        message: confirmMessage,
      },
    });

    confirmRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.snackBar.open(
          `Unidad ${vehicle.unidad} asignada correctamente al registro de ${vehicle.conductor}.`,
          'Entendido',
          {
            duration: 4000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
          },
        );

        this.dialogRef.close({
          confirmed: true,
          updatedData: {
            unidad: vehicle.unidad,
            nombre: vehicle.conductor,
            cedula: vehicle.cedula,
            codigo: vehicle.codigoConductor,
            estado: vehicle.estado,
            hasAlert: false,
            pendiente: '0.00',
          },
        });
      } else {
        this.snackBar.open(
          'Acción cancelada. No se realizaron cambios en el registro.',
          'Entendido',
          {
            duration: 3500,
            horizontalPosition: 'center',
            verticalPosition: 'top',
          },
        );
      }
    });
  }

  close(): void {
    this.dialogRef.close(null);
  }
}
