import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.getToken();

  const authedReq = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(authedReq).pipe(
    catchError((error: unknown) => {
      // Endpoints de /auth/* tratam seus próprios erros (ex: senha errada no
      // login não deve derrubar a sessão nem redirecionar). Um 401 em
      // qualquer outra chamada, porém, significa sessão expirada/inválida.
      const isAuthEndpoint = req.url.includes('/auth/');
      if (error instanceof HttpErrorResponse && error.status === 401 && !isAuthEndpoint) {
        auth.logout();
      }
      return throwError(() => error);
    }),
  );
};
