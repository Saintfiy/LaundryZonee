
import * as dotenv from 'dotenv';
dotenv.config(); // harus di paling atas

import { createClient } from '@supabase/supabase-js';

console.log('URL:', process.env.SUPA_URL);
console.log('KEY:', process.env.SUPA_ANON_KEY);


dotenv.config(); // .env berisi SUPA_URL dan SUPA_ANON_KEY

export const supabase = createClient(
  process.env.SUPA_URL,
  process.env.SUPA_ANON_KEY
);