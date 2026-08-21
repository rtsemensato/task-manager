import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, finalize, of, switchMap, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import type { User } from './models';

const TOKEN_KEY = 'task-manager-token';

interface TokenResponse {
  access_token: string;
  token_type: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly baseUrl = environment.apiBaseUrl;

  readonly currentUser = signal<User | null>(null);
  readonly isAuthenticated = computed(() => this.currentUser() !== null);
  readonly isInitializing = signal(true);

  getToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  }

  private setToken(token: string | null): void {
    try {
      if (token) {
        localStorage.setItem(TOKEN_KEY, token);
      } else {
        localStorage.removeItem(TOKEN_KEY);
      }
    } catch {
      // localStorage indisponível (modo privado etc.): a sessão só dura a aba atual
    }
  }

  register(email: string, password: string): Observable<User> {
    return this.http.post<User>(`${this.baseUrl}/auth/register`, { email, password });
  }

  login(email: string, password: string): Observable<User> {
    const body = new URLSearchParams();
    body.set('username', email);
    body.set('password', password);

    return this.http
      .post<TokenResponse>(`${this.baseUrl}/auth/login`, body.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
      .pipe(
        tap((response) => this.setToken(response.access_token)),
        switchMap(() => this.fetchCurrentUser()),
      );
  }

  logout(): void {
    this.setToken(null);
    this.currentUser.set(null);
    void this.router.navigateByUrl('/login');
  }

  /** Restaura a sessão a partir do token salvo. Chamado uma vez na inicialização do app. */
  restoreSession(): Observable<User | null> {
    if (!this.getToken()) {
      this.isInitializing.set(false);
      return of(null);
    }

    return this.fetchCurrentUser().pipe(
      catchError(() => {
        this.setToken(null);
        this.currentUser.set(null);
        return of(null);
      }),
      finalize(() => this.isInitializing.set(false)),
    );
  }

  private fetchCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/auth/me`).pipe(tap((user) => this.currentUser.set(user)));
  }
}
