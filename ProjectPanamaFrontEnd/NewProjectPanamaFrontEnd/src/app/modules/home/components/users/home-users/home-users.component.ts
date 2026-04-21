import { Component, effect, ElementRef, ViewChild } from '@angular/core';
import { JwtService } from 'src/app/services/jwt.service';
import { GlobalStatesService } from 'src/app/states/global-states.service';
import { MatDialog } from '@angular/material/dialog';
import { CobrosComponent } from '../options/cobros/cobros.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home-users',
  templateUrl: './home-users.component.html',
  styleUrls: ['./home-users.component.css'],
})
export class HomeUsersComponent {
  @ViewChild('videoPlayer') videoPlayer!: ElementRef<HTMLVideoElement>;

  options: any[] = [];

  isAdmin: boolean = false;

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
  changeVideo: boolean = true;
  permisos: any;

  infoCompanyVisible: boolean = false;

  constructor(
    private jwtService: JwtService,
    // private apiService: ApiService,
    private router: Router,
    private globalStatesService: GlobalStatesService,
    public dialog: MatDialog
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
    this.isAdmin = this.jwtService.isAdmin();

    this.convertirValoresBooleanos(this.permisos);

    this.options = [
      {
        name: 'Caja',
        icon: '../../../../assets/icons/caja.svg',
        url: '/cash-register',
        click: () => null,
        enabled: this.permisos.opcion01,
        disabled: false,
      },
      {
        name: 'Operaciones',
        icon: '../../../../assets/icons/operaciones.svg',
        url: '/operations',
        click: () => null,
        enabled: this.permisos.opcion02,
        disabled: false,
      },
      {
        name: 'Cobros',
        icon: '../../../../assets/icons/cobros.svg',
        url: null,
        click: () => this.openDialogCobros(),
        enabled: this.permisos.opcion03,
        disabled: false,
      },
      {
        name: 'Trámites',
        icon: '../../../../assets/icons/tramites.svg',
        url: '/procedures',
        click: () => null,
        enabled: this.permisos.opcion04,
        disabled: false,
      },
      {
        name: 'Almacén',
        icon: '../../../../assets/icons/almacen.svg',
        url: '/warehouse',
        click: () => null,
        enabled: this.permisos.opcion05,
        disabled: false,
      },
      {
        name: 'Sucursal',
        icon: '../../../../assets/icons/taller.svg',
        url: '/workshop',
        click: () => null,
        enabled: this.permisos.opcion06,
        disabled: false,
      },
      {
        name: 'Chapistería',
        icon: '../../../../assets/icons/chapisteria.svg',
        url: '/sheet-metal-work',
        click: () => null,
        enabled: this.permisos.opcion07,
        disabled: false,
      },
      {
        name: 'Llavero',
        icon: '../../../../assets/icons/llavero.svg',
        url: '/keychain',
        click: () => null,
        enabled: this.permisos.opcion08,
        disabled: false,
      },
      {
        name: 'Reclamos',
        icon: '../../../../assets/icons/reclamos.svg',
        url: '/claims',
        click: () => null,
        enabled: this.permisos.opcion09,
        disabled: false,
      },
      {
        name: 'Cartera',
        icon: '../../../../assets/icons/cartera.svg',
        url: '/wallet',
        click: () => null,
        enabled: this.permisos.opcion10,
        disabled: false,
      },
      {
        name: 'Gerencia',
        icon: '../../../../assets/icons/gerencia.svg',
        url: '/management',
        click: () => null,
        enabled: this.permisos.opcion11,
        disabled: false,
      },
      {
        name: 'Gastos',
        icon: '../../../../assets/icons/gastos.svg',
        url: '/expenses',
        click: () => null,
        enabled: this.permisos.opcion12,
        disabled: false,
      },
      {
        name: 'CNT',
        icon: '../../../../assets/icons/cnt.svg',
        url: '/cnt',
        click: () => null,
        enabled: this.permisos.opcion13,
        disabled: false,
      },
      {
        name: 'Contado',
        icon: '../../../../assets/icons/contado.svg',
        url: 'hoalalalal',
        click: () => null,
        enabled: this.permisos.opcion14,
        disabled: true,
      },
      {
        name: 'Utilidades',
        icon: '../../../../assets/icons/utilidades1.svg',
        url: '/utilities',
        click: () => null,
        enabled: this.permisos.opcion15,
        disabled: false,
      },
    ];
  }

  changeVideoState() {
    this.changeVideo = !this.changeVideo;
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

  openDialogCobros() {
    const dialogRef = this.dialog.open(CobrosComponent, {
      minWidth: 'min(600px, 90vw)',
      maxHeight: '100vh'
      }
    );

    dialogRef.afterClosed().subscribe((result) => {
      if(result){
         this.router.navigate(['/cobros'])
      }
    });
  }
}
