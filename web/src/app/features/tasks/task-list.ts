import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TaskService } from '../../core/task.service';
import type { Task } from '../../core/models';

@Component({
  selector: 'app-task-list',
  imports: [FormsModule],
  templateUrl: './task-list.html',
  styleUrl: './task-list.css',
})
export class TaskList {
  private readonly taskService = inject(TaskService);

  readonly tasks = signal<Task[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly isCreating = signal(false);

  newTitle = '';
  newDescription = '';

  constructor() {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.taskService.list().subscribe({
      next: (tasks) => {
        this.tasks.set(tasks);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Não foi possível carregar as tarefas.');
        this.isLoading.set(false);
      },
    });
  }

  createTask(): void {
    const title = this.newTitle.trim();
    if (!title || this.isCreating()) return;

    this.isCreating.set(true);
    this.taskService.create({ title, description: this.newDescription.trim() }).subscribe({
      next: (task) => {
        this.tasks.update((current) => [task, ...current]);
        this.newTitle = '';
        this.newDescription = '';
        this.isCreating.set(false);
      },
      error: () => {
        this.errorMessage.set('Não foi possível criar a tarefa.');
        this.isCreating.set(false);
      },
    });
  }

  toggleDone(task: Task): void {
    this.taskService.update(task.id, { is_done: !task.is_done }).subscribe({
      next: (updated) => {
        this.tasks.update((current) => current.map((t) => (t.id === updated.id ? updated : t)));
      },
    });
  }

  removeTask(task: Task): void {
    this.taskService.remove(task.id).subscribe({
      next: () => {
        this.tasks.update((current) => current.filter((t) => t.id !== task.id));
      },
    });
  }
}
