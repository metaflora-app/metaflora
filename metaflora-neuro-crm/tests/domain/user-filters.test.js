import { describe, expect, it } from "vitest";

import { filterUsers } from "../../src/domain/user-filters.js";

const users = Object.freeze([
  Object.freeze({
    id: "usr-2",
    name: "Ирина Волкова",
    email: "irina@example.ru",
    telegramUsername: "@irina",
    status: "active",
    plan: "pro",
    registeredAt: "2026-07-20T00:00:00.000Z",
    metacoinBalance: 300,
  }),
  Object.freeze({
    id: "usr-1",
    name: "Алексей Смирнов",
    email: "alex@example.ru",
    telegramUsername: "@alex",
    status: "blocked",
    plan: "free",
    registeredAt: "2026-06-10T00:00:00.000Z",
    metacoinBalance: 10,
  }),
]);

describe("filterUsers", () => {
  it("searches case-insensitively across user identity fields", () => {
    expect(filterUsers(users, { query: "ИРИНА" }).map(({ id }) => id)).toEqual([
      "usr-2",
    ]);
    expect(filterUsers(users, { query: "@alex" }).map(({ id }) => id)).toEqual([
      "usr-1",
    ]);
  });

  it("combines status, plan, registration range and sorting", () => {
    expect(
      filterUsers(users, {
        statuses: ["active"],
        plans: ["pro"],
        registeredFrom: "2026-07-01T00:00:00.000Z",
        registeredTo: "2026-07-31T23:59:59.999Z",
        sortBy: "metacoinBalance",
        sortDirection: "desc",
      }).map(({ id }) => id),
    ).toEqual(["usr-2"]);
  });

  it("returns a new sorted array and leaves records untouched", () => {
    const result = filterUsers(users, { sortBy: "name", sortDirection: "asc" });

    expect(result.map(({ id }) => id)).toEqual(["usr-1", "usr-2"]);
    expect(result).not.toBe(users);
    expect(users[0].id).toBe("usr-2");
  });

  it("rejects unsupported sort fields", () => {
    expect(() => filterUsers(users, { sortBy: "password" })).toThrow(
      "Unsupported user sort field",
    );
  });
});
