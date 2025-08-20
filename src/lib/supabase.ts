import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ipknhlvqwecrfqpmuhvg.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlwa25obHZxd2VjcmZxcG11aHZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MDA2OTQsImV4cCI6MjA3MTI3NjY5NH0.JYx5Q4etjfuTOKbVv-qf3i0nN3gFVP9eXFcQNGQum2o'

export const supabase = createClient(supabaseUrl, supabaseAnonKey) 