import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Component, effect, ElementRef, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { OwnersPandgstatusOptionsDialogComponent } from 'src/app/modules/options/owners/components/owners-pandgstatus/owners-pandgstatus-options-dialog/owners-pandgstatus-options-dialog.component';
import { OwnersRelationshipOptionsComponent } from 'src/app/modules/options/owners/components/owners-relationshiprevenues/owners-relationship-options/owners-relationship-options.component';
import { OwnersStatusfleetOptionsComponent } from 'src/app/modules/options/owners/components/owners-statusfleet/owners-statusfleet-options/owners-statusfleet-options.component';
import { JwtService } from 'src/app/services/jwt.service';
import { GlobalStatesService } from 'src/app/states/global-states.service';

@Component({
  selector: 'app-home-owners',
  templateUrl: './home-owners.component.html',
  styleUrls: ['./home-owners.component.css'],
})
export class HomeOwnersComponent {
  @ViewChild('videoPlayer') videoPlayer!: ElementRef<HTMLVideoElement>;

  options: any[] = [];

  logoutIcon: string = '../../../../assets/icons/logout.svg';
  rightIcon: string = '../../../../assets/icons/rightArrow.svg';

  images: string[] = [
    '../../../../assets/img/taxi1.jpg',
    '../../../../assets/img/taxi2.jpg',
    '../../../../assets/img/taxi3.jpg',
  ];

  videos: string[] = [
    '../../../../assets/video/calle.mp4',
    '../../../../assets/video/conduccion.mp4',
  ];

  currentImageIndex: number = 0;
  showImage: boolean = true;
  currentVideoIndex: number = 0;
  currentVideo: string = '';
  showImages: boolean = true;
  permisos: any;

  ownersStatusfleetsummaryVisible: boolean = false;
  ownersStatusfleetdetailVisible: boolean = false;
  ownersPurchasevalueandpiqueraVisible: boolean = false;
  ownersRelationshiprevenuesVisible: boolean = false;
  ownersRelationshiprevenuesGeneralVisible: boolean = false;
  ownersPartsrelationshipVisible: boolean = false;
  ownersPandgstatusVisible: boolean = false;
  ownersPandgstatusGeneralVisible: boolean = false;
  ownersFeespaidVisible: boolean = false;
  infoCompanyVisible: boolean = false;

  constructor(
    private jwtService: JwtService,
    // private apiService: ApiService,
    // private router: Router,
    private globalStatesService: GlobalStatesService,
    private dialog: MatDialog,
    private breakpointObserver: BreakpointObserver,
  ) {
    effect(() => {
      this.infoCompanyVisible = this.globalStatesService.displayInfoCompany();
    });
  }

  ngOnInit() {
    this.changeImagesPeriodically();
    this.obtenerUsuario();
    this.currentVideo = this.videos[this.currentVideoIndex];
  }

  obtenerUsuario() {
    this.permisos = this.jwtService.getUserData();

    this.convertirValoresBooleanos(this.permisos);

    this.options = [
      {
        name: 'Estado de Flota',
        url: 'hoalalalal',
        disabled: false,
        click: () => this.openStatusFleetOptionsDialog(),
      },
      {
        name: 'Valores de Compra y Piquera',
        url: 'hoalalalal',
        disabled: false,
        click: () => this.showModalOwnersPurchasevalueandpiquera(),
      },
      {
        name: 'Relación Ingresos',
        url: 'hoalalalal',
        disabled: false,
        click: () => this.openRelationshipOptionsDialog(),
      },
      {
        name: 'Relación Piezas',
        url: 'hoalalalal',
        disabled: false,
        click: () => this.showModalOwnersPartsRelationship(),
      },
      {
        name: 'Estado de P y G',
        url: 'hoalalalal',
        disabled: false,
        click: () => this.openPyGStatusOptionsDialog(),
      },
      {
        name: 'Cuotas Pagas por Conductor',
        url: 'hoalalalal',
        disabled: false,
        click: () => this.showModalOwnersFeespaid(),
      },
    ];
  }

  toggleMediaType() {
    this.showImages = !this.showImages;
  }

  changeImagesPeriodically() {
    setInterval(() => {
      this.showImage = false; // Oculta la imagen actual
      setTimeout(() => {
        this.currentImageIndex =
          (this.currentImageIndex + 1) % this.images.length;
        this.showImage = true; // Muestra la siguiente imagen
      }, 1000); // Espera 1 segundo para comenzar a mostrar la siguiente imagen
    }, 5000); // Intervalo total entre cambios de imagen
  }

  ngAfterViewInit() {
    this.videoPlayer.nativeElement.muted = true;
  }

  onVideoEnded() {
    this.currentVideoIndex = (this.currentVideoIndex + 1) % this.videos.length;
    this.currentVideo = this.videos[this.currentVideoIndex];
    this.videoPlayer.nativeElement.load(); // Cargar el nuevo video
    // this.videoPlayer.nativeElement.muted = true;
  }

  convertirValoresBooleanos(obj: any) {
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = obj[key];
        if (value === 'T') {
          obj[key] = true;
        } else if (value === 'F' || value === null) {
          obj[key] = false;
        }
      }
    }
  }

  showModalOwnersStatusfleetsummary() {
    this.ownersStatusfleetsummaryVisible =
      !this.ownersStatusfleetsummaryVisible;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
  }

  showModalOwnersStatusfleetdetail() {
    this.ownersStatusfleetdetailVisible = !this.ownersStatusfleetdetailVisible;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
  }

  showModalOwnersPurchasevalueandpiquera() {
    this.ownersPurchasevalueandpiqueraVisible =
      !this.ownersPurchasevalueandpiqueraVisible;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
  }

  showModalOwnersRelationshipprevenues() {
    this.ownersRelationshiprevenuesVisible =
      !this.ownersRelationshiprevenuesVisible;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
  }

  showModalOwnersRelationshiprevenuesGeneral() {
    this.ownersRelationshiprevenuesGeneralVisible =
      !this.ownersRelationshiprevenuesGeneralVisible;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
  }

  showModalOwnersPartsRelationship() {
    this.ownersPartsrelationshipVisible = !this.ownersPartsrelationshipVisible;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
  }

  showModalOwnersPandgstatus() {
    this.ownersPandgstatusVisible = !this.ownersPandgstatusVisible;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
  }

  showModalOwnersPandgstatusGeneral() {
    this.ownersPandgstatusGeneralVisible =
      !this.ownersPandgstatusGeneralVisible;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
  }

  showModalOwnersFeespaid() {
    this.ownersFeespaidVisible = !this.ownersFeespaidVisible;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
  }

  openPyGStatusOptionsDialog() {
    const isSmallScreen = this.breakpointObserver.isMatched(Breakpoints.XSmall);
    const dialogWidth = isSmallScreen ? '90vw' : '60%';

    const dialogRef = this.dialog.open(
      OwnersPandgstatusOptionsDialogComponent,
      {
        width: dialogWidth,
        disableClose: true,
      },
    );

    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'units') {
        this.showModalOwnersPandgstatus();
      } else if (result === 'general') {
        this.showModalOwnersPandgstatusGeneral();
      }
    });
  }

  openStatusFleetOptionsDialog() {
    const isSmallScreen = this.breakpointObserver.isMatched(Breakpoints.XSmall);
    const dialogWidth = isSmallScreen ? '90vw' : '60%';

    const dialogRef = this.dialog.open(OwnersStatusfleetOptionsComponent, {
      width: dialogWidth,
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'detail') {
        this.showModalOwnersStatusfleetdetail();
      } else if (result === 'summary') {
        this.showModalOwnersStatusfleetsummary();
      }
    });
  }

  openRelationshipOptionsDialog() {
    const isSmallScreen = this.breakpointObserver.isMatched(Breakpoints.XSmall);
    const dialogWidth = isSmallScreen ? '90vw' : '60%';

    const dialogRef = this.dialog.open(OwnersRelationshipOptionsComponent, {
      width: dialogWidth,
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'units') {
        this.showModalOwnersRelationshipprevenues();
      } else if (result === 'general') {
        this.showModalOwnersRelationshiprevenuesGeneral();
      }
    });
  }

  hideModal() {
    if (this.ownersStatusfleetsummaryVisible) {
      this.ownersStatusfleetsummaryVisible =
        !this.ownersStatusfleetsummaryVisible;
    }

    if (this.ownersStatusfleetdetailVisible) {
      this.ownersStatusfleetdetailVisible =
        !this.ownersStatusfleetdetailVisible;
    }

    if (this.ownersPurchasevalueandpiqueraVisible) {
      this.ownersPurchasevalueandpiqueraVisible =
        !this.ownersPurchasevalueandpiqueraVisible;
    }

    if (this.ownersRelationshiprevenuesVisible) {
      this.ownersRelationshiprevenuesVisible =
        !this.ownersRelationshiprevenuesVisible;
    }

    if (this.ownersRelationshiprevenuesGeneralVisible) {
      this.ownersRelationshiprevenuesGeneralVisible =
        !this.ownersRelationshiprevenuesGeneralVisible;
    }

    if (this.ownersPartsrelationshipVisible) {
      this.ownersPartsrelationshipVisible =
        !this.ownersPartsrelationshipVisible;
    }

    if (this.ownersPandgstatusVisible) {
      this.ownersPandgstatusVisible = !this.ownersPandgstatusVisible;
    }

    if (this.ownersPandgstatusGeneralVisible) {
      this.ownersPandgstatusGeneralVisible =
        !this.ownersPandgstatusGeneralVisible;
    }

    if (this.ownersFeespaidVisible) {
      this.ownersFeespaidVisible = !this.ownersFeespaidVisible;
    }

    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
  }
}
