import LeadsChats from "@/components/LeadsChats";

export default function AdminChatsPage() {
  return <LeadsChats api="/api/admin/chats" ordersHref="/admin/orders" assign />;
}
