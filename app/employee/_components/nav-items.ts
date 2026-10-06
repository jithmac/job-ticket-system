export const employeeNav = [
  { href: "/employee", label: "Overview", icon: "dashboard", exact: true, exclude: [] as string[] },
  { href: "/employee/tickets", label: "My Tickets", icon: "confirmation_number", exact: false, exclude: ["/employee/tickets/new"] },
  { href: "/employee/tickets/new", label: "New Ticket", icon: "add_box", exact: true, exclude: [] as string[] },
  { href: "/employee/history", label: "Previous Tickets", icon: "history", exact: false, exclude: [] as string[] },
];
