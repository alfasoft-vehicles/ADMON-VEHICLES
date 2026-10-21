import { LOCALE_ID, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { LoginComponent } from './modules/users/login/login.component';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { StatevehiclefleetComponent } from './modules/tasks/statevehiclefleet/statevehiclefleet.component';
import { PdfViewerComponent } from './modules/others/pdf-viewer/pdf-viewer.component';
import { FeespaidComponent } from './modules/tasks/feespaid/feespaid.component';
import { OpcionesGerenciaComponent } from './modules/options/users/gerencia/opciones-gerencia/opciones-gerencia.component';
import { OpcionesTramitesComponent } from './modules/options/users/tramites/opciones-tramites/opciones-tramites.component';
import { OpcionesChapisteriaComponent } from './modules/options/users/chapisteria/opciones-chapisteria/opciones-chapisteria.component';
import { OpcionesGastosComponent } from './modules/options/users/gastos/opciones-gastos/opciones-gastos.component';
import { OpcionesTallerComponent } from './modules/options/users/taller/opciones-taller/opciones-taller.component';
import { OpcionesOperacionesComponent } from './modules/options/users/operaciones/opciones-operaciones/opciones-operaciones.component';
import { OpcionesLlaveroComponent } from './modules/options/users/llavero/opciones-llavero/opciones-llavero.component';
import { OpcionesReclamosComponent } from './modules/options/users/reclamos/opciones-reclamos/opciones-reclamos.component';
import { OpcionesCntComponent } from './modules/options/users/cnt/opciones-cnt/opciones-cnt.component';
import { OpcionesUtilidadesComponent } from './modules/options/users/utilidades/opciones-utilidades/opciones-utilidades.component';
import { OpcionesCarteraComponent } from './modules/options/users/cartera/opciones-cartera/opciones-cartera.component';
import { OpcionesAlmacenComponent } from './modules/options/users/almacen/opciones-almacen/opciones-almacen.component';
import { OwnersTableComponent } from './modules/tasks/owners-old/owners-table/owners-table.component';
import { OwnersVehiclesComponent } from './modules/tasks/owners-old/owners-vehicles/owners-vehicles.component';
import { OwnersResumeComponent } from './modules/tasks/owners-old/owners-resume/owners-resume.component';
import { OwnersAddnewComponent } from './modules/tasks/owners-old/owners-addnew/owners-addnew.component';
import { OwnersReportsComponent } from './modules/tasks/owners-old/owners-reports/owners-reports.component';
import { OwnersDeleteComponent } from './modules/tasks/owners-old/owners-delete/owners-delete.component';
import { DriversTableComponent } from './modules/tasks/drivers-old/drivers-table/drivers-table.component';
import { DriversResumeComponent } from './modules/tasks/drivers-old/drivers-resume/drivers-resume.component';
import { DriversDeleteComponent } from './modules/tasks/drivers-old/drivers-delete/drivers-delete.component';
import { DriversAddnewComponent } from './modules/tasks/drivers-old/drivers-addnew/drivers-addnew.component';
import { VehiclesTableComponent } from './modules/tasks/vehicles-old/vehicles-table/vehicles-table.component';
import { VehiclesResumeComponent } from './modules/tasks/vehicles-old/vehicles-resume/vehicles-resume.component';
import { VehiclesDeleteComponent } from './modules/tasks/vehicles-old/vehicles-delete/vehicles-delete.component';
import { VehiclesAddnewComponent } from './modules/tasks/vehicles-old/vehicles-addnew/vehicles-addnew.component';
import { VehiclesDocumentationComponent } from './modules/tasks/vehicles-old/vehicles-documentation/vehicles-documentation.component';
import { DriversDocumentationComponent } from './modules/tasks/drivers-old/drivers-documentation/drivers-documentation.component';
import { OperacionesEntregaVehiculoConductorComponent } from './modules/options/users/operaciones/operaciones-entrega-vehiculo-conductor/operaciones-entrega-vehiculo-conductor.component';
import { SharedModule } from './modules/shared/shared.module';
import { MaterialModule } from './modules/shared/material/material.module';
import { InspectionsTableComponent } from './modules/tasks/inspections/inspections-table/inspections-table.component';
import { OperacionesContratoDeclaracionJuradaComponent } from './modules/options/users/operaciones/operaciones-contrato-declaracion-jurada/operaciones-contrato-declaracion-jurada.component';
import { VehiclesDocumentsComponent } from './modules/tasks/documents/vehicles-documents/vehicles-documents.component';
import { DriversDocumentsComponent } from './modules/tasks/documents/drivers-documents/drivers-documents.component';
import { OptionsDocumentsDialogComponent } from './modules/tasks/documents/options-documents-dialog/options-documents-dialog.component';
import { FolioInfoDialogComponent } from './modules/tasks/documents/folio-info-dialog/folio-info-dialog.component';
import { InspectionsAddDialogComponent } from './modules/tasks/inspections/inspections-add-dialog/inspections-add-dialog.component';
import { InfoDocumentsDialogComponent } from './modules/tasks/documents/info-documents-dialog/info-documents-dialog.component';
import { OperacionesCrearCuentaDiarioConductorComponent } from './modules/options/users/operaciones/operaciones-crear-cuenta-diario-conductor/operaciones-crear-cuenta-diario-conductor.component';
import { OperacionesCambiarEstadoVehiculoComponent } from './modules/options/users/operaciones/operaciones-cambiar-estado-vehiculo/operaciones-cambiar-estado-vehiculo.component';
import { OperacionesCambiarPatioVehiculoComponent } from './modules/options/users/operaciones/operaciones-cambiar-patio-vehiculo/operaciones-cambiar-patio-vehiculo.component';
import { OperacionesCorregirKilometrajeActualComponent } from './modules/options/users/operaciones/operaciones-corregir-kilometraje-actual/operaciones-corregir-kilometraje-actual.component';
import { OperacionesPrestamoVehiculoConductorComponent } from './modules/options/users/operaciones/operaciones-prestamo-vehiculo-conductor/operaciones-prestamo-vehiculo-conductor.component';
import { OperacionesDevolucionVehiculoPrestadoComponent } from './modules/options/users/operaciones/operaciones-devolucion-vehiculo-prestado/operaciones-devolucion-vehiculo-prestado.component';
import { VehicleStatesFormComponent } from './modules/tasks/inspections/inspections-forms/vehicle-states-form/vehicle-states-form.component';
import { TakePhotosVehicleComponent } from './modules/tasks/inspections/take-photos-vehicle/take-photos-vehicle.component';
import { ImagePreviewDialogComponent } from './modules/tasks/inspections/image-preview-dialog/image-preview-dialog.component';
import { PanapassDialogComponent } from './modules/tasks/inspections/panapass-dialog/panapass-dialog.component';
import { InspectionFinishImagesDialogComponent } from './modules/tasks/inspections/inspection-finish-images-dialog/inspection-finish-images-dialog.component';
import { InspectionInfoDialogComponent } from './modules/tasks/inspections/inspection-info-dialog/inspection-info-dialog.component';
import { TakeSignaturePhotoComponent } from './modules/tasks/take-signature-photo/options-take-signature-photo-dialog/options-take-signature-photo-dialog.component';
import { TakeSignatureComponent } from './modules/tasks/take-signature-photo/take-signature/take-signature.component';
import { TakePhotoComponent } from './modules/tasks/take-signature-photo/take-photo/take-photo.component';
import { TakeVehiclePhotoComponent } from './modules/tasks/take-signature-photo/take-vehicle-photo/take-vehicle-photo.component';
import { TakeFingerprintComponent } from './modules/tasks/take-signature-photo/take-fingerprint/take-fingerprint.component';
import { InspectionsGenerateQrDialogComponent } from './modules/tasks/inspections/inspections-generate-qr-dialog/inspections-generate-qr-dialog.component';
import { InspectionsVehicleInfoComponent } from './modules/tasks/inspections/inspections-vehicle-info/inspections-vehicle-info.component';
import { OperacionesBajarConductorVehiculoComponent } from './modules/options/users/operaciones/operaciones-bajar-conductor-vehiculo/operaciones-bajar-conductor-vehiculo.component';
import { OperacionesLiquidacionCuentaComponent } from './modules/options/users/operaciones/operaciones-bajar-conductor-vehiculo/operaciones-liquidacion-cuenta/operaciones-liquidacion-cuenta.component';

import { OperacionesExplicacionOtrosGastosComponent } from './modules/options/users/operaciones/operaciones-bajar-conductor-vehiculo/operaciones-otros-gastos/operaciones-explicacion-otros-gastos/operaciones-explicacion-otros-gastos.component';
import { OperacionesLiquidacionOtrosGastosComponent } from './modules/options/users/operaciones/operaciones-bajar-conductor-vehiculo/operaciones-otros-gastos/operaciones-liquidacion-otros-gastos/operaciones-liquidacion-otros-gastos.component';
import { OperacionesAperturaCobrarConductorComponent } from './modules/options/users/operaciones/operaciones-apertura-cobrar-conductor/operaciones-apertura-cobrar-conductor.component';
import { OperacionesAperturaCuentaComponent } from './modules/options/users/operaciones/operaciones-apertura-cobrar-conductor/operaciones-apertura-cuenta/operaciones-apertura-cuenta.component';
import { OperacionesRelacionCuentasPagarComponent } from './modules/options/users/operaciones/operaciones-apertura-cobrar-conductor/operaciones-relacion-cuentas-pagar/operaciones-relacion-cuentas-pagar.component';
import { OperacionesExplicacionCuentasPagarComponent } from './modules/options/users/operaciones/operaciones-apertura-cobrar-conductor/operaciones-relacion-cuentas-pagar/operaciones-explicacion-cuentas-pagar/operaciones-explicacion-cuentas-pagar.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    StatevehiclefleetComponent,
    PdfViewerComponent,
    FeespaidComponent,
    OpcionesGerenciaComponent,
    OpcionesTramitesComponent,
    OpcionesChapisteriaComponent,
    OpcionesGastosComponent,
    OpcionesTallerComponent,
    OpcionesOperacionesComponent,
    OpcionesLlaveroComponent,
    OpcionesReclamosComponent,
    OpcionesCntComponent,
    OpcionesUtilidadesComponent,
    OpcionesCarteraComponent,
    OpcionesAlmacenComponent,
    OwnersTableComponent,
    OwnersVehiclesComponent,
    OwnersResumeComponent,
    OwnersAddnewComponent,
    OwnersReportsComponent,
    OwnersDeleteComponent,
    DriversTableComponent,
    DriversResumeComponent,
    DriversDeleteComponent,
    DriversAddnewComponent,
    VehiclesTableComponent,
    VehiclesResumeComponent,
    VehiclesDeleteComponent,
    VehiclesAddnewComponent,
    VehiclesDocumentationComponent,
    DriversDocumentationComponent,
    OperacionesEntregaVehiculoConductorComponent,
    InspectionsTableComponent,
    OperacionesContratoDeclaracionJuradaComponent,
    VehiclesDocumentsComponent,
    DriversDocumentsComponent,
    OptionsDocumentsDialogComponent,
    FolioInfoDialogComponent,
    InspectionsAddDialogComponent,
    InfoDocumentsDialogComponent,
    OperacionesCrearCuentaDiarioConductorComponent,
    OperacionesCambiarEstadoVehiculoComponent,
    OperacionesCambiarPatioVehiculoComponent,
    OperacionesCorregirKilometrajeActualComponent,
    OperacionesPrestamoVehiculoConductorComponent,
    OperacionesDevolucionVehiculoPrestadoComponent,
    VehicleStatesFormComponent,
    TakePhotosVehicleComponent,
    ImagePreviewDialogComponent,
    PanapassDialogComponent,
    InspectionFinishImagesDialogComponent,
    InspectionInfoDialogComponent,
    TakeSignaturePhotoComponent,
    TakeSignatureComponent,
    TakePhotoComponent,
    TakeVehiclePhotoComponent,
    TakeFingerprintComponent,
    InspectionsGenerateQrDialogComponent,
    InspectionsVehicleInfoComponent,
    OperacionesBajarConductorVehiculoComponent,
    OperacionesLiquidacionCuentaComponent,
    OperacionesLiquidacionOtrosGastosComponent,
    OperacionesExplicacionOtrosGastosComponent,
    OperacionesAperturaCobrarConductorComponent,
    OperacionesAperturaCuentaComponent,
    OperacionesRelacionCuentasPagarComponent,
    OperacionesExplicacionCuentasPagarComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    HttpClientModule,
    FormsModule,
    SharedModule,
    MaterialModule,
  ],
  providers: [{ provide: LOCALE_ID, useValue: 'es' }],
  bootstrap: [AppComponent],
})
export class AppModule {}
