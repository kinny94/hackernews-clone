import {Apollo} from 'apollo-angular';
import {CREATE_LINK_MUTATION, CreateLinkMutationResponse, ALL_LINKS_QUERY } from '../graphql';
import {Component, OnInit} from '@angular/core';

import {Router} from '@angular/router';

@Component({
  selector: 'app-hn-create-link',
  templateUrl: './create-link.component.html',
  styleUrls: ['./create-link.component.css']
})
export class CreateLinkComponent implements OnInit {

  description = '';
  url = '';

  constructor(public apollo: Apollo, public router: Router ) {
  }

  ngOnInit() {
  }

  createLink() {
    this.apollo.mutate({
      mutation: CREATE_LINK_MUTATION,
      variables: {
        description: this.description,
        url: this.url
      },
      update: (store, { data: { createLink } }) => {
        const data: any = store.readQuery({
          query: ALL_LINKS_QUERY
        });

        data.allLinks.push(createLink);
        store.writeQuery({ query: ALL_LINKS_QUERY, data });
      },
    }).subscribe((response) => {
      // We injected the Router service
      this.router.navigate(['/']);
    });
  }
//
}
