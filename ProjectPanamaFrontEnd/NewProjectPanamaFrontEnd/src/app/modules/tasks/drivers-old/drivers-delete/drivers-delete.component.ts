import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from 'src/app/services/api.service';

@Component({
  selector: 'app-drivers-delete',
  templateUrl: './drivers-delete.component.html',
  styleUrls: ['./drivers-delete.component.css']
})
export class DriversDeleteComponent {
  @Input() isVisible: boolean = false;
  @Input() driver: string | null = null;
  @Output() close = new EventEmitter<void>();

  isLoading: boolean = true;
  doubleValidation: boolean = false;
  permissionsDelete: any;
  hasPermission: boolean = false;
  grantedPermission: string = '';
  deleteSuccesful: boolean = false;

  constructor(
    private router: Router,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isVisible'] && changes['isVisible'].currentValue === true) {
      this.resetState();
      this.verifyPermissions();
    }
  }

  acceptRemove() {
    if(this.doubleValidation){
      if(!this.hasPermission){
        this.apiService.deleteData("driver/"+this.driver).subscribe(
          (response) => {
            this.deleteSuccesful = true;
          },
          (error) => {
          }
        );
      }
    }
    else{
      this.doubleValidation = true;
    }
  }

  verifyPermissions() {
    this.apiService.getData("verify-driver-delete/"+this.driver).subscribe(
      (response) => {
        this.permissionsDelete = response;

        for (const [key, value] of Object.entries(response)) {
          if (value === true) {
            this.hasPermission = true;
            this.grantedPermission = key;
            break; 
          }
        }
        this.isLoading = false;
      },
      (error) => {
      }
    );
  }

  resetState() {
    this.permissionsDelete = null;
    this.hasPermission = false;
    this.grantedPermission = '';
    this.isLoading = true;
    this.doubleValidation = false;
    this.deleteSuccesful = false;
  }

  returnDrivers() {
    this.closeModal();
    this.router.navigate(['/drivers']);
  }

  closeModal() {
    this.resetState();
    this.close.emit();
  }
}
