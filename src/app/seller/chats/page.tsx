import LeadsChats from "@/components/LeadsChats";

// a seller gets only his leads; Idan (admin) also gets the seller picker (the assign API answers only him)
export default function SellerChatsPage() {
  return <LeadsChats api="/api/seller/chats" ordersHref="/seller/orders" team assign />;
}
