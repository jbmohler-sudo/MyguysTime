import assert from "node:assert/strict";
import { isInviteCreatedPlaceholderEmployee } from "../dist-server/server/routes/invitePlaceholder.js";

const createdAt = new Date("2026-05-08T10:00:00.123Z");

assert.equal(
  isInviteCreatedPlaceholderEmployee({
    invite: {
      employeeId: "emp-new-worker",
      acceptedAt: null,
      createdAt,
    },
    employee: {
      id: "emp-new-worker",
      createdAt,
      user: null,
    },
  }),
  true,
  "new-worker invite placeholder should be detected by exact relationship markers",
);

assert.equal(
  isInviteCreatedPlaceholderEmployee({
    invite: {
      employeeId: "emp-existing",
      acceptedAt: null,
      createdAt,
    },
    employee: {
      id: "emp-existing",
      createdAt: new Date("2026-05-08T10:00:01.123Z"),
      user: null,
    },
  }),
  false,
  "existing-employee invite should not be treated as placeholder by proximity",
);

assert.equal(
  isInviteCreatedPlaceholderEmployee({
    invite: {
      employeeId: "emp-linked",
      acceptedAt: null,
      createdAt,
    },
    employee: {
      id: "emp-linked",
      createdAt,
      user: { id: "user-linked" },
    },
  }),
  false,
  "employee with an existing linked user should not be treated as placeholder",
);

assert.equal(
  isInviteCreatedPlaceholderEmployee({
    invite: {
      employeeId: "emp-accepted",
      acceptedAt: new Date("2026-05-08T10:05:00.000Z"),
      createdAt,
    },
    employee: {
      id: "emp-accepted",
      createdAt,
      user: null,
    },
  }),
  false,
  "already accepted invite should not re-run placeholder detection",
);

assert.equal(
  isInviteCreatedPlaceholderEmployee({
    invite: {
      employeeId: "emp-other",
      acceptedAt: null,
      createdAt,
    },
    employee: {
      id: "emp-different",
      createdAt,
      user: null,
    },
  }),
  false,
  "invite must point at the same employee being considered",
);

console.log("invite placeholder tests passed");
