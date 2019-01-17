import { GC_AUTH_TOKEN } from './constants';
import {NgModule} from '@angular/core';
import {HttpClientModule, HttpHeaders} from '@angular/common/http';
// 1
import {Apollo, ApolloModule} from 'apollo-angular';
import {HttpLink, HttpLinkModule} from 'apollo-angular-link-http';
import {InMemoryCache} from 'apollo-cache-inmemory';
import { ApolloLink } from 'apollo-link';


@NgModule({
  exports: [
    // 2
    HttpClientModule,
    ApolloModule,
    HttpLinkModule
  ]
})
export class GraphQLModule {
  // 3
  constructor(apollo: Apollo, httpLink: HttpLink) {

    // 4
    const uri = 'https://api.graph.cool/simple/v1/cjqzofhkx19a10148s5lxznig';
    const http = httpLink.create({ uri });

    const middleware = new ApolloLink((operation, forward) => {
      const token = localStorage.getItem(GC_AUTH_TOKEN);
      if (token) {
        operation.setContext({
          headers: new HttpHeaders().set('Authorization', `Bearer ${token}`)
        });
      }
      return forward(operation);
    });

    // 5
    apollo.create({
      link: middleware.concat(http),
      cache: new InMemoryCache()
    });
  }
}
