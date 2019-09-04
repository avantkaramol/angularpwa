(function() {
  "use strict";
  console.log("asff");
  self.importScripts("dexie.min.js");

  const db = new Dexie("user_data");

  db.version(1).stores({
    users: "id,ts"
  });
  db.open();

  self.addEventListener("sync", function(event) {
    console.log("user_updated");
    console.log(event.tag);
    if (event.tag == "user_updated") {
      event.waitUntil(serverSync());
    }
  });

  async function serverSync() {
    console.log("serverSync");
    const syncViewResponse = await fetch("http://localhost:5000/syncview");
    const syncView = await syncViewResponse.json();
    console.log("syncView", syncView);
    const serverMap = new Map();
    Object.entries(syncView).forEach(kv => serverMap.set(kv[0], kv[1]));

    const syncRequest = {
      update: [],
      remove: [],
      get: []
    };

    const deleteLocal = [];

    await db.users.toCollection().each(user => {
      const serverTimestamp = serverMap.get(user.id);
      if (serverTimestamp) {
        if (user.ts === -1) {
          syncRequest.remove.push(user.id);
        } else if (user.ts > serverTimestamp) {
          syncRequest.update.push(user);
        } else if (user.ts < serverTimestamp) {
          syncRequest.get.push(user.id);
        }
        serverMap.delete(user.id);
      } else {
        //not on the server, either insert or delete locally
        if (user.ts === 0) {
          syncRequest.update.push(user);
        } else {
          deleteLocal.push(user.id);
        }
      }
    });

    // all these ids are not in our local database, fetch them
    serverMap.forEach((value, key) => syncRequest.get.push(key));

    // delete local todos
    let deleted = false;
    for (const id of deleteLocal) {
      await db.users.delete(id);
      deleted = true;
    }

    // if no changes end sync
    if (
      syncRequest.update.length === 0 &&
      syncRequest.remove.length === 0 &&
      syncRequest.get.length === 0
    ) {
      if (deleted) {
        return notifyClients();
      } else {
        return Promise.resolve();
      }
    }

    // send sync request to the server
    const syncResponse = await fetch("http://localhost:5000/sync", {
      method: "POST",
      body: JSON.stringify(syncRequest),
      headers: {
        "Content-Type": "application/json"
      }
    });

    if (syncResponse.status === 200) {
      const sync = await syncResponse.json();

      await db.transaction("rw", db.users, async () => {
        if (sync.get && sync.get.length > 0) {
          await db.users.bulkPut(sync.get);
        }

        if (sync.updated) {
          Object.entries(sync.updated).forEach(
            async kv => await db.users.update(kv[0], { ts: kv[1] })
          );
        }
        if (sync.removed) {
          sync.removed.forEach(async id => await db.users.delete(id));
        }
      });

      return notifyClients();
    }

    return Promise.reject("sync failed: " + response.status);
  }

  async function notifyClients() {
    const clients = await self.clients.matchAll({ includeUncontrolled: true });
    for (const client of clients) {
      client.postMessage("sync_finished");
    }
  }
})();
