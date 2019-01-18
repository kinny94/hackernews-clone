import { AuthService } from './../auth.service';
import { Component, OnInit, OnDestroy } from '@angular/core';
import {Apollo, Subscription} from 'apollo-angular';
import {Link} from '../types';
import { distinctUntilChanged } from 'rxjs/operators';

// 1
import {ALL_LINKS_QUERY, AllLinkQueryResponse} from '../graphql';

@Component({
  selector: 'app-hn-link-list',
  templateUrl: './link-list.component.html',
  styleUrls: ['./link-list.component.css']
})
export class LinkListComponent implements OnInit, OnDestroy {
  allLinks: Link[] = [];
  loading = true;

  logged = false;

  subscriptions: Subscription[] = [];

  constructor(private apollo: Apollo, private authService: AuthService) {
  }

  ngOnInit() {

    this.authService.isAuthenticated.pipe(
        distinctUntilChanged()
      )
      .subscribe(isAuthenticated => {
        this.logged = isAuthenticated;
      });

    const querySubscription = this.apollo.watchQuery({
      query: ALL_LINKS_QUERY
    }).valueChanges.subscribe((response) => {
      this.allLinks = response.data['allLinks'];
      this.loading = response.data['loading'];
    });

    this.subscriptions = [...this.subscriptions, querySubscription];

  }

  updateStoreAfterVote (store, createVote, linkId) {
    // 1
    const data = store.readQuery({
      query: ALL_LINKS_QUERY
    });

    // 2
    const votedLink = data.allLinks.find(link => link.id === linkId);
    votedLink.votes = createVote.link.votes;

    // 3
    store.writeQuery({ query: ALL_LINKS_QUERY, data });
  }

  ngOnDestroy(): void {
    for (const sub of this.subscriptions) {
      if (sub && sub.unsubscribe) {
        sub.unsubscribe();
      }
    }
  }
}
