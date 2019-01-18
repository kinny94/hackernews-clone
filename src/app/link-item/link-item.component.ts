import {Component, Input, OnInit, OnDestroy} from '@angular/core';
import {Link} from '../types';
import { Subscription, Apollo } from 'apollo-angular';
import {timeDifferenceForDate} from '../utils';
import { subscribeOn } from 'rxjs/operators';
import { CREATE_VOTE_MUTATION, ALL_LINKS_QUERY } from './../graphql';
import { GC_USER_ID } from './../constants';
import { DataProxy } from 'apollo-cache';
import { FetchResult } from 'apollo-link';

interface UpdateStoreAfterVoteCallback {
  (proxy: DataProxy, mutationResult: FetchResult, linkId: string);
}

@Component({
  selector: 'app-hn-link-item',
  templateUrl: './link-item.component.html',
  styleUrls: ['./link-item.component.css']
})
export class LinkItemComponent implements OnInit, OnDestroy {
  @Input()
  link: Link;

  @Input()
  index = 0;

  @Input()
  isAuthenticated = false;

  @Input()
  updateStoreAfterVote: UpdateStoreAfterVoteCallback;

  subscriptions: Subscription[] = [];

  constructor(private apollo: Apollo) {
  }

  ngOnInit() {
  }

  voteForLink() {
    const userId = localStorage.getItem(GC_USER_ID);
    const voterIds = this.link.votes.map(vote => vote.user.id);
    if (voterIds.includes(userId)) {
      alert(`User (${userId}) already voted for this link.`);
      return;
    }
    const linkId = this.link.id;

    const mutationSubscription = this.apollo.mutate({
      mutation: CREATE_VOTE_MUTATION,
      variables: {
        userId,
        linkId
      }
    })
      .subscribe();

    this.subscriptions = [...this.subscriptions, mutationSubscription];
  }

  humanizeDate(date: string) {
    return timeDifferenceForDate(date);
  }

  ngOnDestroy(): void {
    for (const sub of this.subscriptions) {
      if (sub !== undefined ) {
        if (sub && sub.unsubscribe) {
          sub.unsubscribe();
        }
      }
    }
  }
}
