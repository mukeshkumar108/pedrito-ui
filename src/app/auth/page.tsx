import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AuthForm } from "@/components/AuthForm";

export default async function AuthPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/");
  }

  return (
    <main
      className="min-h-screen text-slate-900"
      style={{
        backgroundImage: "url('/images/bg-clouds.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[60%_40%] xl:grid-cols-[60%_40%]">
        <div className="flex items-center justify-start px-6 py-12 sm:px-10 lg:px-12">
          <div className="mx-auto space-y-4 text-white">
            <h1
              className="text-[4rem] font-medium leading-none tracking-[-0.14em] md:text-[5.4rem]"
              style={{ letterSpacing: "-0.2rem" }}
            >
              Your personal executive assistant.
            </h1>
            <h2
              className="text-[1.35rem] font-medium text-white/90 md:text-[1.5rem] lg:w-[70%]"
              style={{ letterSpacing: "-0.1rem", lineHeight: "1.2" }}
            >
              Pedrito helps cut through the noise, so you can stay on top of what&apos;s important to you.
            </h2>
          </div>
        </div>
        <div className="flex items-center justify-center px-6 py-12 sm:px-10 lg:px-12">
          <AuthForm />
        </div>
      </div>
    </main>
  );
}
