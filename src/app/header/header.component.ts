import {Component, OnInit} from '@angular/core';
import {AuthService} from '../auth.service';
import { distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-hn-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  logged = false;

  constructor(private authService: AuthService) {
  }

  ngOnInit() {
    this.authService.isAuthenticated.pipe(
        distinctUntilChanged() // Only emit when the current value is different than the last
      )
      .subscribe(isAuthenticated => {
        this.logged = isAuthenticated;
      });

  }

  logout() {
    this.authService.logout();
  }
}
