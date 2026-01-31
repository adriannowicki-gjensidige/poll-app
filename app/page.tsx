import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-4">Poll App</h1>
      <p className="text-gray-600 mb-8">Simple polling with QR code access</p>
      <Link
        href="/admin"
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
      >
        Admin Dashboard
      </Link>
    </main>
  );
}
