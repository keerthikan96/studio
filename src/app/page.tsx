import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Logo from "@/components/logo";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="flex flex-col items-center justify-center text-center">
        <Logo />
        <p className="mt-4 max-w-xl text-muted-foreground">
          The all-in-one solution for modern staff management. Streamline your
          hiring, onboarding, and profile management with intelligent automation.
        </p>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Admin Portal</CardTitle>
            <CardDescription>
              Manage staff, send invitations, and oversee the system.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/dashboard" className="w-full">
              <Button className="w-full">Admin Login</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Staff Portal</CardTitle>
            <CardDescription>
              Access your profile, update information, and view details.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/profile" className="w-full">
              <Button variant="secondary" className="w-full">
                Staff Login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
      <footer className="mt-16 text-center text-sm text-muted-foreground">
        First time user? Check your email for an invitation link to set up your account.
        <br/>
        <Link href="/set-password" className="text-primary hover:underline">Or simulate setting a password here.</Link>
      </footer>
    </main>
  );
}
