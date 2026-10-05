import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { JwtService } from 'src/app/services/jwt.service';
import { ApiService } from 'src/app/services/api.service';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { InfoCompanyComponent } from '../info-company/info-company.component';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { OptionsDocumentsDialogComponent } from 'src/app/modules/tasks/documents/options-documents-dialog/options-documents-dialog.component';

@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.css'],
})
export class ToolbarComponent implements OnInit {
  @Output() menuClick = new EventEmitter<void>();

  permissions: any;
  ownerView: boolean = false;

  constructor(
    private jwtService: JwtService,
    private apiService: ApiService,
    private router: Router,
    private dialog: MatDialog,
    private breakpointObserver: BreakpointObserver,
  ) {}

  ngOnInit() {
    this.getUser();
  }

  getUser() {
    this.permissions = this.jwtService.getUserPermissions();
    if (this.permissions?.opcion16 === true) {
      this.ownerView = true;
    }
  }

  openDialogInfoCompany(): void {
    const isSmallScreen = this.breakpointObserver.isMatched(Breakpoints.XSmall);
    const dialogWidth = isSmallScreen ? '90vw' : '60%';

    const dialogRef = this.dialog.open(InfoCompanyComponent, {
      width: dialogWidth,
    });
  }

  openDialogDocuments(): void {
    const isSmallScreen = this.breakpointObserver.isMatched(Breakpoints.XSmall);
    const dialogWidth = isSmallScreen ? '90vw' : '60%';

    const dialogRef = this.dialog.open(OptionsDocumentsDialogComponent, {
      width: dialogWidth,
    });
  }

  onMenuClick() {
    this.menuClick.emit();
  }

  logout(): void {
    this.jwtService.logout();
    this.apiService.postData('logout', {}).subscribe(
      (response) => {
        this.router.navigate(['/login']);
      },
      (error) => {
        console.error(error);
      },
    );
  }
}
