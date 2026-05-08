import Dashboard from "@/components/Dashboard/Dashboard";
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export default function Home() {
  return <Dashboard />;
}
