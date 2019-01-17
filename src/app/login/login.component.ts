import { Apollo } from 'apollo-angular';
import { Router } from '@angular/router';
import { AuthService } from './../auth.service';
import {Component, OnInit} from '@angular/core';

import {
  CREATE_USER_MUTATION,
  CreateUserMutationResponse,
  SIGNIN_USER_MUTATION,
  SigninUserMutationResponse
} from '../graphql';

@Component({
  selector: 'app-hn-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  login = true; // switch between Login and SignUp
  email = '';
  password = '';
  name = '';

  constructor(private router: Router,
    private authService: AuthService,
    private apollo: Apollo) {
    }

    ngOnInit() {
    }

    confirm() {
      if (this.login) {
        this.apollo.mutate({
          mutation: SIGNIN_USER_MUTATION,
          variables: {
            email: this.email,
            password: this.password
          }
        }).subscribe((result) => {
          const id = result.data.signinUser.user.id;
          const token = result.data.signinUser.token;
          this.saveUserData(id, token);

          this.router.navigate(['/']);

        }, (error) => {
          alert(error);
        });
      } else {
        this.apollo.mutate({
          mutation: CREATE_USER_MUTATION,
          variables: {
            name: this.name,
            email: this.email,
            password: this.password
          }
        }).subscribe((result) => {
          const id = result.data.signinUser.user.id;
          const token = result.data.signinUser.token;
          this.saveUserData(id, token);

          this.router.navigate(['/']);

        }, (error) => {
          alert(error);
        });
      }
    }

    saveUserData(id: string, token: string) {
      this.authService.saveUserData(id, token);
    }
  }
