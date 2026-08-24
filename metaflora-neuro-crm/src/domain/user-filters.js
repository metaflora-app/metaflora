const SORT_FIELDS = new Set([
  "id",
  "name",
  "email",
  "status",
  "plan",
  "registeredAt",
  "lastActiveAt",
  "metacoinBalance",
]);

function normalize(value) {
  return String(value ?? "").trim().toLocaleLowerCase("ru");
}

function compareValues(left, right) {
  if (typeof left === "number" && typeof right === "number") return left - right;
  return String(left ?? "").localeCompare(String(right ?? ""), "ru", {
    numeric: true,
    sensitivity: "base",
  });
}

export function filterUsers(
  users,
  {
    query = "",
    statuses = [],
    plans = [],
    registeredFrom,
    registeredTo,
    sortBy = "registeredAt",
    sortDirection = "desc",
  } = {},
) {
  if (!SORT_FIELDS.has(sortBy)) {
    throw new TypeError(`Unsupported user sort field: ${sortBy}`);
  }
  if (!["asc", "desc"].includes(sortDirection)) {
    throw new TypeError("sortDirection must be asc or desc");
  }

  const normalizedQuery = normalize(query);
  const fromTime = registeredFrom ? new Date(registeredFrom).getTime() : null;
  const toTime = registeredTo ? new Date(registeredTo).getTime() : null;

  return users
    .filter((user) => {
      const identity = [user.id, user.name, user.email, user.telegramUsername]
        .map(normalize)
        .join(" ");
      const registeredAt = new Date(user.registeredAt).getTime();
      return (
        (!normalizedQuery || identity.includes(normalizedQuery)) &&
        (statuses.length === 0 || statuses.includes(user.status)) &&
        (plans.length === 0 || plans.includes(user.plan)) &&
        (fromTime === null || registeredAt >= fromTime) &&
        (toTime === null || registeredAt <= toTime)
      );
    })
    .sort((left, right) => {
      const order = compareValues(left[sortBy], right[sortBy]);
      return sortDirection === "asc" ? order : -order;
    });
}
