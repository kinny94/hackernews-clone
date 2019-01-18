import { GC_AUTH_TOKEN } from './constants';
import {NgModule} from '@angular/core';
import {HttpClientModule, HttpHeaders} from '@angular/common/http';
// 1
import {Apollo, ApolloModule} from 'apollo-angular';
import {HttpLink, HttpLinkModule} from 'apollo-angular-link-http';
import {InMemoryCache} from 'apollo-cache-inmemory';
import { ApolloLink } from 'apollo-link';

import {getOperationAST} from 'graphql';
import {WebSocketLink} from 'apollo-link-ws';


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

    const token = localStorage.getItem(GC_AUTH_TOKEN);
    const authorization = token ? `Bearer ${token}` : null;
    const headers = new HttpHeaders();
    headers.append('Authorization', authorization);

    const uri = 'https://api.graph.cool/simple/v1/cjqzofhkx19a10148s5lxznig';
    const http = httpLink.create({ uri, headers });

    // 1
    const ws = new WebSocketLink({
      uri: `wss://subscriptions.graph.cool/v1/cjqzofhkx19a10148s5lxznig`,
      options: {
        reconnect: true,
        connectionParams: {
          authToken: localStorage.getItem(GC_AUTH_TOKEN),
        }
      }
    });

    apollo.create({
      // 2
      link: ApolloLink.split(
        // 3
        operation => {
          const operationAST = getOperationAST(operation.query, operation.operationName);
          return !!operationAST && operationAST.operation === 'subscription';
        },
        ws,
        http,
      ),
      cache: new InMemoryCache()
    });
  }
}
