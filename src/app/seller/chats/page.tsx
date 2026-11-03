import LeadsChats from "@/components/LeadsChats";

export default function SellerChatsPage() {
  return <LeadsChats api="/api/seller/chats" ordersHref="/seller/orders" team />;
}
