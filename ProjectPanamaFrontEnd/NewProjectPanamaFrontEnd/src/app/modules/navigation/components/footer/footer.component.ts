import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']
})
export class FooterComponent {
  logoURL = 'https://res.cloudinary.com/dhry2v8qz/image/upload/v1747705038/AlfaSoft/company-logo/AlfaSoft.png';
  currentYear = new Date().getFullYear();
}