import {Component, OnDestroy, OnInit} from '@angular/core';
import {AuthService} from '../auth.service';
import {distinctUntilChanged} from 'rxjs/operators';
import {Subscription} from 'rxjs';

@Component({
  selector: 'app-hn-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, OnDestroy {
  logged = false;
  subscriptions: Subscription[] = [];

  constructor(private authService: AuthService) {
  }

  ngOnInit() {
    const isAuthenticatedSubscription = this.authService.isAuthenticated.pipe(
        distinctUntilChanged()
      )
      .subscribe(isAuthenticated => {
        this.logged = isAuthenticated;
      });

    this.subscriptions = [...this.subscriptions, isAuthenticatedSubscription];

  }

  logout() {
    this.authService.logout();
  }

  ngOnDestroy(): void {
    for (const sub of this.subscriptions) {
      if (sub && sub.unsubscribe) {
        sub.unsubscribe();
      }
    }
  }
}
