import Dashboard from "@/components/Dashboard/Dashboard";
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export default async function Home() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: inventory, error } = await supabase.from('inventory').select()

  if (error) {
    console.error('Error fetching inventory:', error)
  }

  return (<>
    {error ? (
      <p>Error loading data. Check console.</p>
    ) : (
      <ul>
        {inventory?.map((item) => (
          <li key={item.id}>{item.name}</li>
        ))}
      </ul>
    )}
    <Dashboard />
  </>)
}
