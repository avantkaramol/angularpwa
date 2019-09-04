import Dexie from "dexie";

export class user_data extends Dexie {
  users: Dexie.Table<users, string>;

  constructor() {
    super("users");
    this.version(1).stores({
      users: "id,ts"
    });
  }
}

export interface users {
  id: string;
  firstName: string;
  lastname?: string;
  email: string;
  ts: number;
}
