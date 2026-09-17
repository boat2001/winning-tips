import Link from "next/link";
import { updateUserAccess } from "./actions";
import { UserSaveButton } from "@/components/admin/user-save-button";
import { adminRoles } from "@/lib/auth/constants";
import { requireSuperAdmin } from "@/lib/auth/authorization";
import { getDatabase } from "@/lib/db/client";
import { isProtectedSuperAdminUsername } from "@/lib/auth/protected-admins";

const roles = ["SUPER_ADMIN", "ADMIN", "EDITOR", "TIPSTER", "USER"] as const;
const roleFilters = ["ALL", ...roles] as const;
const statusFilters = ["ALL", "ACTIVE", "INACTIVE"] as const;
const pageSize = 20;

function roleLabel(role: string) {
  return role.replaceAll("_", " ").toLowerCase().replace(/^./, (letter) => letter.toUpperCase());
}

function initials(displayName: string | null, username: string) {
  return (displayName || username).split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function pageUrl(page: number, query: string, role: string, status: string) {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (role !== "ALL") params.set("role", role);
  if (status !== "ALL") params.set("status", status);
  if (page > 1) params.set("page", String(page));
  const search = params.toString();
  return search ? `/admin/users?${search}` : "/admin/users";
}

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ q?: string; role?: string; status?: string; page?: string }> }) {
  const actor = await requireSuperAdmin();
  const params = await searchParams;
  const query = params.q?.trim().slice(0, 100) ?? "";
  const requestedRole = params.role?.toUpperCase();
  const requestedStatus = params.status?.toUpperCase();
  const role = roleFilters.includes(requestedRole as (typeof roleFilters)[number]) ? requestedRole as (typeof roleFilters)[number] : "ALL";
  const status = statusFilters.includes(requestedStatus as (typeof statusFilters)[number]) ? requestedStatus as (typeof statusFilters)[number] : "ALL";
  const requestedPage = Number.parseInt(params.page ?? "1", 10);
  const currentPage = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const database = getDatabase();
  const where = {
    ...(query ? { OR: [
      { username: { contains: query, mode: "insensitive" as const } },
      { displayName: { contains: query, mode: "insensitive" as const } },
      { email: { contains: query, mode: "insensitive" as const } },
      { phone: { contains: query, mode: "insensitive" as const } },
    ] } : {}),
    ...(role !== "ALL" ? { role } : {}),
    ...(status === "ACTIVE" ? { isActive: true } : status === "INACTIVE" ? { isActive: false } : {}),
  };

  const [totalUsers, activeUsers, vipUsers, administratorCount, filteredCount] = await Promise.all([
    database.user.count(),
    database.user.count({ where: { isActive: true } }),
    database.user.count({ where: { isActive: true, payments: { some: { status: "SUCCESS" } } } }),
    database.user.count({ where: { role: { in: [...adminRoles] }, isActive: true } }),
    database.user.count({ where }),
  ]);
  const totalPages = Math.max(1, Math.ceil(filteredCount / pageSize));
  const page = Math.min(currentPage, totalPages);
  const users = await database.user.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { username: "asc" }],
    skip: (page - 1) * pageSize,
    take: pageSize,
    select: {
      id: true,
      username: true,
      email: true,
      phone: true,
      displayName: true,
      role: true,
      isActive: true,
      createdAt: true,
      lastLoginAt: true,
      payments: { where: { status: "SUCCESS" }, select: { id: true }, take: 1 },
    },
  });
  const canManage = actor.role === "SUPER_ADMIN";
  const metrics = [
    { label: "Total Users", value: totalUsers, color: "bg-blue-wash text-blue" },
    { label: "Active Users", value: activeUsers, color: "bg-blue-wash text-blue" },
    { label: "VIP Users", value: vipUsers, color: "bg-hold-bg text-hold" },
    { label: "Administrators", value: administratorCount, color: "bg-violet-100 text-violet-700" },
  ];

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-7 sm:py-10">
      <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-3xl font-semibold tracking-[-0.05em] text-ink sm:text-4xl">User Management</h1>{!canManage ? <span className="rounded-full bg-hold-bg px-3 py-1.5 text-[0.65rem] font-semibold text-hold">VIEW ONLY</span> : null}</div>

      <section className="mt-5 grid grid-cols-2 gap-2 lg:grid-cols-4" aria-label="User metrics">
        {metrics.map((metric) => <article key={metric.label} className="flex items-center gap-3 rounded-sharp border border-line bg-white p-3"><span className={`grid size-9 shrink-0 place-items-center rounded-full text-sm font-semibold ${metric.color}`}>{metric.value.toLocaleString()}</span><h2 className="text-xs font-bold text-muted">{metric.label}</h2></article>)}
      </section>

      <section className="mt-6 rounded-sharp border border-line bg-white p-4" aria-label="User filters">
        <form className="grid gap-3 sm:grid-cols-[minmax(220px,1fr)_160px_150px_auto_auto] sm:items-end">
          <label className="text-xs font-bold text-ink-2">Search users<input name="q" defaultValue={query} placeholder="Name, username, email or phone" className="mt-1.5 h-10 w-full rounded-sharp border border-line bg-paper px-3 text-sm outline-none focus:border-blue focus:bg-white" /></label>
          <label className="text-xs font-bold text-ink-2">Role<select name="role" defaultValue={role} className="mt-1.5 h-10 w-full rounded-sharp border border-line bg-white px-3 text-xs font-bold text-ink-2">{roleFilters.map((item) => <option key={item} value={item}>{item === "ALL" ? "All roles" : roleLabel(item)}</option>)}</select></label>
          <label className="text-xs font-bold text-ink-2">Status<select name="status" defaultValue={status} className="mt-1.5 h-10 w-full rounded-sharp border border-line bg-white px-3 text-xs font-bold text-ink-2">{statusFilters.map((item) => <option key={item} value={item}>{item === "ALL" ? "All statuses" : roleLabel(item)}</option>)}</select></label>
          <button className="h-10 rounded-sharp bg-ink px-4 text-xs font-semibold text-white">Apply</button>
          <Link href="/admin/users" className="inline-flex h-10 items-center justify-center rounded-sharp border border-line px-4 text-xs font-semibold text-ink-2">Reset</Link>
        </form>
      </section>

      <section className="mt-6 overflow-hidden rounded-sharp border border-line bg-white" aria-labelledby="users-list-heading">
        <div className="flex items-center justify-between border-b border-line px-4 py-3"><h2 id="users-list-heading" className="text-sm font-semibold text-ink">Users</h2><span className="text-xs font-bold text-faint">{filteredCount.toLocaleString()} found</span></div>
        <div className="hidden grid-cols-[1.25fr_1.3fr_.8fr_.65fr_.75fr_.85fr_auto] gap-3 bg-paper px-4 py-2.5 text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-faint xl:grid"><span>User</span><span>Contact</span><span>Role</span><span>VIP</span><span>Status</span><span>Activity</span><span>Action</span></div>
        <div className="divide-y divide-line">
          {users.map((user) => {
            const isSelf = user.id === actor.id;
            const isProtected = isProtectedSuperAdminUsername(user.username);
            const editable = canManage && !isSelf && !isProtected;
            const hasVip = user.payments.length > 0;
            return (
              <form key={user.id} action={updateUserAccess} className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-[1.25fr_1.3fr_.8fr_.65fr_.75fr_.85fr_auto] xl:items-center">
                <input type="hidden" name="userId" value={user.id} />
                <div className="flex min-w-0 items-center gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-full bg-blue-wash text-xs font-semibold text-blue">{initials(user.displayName, user.username)}</span><div className="min-w-0"><div className="flex flex-wrap items-center gap-1.5"><p className="truncate text-sm font-semibold text-ink">{user.displayName || user.username}</p>{isSelf ? <span className="rounded bg-blue-wash px-1.5 py-0.5 text-[0.55rem] font-semibold text-blue">YOU</span> : null}{isProtected ? <span className="rounded bg-violet-50 px-1.5 py-0.5 text-[0.55rem] font-semibold text-violet-700">PROTECTED</span> : null}</div><p className="truncate text-xs text-faint">@{user.username}</p></div></div>
                <div className="min-w-0"><a href={`mailto:${user.email}`} className="block truncate text-xs font-bold text-ink-2 hover:text-blue">{user.email}</a>{user.phone ? <a href={`tel:${user.phone.replace(/\s+/g, "")}`} className="mt-1 block truncate text-xs text-faint hover:text-blue">{user.phone}</a> : <p className="mt-1 text-xs text-line-2">No phone number</p>}</div>
                <select name="role" defaultValue={user.role} disabled={!editable} aria-label={`Role for ${user.username}`} className="h-9 rounded-sharp border border-line bg-white px-2 text-xs font-bold text-ink-2 disabled:bg-paper disabled:text-faint">{roles.map((item) => <option key={item} value={item}>{roleLabel(item)}</option>)}</select>
                <div><span className={`inline-flex rounded-full px-2.5 py-1 text-[0.6rem] font-semibold ${hasVip ? "bg-hold-bg text-hold" : "bg-line text-muted"}`}>{hasVip ? "VIP" : "FREE"}</span></div>
                <label className="flex items-center gap-2 text-xs font-bold text-ink-2"><input type="checkbox" name="isActive" value="true" defaultChecked={user.isActive} disabled={!editable} className="size-4 accent-blue" /><span className={user.isActive ? "text-blue" : "text-faint"}>{user.isActive ? "Active" : "Inactive"}</span></label>
                <div className="text-xs text-faint"><p>Joined {user.createdAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p><p className="mt-1">{user.lastLoginAt ? `Last seen ${user.lastLoginAt.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}` : "Never signed in"}</p></div>
                <UserSaveButton disabled={!editable} />
              </form>
            );
          })}
          {users.length === 0 ? <p className="px-4 py-10 text-center text-sm text-faint">No users match these filters.</p> : null}
        </div>
      </section>

      {totalPages > 1 ? <nav className="mt-4 flex items-center justify-between" aria-label="User pagination"><Link aria-disabled={page === 1} href={pageUrl(Math.max(1, page - 1), query, role, status)} className={`rounded-sharp border px-3 py-2 text-xs font-semibold ${page === 1 ? "pointer-events-none border-line text-line-2" : "border-line bg-white text-ink-2 hover:border-blue"}`}>Previous</Link><span className="text-xs font-bold text-faint">Page {page} of {totalPages}</span><Link aria-disabled={page === totalPages} href={pageUrl(Math.min(totalPages, page + 1), query, role, status)} className={`rounded-sharp border px-3 py-2 text-xs font-semibold ${page === totalPages ? "pointer-events-none border-line text-line-2" : "border-line bg-white text-ink-2 hover:border-blue"}`}>Next</Link></nav> : null}
    </main>
  );
}
