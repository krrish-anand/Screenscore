
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Clapperboard } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupUsername, setSignupUsername] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const { toast } = useToast();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: loginEmail, password: loginPassword }),
        });

        const data = await response.json();

        if (response.ok) {
            toast({
                title: "Login Successful!",
                description: `Welcome back, ${data.user.username}!`,
            });
            router.push('/');
            router.refresh(); // This will re-fetch server components and update session state
        } else {
            toast({
                variant: 'destructive',
                title: "Login Failed",
                description: data.message || "An unexpected error occurred.",
            });
        }
    } catch (error) {
        toast({
            variant: 'destructive',
            title: "Login Error",
            description: "Could not connect to the server. Please try again later.",
        });
    } finally {
        setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: signupUsername,
          email: signupEmail,
          password: signupPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Sign Up Successful!",
          description: "You can now log in with your credentials.",
        });
        setSignupUsername('');
        setSignupEmail('');
        setSignupPassword('');
        setActiveTab('login'); // Switch to login tab
      } else {
        toast({
          variant: 'destructive',
          title: "Sign Up Failed",
          description: data.message || "An unexpected error occurred.",
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: "Sign Up Error",
        description: "Could not connect to the server. Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative bg-background min-h-screen flex flex-col items-center justify-center p-4">
      <div className="absolute top-4 left-4">
        <Button variant="ghost" onClick={() => router.push('/')} suppressHydrationWarning={true}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to site
        </Button>
      </div>
      <div className="w-full max-w-md">
       <div className="flex flex-col items-center justify-center mb-8">
            <Clapperboard className="h-12 w-12 mb-4" />
            <h1 className="text-4xl font-headline">ScreenScore</h1>
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>Welcome Back</CardTitle>
                <CardDescription>Enter your email and password to access your account.</CardDescription>
              </CardHeader>
              <form onSubmit={handleLogin}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input id="login-email" type="email" placeholder="m@example.com" required value={loginEmail} onChange={e => setLoginEmail(e.target.value)} suppressHydrationWarning={true} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input id="login-password" type="password" required value={loginPassword} onChange={e => setLoginPassword(e.target.value)} suppressHydrationWarning={true} />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full" disabled={isLoading} suppressHydrationWarning={true}>
                    {isLoading ? 'Logging in...' : 'Login'}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
          <TabsContent value="signup">
            <Card>
              <CardHeader>
                <CardTitle>Create an Account</CardTitle>
                <CardDescription>Join the community to review and rate movies.</CardDescription>
              </CardHeader>
              <form onSubmit={handleSignup}>
                <CardContent className="space-y-4">
                   <div className="space-y-2">
                    <Label htmlFor="signup-username">Username</Label>
                    <Input id="signup-username" type="text" placeholder="your_username" required value={signupUsername} onChange={e => setSignupUsername(e.target.value)} suppressHydrationWarning={true} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input id="signup-email" type="email" placeholder="m@example.com" required value={signupEmail} onChange={e => setSignupEmail(e.target.value)} suppressHydrationWarning={true} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input id="signup-password" type="password" required value={signupPassword} onChange={e => setSignupPassword(e.target.value)} suppressHydrationWarning={true} />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full" disabled={isLoading} suppressHydrationWarning={true}>
                    {isLoading ? 'Signing up...' : 'Sign Up'}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
