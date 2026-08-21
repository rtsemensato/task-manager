import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
})
export class Register {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  submit(): void {
    if (this.form.invalid || this.isSubmitting()) return;

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const { email, password } = this.form.getRawValue();

    this.auth.register(email, password).subscribe({
      next: () => {
        // O registro não loga automaticamente no backend, então logamos em seguida.
        this.auth.login(email, password).subscribe({
          next: () => this.router.navigateByUrl('/tasks'),
          error: () => this.router.navigateByUrl('/login'),
        });
      },
      error: (err: HttpErrorResponse) => {
        this.errorMessage.set(
          err.status === 409 ? 'Esse e-mail já está cadastrado.' : 'Não foi possível criar a conta.',
        );
        this.isSubmitting.set(false);
      },
    });
  }
}
