type InvitePlaceholderCandidate = {
  invite: {
    employeeId: string | null;
    acceptedAt: Date | null;
    createdAt: Date;
  };
  employee: {
    id: string;
    createdAt: Date;
    user: { id: string } | null;
  } | null;
};

export function isInviteCreatedPlaceholderEmployee({
  invite,
  employee,
}: InvitePlaceholderCandidate) {
  if (!employee || !invite.employeeId) {
    return false;
  }

  if (invite.employeeId !== employee.id || invite.acceptedAt || employee.user) {
    return false;
  }

  /*
   * Current schema has no explicit "created by invite" marker. The new-worker
   * invite path writes the same Date object to Employee.createdAt and
   * UserInvite.createdAt, so exact timestamp equality plus the invite FK and
   * missing user link is the strongest no-schema-change signal available.
   */
  return employee.createdAt.getTime() === invite.createdAt.getTime();
}
