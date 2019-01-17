import {Component, Input, OnInit, OnDestroy} from '@angular/core';
import {Link} from '../types';
import { Subscription } from 'apollo-angular';
import {timeDifferenceForDate} from '../utils';

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

  subscriptions: Subscription[] = [];

  constructor() {
  }

  ngOnInit() {
  }

  voteForLink = async () => {
    // ... you'll implement this in chapter 6
  }

  humanizeDate(date: string) {
    return timeDifferenceForDate(date);
  }

  ngOnDestroy(): void {
    for (const sub of this.subscriptions) {
      if (sub && sub.unsubscribe) {
        sub.unsubscribe();
      }
    }
  }
}
