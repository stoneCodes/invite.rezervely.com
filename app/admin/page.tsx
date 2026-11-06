import type { Metadata } from "next";
import Login from "./login";
export const metadata: Metadata = { robots: { index: false, follow: false }, title: "Administration" };
export default function AdminPage() { return <Login />; }
