-- Enable RLS on user_avatars table
ALTER TABLE public.user_avatars ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view all avatars (public read access)
CREATE POLICY "Anyone can view avatars" 
ON public.user_avatars 
FOR SELECT 
USING (true);

-- Create policy to allow authenticated users to insert their own avatars
CREATE POLICY "Users can insert their own avatars" 
ON public.user_avatars 
FOR INSERT 
WITH CHECK (auth.jwt() IS NOT NULL);

-- Create policy to allow users to update their own avatars
CREATE POLICY "Users can update their own avatars" 
ON public.user_avatars 
FOR UPDATE 
USING (auth.jwt() IS NOT NULL);

-- Create policy to allow users to delete their own avatars
CREATE POLICY "Users can delete their own avatars" 
ON public.user_avatars 
FOR DELETE 
USING (auth.jwt() IS NOT NULL);