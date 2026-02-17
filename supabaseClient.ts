
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zutmjfynsexzecvrojgc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1dG1qZnluc2V4emVjdnJvamdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNzQ1NTQsImV4cCI6MjA4Njg1MDU1NH0.VizTFoJnYSCp6m7PUf4BvNGwQRxBKVL6GR574I-IzkE';

export const supabase = createClient(supabaseUrl, supabaseKey);
