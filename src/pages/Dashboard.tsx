import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Smartphone, LogOut, ArrowUpRight } from "lucide-react";
import { useQuery } from "convex/react";
import { Link, useNavigate } from "react-router";

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const purchases = useQuery(api.purchases.myPurchases);
  const navigate = useNavigate();

  const handleSignOut = async () => { await signOut(); navigate("/"); };
  const paidPlans = (purchases ?? []).filter((purchase) => purchase.status === "paid");
  const activePlan = paidPlans.length > 0 ? paidPlans[paidPlans.length - 1].planName : null;

  return <main className="min-h-screen bg-black px-6 py-10 text-white"><div className="mx-auto flex w-full max-w-5xl flex-col gap-8"><header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-medium text-white/45">Your KOVA AI account</p><h1 className="mt-1 font-serif text-4xl italic tracking-[-0.05em]">Welcome{user?.name ? `, ${user.name}` : ""}</h1></div><Button type="button" variant="outline" className="cursor-pointer gap-2 self-start border-white/15 text-white hover:bg-white/10 hover:text-white" onClick={handleSignOut}><LogOut className="size-4" />Sign out</Button></header><Card className="border-white/10 bg-white/[0.03] shadow-none"><CardHeader><div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-white text-black"><Smartphone className="size-5" /></div><CardTitle className="text-white">KOVA AI for iPhone</CardTitle></CardHeader><CardContent className="space-y-4 text-sm leading-6 text-white/55"><p>{activePlan ? <>Your active coaching plan is <span className="font-medium text-white">{activePlan}</span>.</> : <>You do not have an active KOVA coaching plan yet.</>} KOVA is preparing for launch on iOS — early access opens soon.</p><Link to="/app" className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:text-white/70">View plans and the app<ArrowUpRight size={14} strokeWidth={1.6} /></Link></CardContent></Card></div></main>;
}
