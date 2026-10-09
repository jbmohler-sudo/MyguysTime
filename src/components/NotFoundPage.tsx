import { useEffect } from "react";

export function NotFoundPage() {
  useEffect(() => {
    document.title = "Page not found | My Guys Time";
    let meta = document.querySelector('meta[name="robots"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "robots");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", "noindex");
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="max-w-xl mx-auto px-6 py-24 text-center">
        <p className="text-sm font-semibold tracking-widest text-orange-600 uppercase">404</p>
        <h1 className="text-4xl font-bold mt-4">Page not found</h1>
        <p className="text-slate-600 mt-4">That page is not on this site.</p>
        <a href="/" className="inline-block mt-8 text-orange-600 font-semibold hover:underline">
          Back to the homepage
        </a>
      </main>
    </div>
  );
}
