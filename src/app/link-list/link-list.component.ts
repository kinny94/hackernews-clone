import {Component, OnDestroy, OnInit} from '@angular/core';
import {Apollo} from 'apollo-angular';
import {Link} from '../types';
import {ALL_LINKS_QUERY, AllLinkQueryResponse, NEW_LINKS_SUBSCRIPTION, NEW_VOTES_SUBSCRIPTION} from '../graphql';
import {AuthService} from '../auth.service';
import {ActivatedRoute, Router} from '@angular/router';
import {map, switchMap, take, distinctUntilChanged} from 'rxjs/operators';
import {LINKS_PER_PAGE} from '../constants';
import {Observable, Subscription, of, combineLatest} from 'rxjs';
import _ from 'lodash';
import {ApolloQueryResult} from 'apollo-client';

@Component({
  selector: 'app-hn-link-list',
  templateUrl: './link-list.component.html',
  styleUrls: ['./link-list.component.css']
})
export class LinkListComponent implements OnInit, OnDestroy {
  allLinks: Link[] = [];
  loading = true;
  linksPerPage = LINKS_PER_PAGE;
  count = 0;

  logged = false;

  subscriptions: Subscription[] = [];

  first$: Observable<number>;
  skip$: Observable<number>;
  orderBy$: Observable<string | null>;

  constructor(private apollo: Apollo,
              private authService: AuthService,
              private route: ActivatedRoute,
              private router: Router) {
  }

  ngOnInit() {

    this.authService.isAuthenticated.pipe(
      distinctUntilChanged()
    )
    .subscribe(isAuthenticated => {
      this.logged = isAuthenticated;
    });

    // 0
    const pageParams$: Observable<number> = this.route.paramMap.pipe(
      map((params) => {
        return parseInt(params.get('page'), 10);
      })
    );

    // 1
    const path$: Observable<string> = this.route.url.pipe(
      map((segments) => segments.toString())
    );

    // 2
    this.first$ = path$.pipe(
      map((path) => {
        const isNewPage = path.includes('new');
        return isNewPage ? this.linksPerPage : 100;
      })
    );

    // 3
    this.skip$ = combineLatest(path$, pageParams$).pipe(
      map(([path, page]) => {
        const isNewPage = path.includes('new');
        return isNewPage ? (page - 1) * this.linksPerPage : 0;
      })
    );

    // 4
    this.orderBy$ = path$.pipe(
      map((path) => {
        const isNewPage = path.includes('new');
        return isNewPage ? 'createdAt_DESC' : null;
      })
    );

    // 5
    const getQuery = (variables): Observable<ApolloQueryResult<AllLinkQueryResponse>> => {
      const query = this.apollo.watchQuery<AllLinkQueryResponse>({
        query: ALL_LINKS_QUERY,
        variables
      });

      query
        .subscribeToMore({
          document: NEW_LINKS_SUBSCRIPTION,
          updateQuery: (previous: AllLinkQueryResponse, { subscriptionData }) => {
            // Casting to any because typings are not updated
            const newAllLinks = [
              (<any>subscriptionData).Link.node,
              ...previous.allLinks
            ];
            return {
              ...previous,
              allLinks: newAllLinks
            };
          }
        });

      query
        .subscribeToMore({
          document: NEW_VOTES_SUBSCRIPTION,
          updateQuery: (previous: AllLinkQueryResponse, { subscriptionData }: { subscriptionData: any }) => {
            const votedLinkIndex = previous.allLinks.findIndex((linked) =>
              linked.id === subscriptionData.Vote.node.link.id);

            const link = subscriptionData.Vote.node.link;

            const newAllLinks = previous.allLinks.slice();
            newAllLinks[votedLinkIndex] = link;

            return {
              ...previous,
              allLinks: newAllLinks
            };
          },
          onError: (err) => {
            console.log('onError::subscribeToMore for NEW_VOTES_SUBSCRIPTION', err);
          }
        });

      return query.valueChanges;
    };

    // 6
    const allLinkQuery: Observable<ApolloQueryResult<AllLinkQueryResponse>> =
      combineLatest(this.first$, this.skip$, this.orderBy$, (first, skip, orderBy) => ({ first, skip, orderBy })).pipe(
        switchMap((variables: any) => getQuery(variables))
      );


    // 7
    const querySubscription = allLinkQuery.subscribe((response) => {
      this.allLinks = response.data.allLinks;
      this.count = response.data._allLinksMeta.count;
      this.loading = response.data.loading;
    });

    this.subscriptions = [...this.subscriptions, querySubscription];
  }

  updateStoreAfterVote = (store, createVote, linkId) => {
    let variables;

    combineLatest(this.first$, this.skip$, this.orderBy$, (first, skip, orderBy) => ({ first, skip, orderBy })).pipe(
      take(1),
    ).subscribe(values => variables = values);

    // 1
    const data = store.readQuery({
      query: ALL_LINKS_QUERY,
      variables
    });

    // 2
    const votedLink = data.allLinks.find(link => link.id === linkId);
    votedLink.votes = createVote.link.votes;

    // 3
    store.writeQuery({ query: ALL_LINKS_QUERY, variables, data });
  }

  get orderedLinks(): Observable<Link[]> {
    return this.route.url.pipe(
      map((segments) => segments.toString()),
      map(path => {
        if (path.includes('top')) {
          return _.orderBy(this.allLinks, 'votes.length').reverse();
        } else {
          return this.allLinks;
        }
      })
    );
  }

  get isFirstPage(): Observable<boolean> {
    return this.route.paramMap.pipe(
      map((params) => {
        return parseInt(params.get('page'), 10);
      }),
      map(page => page === 1)
    );
  }

  get isNewPage(): Observable<boolean> {
    return this.route.url.pipe(
      map((segments) => segments.toString()),
      map(path => path.includes('new'))
    );
  }

  get pageNumber(): Observable<number> {
    return this.route.paramMap.pipe(
      map((params) => {
        return parseInt(params.get('page'), 10);
      })
    );
  }

  get morePages(): Observable<boolean> {
    return this.pageNumber.pipe(
      map(pageNumber => pageNumber < this.count / this.linksPerPage)
    );
  }

  nextPage() {
    const page = parseInt(this.route.snapshot.params.page, 10);
    if (page < this.count / LINKS_PER_PAGE) {
      const nextPage = page + 1;
      this.router.navigate([`/new/${nextPage}`]);
    }
  }


  previousPage() {
    const page = parseInt(this.route.snapshot.params.page, 10);
    if (page > 1) {
      const previousPage = page - 1;
      this.router.navigate([`/new/${previousPage}`]);
    }
  }

  ngOnDestroy(): void {
    for (const sub of this.subscriptions) {
      if (sub && sub.unsubscribe) {
        sub.unsubscribe();
      }
    }
  }
}
