import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import logoUrl from "@/assets/svg/sign-in/logo.svg";
import collapsedLogoUrl from "@/assets/svg/collpasedlogo.svg";
import { useAuth } from "@/lib/auth";
import {
  LayoutDashboard,
  LayoutGrid,
  TrendingUp,
  CheckSquare,
  Calendar,
  Building2,
  Users,
  UserCog,
  UserCheck,
  Mail,
  FileText,
  LogOut,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronsUpDown,
  Wrench,
  Package,
  Receipt,
  User,
  Phone,
  MapPin,
} from "lucide-react";

import React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  useSidebar,
} from "@/components/ui/sidebar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";

const workspace = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "People", url: "/property-managers", icon: Users },
  { title: "Leads", url: "/pipeline", icon: TrendingUp },
  { title: "Quotes", url: "/tasks", icon: FileText },
  { title: "Jobs", url: "/meetings", icon: Wrench },
  { title: "Inventory", url: "/inventory", icon: Package },
  { title: "Invoices", url: "/invoices", icon: Receipt },
];

const accounts = [
  { title: "Agency Offices", url: "/agency-offices", icon: Building2 },
  { title: "People", url: "/property-managers", icon: Users },
];

const people = [
  { title: "Account Managers", url: "/account-managers", icon: UserCog }
];

const mailbox = [
  { title: "Mailbox", url: "/mailbox", icon: Mail }
];

// Flat list of icons for collapsed state (matching mockup precisely)
const collapsedItems = [
  { title: "Dashboard", url: "/", icon: LayoutGrid },
  { title: "Leads", url: "/pipeline", icon: TrendingUp },
  { title: "Quotes", url: "/tasks", icon: CheckSquare },
  { title: "Meetings", url: "/meetings", icon: Calendar },
  { title: "Agency Offices", url: "/agency-offices", icon: Building2 },
  { title: "People", url: "/property-managers", icon: Users },
  { title: "Account Managers", url: "/account-managers", icon: UserCheck },
  { title: "Mailbox", url: "/mailbox", icon: Mail },
  { title: "Email Templates", url: "/email-templates", icon: FileText },
];

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";
  const currentPath = useRouterState({ select: (r) => r.location.pathname });
  const isActive = (path: string) => currentPath === path;
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate({ to: "/login", replace: true });
  };

  const renderPeopleSubmenu = () => (
    <PopoverContent
      side="right"
      align="start"
      sideOffset={12}
      className="w-[420px] p-6 bg-white border border-slate-100 shadow-2xl rounded-2xl z-[200] animate-in fade-in slide-in-from-left-2 duration-200 select-none"
    >
      <div className="flex items-center gap-2 mb-5">
        <Users className="h-5 w-5 text-slate-800 stroke-[1.8px]" />
        <span className="text-base font-extrabold text-slate-800">People</span>
      </div>

      <div className="grid grid-cols-2 gap-x-6">
        {/* Open Column */}
        <div>
          <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2 px-1">
            Open
          </span>
          <div className="flex flex-col gap-0.5">
            <Link
              to="/property-managers"
              onClick={() => toast.success("Opening Customers list")}
              className="group flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <User className="h-4 w-4 text-slate-400 shrink-0 group-hover:text-slate-600 transition-colors" />
              <span>Customers</span>
            </Link>
            <Link
              to="/agency-offices"
              className="flex items-center gap-3.5 px-3 py-2.5 rounded-xl bg-[#dd5437]/10 border border-[#dd5437]/20 text-[#dd5437] font-bold text-xs shadow-sm hover:bg-[#dd5437]/15 transition-all cursor-pointer"
            >
              <MapPin className="h-4 w-4 text-[#dd5437] shrink-0" />
              <span>Sites</span>
            </Link>
            <Link
              to="/property-managers"
              onClick={() => toast.success("Opening Suppliers list")}
              className="group flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <Package className="h-4 w-4 text-slate-400 shrink-0 group-hover:text-slate-600 transition-colors" />
              <span>Suppliers</span>
            </Link>
            <Link
              to="/property-managers"
              onClick={() => toast.success("Opening Contacts list")}
              className="group flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <Phone className="h-4 w-4 text-slate-400 shrink-0 group-hover:text-slate-600 transition-colors" />
              <span>Contacts</span>
            </Link>
            <Link
              to="/property-managers"
              onClick={() => toast.success("Opening Employees list")}
              className="group flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <UserCheck className="h-4 w-4 text-slate-400 shrink-0 group-hover:text-slate-600 transition-colors" />
              <span>Employees</span>
            </Link>
            <Link
              to="/property-managers"
              onClick={() => toast.success("Opening Contractors list")}
              className="group flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <Wrench className="h-4 w-4 text-slate-400 shrink-0 group-hover:text-slate-600 transition-colors" />
              <span>Contractors</span>
            </Link>
          </div>
        </div>

        {/* Create New Column */}
        <div>
          <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2 px-1">
            Create New
          </span>
          <div className="flex flex-col gap-0.5">
            <button
              onClick={() => toast.info("Create New Customer triggered")}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer border-0 bg-transparent w-full text-left"
            >
              <span className="text-[#dd5437] font-black text-sm leading-none -mt-0.5">+</span>
              <span>Customers</span>
            </button>
            <button
              onClick={() => toast.info("Create New Site triggered")}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer border-0 bg-transparent w-full text-left"
            >
              <span className="text-[#dd5437] font-black text-sm leading-none -mt-0.5">+</span>
              <span>Sites</span>
            </button>
            <button
              onClick={() => toast.info("Create New Supplier triggered")}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer border-0 bg-transparent w-full text-left"
            >
              <span className="text-[#dd5437] font-black text-sm leading-none -mt-0.5">+</span>
              <span>Suppliers</span>
            </button>
            <button
              onClick={() => toast.info("Create New Contact triggered")}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer border-0 bg-transparent w-full text-left"
            >
              <span className="text-[#dd5437] font-black text-sm leading-none -mt-0.5">+</span>
              <span>Contacts</span>
            </button>
            <button
              onClick={() => toast.info("Create New Employee triggered")}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer border-0 bg-transparent w-full text-left"
            >
              <span className="text-[#dd5437] font-black text-sm leading-none -mt-0.5">+</span>
              <span>Employees</span>
            </button>
            <button
              onClick={() => toast.info("Create New Contractor triggered")}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer border-0 bg-transparent w-full text-left"
            >
              <span className="text-[#dd5437] font-black text-sm leading-none -mt-0.5">+</span>
              <span>Contractors</span>
            </button>
          </div>
        </div>
      </div>
    </PopoverContent>
  );

  const renderGroup = (
    label: string,
    items: { title: string; url: string; icon: typeof LayoutDashboard }[],
  ) => (
    <SidebarGroup className="px-3 py-1">
      <span className="px-3 py-1.5 text-[11px] font-semibold text-[#8e8e93] block uppercase tracking-wider">
        {label}
      </span>
      <SidebarGroupContent className="mt-1">
        <SidebarMenu className="gap-1">
          {items.map((item) => {
            const isPeople = item.title === "People";
            const active = isActive(item.url) || (isPeople && currentPath.includes("property-managers"));

            if (label === "Workspace" && isPeople) {
              return (
                <Popover key={item.title}>
                  <PopoverTrigger asChild>
                    <button
                      className={`group w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer border-0 data-[state=open]:bg-[#dd5437]/10 data-[state=open]:text-[#dd5437] data-[state=open]:font-semibold ${
                        active
                          ? "bg-[#dd5437]/10 text-[#dd5437] font-semibold"
                          : "text-gray-700 hover:text-gray-900 hover:bg-gray-50/80 bg-transparent"
                      }`}
                    >
                      <item.icon className={`h-[18px] w-[18px] shrink-0 transition-colors group-data-[state=open]:text-[#dd5437] ${
                        active ? "text-[#dd5437]" : "text-gray-400"
                      }`} />
                      <span>{item.title}</span>
                    </button>
                  </PopoverTrigger>
                  {renderPeopleSubmenu()}
                </Popover>
              );
            }

            return (
              <Link
                key={item.title}
                to={item.url as any}
                className={`flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer ${
                  active
                    ? "bg-[#dd5437] text-white shadow-md shadow-[#dd5437]/15 font-semibold"
                    : "text-gray-700 hover:text-gray-900 hover:bg-gray-50/80"
                }`}
              >
                <item.icon className={`h-[18px] w-[18px] shrink-0 transition-colors ${
                  active ? "text-white" : "text-gray-400"
                }`} />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  // 1. Render COLLAPSED Half-Sidebar Layout
  if (collapsed) {
    return (
      <Sidebar 
        collapsible="icon" 
        className="border-r border-gray-100 bg-white"
        style={{ "--sidebar-width-icon": "4rem" } as React.CSSProperties}
      >
        <SidebarHeader className="relative flex flex-col items-center py-6 bg-white shrink-0 select-none">
          <div className="flex items-center justify-center w-full mt-1.5">
            <img src={collapsedLogoUrl} alt="HubKonnect collapsed logo" className="h-9 w-auto object-contain" />
          </div>
          <button
            onClick={toggleSidebar}
            className="absolute -right-4 top-7 w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded-xl shadow-md hover:bg-gray-50 text-gray-500 hover:text-gray-700 cursor-pointer z-50 transition-all duration-200 hover:scale-105 active:scale-95"
            aria-label="Expand sidebar"
          >
            <ChevronsRight className="h-4 w-4 stroke-[2.5px]" />
          </button>
        </SidebarHeader>

        <SidebarContent className="flex flex-col items-center gap-3 px-2 py-4 bg-white overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {collapsedItems.map((item) => {
            const isPeople = item.title === "People";
            const active = isActive(item.url) || (isPeople && currentPath.includes("property-managers"));

            if (isPeople) {
              return (
                <Popover key={item.title}>
                  <PopoverTrigger asChild>
                    <button
                      className={`group p-2.5 rounded-xl transition-all duration-200 flex items-center justify-center cursor-pointer border-0 bg-transparent text-gray-400 hover:bg-gray-50 hover:text-gray-700 data-[state=open]:bg-[#dd5437]/10 data-[state=open]:text-[#dd5437] ${
                        active
                          ? "bg-[#dd5437]/10 text-[#dd5437] font-semibold"
                          : ""
                      }`}
                      title={item.title}
                    >
                      <item.icon className={`h-5 w-5 shrink-0 transition-colors group-data-[state=open]:text-[#dd5437] ${
                        active ? "text-[#dd5437]" : ""
                      }`} />
                    </button>
                  </PopoverTrigger>
                  {renderPeopleSubmenu()}
                </Popover>
              );
            }

            return (
              <Link
                key={item.title}
                to={item.url as any}
                className={`p-2.5 rounded-xl transition-all duration-200 flex items-center justify-center cursor-pointer ${
                  active
                    ? "bg-[#dd5437]/10 text-[#dd5437] shadow-sm shadow-[#dd5437]/5 font-semibold"
                    : "text-gray-400 hover:bg-gray-50 hover:text-gray-700"
                }`}
                title={item.title}
              >
                <item.icon className="h-5 w-5 shrink-0" />
              </Link>
            );
          })}
        </SidebarContent>

        <SidebarFooter className="border-t border-gray-100 flex flex-col items-center gap-4 py-6 bg-white shrink-0">
          <div className="h-9 w-9 rounded-full bg-[#dd5437] text-white flex items-center justify-center font-bold text-sm shadow-sm select-none shadow-[#dd5437]/20 border border-[#dd5437]/10">
            J
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-gray-400 hover:text-[#dd5437] hover:bg-gray-50 rounded-xl transition-all cursor-pointer"
            title="Logout"
          >
            <LogOut className="h-5 w-5 transition-colors" />
          </button>
        </SidebarFooter>
      </Sidebar>
    );
  }

  // 2. Render EXPANDED Sidebar Layout
  return (
    <Sidebar 
      collapsible="icon" 
      className="border-r border-gray-100 bg-white"
      style={{ "--sidebar-width-icon": "4rem" } as React.CSSProperties}
    >
      <SidebarHeader className="flex flex-row items-center justify-between px-5 pt-5 pb-2 border-none bg-white">
        <div className="flex items-center gap-2">
          <img src={logoUrl} alt="HubKonnect" className="h-[128px] w-auto object-contain" />
        </div>
        <button
          onClick={toggleSidebar}
          className="p-2 border border-gray-100 rounded-xl hover:bg-gray-50 text-gray-500 cursor-pointer flex items-center justify-center transition-all shadow-sm duration-200"
          aria-label="Collapse sidebar"
        >
          <ChevronsLeft className="h-4 w-4" />
        </button>
      </SidebarHeader>

      <SidebarContent className="bg-white gap-2 flex flex-col py-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {renderGroup("Workspace", workspace)}
        {renderGroup("Account Management", accounts)}
        {renderGroup("People", people)}
        {renderGroup("Mailbox", mailbox)}
      </SidebarContent>

      <SidebarFooter className="border-none p-3 bg-white shrink-0">
        <div className="border border-gray-100 rounded-2xl p-4 bg-white shadow-sm flex flex-col">
          {/* User Profile Card */}
          <div className="flex items-center gap-3">
            <img
              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80"
              alt="Jean Doe"
              className="h-10 w-10 rounded-xl object-cover border border-gray-100 shrink-0"
            />
            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="truncate text-sm font-bold text-gray-900 leading-tight">Jean Doe</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#fdf2f0] text-[#dd5437] shrink-0 uppercase tracking-wider select-none leading-none mt-0.5">
                  Admin
                </span>
              </div>
              <span className="truncate text-[11px] font-medium text-gray-400 mt-1 leading-none">@jeandoe</span>
            </div>
            <button 
              className="border border-gray-200 rounded-lg p-1.5 hover:bg-gray-50 transition-all cursor-pointer text-gray-500 shrink-0"
              aria-label="Profile options"
            >
              <ChevronsUpDown className="h-4 w-4" />
            </button>
          </div>

          {/* Separator */}
          <div className="my-3 border-t border-gray-100"></div>

          {/* Logout Action */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 py-2 px-1 text-sm font-medium text-gray-700 hover:text-[#dd5437] rounded-lg hover:bg-gray-50/50 cursor-pointer transition-all duration-150"
          >
            <LogOut className="h-[18px] w-[18px] text-[#dd5437] shrink-0" />
            <span className="text-gray-700 hover:text-[#dd5437] transition-colors">Logout</span>
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}