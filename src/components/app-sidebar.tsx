import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import logoUrl from "@/assets/logo.avif";
import { useAuth } from "@/lib/auth";
import {
  LayoutDashboard,
  TrendingUp,
  CheckSquare,
  Calendar,
  Building2,
  Users,
  UserCog,
  Mail,
  FileText,
  LogOut,
  Settings2,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const workspace = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Pipeline", url: "/pipeline", icon: TrendingUp },
  { title: "Tasks", url: "/tasks", icon: CheckSquare },
  { title: "Meetings", url: "/meetings", icon: Calendar },
];

const accounts = [
  { title: "Agency Offices", url: "/agency-offices", icon: Building2 },
  { title: "Property Managers", url: "/property-managers", icon: Users },
];

const people = [{ title: "Account Managers", url: "/account-managers", icon: UserCog }];

const mailbox = [
  { title: "Mailbox", url: "/mailbox", icon: Mail },
  { title: "Email Templates", url: "/email-templates", icon: FileText },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const currentPath = useRouterState({ select: (r) => r.location.pathname });
  const isActive = (path: string) => currentPath === path;
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => {
    logout();
    navigate({ to: "/login", replace: true });
  };
  const displayName = user?.name ?? user?.email ?? "Guest";
  const avatarInitial = (user?.initials ?? user?.name ?? user?.email ?? "?")
    .trim()
    .charAt(0)
    .toUpperCase();
  const roleLabel = user?.role
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
    : "Guest";

  const renderGroup = (
    label: string,
    items: { title: string; url: string; icon: typeof LayoutDashboard }[],
  ) => (
    <SidebarGroup>
      {!collapsed && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                isActive={isActive(item.url)}
                className="data-[active=true]:bg-accent data-[active=true]:text-accent-foreground data-[active=true]:font-semibold"
              >
                <Link to={item.url} className="flex items-center gap-3">
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span>{item.title}</span>}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b px-4 py-5">
        {collapsed ? (
          <img src={logoUrl} alt="The Appliance Guys" className="h-10 w-10 object-contain" />
        ) : (
          <img src={logoUrl} alt="The Appliance Guys" className="h-16 w-auto object-contain" />
        )}
      </SidebarHeader>

      <SidebarContent>
        {renderGroup("WORKSPACE", workspace)}
        {renderGroup("ACCOUNTS", accounts)}
        {renderGroup("PEOPLE", people)}
        {renderGroup("MAILBOX", mailbox)}
      </SidebarContent>

      <SidebarFooter className="border-t p-3">
        <div className="flex items-center gap-3 px-1 py-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
            {avatarInitial}
          </div>
          {!collapsed && (
            <div className="flex min-w-0 flex-1 flex-col leading-tight">
              <span className="truncate text-sm font-semibold text-foreground">{displayName}</span>
              <span className="mt-0.5 inline-flex w-fit items-center rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-accent-foreground">
                {roleLabel}
              </span>
            </div>
          )}
          {!collapsed && (
            <button className="text-muted-foreground hover:text-foreground" aria-label="Settings">
              <Settings2 className="h-4 w-4" />
            </button>
          )}
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} className="text-muted-foreground">
              <LogOut className="h-4 w-4" />
              {!collapsed && <span>Logout</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}