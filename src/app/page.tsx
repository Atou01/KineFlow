import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold">FlowPro</h1>
      <p className="mt-4 text-xl text-gray-600">Gestion de cabinet pour kinésithérapeutes</p>
      
      <div className="mt-8 flex gap-4">
        <Link
          href="/signin"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Se connecter
        </Link>
        <Link
          href="/signup"
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
        >
          Créer un compte
        </Link>
      </div>
    </main>
  );
}
