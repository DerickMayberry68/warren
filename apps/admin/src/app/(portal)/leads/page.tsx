import { ContactRequests } from "@/components/contact-requests";

export default function LeadsPage() {
  return <section><div className="portal-page-heading"><div><h1>Contact requests</h1><p>Customer inquiries from the Warren website. Showing the 100 most recent requests.</p></div></div><ContactRequests limit={100}/></section>;
}
