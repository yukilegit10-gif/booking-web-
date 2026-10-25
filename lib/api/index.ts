'use client';

import { isSupabaseConfigured } from '../supabase/client';
import { demoApi } from './demo';
import { supabaseApi } from './supabase';
import type { SomApi } from './types';

export const api: SomApi = isSupabaseConfigured ? supabaseApi : demoApi;
export const isDemoMode = !isSupabaseConfigured;
