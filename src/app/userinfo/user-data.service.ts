import { Injectable } from "@angular/core";
import { user_data, users } from "../userinfo/userinfo";
import { UUID } from "angular2-uuid";

@Injectable({
  providedIn: "root"
})
export class UserDataService {
  private db: user_data;
  constructor() {
    this.db = new user_data();
  }

  async getTodos(): Promise<users[]> {
    return this.db.users
      .where("ts")
      .notEqual(-1)
      .toArray();
  }

  getTodo(id: string): Promise<users> {
    return this.db.users.get(id);
  }

  deleteTodo(todo: users) {
    todo.ts = -1;
    this.db.users.put(todo).then(() => this.requestSync());
  }

  async save(todo: users) {
    console.log("todo", todo);
    if (!todo.id) {
      todo.id = UUID.UUID();
      todo.ts = 0;
      this.db.users.add(todo).then(() => this.requestSync());
    } else {
      const oldTodo = await this.db.users.get(todo.id);
      if (this.changed(oldTodo, todo)) {
        todo.ts = Date.now();
        this.db.users.put(todo).then(() => this.requestSync());
      }
    }
  }

  requestSync() {
    navigator.serviceWorker.ready.then(swRegistration =>
      swRegistration.sync.register("user_updated")
    );
  }

  private changed(oldTodo: users, newTodo: users) {
    if (oldTodo.email !== newTodo.email) {
      return true;
    }
    if (oldTodo.lastname !== newTodo.lastname) {
      return true;
    }
    if (oldTodo.firstName !== newTodo.firstName) {
      return true;
    }
    return false;
  }
}
