import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface SubscriptionData {
  tier: 'free' | 'pro';
  status: 'active' | 'trialing' | 'past_due' | 'canceled';
  trial_end_date: string | null;
  days_left: number;
  is_pro: boolean;
}

export const useSubscription = () => {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSubscription = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No record found, user is free by default
          setSubscription({
            tier: 'free',
            status: 'canceled',
            trial_end_date: null,
            days_left: 0,
            is_pro: false
          });
        }
      } else if (data) {
        const now = new Date();
        const endDate = new Date(data.trial_end_date || data.expiry_date);
        const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 3600 * 24)));
        
        // User is pro if they are in active/trialing status and haven't expired
        const isPro = (data.tier === 'pro') && 
                      (data.status === 'active' || data.status === 'trialing') && 
                      (endDate > now);

        setSubscription({
          tier: data.tier,
          status: data.status,
          trial_end_date: data.trial_end_date,
          days_left: daysLeft,
          is_pro: isPro
        });
      }
    } catch (e) {
      console.error("Error fetching subscription:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, []);

  return { subscription, loading, refresh: fetchSubscription };
};
